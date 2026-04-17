from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    is_employer = Column(Boolean, default=False, nullable=False)
    company_name = Column(String, nullable=True)
    company_website = Column(String, nullable=True)
    company_description = Column(Text, nullable=True)
    profile_completed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    resumes = relationship("Candidate", back_populates="user", cascade="all, delete")
    jobs = relationship("Job", back_populates="employer", cascade="all, delete")
