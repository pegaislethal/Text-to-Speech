# 21st Tech Company - Production AI Voice Adaptation Infrastructure

## Overview

The 21st Tech Company AI Voice Adaptation Infrastructure upgrades basic zero-shot speaker embedding into a full production-grade **Voice Adaptation Pipeline**. Built on **Coqui XTTS v2** with modular support for **OpenVoice** and custom fine-tuned checkpoints, this engine extracts phoneme pronunciation, pitch envelope, vocal timbre, speaking rhythm, and speaker identity to produce high-fidelity voice cloning.

---

## 1. System Architecture Diagram

```
+------------------+         +--------------------+         +-----------------------+
|  Next.js Studio  |  ---->  | Express Backend    |  ---->  | Python AI Service     |
|  (Frontend UI)   |  <----  | (API Gateway/Auth) |  <----  | (FastAPI + PyTorch)   |
+------------------+         +--------------------+         +-----------------------+
                                                                        |
                                                                        v
                                                            +-----------------------+
                                                            | Adaptation Pipeline   |
                                                            | (Quality, VAD, DSP)   |
                                                            +-----------------------+
                                                                        |
                                                                        v
                                                            +-----------------------+
                                                            | Coqui XTTS v2 /       |
                                                            | OpenVoice Engine      |
                                                            +-----------------------+
```

### Component Flow
1. **Frontend (Next.js)**: Voice Studio UI handles audio file upload, ownership consent verification, progress step feedback (`Uploading voice...` → `Analyzing audio...` → `Preparing dataset...` → `Learning voice characteristics...` → `Creating AI voice...` → `Voice ready.`), and interactive DSP parameters (Pitch, Depth, Speed, EQ Tone).
2. **Backend (Express Node.js)**: Enforces authorization (`premiumAccess: true`), checks ownership confirmation, stores voice profile metadata in MongoDB, and proxies cloning and synthesis requests to the Python AI service.
3. **AI Service (Python FastAPI)**: High-performance microservice managing audio preprocessing, dataset segmentation, G2P phoneme alignment, speaker conditioning extraction, and DSP post-processing.

---

## 2. Voice Training & Adaptation Pipeline

When a user submits a voice sample (`voiceName`, `audioUrl`, `userId`):

```
Audio Upload
    ↓
Download Audio
    ↓
Audio Quality Analysis (SNR, Clipping, Single Speaker Check)
    ↓
Format Standardization (16kHz Mono WAV)
    ↓
Noise Removal (Spectral Gating via noisereduce)
    ↓
Silence Trimming & Voice Activity Detection (VAD)
    ↓
RMS Volume Normalization (-20 dBFS)
    ↓
Sample Segmentation (3–10 sec Speech Chunks)
    ↓
Phoneme & Rhythm Characteristic Analysis
    ↓
Speaker Embedding Extraction (GPT Cond Latents & Speaker Latents)
    ↓
Adaptation Layer Build (Save Checkpoint Profile)
```

---

## 3. Dataset Creation Standard

Temporary training datasets are created dynamically under `storage/voice_dataset/<speaker_id>/`:

```
voice_dataset/
└── speaker_001/
    ├── audio/
    │   ├── 001.wav
    │   ├── 002.wav
    │   └── 003.wav
    └── metadata.csv
```

### Metadata Format (`metadata.csv`)
```csv
audio_file|transcription|speaker_id
audio/001.wav|Audio reference sample 1 for speaker voice cloning adaptation.|speaker_001
audio/002.wav|Audio reference sample 2 for speaker voice cloning adaptation.|speaker_001
```

---

## 4. Phoneme & Pronunciation Learning

The `VoiceTrainer` engine performs pitch tracking (`librosa.pyin`) and spectral analysis (`spectral_centroid`) to learn:
- **Pitch Range & Envelope**: Min, max, and mean frequency bounds (Hz).
- **Vocal Timbre**: Warm, bright, or natural spectral characteristics.
- **Rhythm & Tempo**: Segment speech rate and duration distribution.
- **Phonemic Stress**: Pronunciation rules across vowels and consonants.

---

## 5. Model Provider Architecture

The microservice exposes a modular provider interface (`app/providers/`):
- `XTTSProvider` (`xtts_provider.py`): Coqui XTTS v2 multilingual zero-shot adaptation & speaker conditioning latents.
- `OpenVoiceProvider` (`openvoice_provider.py`): Tone-Color converter fast cloning.
- `FineTunedProvider` (`fine_tuned_provider.py`): Dedicated LoRA / fine-tuned speaker checkpoints.

```python
class ModelProvider:
    def clone_voice(self, voice_id: str, sample_wavs: list) -> dict: ...
    def generate_voice(self, text: str, voice_id: str, output_path: str) -> str: ...
```

---

## 6. DSP Voice Control Engine

Generated audio passes through the `InferenceService` DSP engine:
- **Pitch Correction**: Shift pitch from -12 to +12 semitones.
- **Voice Depth**: Equalizer & low-pass body boost (0-100%).
- **Tone Presets**:
  - `Natural`: Balanced studio curve.
  - `Deep`: Low-end boost for deep bass narrators.
  - `Warm`: Mid-range warmth for storytelling.
  - `Cinematic`: High-pass + low-pass wide soundstage.
  - `Documentary`: Crisp speech clarity profile.
- **Speed Control**: Time-stretch scaling from 0.5x to 1.5x.

---

## 7. GPU Requirements & Performance Setup

### System Requirements
- **NVIDIA GPU**: Minimum 8GB VRAM (NVIDIA RTX 3080 / T4 / A10G / A100).
- **CUDA Toolkit**: CUDA 11.8+ with PyTorch 2.1.0.
- **CPU Fallback**: Automatic CPU execution mode when CUDA is unavailable (`DEVICE=cpu`).

### VRAM & Latency Optimization
- **Model Caching**: XTTS model loaded once into VRAM at startup.
- **Mixed Precision**: FP16 inference enabled on CUDA.
- **Audio Pre-caching**: Speaker conditioning vectors (`speaker_latents.pth`) cached per voice profile.

---

## 8. Deployment Strategy

### Docker Container Build
```bash
cd voice-ai-service
docker build -t 21sttech/voice-ai-service:latest .
docker run --gpus all -p 8000:8000 -e USE_CUDA=true 21sttech/voice-ai-service:latest
```

### Cloud GPU Deployment Targets

1. **RunPod**:
   - Deploy container image on RunPod GPU Pods (NVIDIA A10G / RTX 4090).
   - Set environment variables: `PORT=8000`, `USE_CUDA=true`.

2. **Modal Labs**:
   - Deploy as serverless GPU function using `@app.function(gpu="T4")`.

3. **AWS EC2 GPU (g4dn.xlarge)**:
   - Run Docker with NVIDIA Container Toolkit enabled.

4. **Lambda Labs**:
   - High-throughput multi-GPU deployment (NVIDIA A10).

---

## 9. Environment Configuration

```env
PORT=8000
USE_CUDA=true
CUDA_VISIBLE_DEVICES=0
MODEL_PATH=/app/app/models/voices
STORAGE_URL=/app/storage
PYTHON_AI_SERVICE_URL=http://localhost:8000
```
