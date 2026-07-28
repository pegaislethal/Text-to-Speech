# 21st Tech Company - Complete Text-to-Speech & Voice AI Technical Documentation

> **Project Name**: 21st Tech Company AI Text-to-Speech Platform  
> **Repository Root**: `d:\Work\Project`  
> **Document Version**: `1.0.0`  
> **Last Updated**: July 28, 2026  

---

## Table of Contents

- [1. Executive Overview](#1-executive-overview)
- [2. System Architecture & High-Level Flow](#2-system-architecture--high-level-flow)
- [3. Voice Provider Analysis & Voice Catalog](#3-voice-provider-analysis--voice-catalog)
  - [3.1 Primary Providers](#31-primary-providers)
  - [3.2 System Default Voices Catalog (13 Seeded Voices)](#32-system-default-voices-catalog-13-seeded-voices)
- [4. Text-to-Speech (TTS) Generation Flow](#4-text-to-speech-tts-generation-flow)
  - [4.1 Step-by-Step Workflow](#41-step-by-step-workflow)
  - [4.2 Architectural Flowchart](#42-architectural-flowchart)
- [5. Voice Cloning Infrastructure & Adaptation Pipeline](#5-voice-cloning-infrastructure--adaptation-pipeline)
  - [5.1 Voice Cloning Overview](#51-voice-cloning-overview)
  - [5.2 Complete 5-Step Adaptation Pipeline](#52-complete-5-step-adaptation-pipeline)
  - [5.3 Dataset Construction Standard](#53-dataset-construction-standard)
- [6. AI Model Details & Provider Framework](#6-ai-model-details--provider-framework)
  - [6.1 Coqui XTTS v2 Model](#61-coqui-xtts-v2-model)
  - [6.2 OpenVoice & LoRA Fine-Tuned Framework](#62-openvoice--lora-fine-tuned-framework)
- [7. Audio Signal Processing (DSP) Pipeline](#7-audio-signal-processing-dsp-pipeline)
  - [7.1 Backend Node.js DSP (ffmpeg-static)](#71-backend-nodejs-dsp-ffmpeg-static)
  - [7.2 Python AI Microservice Audio Preprocessing](#72-python-ai-microservice-audio-preprocessing)
- [8. Complete Technology Stack](#8-complete-technology-stack)
- [9. API Specifications & Endpoints](#9-api-specifications--endpoints)
  - [9.1 Express Backend API Gateway](#91-express-backend-api-gateway)
  - [9.2 Python AI Microservice API](#92-python-ai-microservice-api)
  - [9.3 External Third-Party APIs](#93-external-third-party-apis)
- [10. Database Architecture & Data Dictionary](#10-database-architecture--data-dictionary)
- [11. Authentication, Authorization & Security](#11-authentication-authorization--security)
- [12. Environment Variables & Configuration](#12-environment-variables--configuration)
- [13. Deployment Architecture & Docker Containerization](#13-deployment-architecture--docker-containerization)
- [14. Current Technical Limitations](#14-current-technical-limitations)
- [15. Strategic Architectural Roadmap (ElevenLabs-Style Engine)](#15-strategic-architectural-roadmap-elevenlabs-style-engine)

---

## 1. Executive Overview

The **21st Tech Company AI Text-to-Speech Platform** is a full-stack, enterprise-ready web application designed for converting written text into highly realistic, natural-sounding AI speech and creating personalized voice clones.

### Key Capabilities
- **Neural Speech Synthesis**: Access 13 pre-configured neural voices spanning documentary narrators, corporate presenters, and storytelling voices.
- **AI Voice Cloning**: Zero-shot speaker embedding extraction allowing users to upload a 5+ second audio clip to create custom cloned voice models.
- **Realtime DSP Voice Controls**: Dynamic runtime pitch shifting (-12 to +12 semitones), low-end voice depth enhancement, speed scaling (0.5x to 1.5x), and Equalizer tone presets (`documentary`, `cinematic`, `podcast`, `radio`).
- **AI Scene Generator**: Multi-voice script generator to synthesize multi-speaker audio scenes and export bundled ZIP archives.
- **Analytics & History**: Track character usage, credits consumption, audio history logs, and voice popularity analytics.

---

## 2. System Architecture & High-Level Flow

The application adopts a **decoupled multi-tier microservice architecture**:

```
+-----------------------------------------------------------------------------------+
| Next.js 16 Studio Frontend (App Router, Tailwind CSS, TypeScript, Context API)   |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ HTTP REST API / Bearer Tokens / Cookies
+-----------------------------------------------------------------------------------+
| Node.js & Express.js API Gateway (Auth, MongoDB, Quota Enforcement, FFmpeg DSP)   |
+-----------------------------------------------------------------------------------+
        │                                 │                                 │
        ▼ WSS WebSocket                   ▼ Internal REST RPC               ▼ HTTPS REST
+-----------------------+       +-----------------------+       +-----------------------+
| Microsoft Edge TTS    |       | Python FastAPI AI     |       | Cloudinary CDN &      |
| Universal Engine      |       | Adaptation Microservice|       | MongoDB Atlas Cluster |
| (Free Default Voices) |       | (PyTorch & XTTS v2)   |       | (Storage & Database)  |
+-----------------------+       +-----------------------+       +-----------------------+
```

---

## 3. Voice Provider Analysis & Voice Catalog

### 3.1 Primary Providers

1. **Microsoft Edge TTS** (`edge-tts-universal` NPM package v1.4.0):
   - **Role**: Drives all 13 system default voices.
   - **Protocol**: Direct WebSocket streaming over `wss://speech.platform.bing.com`.
   - **Key Advantage**: No API key required; zero cost for default neural speech.

2. **Coqui XTTS v2** (`TTS>=0.22.0` PyTorch microservice):
   - **Role**: Drives custom AI voice cloning and speech synthesis.
   - **Protocol**: Local PyTorch model execution in FastAPI microservice (`voice-ai-service`).
   - **Key Advantage**: High-fidelity zero-shot voice adaptation from brief reference samples.

---

### 3.2 System Default Voices Catalog (13 Seeded Voices)

Seeded into MongoDB upon server startup via `seedVoices()` in [`backend/src/config/database.js`](file:///d:/Work/Project/backend/src/config/database.js#L6-L163).

| # | Voice Name | Voice ID | Category | Provider | Library | Tier | Description |
|---|---|---|---|---|---|---|---|
| 1 | **Deep Documentary Male** | `en-US-ChristopherNeural` | Documentary | Microsoft | `edge-tts-universal` | Free | Deep, cinematic, and calm tone for nature & features. |
| 2 | **Calm Narrator Male** | `en-US-BrianNeural` | Male | Microsoft | `edge-tts-universal` | Free | Soft, steady pacing for guided meditations & essays. |
| 3 | **Professional Male** | `en-GB-ThomasNeural` | Male | Microsoft | `edge-tts-universal` | Free | Articulate British corporate cadence for pitches. |
| 4 | **Educational Female** | `en-US-JennyNeural` | Female | Microsoft | `edge-tts-universal` | Free | Clear, engaging female voice optimized for instruction. |
| 5 | **Storytelling Female** | `en-US-MichelleNeural` | Female | Microsoft | `edge-tts-universal` | Free | Warm and expressive narration style for audiobooks. |
| 6 | **Ancient History Narrator** | `en-GB-RyanNeural` | Documentary | Microsoft | `edge-tts-universal` | Premium | Resonant British accent for historical audiobooks. |
| 7 | **Wildlife Documentary** | `en-US-SteffanNeural` | Documentary | Microsoft | `edge-tts-universal` | Premium | Warm, narrative pitch for scientific features. |
| 8 | **Dark Mystery Narrator** | `en-US-EricNeural` | Documentary | Microsoft | `edge-tts-universal` | Premium | Low pitch, moody cadence for mystery & thrillers. |
| 9 | **Cinematic Trailer** | `en-US-GuyNeural` | Documentary | Microsoft | `edge-tts-universal` | Premium | Storytelling pacing for film trailers & epics. |
| 10 | **News Anchor Voice** | `en-US-AndrewNeural` | Male | Microsoft | `edge-tts-universal` | Premium | Articulate tone for technical podcasts & news. |
| 11 | **Emotional Storyteller** | `en-US-EmmaNeural` | Female | Microsoft | `edge-tts-universal` | Premium | Dynamic emotional range for fiction & narration. |
| 12 | **Deep Cinematic Male** | `en-US-RogerNeural` | Male | Microsoft | `edge-tts-universal` | Premium | Bass-rich tone for advertising and voiceovers. |
| 13 | **Luxury Podcast Voice** | `en-US-AvaNeural` | Female | Microsoft | `edge-tts-universal` | Premium | Polished, sophisticated voice for luxury branding. |

---

## 4. Text-to-Speech (TTS) Generation Flow

### 4.1 Step-by-Step Workflow

1. **User Interaction**: User inputs text script and selects voice, speed, pitch, depth, and EQ tone in [`frontend/app/dashboard/speech-studio/page.tsx`](file:///d:/Work/Project/frontend/app/dashboard/speech-studio/page.tsx).
2. **API Delegation**: Client calls `generateSpeech()` helper in [`frontend/services/api.ts`](file:///d:/Work/Project/frontend/services/api.ts#L64-L70) issuing an HTTP POST to `/api/tts/generate`.
3. **Auth & Quota Verification**: Express [`authMiddleware.js`](file:///d:/Work/Project/backend/src/middleware/authMiddleware.js) validates JWT token. [`ttsController.js`](file:///d:/Work/Project/backend/src/controllers/ttsController.js#L107-L118) calculates credit cost (1 credit per 50 characters) and enforces quota / premium locks.
4. **Speech Generation Execution**:
   - **Custom Cloned Voice**: Backend delegates to Python microservice via POST `http://localhost:8000/voice/generate` using `xttsProvider.js`. If offline, falls back to `en-US-ChristopherNeural`.
   - **System Default Voice**: Backend imports `edge-tts-universal` ESM module and streams MP3 audio chunks over Microsoft WebSockets.
5. **Post-Processing DSP**: Audio buffer is routed through [`backend/src/utils/audioProcessor.js`](file:///d:/Work/Project/backend/src/utils/audioProcessor.js) where `ffmpeg-static` applies pitch shifting (`asetrate` + `atempo`), depth bass boost (`bass`), and equalizer filtering.
6. **Media Storage**: Buffer is saved to Cloudinary (`uploadAudioBuffer`) or local filesystem fallback (`public/uploads/`).
7. **Database Logging**: Updates `freeCredits`/`usedCredits`, logs [`AudioHistory`](file:///d:/Work/Project/backend/src/models/audioHistory.js) entry, and records [`VoiceAnalytics`](file:///d:/Work/Project/backend/src/models/voiceAnalytics.js).

### 4.2 Architectural Flowchart

```
[User Speech Studio UI]
           │
           ▼ POST /api/tts/generate
[Express API Gateway] ──► Validate Token & Credit Balance
           │
     ┌─────┴────────────────────────────────┐
     ▼ (System Voice)                       ▼ (Custom Voice)
[edge-tts-universal]                 [Python AI Microservice]
     │ (Microsoft Edge WSS)                 │ (XTTS v2 PyTorch Inference)
     └─────┬────────────────────────────────┘
           ▼
[FFmpeg DSP Processor] (Pitch, Bass Depth, EQ Tone)
           ▼
[Cloudinary CDN Upload]
           ▼
[MongoDB History & Analytics]
           ▼
[JSON Response with Audio URL]
```

---

## 5. Voice Cloning Infrastructure & Adaptation Pipeline

### 5.1 Voice Cloning Overview

The voice cloning engine accepts a reference audio file (.mp3, .wav, .m4a), extracts unique vocal characteristics, and builds a serialized speaker conditioning profile.

- **Primary Engine**: Coqui **XTTS v2**.
- **Modular Alternatives**: OpenVoice (Tone-Color Converter) and FineTuned LoRA checkpoints.

---

### 5.2 Complete 5-Step Adaptation Pipeline

```
Audio Sample Upload (Frontend)
    │
    ▼ Direct Signed Cloudinary Upload (/api/upload/signature)
POST /api/voice/clone (Express Backend Gateway)
    │
    ▼ Delegated to Python FastAPI Microservice (POST /voice/clone)
Background Pipeline Task (run_pipeline_task in app/routes/clone.py):

  Step 1: Download & Quality Assurance (app/services/audio_preprocessor.py)
          - Standardize format to 16kHz mono WAV.
          - QA Check: SNR > 10dB, clipping < 5%, min duration >= 5 seconds.
          - Apply spectral gating noise reduction via `noisereduce`.
          - Remove excess silence & apply Voice Activity Detection (VAD).
          - Normalize RMS volume to -20 dBFS.
          - Segment into 3-10 second training chunks.

  Step 2: Dataset Construction (app/services/voice_trainer.py)
          - Store audio chunks in `storage/voice_dataset/<speaker_id>/audio/`
          - Generate `metadata.csv` (audio_file|transcription|speaker_id).

  Step 3: Pronunciation & Characteristic Analysis (app/services/voice_trainer.py)
          - Pitch tracking (`librosa.pyin` -> mean pitch Hz, pitch variation).
          - Vocal timbre estimation via spectral centroid (`warm`, `bright`, `natural`).

  Step 4: Speaker Embedding Extraction (app/services/speaker_encoder.py)
          - Extract 512-dim speaker embeddings & 1024-dim GPT conditioning latents.
          - Save serialized tensors to `app/models/voices/<speaker_id>/speaker_latents.pth`.
          - Generate `speaker_profile.json`.

  Step 5: Completion & Status Notification
          - Set `trainingProgress: 100`, `status: "completed"`.
```

---

### 5.3 Dataset Construction Standard

Temporary training datasets are generated dynamically under `storage/voice_dataset/<speaker_id>/`:

```
voice_dataset/
└── speaker_001/
    ├── audio/
    │   ├── 001.wav
    │   ├── 002.wav
    │   └── 003.wav
    └── metadata.csv
```

#### Metadata Format (`metadata.csv`)
```csv
audio_file|transcription|speaker_id
audio/001.wav|Audio reference sample 1 for speaker voice cloning adaptation.|speaker_001
audio/002.wav|Audio reference sample 2 for speaker voice cloning adaptation.|speaker_001
```

---

## 6. AI Model Details & Provider Framework

### 6.1 Coqui XTTS v2 Model

- **Model Identifier**: `tts_models/multilingual/multi-dataset/xtts_v2`
- **Capabilities**: Zero-shot voice cloning, multilingual speech synthesis (17+ languages), natural pitch & prosody continuation.
- **Conditioning Vectors**:
  - `gpt_cond_latent`: Shape `[1, 1024, 32]`
  - `speaker_embedding`: Shape `[1, 512]`

### 6.2 OpenVoice & LoRA Fine-Tuned Framework

The microservice features a unified provider architecture in `voice-ai-service/app/providers/`:

```python
class ModelProvider:
    def clone_voice(self, voice_id: str, sample_wavs: list) -> dict: ...
    def generate_voice(self, text: str, voice_id: str, output_path: str) -> str: ...
```

- **`XTTSProvider`** ([`xtts_provider.py`](file:///d:/Work/Project/voice-ai-service/app/providers/xtts_provider.py)): Multi-lingual zero-shot adaptation.
- **`OpenVoiceProvider`** ([`openvoice_provider.py`](file:///d:/Work/Project/voice-ai-service/app/providers/openvoice_provider.py)): Fast tone-color conversion using MeloTTS base.
- **`FineTunedProvider`** ([`fine_tuned_provider.py`](file:///d:/Work/Project/voice-ai-service/app/providers/fine_tuned_provider.py)): Dedicated speaker LoRA checkpoints.

---

## 7. Audio Signal Processing (DSP) Pipeline

### 7.1 Backend Node.js DSP (`ffmpeg-static`)

Located in [`backend/src/utils/audioProcessor.js`](file:///d:/Work/Project/backend/src/utils/audioProcessor.js):

- **Pitch Adjustment**:
  - Pitch semitones (-12 to +12).
  - Calculated frequency factor: $F = 2^{\frac{\text{pitch}}{12}}$.
  - Applied filter: `asetrate=44100*F,atempo=1/F`.
- **Voice Depth (Bass Boost)**:
  - Boosts bass frequencies below 80Hz up to +15dB: `bass=g=X:f=80`.
- **Equalizer Presets**:
  - `documentary`: Narrative warmth (`bass=g=5:f=120,treble=g=3:f=3000`).
  - `cinematic`: Deep bass & Haas stereo expansion (`bass=g=10:f=80,treble=g=2:f=8000,haas`).
  - `podcast`: Mid-range presence equalizer (`equalizer=f=1000:g=2,equalizer=f=200:g=1.5`).
  - `radio`: Dynamic range compressor + treble boost (`compand=...,equalizer=f=5000:g=3`).

---

### 7.2 Python AI Microservice Audio Preprocessing

Located in [`voice-ai-service/app/services/audio_preprocessor.py`](file:///d:/Work/Project/voice-ai-service/app/services/audio_preprocessor.py):

- **`librosa`**: Resampling to 16kHz, SNR calculation, `pyin` pitch tracking, spectral centroid calculation, and silence frame splitting.
- **`noisereduce`**: Non-stationary spectral gating noise reduction (`prop_decrease=0.75`).
- **`pydub`**: Silence trimming (`split_on_silence`), volume normalization to -20 dBFS, and MP3 export.

---

## 8. Complete Technology Stack

```
+-----------------------------------------------------------------------------------+
| FRONTEND LAYER                                                                    |
| - Framework: Next.js 16.2.10 (React 19.2.4, App Router)                           |
| - Language: TypeScript 5                                                          |
| - Styling: Tailwind CSS v4, Lucide React Icons, Recharts                          |
| - State Management: React Context API (authContext, toastContext)                 |
| - Auth Client: @react-oauth/google, jwt-decode                                    |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
| BACKEND API GATEWAY LAYER                                                         |
| - Framework: Node.js with Express.js v5.2.1                                       |
| - Language: JavaScript (CommonJS)                                                 |
| - Database ORM: Mongoose v9.7.4 (MongoDB Atlas)                                   |
| - Default TTS Engine: edge-tts-universal v1.4.0 (Microsoft Edge WebSockets)       |
| - DSP Audio Processor: ffmpeg-static v5.3.0                                       |
| - Cloud Storage: Cloudinary SDK v2.10.0                                           |
| - Auth & Security: jsonwebtoken, bcryptjs, google-auth-library, helmet            |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
| AI MICROSERVICE LAYER                                                             |
| - Framework: FastAPI v0.104.0 with Uvicorn                                        |
| - Language: Python 3.10+                                                          |
| - Deep Learning Engine: PyTorch 2.1.0, PyTorch Audio 2.1.0, Coqui TTS 0.22.0     |
| - Signal Processing: librosa 0.10.1, soundfile 0.12.1, pydub 0.25.1, noisereduce   |
| - Hardware Acceleration: CUDA 11.8+ (NVIDIA GPU) or CPU fallback                  |
+-----------------------------------------------------------------------------------+
```

---

## 9. API Specifications & Endpoints

### 9.1 Express Backend API Gateway

- **Authentication**:
  - `POST /api/auth/google`: Google OAuth sign-in / registration.
  - `POST /api/auth/signup`: Email & password user registration.
  - `POST /api/auth/login`: Email & password authentication.
  - `POST /api/auth/admin/login`: Admin portal authentication.
  - `POST /api/auth/logout`: Clears session authentication cookies.
  - `GET /api/auth/me`: Retrieves current session profile.

- **TTS Operations**:
  - `POST /api/tts/generate`: Synthesizes speech with full DSP post-processing.
  - `POST /api/tts/preview`: Generates short voice previews (cached when available).
  - `GET /api/history`: Retrieves user generated audio logs.
  - `DELETE /api/history/:id`: Removes single audio log entry.
  - `DELETE /api/history`: Clears complete user audio history.

- **Voice Cloning & Library**:
  - `POST /api/voice/clone`: Triggers voice cloning adaptation pipeline.
  - `GET /api/voice/status/:id`: Polls live training progress of custom voice profile.
  - `GET /api/voice/library`: Fetches available system default & user custom voices.
  - `DELETE /api/voice/:id`: Deletes custom voice profile.

- **Premium & Scene Generator**:
  - `POST /api/premium/scene-generator`: Multi-voice script generator.
  - `POST /api/premium/download-scenes-zip`: Bundles generated scene audio into a downloadable ZIP archive.

- **Presets & Uploads**:
  - `POST /api/upload/signature`: Generates signed Cloudinary upload credentials.
  - `GET /api/presets` / `POST /api/presets` / `DELETE /api/presets/:id`: Voice preset CRUD operations.

---

### 9.2 Python AI Microservice API

- `GET /health`: Microservice health check and device diagnostic (`cuda`/`cpu`).
- `POST /voice/clone`: Accepts voice sample URL and executes background adaptation pipeline.
- `GET /voice/status/{voice_id}`: Returns training job status and progress percentage.
- `POST /voice/generate`: Synthesizes speech using XTTS v2 and returns generated MP3 file stream.

---

### 9.3 External Third-Party APIs

- **Microsoft Edge TTS**: WebSocket streaming API (`wss://speech.platform.bing.com`).
- **Cloudinary Upload API**: Direct signed media upload (`https://api.cloudinary.com/v1_1/<cloud_name>/auto/upload`).
- **Google OAuth 2.0 API**: Google token verification (`google-auth-library`).

---

## 10. Database Architecture & Data Dictionary

Database System: **MongoDB** using **Mongoose**.

### 10.1 User Model (`User`)
Located in [`backend/src/models/user.js`](file:///d:/Work/Project/backend/src/models/user.js).

| Field | Type | Description |
|---|---|---|
| `name` | String | User full name |
| `email` | String | Unique email address |
| `passwordHash` | String | Bcrypt hash for email authentication |
| `profileImage` | String | Avatar URL |
| `googleId` | String | Sparse unique Google OAuth ID |
| `role` | String | Access role (`'user'` or `'admin'`) |
| `permissions` | Array[String] | Fine-grained permissions (`MANAGE_USERS`, `MANAGE_PREMIUM`) |
| `isActive` | Boolean | Account status flag |
| `premiumAccess` | Boolean | Premium tier authorization flag |
| `freeCredits` | Number | Allocated free generation credits (default: 100) |
| `usedCredits` | Number | Consumed credits counter |

---

### 10.2 Voice Model (`Voice`)
Located in [`backend/src/models/voice.js`](file:///d:/Work/Project/backend/src/models/voice.js).

| Field | Type | Description |
|---|---|---|
| `name` / `voiceName` | String | Display name of voice profile |
| `voiceId` | String | Unique identifier (e.g. `en-US-ChristopherNeural` or custom ID) |
| `provider` | String | AI Model Provider (`'Microsoft'`, `'XTTS'`, `'OpenVoice'`) |
| `category` | String | Voice style category (`documentary`, `male`, `female`, `custom`) |
| `description` | String | Descriptive narrative summary |
| `isPremium` | Boolean | Premium access lock flag |
| `type` | String | Voice profile classification (`'default'` or `'custom'`) |
| `userId` | ObjectId | Reference to owning user (null for default voices) |
| `sampleUrl` | String | Reference audio sample URL |
| `trainingStatus` | String | Adaptation status (`uploaded`, `processing`, `training`, `completed`, `failed`) |
| `trainingProgress` | Number | Percentage progress (0 - 100) |

---

### 10.3 Audio History Model (`AudioHistory`)
Located in [`backend/src/models/audioHistory.js`](file:///d:/Work/Project/backend/src/models/audioHistory.js).

| Field | Type | Description |
|---|---|---|
| `userId` | ObjectId | Owner user ID reference |
| `text` | String | Synthesized text content |
| `voice` / `voiceId` | String | Voice name and identifier used |
| `speed` | Number | Speech speed rate multiplier |
| `audioUrl` | String | Hosted MP3 audio URL |
| `characterCount` | Number | Character length synthesized |
| `createdAt` | Date | Generation timestamp |

---

## 11. Authentication, Authorization & Security

1. **Authentication Flow**:
   - Google OAuth 2.0 ID token verification via `google-auth-library`.
   - Email/Password authentication using `bcryptjs` (10 salt rounds).
   - Session Tokens: **JWT (JSON Web Token)** with a 25-minute expiration signed with `JWT_SECRET`.
   - Storage: HTTP-Only cookies (`res.cookie('token')`) + `Authorization: Bearer <token>` header. Auto-refreshed on active requests via `x-new-token` header.
2. **Authorization Middleware**:
   - [`authMiddleware.js`](file:///d:/Work/Project/backend/src/middleware/authMiddleware.js): Verifies active JWT token.
   - [`adminMiddleware.js`](file:///d:/Work/Project/backend/src/middleware/adminMiddleware.js): Restricts route access to users with `role: 'admin'`.
   - [`permissionMiddleware.js`](file:///d:/Work/Project/backend/src/middleware/permissionMiddleware.js): Verifies specific granular permissions.
   - [`premiumMiddleware.js`](file:///d:/Work/Project/backend/src/middleware/premiumMiddleware.js): Restricts voice cloning, premium voices, and scene generation to `premiumAccess: true`.

---

## 12. Environment Variables & Configuration

### 12.1 Backend Environment Variables (`backend/.env`)

```env
PORT=5000                                              # Express server listening port
MONGODB_URI=mongodb+srv://...                          # MongoDB Atlas database connection string
JWT_SECRET=production_ready_secret_key_...             # Secret key for JWT signing & verification
GOOGLE_CLIENT_ID=837458393193-...                      # Google OAuth 2.0 Client ID
GOOGLE_CLIENT_SECRET=GOCSPX-...                        # Google OAuth 2.0 Client Secret
CLOUDINARY_CLOUD_NAME=dmcyfapfa                        # Cloudinary cloud account name
CLOUDINARY_API_KEY=416342218133839                     # Cloudinary API key
CLOUDINARY_API_SECRET=IZYjoendhS2pQpF8erSyKkGDjdc      # Cloudinary API secret key
FRONTEND_URL=https://text-to-speech-iaos.vercel.app    # Allowed frontend CORS origin
```

### 12.2 Frontend Environment Variables (`frontend/.env` / `frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=https://text-to-speech-iota-dun.vercel.app/api   # Backend API base URL
NEXT_PUBLIC_GOOGLE_CLIENT_ID=837458393193-...                         # Public Google Client ID
```

### 12.3 Python AI Microservice Environment Variables

```env
PORT=8000                                              # FastAPI service listening port
USE_CUDA=true                                          # Enable GPU CUDA hardware acceleration
CUDA_VISIBLE_DEVICES=0                                 # CUDA GPU device index selection
MODEL_PATH=/app/app/models/voices                      # Storage path for model checkpoints & voice profiles
STORAGE_URL=/app/storage                               # Storage path for temporary datasets
PYTHON_AI_SERVICE_URL=http://localhost:8000            # Microservice RPC URL called by Express
```

---

## 13. Deployment Architecture & Docker Containerization

```
+-----------------------------------------------------------------------------------+
| FRONTEND DEPLOYMENT                                                               |
| Platform: Vercel (Edge Network)                                                   |
| Build Output: Next.js SSG/SSR App Router                                          |
| Domain: text-to-speech-iota-dun.vercel.app                                        |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ HTTPS
+-----------------------------------------------------------------------------------+
| BACKEND API GATEWAY DEPLOYMENT                                                    |
| Platform: Vercel Serverless / Cloud Server Instance                               |
| Runtime: Node.js 18+                                                              |
| Domain: text-to-speech-iaos.vercel.app                                            |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ HTTP (Internal VPC)
+-----------------------------------------------------------------------------------+
| AI MICROSERVICE DEPLOYMENT                                                        |
| Platform: Cloud GPU (RunPod, Modal Labs, AWS EC2 g4dn.xlarge, Lambda Labs)        |
| Containerization: Docker Container (`Dockerfile`)                                 |
| GPU Toolkit: NVIDIA Container Toolkit with CUDA 11.8+                             |
+-----------------------------------------------------------------------------------+
```

### Microservice Docker Build Commands

```bash
cd voice-ai-service
docker build -t 21sttech/voice-ai-service:latest .
docker run --gpus all -p 8000:8000 -e USE_CUDA=true 21sttech/voice-ai-service:latest
```

---

## 14. Current Technical Limitations

1. **Cloud Serverless Filesystem Constraints**:
   - Serverless platforms like Vercel have read-only filesystems. If Cloudinary credentials are missing in production, local file fallback storage fails.
2. **Unofficial Dependency for Default Voices**:
   - System voices rely on Microsoft Edge's internal WebSocket endpoint via `edge-tts-universal`. Protocol modifications or IP throttling by Microsoft would disrupt default voice generation.
3. **Single-Sample Voice Cloning Limit**:
   - Voice cloning currently accepts 1 audio sample per profile. Accepting 3–5 multi-sample reference recordings would significantly enhance speaker latent fidelity.
4. **In-Memory Job Tracking**:
   - Python microservice tracks adaptation progress in an in-memory dictionary (`training_jobs = {}`). Container restarts reset active job progress tracking.
5. **GPU Microservice Availability Fallback**:
   - If the Python microservice is offline, custom voice generation falls back to `en-US-ChristopherNeural` via Microsoft Edge TTS to prevent user crash errors.

---

## 15. Strategic Architectural Roadmap (ElevenLabs-Style Engine)

To evolve this project into an enterprise-grade platform comparable to ElevenLabs, the following architectural upgrades are recommended:

```
+-----------------------------------------------------------------------------------+
| FUTURE TARGET ARCHITECTURE ROADMAP                                                |
+-----------------------------------------------------------------------------------+
                                         │
    ┌────────────────────────────────────┼────────────────────────────────────┐
    ▼                                    ▼                                    ▼
+-----------------------+    +-----------------------+    +-----------------------+
| 1. Free Voice Engine  |    | 2. Premium AI Engine  |    | 3. Serverless GPU     |
| Replace Edge TTS with |    | Upgrade to ChatTTS /  |    | Deploy Python micro-  |
| Kokoro-82M or Piper   |    | Fish Speech / XTTS v2 |    | service on Modal Labs |
| for sub-100ms offline |    | with TensorRT-LLM for |    | or RunPod GPU Pods    |
| CPU speech synthesis. |    | voice emotion control.|    | (Auto-scale to zero). |
+-----------------------+    +-----------------------+    +-----------------------+
                                         │
    ┌────────────────────────────────────┴────────────────────────────────────┐
    ▼                                                                         ▼
+------------------------------------+                    +------------------------------------+
| 4. Distributed Task Queue          |                    | 5. Vector Latent Caching           |
| Replace in-memory dictionary with  |                    | Store 512-dim speaker embeddings   |
| Redis + BullMQ / Celery worker pool|                    | in Redis / MongoDB Vector Search   |
| for asynchronous fine-tuning jobs  |                    | for instant zero-shot model        |
| with Socket.io progress streaming. |                    | warm starts without disk read I/O. |
+------------------------------------+                    +------------------------------------+
```

1. **Free Voice Engine**: Deploy **Kokoro-82M** or **Piper TTS** on CPU instances for ultra-fast, 100% self-hosted default voice synthesis.
2. **Premium Voice Engine**: Integrate **Fish Speech** or **ChatTTS** combined with **TensorRT-LLM** optimization for sub-200ms latency and high dynamic range emotional speech synthesis.
3. **Self-Hosted LoRA Fine-Tuning**: Enable multi-sample upload (3 to 5 audio samples) and fine-tune speaker-specific LoRA adapters.
4. **Serverless GPU Deployment**: Host the Python microservice on **Modal Labs** or **RunPod Serverless GPU** (NVIDIA A10G / RTX 4090) to scale down to zero when idle, saving infrastructure costs.
5. **Async Job Architecture**: Implement **Redis + BullMQ / Celery** with WebSocket notifications for reliable, persistent voice training job tracking.
