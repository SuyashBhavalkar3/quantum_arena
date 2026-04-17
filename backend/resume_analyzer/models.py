from sqlalchemy import Column, Integer, JSON, DateTime, ForeignKey
from sqlalchemy.sql import func
from authentication.database import Base
from sqlalchemy.orm import relationship

class ResumeAnalysis(Base):
    __tablename__ = "resume_analyses"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    
    # Store the result from the analyzer
    overall_score = Column(Integer, nullable=False)
    formatting_score = Column(Integer, nullable=False)
    strengths = Column(JSON, nullable=False)  # list of strings
    weaknesses = Column(JSON, nullable=False) # list of strings
    suggestions = Column(JSON, nullable=False) # list of strings

    created_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    candidate = relationship("Candidate", backref="resume_analysis")
