from datetime import datetime
from typing import Any, Dict, List, Literal

from pydantic import BaseModel, Field


class RecruitmentStrategyGenerateRequest(BaseModel):
    role_to_hire_for: str = Field(..., min_length=2, max_length=255)
    number_of_candidates_to_hire: int = Field(..., ge=1, le=500)
    hiring_timeline_days: int = Field(..., ge=1, le=365)
    company_category: Literal["startup", "mid-size", "enterprise"]


class RecruitmentStrategyFunnel(BaseModel):
    applications: int
    resume_screening: int
    assessment: int
    interview: int
    final_hires: int


class RecruitmentStrategyResponse(BaseModel):
    id: int
    role_to_hire_for: str
    number_of_candidates_to_hire: int
    hiring_timeline_days: int
    market_competition: str
    company_category: str
    company_offering: str
    competitor_offerings: str
    executive_summary: str
    hiring_funnel_strategy: RecruitmentStrategyFunnel
    time_optimization_plan: List[str]
    cost_optimization_suggestions: List[str]
    competitive_hiring_advice: List[str]
    sourcing_strategy: List[str]
    risk_warnings: List[str]
    raw_strategy_json: Dict[str, Any]
    created_at: datetime
