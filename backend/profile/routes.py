from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from authentication.database import get_db
from authentication.utils import get_current_user
from authentication.models import User
from resume_parsing.models import Candidate
from candidate_profile.schemas import CandidateProfileComplete
from candidate_profile.models import Experience, Education, Skill, Project
from resume_parsing.utils import parse_resume
import io
import os
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv
from typing import Optional

load_dotenv()

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

router = APIRouter(prefix="/api/profile", tags=["Profile"])

@router.post("/parse")
async def parse_resume_for_profile(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only candidates can access this endpoint")
    
    if file.content_type not in [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]:
        raise HTTPException(status_code=400, detail="Only PDF and Word documents are allowed")
    
    try:
        file_bytes = await file.read()
        parsed_data = parse_resume(io.BytesIO(file_bytes), file.filename)
        return parsed_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resume parsing failed: {str(e)}")

@router.get("/status")
def get_profile_status(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only candidates can access this endpoint")
    
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    
    if not candidate:
        return {"profile_completed": False}
    
    return {"profile_completed": candidate.profile_completed}

@router.get("")
def get_candidate_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Fetch complete candidate profile data"""
    if current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only candidates can access this endpoint")
    
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    
    if not candidate:
        return {
            "profile_completed": False,
            "profile_photo_url": None,
            "phone": None,
            "linkedin_url": None,
            "github_url": None,
            "bio": None,
            "experiences": [],
            "education": [],
            "skills": [],
            "projects": [],
            "certifications": []
        }
    
    # Fetch all related data
    experiences = [
        {
            "company_name": exp.company_name,
            "job_title": exp.job_title,
            "location": exp.location,
            "start_date": exp.start_date,
            "end_date": exp.end_date,
            "is_current": exp.is_current,
            "description": exp.description,
        }
        for exp in candidate.experiences
    ]
    
    education = [
        {
            "institution": edu.institution,
            "degree": edu.degree,
            "field_of_study": edu.field_of_study,
            "start_date": edu.start_date,
            "end_date": edu.end_date,
            "grade": edu.grade,
        }
        for edu in candidate.education
    ]
    
    skills = [
        {
            "languages": skill.languages,
            "backend_technologies": skill.backend_technologies,
            "databases": skill.databases,
            "ai_ml_frameworks": skill.ai_ml_frameworks,
            "tools_platforms": skill.tools_platforms,
            "core_competencies": skill.core_competencies,
        }
        for skill in candidate.skills
    ]
    
    projects = [
        {
            "title": project.title,
            "description": project.description,
            "link": project.link,
        }
        for project in candidate.projects
    ]
    
    certifications = [
        {
            "title": cert.title,
            "issuer": cert.issuer,
            "date": cert.date,
        }
        for cert in candidate.certifications
    ]
    
    return {
        "profile_completed": candidate.profile_completed,
        "profile_photo_url": candidate.profile_photo_url,
        "phone": candidate.phone,
        "linkedin_url": candidate.linkedin_url,
        "github_url": candidate.github_url,
        "bio": candidate.bio,
        "experiences": experiences,
        "education": education,
        "skills": skills,
        "projects": projects,
        "certifications": certifications,
    }

@router.post("/save")
async def save_profile(
    phone: Optional[str] = Form(None),
    linkedin_url: Optional[str] = Form(None),
    github_url: Optional[str] = Form(None),
    bio: Optional[str] = Form(None),
    profile_photo: Optional[UploadFile] = File(None),
    experiences_json: str = Form(...),
    education_json: str = Form(...),
    skills_json: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    import json
    
    if current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only candidates can access this endpoint")
    
    try:
        # Parse JSON strings
        experiences = json.loads(experiences_json)
        education = json.loads(education_json)
        skills = json.loads(skills_json)
        
        # Validate data structure
        profile_data = CandidateProfileComplete(
            phone=phone,
            linkedin_url=linkedin_url,
            github_url=github_url,
            bio=bio,
            experiences=experiences,
            education=education,
            skills=skills
        )
    except (json.JSONDecodeError, ValueError) as e:
        raise HTTPException(status_code=400, detail=f"Invalid profile data format: {str(e)}")
    
    # Handle profile photo upload to Cloudinary
    profile_photo_url = None
    if profile_photo:
        if profile_photo.content_type not in ["image/jpeg", "image/png", "image/jpg", "image/webp"]:
            raise HTTPException(status_code=400, detail="Only JPEG, PNG, JPG and WEBP images are allowed for profile photo")
        
        try:
            photo_bytes = await profile_photo.read()
            photo_upload = cloudinary.uploader.upload(
                photo_bytes,
                resource_type="image",
                public_id=f"profile_{current_user.id}",
                overwrite=True
            )
            profile_photo_url = photo_upload["secure_url"]
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Profile photo upload failed: {str(e)}")
    
    try:
        # Get or create candidate record
        candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
        
        if not candidate:
            candidate = Candidate(
                user_id=current_user.id,
                linkedin_url=linkedin_url or "",
                resume_url=""
            )
            db.add(candidate)
            db.flush()
        
        # Update candidate fields
        candidate.phone = phone
        candidate.linkedin_url = linkedin_url
        candidate.github_url = github_url
        candidate.bio = bio
        candidate.profile_completed = True
        
        if profile_photo_url:
            candidate.profile_photo_url = profile_photo_url
        
        # Clear existing profile data
        db.query(Experience).filter(Experience.candidate_id == candidate.id).delete()
        db.query(Education).filter(Education.candidate_id == candidate.id).delete()
        db.query(Skill).filter(Skill.candidate_id == candidate.id).delete()
        db.query(Project).filter(Project.candidate_id == candidate.id).delete()
        
        # Add new experiences
        for exp_data in profile_data.experiences:
            experience = Experience(candidate_id=candidate.id, **exp_data.dict())
            db.add(experience)
        
        # Add new education
        for edu_data in profile_data.education:
            education = Education(candidate_id=candidate.id, **edu_data.dict())
            db.add(education)
        
        # Add new skills
        for skill_data in profile_data.skills:
            skill = Skill(candidate_id=candidate.id, **skill_data.dict())
            db.add(skill)
        
        # Mark user profile as completed
        current_user.profile_completed = True
        
        db.commit()
        
        return {
            "message": "Profile saved successfully",
            "profile_completed": True,
            "profile_photo_url": profile_photo_url
        }
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save profile: {str(e)}")