import os
import numpy as np
import librosa
import soundfile as sf
from pydub import AudioSegment
from app.config import settings
from app.services.xtts_service import xtts_service

class InferenceService:
    """
    Inference & Audio Post-Processing Engine.
    Applies pitch shifting, voice depth enhancement, tone equalization, 
    speed scaling, and dynamic range compression.
    """

    def apply_dsp_effects(
        self, 
        wav_path: str, 
        output_mp3_path: str,
        pitch_semitones: float = 0.0,
        depth: float = 0.0,
        tone: str = "Natural",
        speed: float = 1.0
    ) -> str:
        """
        Applies signal processing effects on generated WAV and exports MP3.
        """
        # Load generated WAV
        y, sr = librosa.load(wav_path, sr=settings.TARGET_SAMPLE_RATE)

        # 1. Pitch Correction / Shift (-12 to +12 semitones)
        if pitch_semitones != 0.0:
            pitch_shift_n = max(-12.0, min(12.0, pitch_semitones))
            y = librosa.effects.pitch_shift(y, sr=sr, n_steps=pitch_shift_n)

        # 2. Speed Control (0.5x - 1.5x)
        if speed != 1.0 and speed > 0.4 and speed < 2.0:
            y = librosa.effects.time_stretch(y, rate=speed)

        # Write intermediate processed WAV
        temp_proc_wav = wav_path.replace(".wav", "_processed.wav")
        sf.write(temp_proc_wav, y, sr, subtype='PCM_16')

        # Load with pydub for EQ and tone shaping
        sound = AudioSegment.from_file(temp_proc_wav)

        # 3. Voice Depth (0-100 bass & body boost)
        if depth > 0:
            gain_db = (depth / 100.0) * 4.0  # Up to +4dB bass boost
            sound = sound.low_pass_filter(3000).apply_gain(gain_db).overlay(sound)

        # 4. Tone EQ Presets
        tone_lower = (tone or "natural").lower()
        if tone_lower == "deep":
            sound = sound.low_pass_filter(4000).apply_gain(2.5)
        elif tone_lower == "warm":
            sound = sound.low_pass_filter(6000).apply_gain(1.5)
        elif tone_lower == "cinematic":
            sound = sound.high_pass_filter(80).low_pass_filter(12000).apply_gain(3.0)
        elif tone_lower == "documentary":
            sound = sound.high_pass_filter(100).apply_gain(1.0)

        # 5. Volume Normalization & Export as MP3
        sound = sound.normalize(headroom=0.5)
        sound.export(output_mp3_path, format="mp3", bitrate="192k")

        # Cleanup temporary file
        if os.path.exists(temp_proc_wav):
            try:
                os.remove(temp_proc_wav)
            except Exception:
                pass

        return output_mp3_path

    def generate(
        self,
        voice_id: str,
        text: str,
        pitch: float = 0.0,
        depth: float = 0.0,
        tone: str = "Natural",
        speed: float = 1.0,
        provider_name: str = "XTTS"
    ) -> str:
        """
        Synthesizes speech for text and applies post-processing audio parameters.
        """
        out_dir = os.path.join(settings.TEMP_DIR, voice_id)
        os.makedirs(out_dir, exist_ok=True)
        
        raw_wav_path = os.path.join(out_dir, f"raw_{hash(text) & 0xffffffff}.wav")
        final_mp3_path = os.path.join(out_dir, f"gen_{hash(text) & 0xffffffff}.mp3")

        # Synthesize base audio
        xtts_service.generate_speech(text, voice_id, raw_wav_path, provider_name)

        # Apply DSP post-processing
        return self.apply_dsp_effects(
            raw_wav_path, 
            final_mp3_path, 
            pitch_semitones=pitch, 
            depth=depth, 
            tone=tone, 
            speed=speed
        )

inference_service = InferenceService()
