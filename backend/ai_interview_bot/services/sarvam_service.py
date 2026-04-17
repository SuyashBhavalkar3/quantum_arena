import logging

logger = logging.getLogger(__name__)

import os
import requests
import base64
from dotenv import load_dotenv

load_dotenv()

SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")
SARVAM_TTS_URL = "https://api.sarvam.ai/text-to-speech/stream"
SARVAM_STT_URL = "https://api.sarvam.ai/speech-to-text"

# very small dummy audio (encoded) for fallback when no key is present
DUMMY_AUDIO_B64 = (
"//OExAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=="
)


def generate_speech(text: str) -> str:
    """Convert text to base64-encoded MP3 using Sarvam TTS."""
    if not text:
        return ""
    if not SARVAM_API_KEY:
        return DUMMY_AUDIO_B64

    headers = {
        "api-subscription-key": SARVAM_API_KEY,
        "Content-Type": "application/json"
    }

    payload = {
        "text": text,
        "target_language_code": "en-IN",
        "speaker": "ratan",
        "model": "bulbul:v3",
        "pace": 1.1,
        "speech_sample_rate": 22050,
        "output_audio_codec": "mp3",
        "enable_preprocessing": True
    }

    try:
        with requests.post(
            SARVAM_TTS_URL,
            headers=headers,
            json=payload,
            stream=True,
            timeout=30
        ) as response:
            response.raise_for_status()
            chunks = []
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    chunks.append(chunk)
            audio_bytes = b"".join(chunks)

        if not audio_bytes:
            return ""
        return base64.b64encode(audio_bytes).decode("ascii")
    except Exception as e:
        logger.info(f"[Sarvam TTS error] {e}")
        return ""


def transcribe_audio(audio_bytes: bytes) -> str:
    """Send raw audio bytes to Sarvam STT and return the transcribed text."""
    if not audio_bytes:
        return ""
    if not SARVAM_API_KEY:
        return ""

    files = {"file": ("audio.webm", audio_bytes, "audio/webm")}  # browser recording often uses webm
    data = {
        "model": "saaras:v3",
        "mode": "transcribe",
        "language_code": "unknown"
    }
    headers = {"api-subscription-key": SARVAM_API_KEY}

    try:
        response = requests.post(
            SARVAM_STT_URL,
            files=files,
            data=data,
            headers=headers,
            timeout=30
        )
        response.raise_for_status()
        resp_json = response.json()
        # extract text
        text = ""
        if isinstance(resp_json, dict):
            text = resp_json.get("transcript") or resp_json.get("text") or ""
            if not text and "results" in resp_json:
                results = resp_json.get("results")
                if isinstance(results, list) and results:
                    text = results[0].get("transcript") or results[0].get("text", "")
        return (text or "").strip()
    except Exception as e:
        logger.info(f"[Sarvam STT error] {e}")
        return ""