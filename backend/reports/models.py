from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from authentication.database import Base


class CandidateReport(Base):
    __tablename__ = "candidate_reports"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, unique=True)
    report_type = Column(String(50), nullable=False, default="final_evaluation")
    status = Column(String(50), nullable=False, default="pending")
    pdf_path = Column(String(500), nullable=True)
    pdf_url = Column(String(500), nullable=True)
    llm_summary_json = Column(JSON, nullable=True)
    chart_metadata_json = Column(JSON, nullable=True)
    generated_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    application = relationship("Application")
