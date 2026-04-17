from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.sql import func
from authentication.database import Base
from sqlalchemy.orm import relationship

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    phone = Column(String(20), nullable=True)
    linkedin_url = Column(String(500), nullable=False)
    github_url = Column(String(500), nullable=True)
    resume_url = Column(String(500), nullable=False)
    parsed_data = Column(JSON, nullable=True)
    profile_photo_url = Column(String, nullable=True)
    bio = Column(String(500), nullable=True)
    profile_completed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="resumes")
    experiences = relationship("Experience", back_populates="candidate", cascade="all, delete")
    education = relationship("Education", back_populates="candidate", cascade="all, delete")
    skills = relationship("Skill", back_populates="candidate", cascade="all, delete")
    projects = relationship("Project", back_populates="candidate", cascade="all, delete")
    certifications = relationship("Certification", back_populates="candidate", cascade="all, delete")


# re-export models defined in candidate_profile for convenience
from candidate_profile.models import Experience, Education, Skill, Project, Certification