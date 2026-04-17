from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Float, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from authentication.database import Base
import enum

class ApplicationStatus(str, enum.Enum):
    PENDING = "pending"
    RESUME_SCREENED = "resume_screened"
    ASSESSMENT_SCHEDULED = "assessment_scheduled"
    ASSESSMENT_COMPLETED = "assessment_completed"
    INTERVIEW_SCHEDULED = "interview_scheduled"
    INTERVIEW_COMPLETED = "interview_completed"
    FINAL_REVIEW = "final_review"
    REJECTED = "rejected"
    ACCEPTED = "accepted"

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    status = Column(SQLEnum(ApplicationStatus), default=ApplicationStatus.PENDING, nullable=False)
    resume_match_score = Column(Float, nullable=True)
    resume_analysis = Column(JSON, nullable=True)
    
    assessment_score = Column(Float, nullable=True)
    assessment_data = Column(JSON, nullable=True)
    
    interview_score = Column(Float, nullable=True)
    interview_transcript = Column(JSON, nullable=True)
    interview_feedback = Column(JSON, nullable=True)
    
    final_score = Column(Float, nullable=True)
    hr_notes = Column(String, nullable=True)
    assessment_available_at = Column(DateTime(timezone=True), nullable=True)
    assessment_expires_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    job = relationship("Job", backref="applications")
    candidate = relationship("Candidate", backref="applications")
    user = relationship("User", backref="applications")
    schedules = relationship("Schedule", back_populates="application", cascade="all, delete")
    assessments = relationship("Assessment", back_populates="application", cascade="all, delete")

    @property
    def candidate_name(self):
        return self.user.name if self.user else None

    @property
    def candidate_email(self):
        return self.user.email if self.user else None
