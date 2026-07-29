import sys
import os
import argparse
import time
import json
import urllib.request

# Ensure UTF-8 output encoding for Windows terminal compatibility
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

API_BASE_URL = "http://localhost:8000"

def clone_and_speak(audio_path, voice_name, text_prompt, output_file, provider="XTTS"):
    abs_audio_path = os.path.abspath(audio_path)
    if not os.path.exists(abs_audio_path):
        print(f"Error: Audio file not found at: {abs_audio_path}")
        sys.exit(1)

    print("\n" + "=" * 65)
    print("           TERMINAL AI VOICE CLONER & SYNTHESIZER             ")
    print("=" * 65)
    print(f"🎙️  Audio Sample : {abs_audio_path}")
    print(f"👤 Voice Name   : {voice_name}")
    print(f"⚡ AI Provider  : {provider}")
    print(f"📝 Text Script  : \"{text_prompt}\"")
    print("=" * 65)

    # Convert local file path to file URI
    file_uri = f"file:///{abs_audio_path.replace('\\', '/')}"

    # 1. Send Clone Request to API
    print("\n[Step 1/3] Extracting Voice Embeddings & Training Model...")
    clone_payload = {
        "voiceName": voice_name,
        "audioUrl": file_uri,
        "userId": "cli_user",
        "provider": provider,
        "consent": True
    }

    req = urllib.request.Request(
        f"{API_BASE_URL}/voice/clone",
        data=json.dumps(clone_payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )

    try:
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            voice_id = res_data.get("voiceId")
            print(f"✔️ Voice Profile Registered (ID: {voice_id})")
    except Exception as e:
        print(f"❌ Failed to connect to Voice Engine: {e}")
        print("Make sure the Python service is running on http://localhost:8000")
        sys.exit(1)

    # 2. Poll Training Status
    print("[Step 2/3] Processing Speaker Encoder Pipeline...")
    for _ in range(15):
        time.sleep(1)
        try:
            with urllib.request.urlopen(f"{API_BASE_URL}/voice/status/{voice_id}") as resp:
                status = json.loads(resp.read().decode("utf-8"))
                progress = status.get("trainingProgress", 0)
                status_msg = status.get("trainingStatus", "")
                print(f"   ⏳ [{progress}%] {status_msg}")
                if status.get("status") in ["completed", "failed"]:
                    break
        except Exception as err:
            print(f"   Warning checking status: {err}")
            break

    # 3. Generate Speech Output MP3
    print(f"\n[Step 3/3] Synthesizing Speech Audio...")
    gen_payload = {
        "voiceId": voice_id,
        "text": text_prompt,
        "speed": 1.0,
        "pitch": 0.0,
        "tone": "Natural",
        "provider": provider
    }

    gen_req = urllib.request.Request(
        f"{API_BASE_URL}/voice/generate",
        data=json.dumps(gen_payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )

    try:
        with urllib.request.urlopen(gen_req) as resp:
            audio_bytes = resp.read()
            abs_output_path = os.path.abspath(output_file)
            with open(abs_output_path, "wb") as f:
                f.write(audio_bytes)
            
            print("\n" + "🎉 SUCCESS! Voice Cloned and Audio Generated!".center(65))
            print(f"📁 Output Audio Saved to: {abs_output_path}")
            print(f"📊 Audio Size           : {len(audio_bytes):,} bytes")
            print("=" * 65 + "\n")
    except Exception as e:
        print(f"❌ Error generating speech audio: {e}")

def main():
    parser = argparse.ArgumentParser(description="Terminal AI Voice Cloning CLI Tool")
    parser.add_argument("--file", "-f", help="Path to sample audio file (MP3 or WAV)")
    parser.add_argument("--name", "-n", help="Name for the cloned voice profile")
    parser.add_argument("--text", "-t", help="Text script to synthesize with cloned voice")
    parser.add_argument("--output", "-o", default="cloned_output.mp3", help="Output MP3 filename (default: cloned_output.mp3)")
    parser.add_argument("--provider", "-p", default="XTTS", choices=["XTTS", "OpenVoice"], help="AI provider (default: XTTS)")

    args = parser.parse_args()

    # If arguments are missing, prompt interactively
    audio_path = args.file
    if not audio_path:
        audio_path = input("Enter path to audio sample file (e.g., sample_voice.wav): ").strip().strip('"\'')
        if not audio_path:
            audio_path = "sample_voice.wav"

    voice_name = args.name
    if not voice_name:
        voice_name = input("Enter Voice Profile Name (default: Terminal Voice): ").strip() or "Terminal Voice"

    text_prompt = args.text
    if not text_prompt:
        text_prompt = input("Enter Text Script to synthesize: ").strip() or "Hello! This is a test of voice cloning directly from the terminal."

    output_file = args.output

    clone_and_speak(audio_path, voice_name, text_prompt, output_file, args.provider)

if __name__ == "__main__":
    main()
