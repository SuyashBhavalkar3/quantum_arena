from sqlalchemy import Column, Integer, String, DateTime, Boolean,ForeignKey,JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from authentication.database import Base

class ATSScore(Base):
    __tablename__ = "ats_scores"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    
    overall_score = Column(Integer)
    skill_match_score = Column(Integer)
    experience_match_score = Column(Integer)
    education_match_score = Column(Integer)
    matched_skills = Column(JSON)
    missing_skills = Column(JSON)
    recommendation = Column(String)
    summary = Column(String)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    candidate = relationship("Candidate", backref="ats_scores")
    job = relationship("Job", backref="ats_scores")