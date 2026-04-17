from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class FlaggedMoment(BaseModel):
    timestamp_seconds: float
    reason: str          # "filler_burst" | "long_pause" | "low_volume" | "high_pitch_variance"
    text: Optional[str] = None


class PerQuestionScore(BaseModel):
    question_id: Optional[str] = None
    question_text: Optional[str] = None
    linguistic_score: float         # 0-10
    completeness: float             # 0-10
    star_structure: float           # 0-10
    overall: float                  # 0-10


class VoiceAnalysisReportOut(BaseModel):
    id: int
    session_id: str
    application_id: Optional[int]

    # Prosody
    wpm: Optional[float]
    pause_count: Optional[int]
    filler_count: Optional[int]
    pitch_variance: Optional[float]
    volume_stability: Optional[float]

    # Linguistic
    linguistic_score: Optional[float]
    answer_completeness: Optional[float]
    star_structure_score: Optional[float]
    vocabulary_richness: Optional[float]
    hedging_ratio: Optional[float]
    deflection_count: Optional[int]

    # Combined
    confidence_index: Optional[float]
    recommendation: Optional[str]

    per_question_scores: Optional[List[PerQuestionScore]]
    flagged_moments: Optional[List[FlaggedMoment]]
    transcript: Optional[str]

    created_at: datetime

    model_config = {"from_attributes": True}


class VoiceAnalysisRequest(BaseModel):
    session_id: str
    application_id: Optional[int] = None
