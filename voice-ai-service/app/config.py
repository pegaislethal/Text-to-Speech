import os

class Settings:
    PROJECT_NAME: str = "21st Tech AI Voice Adaptation Engine"
    VERSION: str = "1.0.0"
    API_PORT: int = int(os.getenv("PORT", "8000"))
    
    # Paths
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    MODEL_PATH: str = os.getenv("MODEL_PATH", os.path.join(BASE_DIR, "app", "models", "voices"))
    STORAGE_DIR: str = os.getenv("STORAGE_URL", os.path.join(BASE_DIR, "storage"))
    TEMP_DIR: str = os.path.join(STORAGE_DIR, "temp")
    DATASET_DIR: str = os.path.join(STORAGE_DIR, "voice_dataset")
    
    # Audio Preprocessor defaults
    TARGET_SAMPLE_RATE: int = 16000
    MIN_AUDIO_DURATION_SEC: float = 5.0
    RECOMMENDED_AUDIO_DURATION_SEC: float = 30.0
    MAX_AUDIO_DURATION_SEC: float = 900.0  # 15 mins
    
    # Device setup
    CUDA_VISIBLE_DEVICES: str = os.getenv("CUDA_VISIBLE_DEVICES", "0")
    DEVICE: str = "cuda" if os.getenv("USE_CUDA", "true").lower() == "true" else "cpu"

settings = Settings()

os.makedirs(settings.MODEL_PATH, exist_ok=True)
os.makedirs(settings.TEMP_DIR, exist_ok=True)
os.makedirs(settings.DATASET_DIR, exist_ok=True)
