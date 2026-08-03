import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import Optional
from app.services.inference_service import inference_service

router = APIRouter(prefix="/voice", tags=["Voice Generation"])

class GenerateRequest(BaseModel):
    voiceId: str
    text: str
    speed: Optional[float] = 1.0
    pitch: Optional[float] = 0.0
    tone: Optional[str] = "Natural"
    depth: Optional[float] = 0.0
    bassEnhancement: Optional[float] = 0.0
    provider: Optional[str] = "XTTS"

@router.post("/generate")
async def generate_voice_speech(req: GenerateRequest):
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Synthesis text parameter cannot be empty.")

    try:
        mp3_path = inference_service.generate(
            voice_id=req.voiceId,
            text=req.text.strip(),
            pitch=req.pitch or 0.0,
            depth=req.depth or 0.0,
            bass_enhancement=req.bassEnhancement or 0.0,
            tone=req.tone or "Natural",
            speed=req.speed or 1.0,
            provider_name=req.provider or "XTTS"
        )

        if not os.path.exists(mp3_path):
            raise HTTPException(status_code=500, detail="Speech generation failed to generate audio output file.")

        media_type = "audio/wav" if mp3_path.endswith(".wav") else "audio/mpeg"
        filename = f"speech_{req.voiceId}.wav" if mp3_path.endswith(".wav") else f"speech_{req.voiceId}.mp3"

        return FileResponse(
            mp3_path,
            media_type=media_type,
            filename=filename
        )
    except Exception as e:
        print(f"[GenerateEndpoint] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
