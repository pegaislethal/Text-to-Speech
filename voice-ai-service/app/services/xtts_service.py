import os
from app.config import settings
from app.providers.xtts_provider import xtts_provider
from app.providers.openvoice_provider import openvoice_provider
from app.providers.fine_tuned_provider import fine_tuned_provider

class XTTSService:
    """
    Unified Model Provider Manager. Interfaces XTTS v2, OpenVoice, and Fine-Tuned models.
    """

    def __init__(self):
        self.providers = {
            "XTTS": xtts_provider,
            "OpenVoice": openvoice_provider,
            "FineTuned": fine_tuned_provider
        }

    def get_provider(self, name: str = "XTTS"):
        return self.providers.get(name, xtts_provider)

    def clone_voice(self, voice_id: str, sample_wavs: list, provider_name: str = "XTTS") -> dict:
        provider = self.get_provider(provider_name)
        return provider.clone_voice(voice_id, sample_wavs)

    def generate_speech(self, text: str, voice_id: str, output_path: str, provider_name: str = "XTTS") -> str:
        provider = self.get_provider(provider_name)
        return provider.generate_voice(text, voice_id, output_path)

xtts_service = XTTSService()
