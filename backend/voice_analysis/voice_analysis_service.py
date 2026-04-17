"""
Voice Analysis Service
=======================
Analyzes interview session audio + transcript for HR decision support.

Dependencies (install separately — see README):
  pip install librosa soundfile openai-whisper

If these are not installed, the service runs in TEXT-ONLY mode using
only the stored transcript and GPT-4o linguistic analysis.

Weight formula:
  confidence_index = 0.40 * prosody_score + 0.40 * linguistic_score + 0.20 * consistency_score
"""

import os
import re
import json
import logging
from typing import Optional

from openai import OpenAI

logger = logging.getLogger(__name__)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

FILLER_WORDS = {"um", "uh", "like", "you know", "basically", "literally", "sort of", "kind of"}

# ─── Audio Analysis (librosa) ────────────────────────────────────────────────

def _analyze_audio_librosa(audio_path: str) -> dict:
    """Extract prosody features from audio file using librosa."""
    try:
        import librosa
        import numpy as np

        y, sr = librosa.load(audio_path, sr=None)
        duration = librosa.get_duration(y=y, sr=sr)

        # Pitch (fundamental frequency)
        f0, voiced_flag, _ = librosa.pyin(y, fmin=50, fmax=500)
        voiced_f0 = f0[voiced_flag] if voiced_flag is not None else f0
        pitch_variance = float(voiced_f0.std()) if len(voiced_f0) > 0 else 0.0

        # Volume stability (RMS energy)
        rms = librosa.feature.rms(y=y)[0]
        volume_stability = float(1.0 - (rms.std() / (rms.mean() + 1e-6)))
        volume_stability = max(0.0, min(1.0, volume_stability))

        # Pauses: frames where RMS is very low
        silence_threshold = rms.mean() * 0.15
        is_silent = rms < silence_threshold
        # Count transitions from non-silence to silence as pause starts
        transitions = np.diff(is_silent.astype(int))
        pause_count = int((transitions == 1).sum())

        return {
            "duration_seconds": duration,
            "pitch_variance": pitch_variance,
            "volume_stability": volume_stability,
            "pause_count": pause_count,
        }
    except ImportError:
        logger.warning("librosa not installed — skipping audio analysis")
        return {}
    except Exception as e:
        logger.error(f"Audio analysis failed: {e}")
        return {}


def _transcribe_audio_whisper(audio_path: str) -> Optional[str]:
    """Transcribe audio using openai-whisper (local model)."""
    try:
        import whisper
        model = whisper.load_model("base")
        result = model.transcribe(audio_path)
        return result.get("text", "")
    except ImportError:
        logger.warning("openai-whisper not installed — skipping local transcription")
        return None
    except Exception as e:
        logger.error(f"Whisper transcription failed: {e}")
        return None


# ─── Text Analysis (GPT-4o) ──────────────────────────────────────────────────

def _count_fillers(text: str) -> int:
    """Count filler words/phrases in transcript text."""
    count = 0
    text_lower = text.lower()
    for fw in FILLER_WORDS:
        count += len(re.findall(r'\b' + re.escape(fw) + r'\b', text_lower))
    return count


def _estimate_wpm(text: str, duration_seconds: float) -> float:
    """Estimate words per minute from text and audio duration."""
    if duration_seconds <= 0:
        return 0.0
    word_count = len(text.split())
    return round(word_count / (duration_seconds / 60), 1)


def _linguistic_analysis_gpt(transcript: str, questions: list) -> dict:
    """
    Send transcript to GPT-4o for linguistic quality scoring.
    Returns structured scoring dict.
    """
    q_list = "\n".join(f"Q{i+1}: {q}" for i, q in enumerate(questions[:8]))

    prompt = f"""
You are an expert HR analyst evaluating a job interview transcript.
Score the candidate's responses on the following dimensions (0-10 each):

1. answer_completeness — Did they fully answer each question?
2. star_structure_usage — Did they use Situation-Task-Action-Result structure for behavioral answers?
3. vocabulary_richness — Diversity, precision, and professionalism of vocabulary
4. hedging_ratio — How often did they hedge (unsure, maybe, possibly)? Lower is better.
5. question_deflection_count — How many questions did they avoid or redirect?

Also provide per_question_scores (0-10 each).
Flag any moments that seem weak, evasive, or incomplete.

Return ONLY valid JSON:
{{
  "answer_completeness": <0-10>,
  "star_structure_usage": <0-10>,
  "vocabulary_richness": <0-10>,
  "hedging_ratio": <0.0-1.0>,
  "question_deflection_count": <int>,
  "linguistic_score": <0-100>,
  "per_question_scores": [
    {{
      "question_id": "q<n>",
      "question_text": "<text>",
      "linguistic_score": <0-10>,
      "completeness": <0-10>,
      "star_structure": <0-10>,
      "overall": <0-10>
    }}
  ],
  "flagged_moments": [
    {{
      "timestamp_seconds": <float>,
      "reason": "<filler_burst|evasion|incomplete|contradiction>",
      "text": "<excerpt>"
    }}
  ]
}}

INTERVIEW QUESTIONS:
{q_list}

FULL TRANSCRIPT:
{transcript[:4000]}
"""

    try:
        resp = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=2000,
            response_format={"type": "json_object"},
        )
        return json.loads(resp.choices[0].message.content)
    except Exception as e:
        logger.error(f"GPT linguistic analysis failed: {e}")
        return {
            "answer_completeness": 5.0, "star_structure_usage": 5.0,
            "vocabulary_richness": 5.0, "hedging_ratio": 0.3,
            "question_deflection_count": 0, "linguistic_score": 50.0,
            "per_question_scores": [], "flagged_moments": [],
        }


# ─── Combined confidence index ───────────────────────────────────────────────

def _compute_confidence_index(prosody: dict, linguistic: dict, wpm: float) -> float:
    """
    confidence_index = 0.40 * prosody_score + 0.40 * linguistic_score + 0.20 * consistency_score
    """
    # Prosody sub-score (0-100)
    prosody_components = []

    # WPM ideal range 120-160; penalty outside
    if wpm > 0:
        wpm_score = max(0, 100 - abs(wpm - 140) * 0.8)
        prosody_components.append(wpm_score)

    # Pause count: 0-5 great, >15 poor (scale 100→0)
    pause_count = prosody.get("pause_count", 5)
    pause_score = max(0, 100 - max(0, pause_count - 5) * 4)
    prosody_components.append(pause_score)

    # Pitch variance: moderate is good (30-80 Hz ideal)
    pv = prosody.get("pitch_variance", 50)
    pv_score = max(0, 100 - abs(pv - 55) * 1.2)
    prosody_components.append(pv_score)

    # Volume stability: direct 0-1 → 0-100
    vs = prosody.get("volume_stability", 0.7)
    prosody_components.append(vs * 100)

    prosody_score = sum(prosody_components) / len(prosody_components) if prosody_components else 50.0

    # Linguistic score (already 0-100 from GPT)
    linguistic_score = float(linguistic.get("linguistic_score", 50.0))

    # Consistency score — based on filler ratio and hedging
    hedging = float(linguistic.get("hedging_ratio", 0.3))
    deflections = int(linguistic.get("question_deflection_count", 0))
    consistency_score = max(0, 100 - hedging * 50 - deflections * 10)

    confidence = (0.40 * prosody_score) + (0.40 * linguistic_score) + (0.20 * consistency_score)
    return round(min(100.0, max(0.0, confidence)), 1)


def _get_recommendation(confidence_index: float) -> str:
    if confidence_index >= 72:
        return "Confident"
    elif confidence_index >= 50:
        return "Neutral"
    else:
        return "Needs Review"


# ─── Main entry point ────────────────────────────────────────────────────────

def analyze_session(
    session_id: str,
    stored_transcript: Optional[list],   # [{speaker, text}] from DB
    audio_path: Optional[str] = None,    # path to audio file if available
    application_id: Optional[int] = None,
) -> dict:
    """
    Full pipeline:
    1. Audio analysis (librosa) — if audio_path provided
    2. Transcription (whisper) — if audio_path provided and no transcript
    3. Merge transcript
    4. Linguistic analysis (GPT-4o)
    5. Compute confidence index
    6. Return full report dict
    """

    # ── Step 1: Audio prosody ──
    prosody = {}
    duration_seconds = 0.0
    if audio_path and os.path.exists(audio_path):
        prosody = _analyze_audio_librosa(audio_path)
        duration_seconds = prosody.get("duration_seconds", 0.0)

    # ── Step 2: Transcript ──
    transcript_text = ""
    if stored_transcript:
        # Use stored transcript (candidate messages only)
        candidate_turns = [t["text"] for t in stored_transcript if t.get("speaker") == "candidate"]
        transcript_text = " ".join(candidate_turns)
    elif audio_path and os.path.exists(audio_path):
        whisper_text = _transcribe_audio_whisper(audio_path)
        transcript_text = whisper_text or ""

    # ── Step 3: Filler count + WPM ──
    filler_count = _count_fillers(transcript_text) if transcript_text else 0
    wpm = _estimate_wpm(transcript_text, duration_seconds) if duration_seconds > 0 else 0.0

    # ── Step 4: Questions list for linguistic analysis ──
    questions = []
    if stored_transcript:
        questions = [t["text"] for t in stored_transcript if t.get("speaker") == "bot"]

    linguistic = {}
    if transcript_text:
        linguistic = _linguistic_analysis_gpt(transcript_text, questions)

    # ── Step 5: Confidence index ──
    confidence_index = _compute_confidence_index(prosody, linguistic, wpm)
    recommendation = _get_recommendation(confidence_index)

    return {
        "session_id": session_id,
        "application_id": application_id,
        "wpm": wpm if wpm > 0 else None,
        "pause_count": prosody.get("pause_count"),
        "filler_count": filler_count,
        "pitch_variance": prosody.get("pitch_variance"),
        "volume_stability": prosody.get("volume_stability"),
        "linguistic_score": linguistic.get("linguistic_score"),
        "answer_completeness": linguistic.get("answer_completeness"),
        "star_structure_score": linguistic.get("star_structure_usage"),
        "vocabulary_richness": linguistic.get("vocabulary_richness"),
        "hedging_ratio": linguistic.get("hedging_ratio"),
        "deflection_count": linguistic.get("question_deflection_count"),
        "confidence_index": confidence_index,
        "recommendation": recommendation,
        "per_question_scores": linguistic.get("per_question_scores", []),
        "flagged_moments": linguistic.get("flagged_moments", []),
        "transcript": transcript_text or None,
    }
