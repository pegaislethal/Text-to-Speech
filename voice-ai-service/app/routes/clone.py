import os
import uuid
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional
from app.config import settings
from app.services.audio_preprocessor import audio_preprocessor
from app.services.speaker_encoder import speaker_encoder
from app.services.voice_trainer import voice_trainer
from app.services.xtts_service import xtts_service

router = APIRouter(prefix="/voice", tags=["Voice Cloning"])

# Global state for training status tracking
training_jobs = {}

class CloneRequest(BaseModel):
    voiceName: str
    audioUrl: str
    userId: str
    provider: Optional[str] = "XTTS"
    consent: bool = True

def run_pipeline_task(voice_id: str, audio_url: str, provider_name: str):
    """Background task executing the complete adaptation pipeline."""
    try:
        def update_status(status_msg: str, progress: int):
            training_jobs[voice_id] = {
                "status": "processing" if progress < 100 else "completed",
                "trainingStatus": status_msg,
                "trainingProgress": progress,
                "error": None
            }

        update_status("Uploading voice...", 10)
        
        # 1. Download & Preprocess Audio
        work_dir = os.path.join(settings.TEMP_DIR, voice_id)
        update_status("Analyzing audio...", 20)
        
        prep_result = audio_preprocessor.process_pipeline(audio_url, work_dir)
        if not prep_result["success"]:
            training_jobs[voice_id] = {
                "status": "failed",
                "trainingStatus": "failed",
                "trainingProgress": 0,
                "error": prep_result.get("error", "Quality check failed")
            }
            return

        # 2. Adaptation Engine Execution
        train_result = voice_trainer.run_voice_adaptation_pipeline(
            speaker_id=voice_id,
            audio_segments=prep_result["segments"],
            progress_callback=update_status
        )

        # 3. Extract Speaker Latents
        speaker_encoder.extract_speaker_embedding(prep_result["segments"], voice_id)
        xtts_service.clone_voice(voice_id, prep_result["segments"], provider_name)

        training_jobs[voice_id] = {
            "status": "completed",
            "trainingStatus": "Voice ready.",
            "trainingProgress": 100,
            "error": None,
            "characteristics": train_result.get("characteristics", {})
        }

    except Exception as e:
        print(f"[CloneTask] Pipeline error for {voice_id}: {e}")
        training_jobs[voice_id] = {
            "status": "failed",
            "trainingStatus": "failed",
            "trainingProgress": 0,
            "error": str(e)
        }

@router.post("/clone")
async def clone_voice(req: CloneRequest, background_tasks: BackgroundTasks):
    if not req.consent:
        raise HTTPException(status_code=400, detail="Confirmation of voice ownership/authorization is required.")
        
    voice_id = f"voice_{uuid.uuid4().hex[:12]}"
    
    training_jobs[voice_id] = {
        "status": "processing",
        "trainingStatus": "Uploading voice...",
        "trainingProgress": 10,
        "error": None
    }
    
    background_tasks.add_task(run_pipeline_task, voice_id, req.audioUrl, req.provider or "XTTS")
    
    return {
        "success": True,
        "voiceId": voice_id,
        "voiceName": req.voiceName,
        "provider": req.provider or "XTTS",
        "trainingStatus": "Uploading voice...",
        "trainingProgress": 10
    }

@router.get("/status/{voice_id}")
async def get_training_status(voice_id: str):
    if voice_id not in training_jobs:
        return {
            "status": "completed",
            "trainingStatus": "Voice ready.",
            "trainingProgress": 100
        }
    return training_jobs[voice_id]
