from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from authentication.database import get_db
from authentication.utils import get_current_user
from authentication.models import User
from applications.models import Application, ApplicationStatus
from middleware.rate_limiter import rate_limiter
from datetime import datetime
from reports.service import generate_candidate_report_safe

router = APIRouter(prefix="/v1/proctoring", tags=["Proctoring"], dependencies=[Depends(rate_limiter)])

class ViolationReport(BaseModel):
    application_id: int
    violation_type: str  # face_not_detected, multiple_faces, tab_switch, etc.
    timestamp: str
    details: str
    stage: str = "assessment"


class TerminateSessionRequest(BaseModel):
    application_id: int
    stage: str  # assessment | interview
    status: str
    reason: str
    violations: int

@router.post("/report-violation")
def report_violation(
    data: ViolationReport,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(
        Application.id == data.application_id,
        Application.user_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Store violation in assessment/interview data
    target_payload = dict(app.assessment_data or {}) if data.stage == "assessment" else dict(app.interview_feedback or {})
    violations = target_payload.get("violations", []) if target_payload else []
    violations.append({
        "type": data.violation_type,
        "timestamp": data.timestamp,
        "details": data.details,
        "stage": data.stage,
    })

    if data.stage == "assessment":
        target_payload["violations"] = violations
        target_payload["violation_count"] = len(violations)
        app.assessment_data = target_payload
    else:
        target_payload["violations"] = violations
        target_payload["violation_count"] = len(violations)
        app.interview_feedback = target_payload
    
    # Auto-fail if critical violations
    critical_violations = ["multiple_faces", "impersonation", "external_help"]
    if data.violation_type in critical_violations:
        app.status = ApplicationStatus.REJECTED
        app.hr_notes = f"Auto-rejected: Proctoring violation - {data.violation_type}"
    
    db.commit()
    return {"message": "Violation reported", "auto_rejected": data.violation_type in critical_violations}


@router.post("/terminate-session")
def terminate_session(
    data: TerminateSessionRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(
        Application.id == data.application_id,
        Application.user_id == current_user.id
    ).first()

    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    if data.stage == "interview":
        interview_feedback = dict(app.interview_feedback or {})
        interview_feedback["ai_interview_status"] = data.status
        interview_feedback["violation_count"] = data.violations
        interview_feedback["termination_reason"] = data.reason
        interview_feedback["completed_at"] = datetime.utcnow().isoformat()
        app.interview_feedback = interview_feedback
        app.status = ApplicationStatus.INTERVIEW_COMPLETED
    else:
        assessment_data = dict(app.assessment_data or {})
        assessment_data["assessment_status"] = data.status
        assessment_data["violation_count"] = data.violations
        assessment_data["termination_reason"] = data.reason
        app.assessment_data = assessment_data
        app.status = ApplicationStatus.ASSESSMENT_COMPLETED

    db.commit()
    if data.stage == "interview":
        background_tasks.add_task(generate_candidate_report_safe, data.application_id)
    return {"message": "Session terminated", "stage": data.stage, "status": data.status}

@router.get("/violations/{application_id}")
def get_violations(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Check authorization
    if current_user.is_employer:
        if app.job.created_by != current_user.id:
            raise HTTPException(status_code=403, detail="Unauthorized")
    else:
        if app.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Unauthorized")
    
    violations = []
    if app.assessment_data:
        violations.extend(app.assessment_data.get("violations", []))
    if app.interview_feedback:
        violations.extend(app.interview_feedback.get("violations", []))
    return {"violations": violations}
