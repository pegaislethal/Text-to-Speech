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
        bass_enhancement: float = 0.0,
        tone: str = "Natural",
        speed: float = 1.0
    ) -> str:
        """
        Applies signal processing effects on generated WAV and exports high quality MP3.
        Pipeline: Pitch Shift -> Speed Stretch -> Bass Enhancement -> Voice Depth -> EQ Presets -> Normalization.
        """
        # Load generated WAV
        y, sr = librosa.load(wav_path, sr=settings.TARGET_SAMPLE_RATE)

        # 1. Pitch Correction / Shift (-12 to +12 semitones)
        if pitch_semitones != 0.0:
            pitch_shift_n = max(-12.0, min(12.0, pitch_semitones))
            y = librosa.effects.pitch_shift(y, sr=sr, n_steps=pitch_shift_n)

        # 2. Speed Control (0.5x - 1.5x)
        if speed != 1.0 and speed >= 0.5 and speed <= 1.5:
            y = librosa.effects.time_stretch(y, rate=speed)

        # Write intermediate processed WAV
        temp_proc_wav = wav_path.replace(".wav", "_processed.wav")
        sf.write(temp_proc_wav, y, sr, subtype='PCM_16')

        # Load with pydub for EQ and tone shaping
        sound = AudioSegment.from_file(temp_proc_wav)

        # 3. Bass Enhancement (0-100 sub-bass gain between 60Hz - 250Hz)
        if bass_enhancement > 0:
            try:
                bass_gain_db = (min(100.0, max(0.0, bass_enhancement)) / 100.0) * 5.0
                sound = sound.low_pass_filter(250).apply_gain(bass_gain_db).overlay(sound)
            except Exception:
                pass

        # 4. Voice Depth (0-100 body resonance boost)
        if depth > 0:
            try:
                depth_gain_db = (min(100.0, max(0.0, depth)) / 100.0) * 4.0
                sound = sound.low_pass_filter(2500).apply_gain(depth_gain_db).overlay(sound)
            except Exception:
                pass

        # 5. Tone EQ Presets (Documentary, Cinematic, Dark, Podcast, Natural)
        tone_lower = (tone or "natural").strip().lower()
        try:
            if tone_lower == "documentary":
                sound = sound.high_pass_filter(80).low_pass_filter(10000).apply_gain(1.5)
            elif tone_lower == "cinematic":
                sound = sound.high_pass_filter(70).low_pass_filter(12000).apply_gain(3.5)
            elif tone_lower == "dark":
                sound = sound.low_pass_filter(4500).apply_gain(3.0)
            elif tone_lower == "podcast":
                sound = sound.high_pass_filter(100).apply_gain(2.0)
            elif tone_lower == "warm":
                sound = sound.low_pass_filter(6000).apply_gain(1.5)
        except Exception:
            pass

        # 6. Peak Normalization & Export
        sound = sound.normalize(headroom=0.5)
        try:
            sound.export(output_mp3_path, format="mp3", bitrate="192k")
            return output_mp3_path
        except Exception as e:
            # Fallback to WAV format if ffmpeg binary is not installed in system PATH
            wav_path = output_mp3_path.rsplit('.', 1)[0] + ".wav"
            sound.export(wav_path, format="wav")
            return wav_path

        # Cleanup temporary WAV file
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
        bass_enhancement: float = 0.0,
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
            bass_enhancement=bass_enhancement,
            tone=tone, 
            speed=speed
        )

inference_service = InferenceService()
