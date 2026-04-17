from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from applications.models import ApplicationStatus

class ApplicationCreate(BaseModel):
    job_id: int

class ApplicationUpdate(BaseModel):
    status: Optional[ApplicationStatus] = None
    hr_notes: Optional[str] = None

class ApplicationResponse(BaseModel):
    id: int
    job_id: int
    candidate_id: int
    user_id: int
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    status: ApplicationStatus
    resume_match_score: Optional[float]
    resume_analysis: Optional[Dict[str, Any]]
    assessment_score: Optional[float]
    interview_score: Optional[float]
    final_score: Optional[float]
    hr_notes: Optional[str]
    assessment_data: Optional[Dict[str, Any]] = None
    interview_feedback: Optional[Dict[str, Any]] = None
    assessment_available_at: Optional[datetime] = None
    assessment_expires_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class ApplicationDetailResponse(ApplicationResponse):
    interview_transcript: Optional[Dict[str, Any]] = None
    job: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
