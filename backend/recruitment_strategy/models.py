from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.sql import func

from authentication.database import Base


class RecruitmentStrategy(Base):
    __tablename__ = "recruitment_strategies"

    id = Column(Integer, primary_key=True, index=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role_title = Column(String(255), nullable=False)
    candidates_to_hire = Column(Integer, nullable=False)
    hiring_timeline_days = Column(Integer, nullable=False)
    market_competition = Column(String(50), nullable=False)
    company_category = Column(String(50), nullable=False)
    company_offering = Column(Text, nullable=False)
    competitor_offerings = Column(Text, nullable=False)
    input_payload = Column(JSON, nullable=False)
    strategy_json = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
