from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from authentication.database import get_db
from authentication.models import User
from authentication.utils import get_current_user
from middleware.rate_limiter import rate_limiter
from recruitment_strategy.models import RecruitmentStrategy
from recruitment_strategy.schemas import (
    RecruitmentStrategyGenerateRequest,
    RecruitmentStrategyResponse,
)
from recruitment_strategy.service import generate_recruitment_strategy

router = APIRouter(
    prefix="/v1/recruitment-strategy",
    tags=["Recruitment Strategy"],
    dependencies=[Depends(rate_limiter)],
)


@router.post("/generate", response_model=RecruitmentStrategyResponse, status_code=status.HTTP_201_CREATED)
def generate_strategy(
    payload: RecruitmentStrategyGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only HR can generate recruitment strategies")

    strategy = generate_recruitment_strategy(payload)
    record = RecruitmentStrategy(
        created_by=current_user.id,
        role_title=payload.role_to_hire_for,
        candidates_to_hire=payload.number_of_candidates_to_hire,
        hiring_timeline_days=payload.hiring_timeline_days,
        market_competition=strategy["market_competition"],
        company_category=payload.company_category,
        company_offering=strategy["company_offering"],
        competitor_offerings=strategy["competitor_offerings"],
        input_payload=payload.model_dump(),
        strategy_json=strategy,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "id": record.id,
        "role_to_hire_for": payload.role_to_hire_for,
        "number_of_candidates_to_hire": payload.number_of_candidates_to_hire,
        "hiring_timeline_days": payload.hiring_timeline_days,
        "market_competition": strategy["market_competition"],
        "company_category": payload.company_category,
        "company_offering": strategy["company_offering"],
        "competitor_offerings": strategy["competitor_offerings"],
        "executive_summary": strategy["executive_summary"],
        "hiring_funnel_strategy": strategy["hiring_funnel_strategy"],
        "time_optimization_plan": strategy["time_optimization_plan"],
        "cost_optimization_suggestions": strategy["cost_optimization_suggestions"],
        "competitive_hiring_advice": strategy["competitive_hiring_advice"],
        "sourcing_strategy": strategy["sourcing_strategy"],
        "risk_warnings": strategy["risk_warnings"],
        "raw_strategy_json": strategy,
        "created_at": record.created_at,
    }
