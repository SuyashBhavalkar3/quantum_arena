from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from applications.models import Application
from authentication.database import get_db
from authentication.models import User
from authentication.utils import get_current_user
from hr_ai_assistant.service import interpret_hr_command
from job_management_module.models import Job
from middleware.rate_limiter import rate_limiter

router = APIRouter(
    prefix="/v1/hr",
    tags=["HR AI Assistant"],
    dependencies=[Depends(rate_limiter)],
)


class AICommandRequest(BaseModel):
    query: str


class AICommandResponse(BaseModel):
    message: str
    action: str
    data: list[dict] | None = None


@router.post("/ai-command", response_model=AICommandResponse)
def run_ai_command(
    payload: AICommandRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only HR can use the AI assistant")

    command = interpret_hr_command(payload.query)
    action = command.get("action")

    if action == "create_job":
        title = (command.get("title") or "").strip()
        if not title:
            raise HTTPException(status_code=400, detail="Could not determine the role title")

        new_job = Job(
            title=title,
            description=command.get("description"),
            required_skills=command.get("required_skills") or [],
            experience_required=int(command.get("experience_required") or 0),
            location=command.get("location"),
            salary_range=command.get("salary_range"),
            created_by=current_user.id,
        )
        db.add(new_job)
        db.commit()
        db.refresh(new_job)
        return {
            "message": f'Job post created successfully for role "{new_job.title}".',
            "action": action,
            "data": [
                {
                    "id": new_job.id,
                    "title": new_job.title,
                    "required_skills": new_job.required_skills or [],
                    "experience_required": new_job.experience_required,
                    "location": new_job.location,
                    "salary_range": new_job.salary_range,
                }
            ],
        }

    if action == "list_jobs":
        jobs = (
            db.query(Job)
            .filter(Job.created_by == current_user.id)
            .order_by(Job.created_at.desc())
            .all()
        )
        return {
            "message": f"Found {len(jobs)} active job posts.",
            "action": action,
            "data": [
                {
                    "id": job.id,
                    "title": job.title,
                    "experience_required": job.experience_required,
                    "location": job.location,
                }
                for job in jobs
            ],
        }

    if action == "delete_job":
        title = (command.get("title") or "").strip()
        if not title:
            raise HTTPException(status_code=400, detail="Could not determine which job to delete")

        job = (
            db.query(Job)
            .filter(Job.created_by == current_user.id, func.lower(Job.title) == title.lower())
            .first()
        )
        if not job:
            raise HTTPException(status_code=404, detail=f'No job found for "{title}"')

        deleted_title = job.title
        db.delete(job)
        db.commit()
        return {
            "message": f'Job post "{deleted_title}" deleted successfully.',
            "action": action,
            "data": None,
        }

    if action == "list_candidates":
        title = (command.get("title") or "").strip()
        if not title:
            raise HTTPException(status_code=400, detail="Could not determine the job title")

        job = (
            db.query(Job)
            .filter(Job.created_by == current_user.id, func.lower(Job.title) == title.lower())
            .first()
        )
        if not job:
            raise HTTPException(status_code=404, detail=f'No job found for "{title}"')

        applications = (
            db.query(Application)
            .filter(Application.job_id == job.id)
            .order_by(Application.created_at.desc())
            .all()
        )
        return {
            "message": f'Found {len(applications)} candidate(s) for "{job.title}".',
            "action": action,
            "data": [
                {
                    "application_id": application.id,
                    "candidate_name": application.user.name if application.user else f"Candidate #{application.user_id}",
                    "candidate_email": application.user.email if application.user else None,
                    "status": application.status.value,
                }
                for application in applications
            ],
        }

    return {
        "message": "I can currently create jobs, list active jobs, delete a job, or list candidates for a role.",
        "action": "unsupported",
        "data": None,
    }
