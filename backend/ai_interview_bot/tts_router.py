from fastapi import APIRouter, File, UploadFile
from pydantic import BaseModel
from ai_interview_bot.services.sarvam_service import generate_speech, transcribe_audio

router = APIRouter()

class TTSRequest(BaseModel):
    text: str

@router.post("/api/tts")
async def text_to_speech(request: TTSRequest):
    """Convert text to speech using Sarvam API."""
    audio_base64 = generate_speech(request.text)
    if not audio_base64:
        return {"error": "Failed to generate speech", "audio": ""}
    return {"audio": audio_base64, "status": "success"}

@router.post("/api/transcribe")
async def speech_to_text(file: UploadFile = File(...)):
    """Transcribe speech to text using Sarvam API."""
    try:
        audio_bytes = await file.read()
        transcript = transcribe_audio(audio_bytes)
        if not transcript:
            return {"transcript": "", "error": "Failed to transcribe audio"}
        return {"transcript": transcript, "status": "success"}
    except Exception as e:
        return {"error": str(e), "transcript": ""}
