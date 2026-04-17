from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from authentication.database import get_db
from authentication.utils import get_current_user
from authentication.models import User
from applications.models import Application, ApplicationStatus
from middleware.rate_limiter import rate_limiter

router = APIRouter(prefix="/v1/hr/actions", tags=["HR Actions"], dependencies=[Depends(rate_limiter)])

class OfferRequest(BaseModel):
    application_id: int
    offer_details: str

class RejectRequest(BaseModel):
    application_id: int
    reason: str

@router.post("/offer")
def send_offer(
    data: OfferRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only HR can send offers")
    
    app = db.query(Application).filter(Application.id == data.application_id).first()
    if not app or app.job.created_by != current_user.id:
        raise HTTPException(status_code=404, detail="Application not found")
    
    app.status = ApplicationStatus.ACCEPTED
    app.hr_notes = data.offer_details
    
    # Calculate final score
    scores = []
    if app.resume_match_score: scores.append(app.resume_match_score * 0.3)
    if app.assessment_score: scores.append(app.assessment_score * 0.4)
    if app.interview_score: scores.append(app.interview_score * 0.3)
    app.final_score = sum(scores) if scores else 0
    
    db.commit()
    return {"message": "Offer sent successfully"}

@router.post("/reject")
def reject_candidate(
    data: RejectRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only HR can reject")
    
    app = db.query(Application).filter(Application.id == data.application_id).first()
    if not app or app.job.created_by != current_user.id:
        raise HTTPException(status_code=404, detail="Application not found")
    
    app.status = ApplicationStatus.REJECTED
    app.hr_notes = data.reason
    db.commit()
    return {"message": "Candidate rejected"}
