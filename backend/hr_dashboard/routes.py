from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from authentication.database import get_db
from authentication.utils import get_current_user
from authentication.models import User
from applications.models import Application, ApplicationStatus
from job_management_module.models import Job
from middleware.rate_limiter import rate_limiter
from datetime import datetime, timedelta

router = APIRouter(prefix="/v1/hr/dashboard", tags=["HR Dashboard"], dependencies=[Depends(rate_limiter)])

@router.get("/stats")
def get_hr_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only HR can access")
    
    jobs = db.query(Job).filter(Job.created_by == current_user.id).all()
    job_ids = [j.id for j in jobs]
    
    total_jobs = len(jobs)
    total_apps = db.query(Application).filter(Application.job_id.in_(job_ids)).count()
    
    pending = db.query(Application).filter(
        Application.job_id.in_(job_ids),
        Application.status == ApplicationStatus.PENDING
    ).count()
    
    in_assessment = db.query(Application).filter(
        Application.job_id.in_(job_ids),
        Application.status.in_([ApplicationStatus.ASSESSMENT_SCHEDULED, ApplicationStatus.ASSESSMENT_COMPLETED])
    ).count()
    
    in_interview = db.query(Application).filter(
        Application.job_id.in_(job_ids),
        Application.status.in_([ApplicationStatus.INTERVIEW_SCHEDULED, ApplicationStatus.INTERVIEW_COMPLETED])
    ).count()
    
    hired = db.query(Application).filter(
        Application.job_id.in_(job_ids),
        Application.status == ApplicationStatus.ACCEPTED
    ).count()
    
    rejected = db.query(Application).filter(
        Application.job_id.in_(job_ids),
        Application.status == ApplicationStatus.REJECTED
    ).count()
    
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    hired_this_month = db.query(Application).filter(
        Application.job_id.in_(job_ids),
        Application.status == ApplicationStatus.ACCEPTED,
        Application.updated_at >= thirty_days_ago
    ).count()
    
    apps_this_month = db.query(Application).filter(
        Application.job_id.in_(job_ids),
        Application.created_at >= thirty_days_ago
    ).count()
    
    return {
        "total_jobs": total_jobs,
        "total_applications": total_apps,
        "pending_review": pending,
        "in_assessment": in_assessment,
        "in_interview": in_interview,
        "hired_total": hired,
        "rejected": rejected,
        "hired_this_month": hired_this_month,
        "applications_this_month": apps_this_month
    }

@router.get("/recent-applicants")
def get_recent_applicants(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only HR can access")
    
    jobs = db.query(Job).filter(Job.created_by == current_user.id).all()
    job_ids = [j.id for j in jobs]
    
    apps = db.query(Application).filter(
        Application.job_id.in_(job_ids)
    ).order_by(Application.created_at.desc()).limit(limit).all()
    
    return [{
        "id": a.id,
        "candidate_id": a.candidate_id,
        "job_title": a.job.title,
        "status": a.status,
        "resume_score": a.resume_match_score,
        "assessment_score": a.assessment_score,
        "interview_score": a.interview_score,
        "final_score": a.final_score,
        "applied_at": a.created_at
    } for a in apps]

@router.get("/top-candidates")
def get_top_candidates(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only HR can access")
    
    jobs = db.query(Job).filter(Job.created_by == current_user.id).all()
    job_ids = [j.id for j in jobs]
    
    apps = db.query(Application).filter(
        Application.job_id.in_(job_ids),
        Application.resume_match_score.isnot(None)
    ).order_by(Application.resume_match_score.desc()).limit(limit).all()
    
    return [{
        "id": a.id,
        "candidate_id": a.candidate_id,
        "job_title": a.job.title,
        "status": a.status,
        "resume_score": a.resume_match_score,
        "assessment_score": a.assessment_score,
        "interview_score": a.interview_score,
        "final_score": a.final_score
    } for a in apps]

@router.get("/pending-actions")
def get_pending_actions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only HR can access")
    
    jobs = db.query(Job).filter(Job.created_by == current_user.id).all()
    job_ids = [j.id for j in jobs]
    
    pending_review = db.query(Application).filter(
        Application.job_id.in_(job_ids),
        Application.status == ApplicationStatus.PENDING
    ).all()
    
    assessment_completed = db.query(Application).filter(
        Application.job_id.in_(job_ids),
        Application.status == ApplicationStatus.ASSESSMENT_COMPLETED
    ).all()
    
    interview_completed = db.query(Application).filter(
        Application.job_id.in_(job_ids),
        Application.status == ApplicationStatus.INTERVIEW_COMPLETED
    ).all()
    
    return {
        "pending_review": [{
            "id": a.id,
            "job_title": a.job.title,
            "candidate_id": a.candidate_id,
            "applied_at": a.created_at
        } for a in pending_review],
        "assessment_completed": [{
            "id": a.id,
            "job_title": a.job.title,
            "candidate_id": a.candidate_id,
            "assessment_score": a.assessment_score
        } for a in assessment_completed],
        "interview_completed": [{
            "id": a.id,
            "job_title": a.job.title,
            "candidate_id": a.candidate_id,
            "interview_score": a.interview_score
        } for a in interview_completed]
    }
