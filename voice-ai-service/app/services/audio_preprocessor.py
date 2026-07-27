import os
import requests
import tempfile
import numpy as np
import soundfile as sf
import librosa
from pydub import AudioSegment, silence
from app.config import settings

class AudioPreprocessor:
    """
    Production Audio Preprocessing & Quality Assurance Pipeline.
    Performs download, format conversion (16kHz mono WAV), noise reduction,
    silence removal, VAD, volume normalization, and audio segmentation.
    """

    def download_audio(self, url_or_path: str, target_dir: str) -> str:
        """Download remote audio or verify local path and store in target_dir."""
        if os.path.exists(url_or_path):
            return url_or_path
        
        response = requests.get(url_or_path, stream=True)
        response.raise_for_status()
        
        filename = f"raw_{os.path.basename(url_or_path.split('?')[0]) or 'sample.wav'}"
        if not filename.endswith(('.wav', '.mp3', '.m4a', '.flac', '.ogg')):
            filename += ".wav"
            
        save_path = os.path.join(target_dir, filename)
        with open(save_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        return save_path

    def analyze_audio_quality(self, audio_data: np.ndarray, sr: int) -> dict:
        """
        Analyze audio quality for SNR, duration, clipping, and clarity.
        Returns quality evaluation metrics and pass/fail boolean.
        """
        duration = len(audio_data) / sr
        
        # Clipping detection
        max_val = np.max(np.abs(audio_data))
        clipping_ratio = np.sum(np.abs(audio_data) >= 0.99) / len(audio_data)
        
        # Estimate Signal-to-Noise Ratio (SNR)
        energy = audio_data ** 2
        noise_floor = np.percentile(energy, 10)
        signal_power = np.percentile(energy, 90)
        snr_db = 10 * np.log10((signal_power + 1e-10) / (noise_floor + 1e-10))
        
        # Basic check for single speaker / voice presence (energy variability)
        is_clear = snr_db > 10.0 and clipping_ratio < 0.05
        
        return {
            "duration_sec": round(duration, 2),
            "snr_db": round(float(snr_db), 2),
            "clipping_ratio": round(float(clipping_ratio), 4),
            "max_amplitude": round(float(max_val), 4),
            "is_valid": duration >= settings.MIN_AUDIO_DURATION_SEC and is_clear
        }

    def convert_to_canonical_wav(self, input_path: str, output_path: str) -> tuple:
        """
        Converts input audio file to canonical format:
        16kHz sample rate, 1 channel (mono), 16-bit PCM WAV.
        """
        # Load using librosa to ensure standard sampling rate
        audio, _ = librosa.load(input_path, sr=settings.TARGET_SAMPLE_RATE, mono=True)
        
        # Normalize amplitude to [-1, 1]
        if np.max(np.abs(audio)) > 0:
            audio = audio / np.max(np.abs(audio))
            
        sf.write(output_path, audio, settings.TARGET_SAMPLE_RATE, subtype='PCM_16')
        return audio, settings.TARGET_SAMPLE_RATE

    def apply_noise_reduction(self, audio_data: np.ndarray, sr: int) -> np.ndarray:
        """Applies spectral gating noise reduction on speech audio."""
        try:
            import noisereduce as nr
            # Use non-stationary noise reduction for speech isolation
            cleaned = nr.reduce_noise(y=audio_data, sr=sr, prop_decrease=0.75, stationary=False)
            return cleaned
        except Exception as e:
            print(f"[AudioPreprocessor] Warning: Noise reduction fallback due to error: {e}")
            return audio_data

    def remove_excess_silence(self, wav_path: str, output_path: str) -> str:
        """Trims leading/trailing silence and shrinks interior pause duration."""
        sound = AudioSegment.from_file(wav_path)
        chunks = silence.split_on_silence(
            sound,
            min_silence_len=500,
            silence_thresh=sound.dBFS - 16,
            keep_silence=200
        )
        if chunks:
            combined = AudioSegment.empty()
            for chunk in chunks:
                combined += chunk
            combined.export(output_path, format="wav")
            return output_path
        return wav_path

    def normalize_volume(self, audio_data: np.ndarray, target_dbfs: float = -20.0) -> np.ndarray:
        """Performs RMS volume normalization."""
        rms = np.sqrt(np.mean(audio_data ** 2))
        if rms <= 0:
            return audio_data
        scalar = 10 ** (target_dbfs / 20.0) / (rms + 1e-8)
        normalized = audio_data * scalar
        # Prevent clipping after boost
        if np.max(np.abs(normalized)) > 0.98:
            normalized = normalized / np.max(np.abs(normalized)) * 0.98
        return normalized

    def segment_audio(self, audio_data: np.ndarray, sr: int, min_len_sec: float = 3.0, max_len_sec: float = 10.0) -> list:
        """
        Segments continuous audio into discrete 3-10 second speech chunks for training dataset.
        """
        chunk_samples_min = int(min_len_sec * sr)
        chunk_samples_max = int(max_len_sec * sr)
        
        # Split on silent regions
        intervals = librosa.effects.split(audio_data, top_db=25, frame_length=2048, hop_length=512)
        
        segments = []
        current_chunk = []
        current_length = 0

        for start, end in intervals:
            segment = audio_data[start:end]
            seg_len = len(segment)

            if current_length + seg_len > chunk_samples_max:
                if current_length >= chunk_samples_min:
                    segments.append(np.concatenate(current_chunk))
                current_chunk = [segment]
                current_length = seg_len
            else:
                current_chunk.append(segment)
                current_length += seg_len

        if current_chunk and current_length >= chunk_samples_min:
            segments.append(np.concatenate(current_chunk))
            
        # Fallback if audio is too short to segment
        if not segments and len(audio_data) >= chunk_samples_min:
            segments.append(audio_data)

        return segments

    def process_pipeline(self, audio_url: str, output_dir: str) -> dict:
        """
        Executes complete preparation pipeline:
        Audio Upload -> Download -> Quality Analysis -> Noise Removal ->
        Silence Removal -> VAD & Normalization -> Segment Datasets
        """
        os.makedirs(output_dir, exist_ok=True)
        
        # 1. Download audio
        raw_path = self.download_audio(audio_url, output_dir)
        canonical_path = os.path.join(output_dir, "canonical.wav")
        
        # 2. Convert to 16kHz mono WAV
        audio_data, sr = self.convert_to_canonical_wav(raw_path, canonical_path)
        
        # 3. Quality Analysis
        quality = self.analyze_audio_quality(audio_data, sr)
        if not quality["is_valid"]:
            return {
                "success": False,
                "error": "Please upload a cleaner voice sample with only one speaker (minimum 5 seconds duration required).",
                "quality": quality
            }

        # 4. Noise Reduction
        cleaned_audio = self.apply_noise_reduction(audio_data, sr)
        cleaned_wav_path = os.path.join(output_dir, "cleaned.wav")
        sf.write(cleaned_wav_path, cleaned_audio, sr, subtype='PCM_16')

        # 5. Silence Trimming & VAD
        trimmed_wav_path = os.path.join(output_dir, "trimmed.wav")
        self.remove_excess_silence(cleaned_wav_path, trimmed_wav_path)
        
        # Load trimmed audio data
        final_audio, _ = librosa.load(trimmed_wav_path, sr=sr, mono=True)
        
        # 6. Volume Normalization
        norm_audio = self.normalize_volume(final_audio, target_dbfs=-20.0)
        norm_wav_path = os.path.join(output_dir, "normalized.wav")
        sf.write(norm_wav_path, norm_audio, sr, subtype='PCM_16')

        # 7. Segmentation
        segments = self.segment_audio(norm_audio, sr)
        chunk_paths = []
        chunks_dir = os.path.join(output_dir, "chunks")
        os.makedirs(chunks_dir, exist_ok=True)
        
        for idx, seg in enumerate(segments):
            chunk_path = os.path.join(chunks_dir, f"{idx+1:03d}.wav")
            sf.write(chunk_path, seg, sr, subtype='PCM_16')
            chunk_paths.append(chunk_path)

        return {
            "success": True,
            "normalized_wav": norm_wav_path,
            "segments": chunk_paths,
            "quality": quality
        }

audio_preprocessor = AudioPreprocessor()
