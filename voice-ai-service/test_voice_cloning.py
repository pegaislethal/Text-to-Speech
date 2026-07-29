import os
import time
import math
import struct
import wave
import urllib.request
import json

# 1. Create a 5-second test WAV audio sample using Python standard library
def create_sample_wav(filename="sample_voice.wav", duration_sec=5.0, sample_rate=16000):
    num_samples = int(duration_sec * sample_rate)
    with wave.open(filename, "wb") as wav_file:
        wav_file.setnchannels(1)  # Mono
        wav_file.setsampwidth(2)  # 16-bit
        wav_file.setframerate(sample_rate)
        
        # Generate 440 Hz tone with harmonic modulation simulating voice pitch envelope
        for i in range(num_samples):
            t = float(i) / sample_rate
            value = int(16000 * math.sin(2 * math.pi * 220 * t) * math.sin(2 * math.pi * 2 * t))
            data = struct.pack("<h", value)
            wav_file.writeframesraw(data)
    print(f"[1/4] Sample WAV audio created: {os.path.abspath(filename)}")
    return os.path.abspath(filename)

def run_test():
    print("=" * 60)
    print("      TESTING AI VOICE CLONING PIPELINE (PYTHON)       ")
    print("=" * 60)
    
    # Step 1: Create local sample audio
    sample_file = create_sample_wav()
    
    # Convert file path to file URI for testing local preprocessor
    sample_uri = f"file:///{sample_file.replace('\\', '/')}"
    
    # Step 2: Call /voice/clone API
    print("\n[2/4] Triggering Voice Cloning API...")
    payload = {
        "voiceName": "Python Test Narrator",
        "audioUrl": sample_uri,
        "userId": "test_user_001",
        "provider": "XTTS",
        "consent": True
    }
    
    req = urllib.request.Request(
        "http://localhost:8000/voice/clone",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    
    try:
        with urllib.request.urlopen(req) as resp:
            clone_res = json.loads(resp.read().decode("utf-8"))
            print("Response:", json.dumps(clone_res, indent=2))
            voice_id = clone_res.get("voiceId")
    except Exception as e:
        print("API Request Error:", e)
        return

    # Step 3: Poll status
    print(f"\n[3/4] Polling training status for Voice ID: {voice_id}...")
    for _ in range(10):
        time.sleep(1)
        try:
            with urllib.request.urlopen(f"http://localhost:8000/voice/status/{voice_id}") as resp:
                status_res = json.loads(resp.read().decode("utf-8"))
                print("   Progress:", status_res.get("trainingProgress"), "% | Status:", status_res.get("trainingStatus"))
                if status_res.get("status") in ["completed", "failed"]:
                    break
        except Exception as err:
            print("Status fetch error:", err)
            break

    # Step 4: Generate speech from text
    print("\n[4/4] Generating speech audio using cloned voice...")
    gen_payload = {
        "voiceId": voice_id,
        "text": "Hello! The AI Voice Cloning pipeline is running smoothly.",
        "speed": 1.0,
        "pitch": 0.0,
        "tone": "Natural",
        "provider": "XTTS"
    }
    
    gen_req = urllib.request.Request(
        "http://localhost:8000/voice/generate",
        data=json.dumps(gen_payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    
    try:
        with urllib.request.urlopen(gen_req) as resp:
            audio_data = resp.read()
            output_filename = "output_generated_speech.mp3"
            with open(output_filename, "wb") as f:
                f.write(audio_data)
            print(f"SUCCESS! Speech generated and saved to: {os.path.abspath(output_filename)}")
            print(f"Output File Size: {len(audio_data)} bytes")
    except Exception as e:
        print("Speech Generation Error:", e)
        
    print("=" * 60)

if __name__ == "__main__":
    run_test()
