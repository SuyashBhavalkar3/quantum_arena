
#Text To Speech Payload
import requests

API_KEY = "YOUR_API_KEY"
API_URL = "https://api.sarvam.ai/text-to-speech/stream"

def stream_tts():
    headers = {
        "api-subscription-key": API_KEY,
        "Content-Type": "application/json"
    }
    
    payload = {
        "text": """Hello! This is a streaming text-to-speech example.""",
        "target_language_code": "en-IN",
        "speaker": "priya",
        "model": "bulbul:v3",
        "pace": 1.1,
        "speech_sample_rate": 22050,
        "output_audio_codec": "mp3",
        "enable_preprocessing": True
    }
    
    # Stream the response
    with requests.post(API_URL, headers=headers, json=payload, stream=True) as response:
        response.raise_for_status()
        
        # Save to file as chunks arrive
        with open("output.mp3", "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
                    print(f"Received {len(chunk)} bytes")
        
        print("Audio saved to output.mp3")

if __name__ == "__main__":
    stream_tts()




#Speech To Text Payload

from sarvamai import SarvamAI

def main():
    client = SarvamAI(api_subscription_key="YOUR_API_KEY")

    # Create batch job — change mode as needed
    job = client.speech_to_text_job.create_job(
        model="saaras:v3",
        mode="transcribe",
        language_code="unknown",
        with_diarization=True,
        num_speakers=2
    )

    # Upload and process files
    audio_paths = ["path/to/audio1.mp3", "path/to/audio2.mp3"]
    job.upload_files(file_paths=audio_paths)
    job.start()

    # Wait for completion
    job.wait_until_complete()

    # Check file-level results
    file_results = job.get_file_results()

    print(f"\nSuccessful: {len(file_results['successful'])}")
    for f in file_results['successful']:
        print(f"  ✓ {f['file_name']}")

    print(f"\nFailed: {len(file_results['failed'])}")
    for f in file_results['failed']:
        print(f"  ✗ {f['file_name']}: {f['error_message']}")

    # Download outputs for successful files
    if file_results['successful']:
        job.download_outputs(output_dir="./output")
        print(f"\nDownloaded {len(file_results['successful'])} file(s) to: ./output")

if __name__ == "__main__":
    main()