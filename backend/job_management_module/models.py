from sqlalchemy import Column, Integer, String, DateTime, Boolean,ForeignKey,JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from authentication.database import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)

    required_skills = Column(JSON, nullable=True)

    experience_required = Column(Integer, nullable=True)
    location = Column(String, nullable=True)
    salary_range = Column(String, nullable=True)

    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    employer = relationship("User", back_populates="jobs")

