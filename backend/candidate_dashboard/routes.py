from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from authentication.database import get_db
from authentication.utils import get_current_user
from authentication.models import User
from applications.models import Application, ApplicationStatus
from notifications.models import Notification
from notifications.models import Schedule
from middleware.rate_limiter import rate_limiter
from datetime import datetime, timedelta

RESUME_SCREENING_THRESHOLD = 10

router = APIRouter(prefix="/v1/candidate/dashboard", tags=["Candidate Dashboard"], dependencies=[Depends(rate_limiter)])

@router.get("/stats")
def get_candidate_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only candidates can access")
    
    total = db.query(Application).filter(Application.user_id == current_user.id).count()

    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    applications_this_week = db.query(Application).filter(
        Application.user_id == current_user.id,
        Application.created_at >= seven_days_ago
    ).count()

    in_progress = db.query(Application).filter(
        Application.user_id == current_user.id,
        Application.status.in_([
            ApplicationStatus.RESUME_SCREENED,
            ApplicationStatus.ASSESSMENT_SCHEDULED,
            ApplicationStatus.ASSESSMENT_COMPLETED,
            ApplicationStatus.INTERVIEW_SCHEDULED,
            ApplicationStatus.INTERVIEW_COMPLETED,
            ApplicationStatus.FINAL_REVIEW,
        ])
    ).count()

    interviews_total = db.query(Application).filter(
        Application.user_id == current_user.id,
        Application.status.in_([
            ApplicationStatus.INTERVIEW_SCHEDULED,
            ApplicationStatus.INTERVIEW_COMPLETED,
        ])
    ).count()

    upcoming_interviews = (
        db.query(Schedule)
        .join(Application, Schedule.application_id == Application.id)
        .filter(
            Application.user_id == current_user.id,
            Schedule.schedule_type == "interview",
            Schedule.scheduled_time >= datetime.utcnow(),
            Schedule.completed == False,
        )
        .count()
    )

    offers = db.query(Application).filter(
        Application.user_id == current_user.id,
        Application.status == ApplicationStatus.ACCEPTED
    ).count()

    offers_pending_response = offers

    unread = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()
    
    return {
        "total_applications": total,
        "applications_this_week": applications_this_week,
        "in_progress": in_progress,
        "interviews_total": interviews_total,
        "upcoming_interviews": upcoming_interviews,
        "offers_received": offers,
        "offers_pending_response": offers_pending_response,
        "unread_notifications": unread
    }

@router.get("/activity")
def get_activity(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only candidates can access")
    
    apps = db.query(Application).filter(
        Application.user_id == current_user.id
    ).order_by(Application.updated_at.desc()).limit(limit).all()
    
    activity = []

    for application in apps:
        resume_score = application.resume_match_score
        resume_screened = resume_score is not None
        passed_screening = bool(
            resume_screened and resume_score >= RESUME_SCREENING_THRESHOLD
        )

        if application.status in [
            ApplicationStatus.ASSESSMENT_SCHEDULED,
            ApplicationStatus.ASSESSMENT_COMPLETED,
            ApplicationStatus.INTERVIEW_SCHEDULED,
            ApplicationStatus.INTERVIEW_COMPLETED,
            ApplicationStatus.FINAL_REVIEW,
            ApplicationStatus.ACCEPTED,
        ] or passed_screening:
            screening_status = "passed"
            next_step_message = "You have been shortlisted based on your resume. Proceed to the next stage."
        elif resume_screened:
            screening_status = "not_selected"
            next_step_message = "Not selected - resume did not meet the job requirements."
        else:
            screening_status = "pending"
            next_step_message = "Your application is under review."

        activity.append({
            "id": application.id,
            "job_id": application.job_id,
            "job_title": application.job.title,
            "status": application.status,
            "updated_at": application.updated_at,
            "resume_score": resume_score,
            "assessment_score": application.assessment_score,
            "screening_status": screening_status,
            "screening_threshold": RESUME_SCREENING_THRESHOLD,
            "resume_screened": resume_screened,
            "passed_screening": passed_screening,
            "next_step_message": next_step_message,
        })

    return activity
