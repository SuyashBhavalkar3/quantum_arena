from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel


class CandidateReportSubject(BaseModel):
    candidate_name: str
    candidate_id: Optional[int] = None
    job_title: str
    job_id: Optional[int] = None
    application_status: Optional[str] = None


class CandidateReportAssessmentSection(BaseModel):
    score: float
    accuracy_percent: float
    duration_minutes: int
    violation_count: int
    violations: list[Dict[str, Any]]
    section_scores: Dict[str, float]
    time_spent_by_section: Dict[str, float]


class CandidateReportInterviewSection(BaseModel):
    score: float
    duration_minutes: int
    status: str
    violation_count: int
    violations: list[Dict[str, Any]]
    response_count: int
    skill_ratings: Dict[str, float]
    topic_coverage: Dict[str, float]
    summary: str


class CandidateReportResponse(BaseModel):
    id: int
    application_id: int
    report_type: str
    status: str
    pdf_path: Optional[str] = None
    pdf_url: Optional[str] = None
    llm_summary_json: Optional[Dict[str, Any]] = None
    chart_metadata_json: Optional[Dict[str, Any]] = None
    generated_at: Optional[datetime] = None
    error_message: Optional[str] = None
    created_at: datetime
    subject: Optional[CandidateReportSubject] = None
    assessment: Optional[CandidateReportAssessmentSection] = None
    interview: Optional[CandidateReportInterviewSection] = None
    strengths: list[str] = []
    weaknesses: list[str] = []
    behavioral_observations: list[str] = []
    final_recommendation: Optional[str] = None
    candidate_summary: Optional[str] = None
    interview_summary: Optional[str] = None
    chart_images: Optional[Dict[str, str]] = None

    class Config:
        from_attributes = True


class CandidateReportGenerateResponse(BaseModel):
    message: str
    application_id: int
    status: str
