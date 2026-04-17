"""
Voice Analysis Routes
======================
POST /analysis/voice              — Run analysis on a session, store report
GET  /analysis/voice/{session_id} — Fetch stored report
"""

import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from authentication.database import get_db
from authentication.utils import get_current_user
from authentication.models import User
from ai_interview_bot.services.interview_session import SessionManager

from .models import VoiceAnalysisReport
from .schemas import VoiceAnalysisRequest, VoiceAnalysisReportOut
from .voice_analysis_service import analyze_session

router = APIRouter(prefix="/analysis", tags=["Voice Analysis"])
logger = logging.getLogger(__name__)
session_manager = SessionManager()


@router.post("/voice", response_model=VoiceAnalysisReportOut, status_code=201)
def run_voice_analysis(
    payload: VoiceAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Run voice analysis on a completed interview session.
    Uses stored transcript + optional audio file.
    Stores result and returns full report.
    """
    session_id = payload.session_id

    # Check if report already exists
    existing = db.query(VoiceAnalysisReport).filter(
        VoiceAnalysisReport.session_id == session_id
    ).first()
    if existing:
        return existing

    # Get transcript from session manager (in-memory) or fall back to DB
    session_data = session_manager.get_session(session_id) or {}
    stored_transcript = session_data.get("transcript", [])

    # Run analysis
    try:
        report_data = analyze_session(
            session_id=session_id,
            stored_transcript=stored_transcript if stored_transcript else None,
            audio_path=None,  # Audio file path if stored — extend when audio storage is added
            application_id=payload.application_id,
        )
    except Exception as e:
        logger.error(f"Voice analysis failed for session {session_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Voice analysis failed: {str(e)}")

    # Store report
    report = VoiceAnalysisReport(
        session_id=report_data["session_id"],
        application_id=report_data.get("application_id"),
        wpm=report_data.get("wpm"),
        pause_count=report_data.get("pause_count"),
        filler_count=report_data.get("filler_count"),
        pitch_variance=report_data.get("pitch_variance"),
        volume_stability=report_data.get("volume_stability"),
        linguistic_score=report_data.get("linguistic_score"),
        answer_completeness=report_data.get("answer_completeness"),
        star_structure_score=report_data.get("star_structure_score"),
        vocabulary_richness=report_data.get("vocabulary_richness"),
        hedging_ratio=report_data.get("hedging_ratio"),
        deflection_count=report_data.get("deflection_count"),
        confidence_index=report_data.get("confidence_index"),
        recommendation=report_data.get("recommendation"),
        per_question_scores=report_data.get("per_question_scores", []),
        flagged_moments=report_data.get("flagged_moments", []),
        transcript=report_data.get("transcript"),
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.get("/voice/{session_id}", response_model=VoiceAnalysisReportOut)
def get_voice_analysis(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Fetch a previously generated voice analysis report."""
    report = db.query(VoiceAnalysisReport).filter(
        VoiceAnalysisReport.session_id == session_id
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Voice analysis report not found")
    return report
