from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from authentication.database import SessionLocal
from .models import  Job
from job_management_module.schemas import JobCreate,JobUpdate
from authentication.utils import get_current_user
from authentication.models import User

router = APIRouter(prefix="/jobs", tags=["Jobs"])



def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/create")
def create_job(
    job: JobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only HR can create jobs")

    new_job = Job(
        title=job.title,
        description=job.description,
        required_skills=job.required_skills,
        experience_required=job.experience_required,
        location=job.location,
        salary_range=job.salary_range,
        created_by=current_user.id
    )

    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    return {
        "message": "Job created successfully",
        "job": new_job
    }




@router.get("/")
def get_all_jobs(db: Session = Depends(get_db)):

    jobs = db.query(Job).all()

    return {"total_jobs": len(jobs), "jobs": jobs}



@router.get("/{job_id}")
def get_job(job_id: int, db: Session = Depends(get_db)):

    job = db.query(Job).filter(Job.id == job_id).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return job



@router.put("/{job_id}")
def update_job(job_id: int, job_update: JobUpdate, db: Session = Depends(get_db)):

    job = db.query(Job).filter(Job.id == job_id).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    for key, value in job_update.dict(exclude_unset=True).items():
        setattr(job, key, value)

    db.commit()
    db.refresh(job)

    return {"message": "Job updated", "job": job}



@router.delete("/{job_id}")
def delete_job(job_id: int, db: Session = Depends(get_db)):

    job = db.query(Job).filter(Job.id == job_id).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    db.delete(job)
    db.commit()

    return {"message": "Job deleted successfully"}
