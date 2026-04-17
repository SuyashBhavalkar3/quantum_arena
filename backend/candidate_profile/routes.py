import logging

logger = logging.getLogger(__name__)

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from authentication.database import get_db
from authentication.utils import get_current_user
from authentication.models import User
from resume_parsing.models import Candidate
from candidate_profile.models import Experience, Education, Skill, Project, Certification
from candidate_profile.schemas import *
from middleware.rate_limiter import rate_limiter

router = APIRouter(prefix="/v1/candidate", tags=["Candidate Profile"], dependencies=[Depends(rate_limiter)])

def check_candidate_access(current_user: User):
    if current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only candidates can access this endpoint")

# EXPERIENCES
@router.post("/experiences", response_model=ExperienceResponse, status_code=status.HTTP_201_CREATED)
def add_experience(exp: ExperienceCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_candidate_access(current_user)
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Complete profile first")
    
    experience = Experience(candidate_id=candidate.id, **exp.dict())
    db.add(experience)
    db.commit()
    db.refresh(experience)
    return experience

@router.get("/experiences", response_model=List[ExperienceResponse])
def get_experiences(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_candidate_access(current_user)
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if not candidate:
        return []
    return candidate.experiences

@router.put("/experiences/{exp_id}", response_model=ExperienceResponse)
def update_experience(exp_id: int, exp: ExperienceCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_candidate_access(current_user)
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    experience = db.query(Experience).filter(Experience.id == exp_id, Experience.candidate_id == candidate.id).first()
    if not experience:
        raise HTTPException(status_code=404, detail="Experience not found")
    
    for key, value in exp.dict().items():
        setattr(experience, key, value)
    db.commit()
    db.refresh(experience)
    return experience

@router.delete("/experiences/{exp_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_experience(exp_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_candidate_access(current_user)
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    experience = db.query(Experience).filter(Experience.id == exp_id, Experience.candidate_id == candidate.id).first()
    if not experience:
        raise HTTPException(status_code=404, detail="Experience not found")
    
    db.delete(experience)
    db.commit()

# EDUCATION
@router.post("/education", response_model=EducationResponse, status_code=status.HTTP_201_CREATED)
def add_education(edu: EducationCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_candidate_access(current_user)
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Complete profile first")
    
    education = Education(candidate_id=candidate.id, **edu.dict())
    db.add(education)
    db.commit()
    db.refresh(education)
    return education

@router.get("/education", response_model=List[EducationResponse])
def get_education(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_candidate_access(current_user)
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if not candidate:
        return []
    return candidate.education

@router.delete("/education/{edu_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_education(edu_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_candidate_access(current_user)
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    education = db.query(Education).filter(Education.id == edu_id, Education.candidate_id == candidate.id).first()
    if not education:
        raise HTTPException(status_code=404, detail="Education not found")
    
    db.delete(education)
    db.commit()

# SKILLS
@router.post("/skills", response_model=SkillResponse, status_code=status.HTTP_201_CREATED)
def add_skill(skill: SkillCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_candidate_access(current_user)
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Complete profile first")
    
    new_skill = Skill(candidate_id=candidate.id, **skill.dict())
    db.add(new_skill)
    db.commit()
    db.refresh(new_skill)
    return new_skill

@router.get("/skills", response_model=List[SkillResponse])
def get_skills(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_candidate_access(current_user)
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if not candidate:
        return []
    return candidate.skills

@router.put("/skills/{skill_id}", response_model=SkillResponse)
def update_skill(skill_id: int, skill: SkillCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_candidate_access(current_user)
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    skill_obj = db.query(Skill).filter(Skill.id == skill_id, Skill.candidate_id == candidate.id).first()
    if not skill_obj:
        raise HTTPException(status_code=404, detail="Skill not found")
    
    for key, value in skill.dict().items():
        setattr(skill_obj, key, value)
    db.commit()
    db.refresh(skill_obj)
    return skill_obj

@router.delete("/skills/{skill_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_skill(skill_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_candidate_access(current_user)
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    skill = db.query(Skill).filter(Skill.id == skill_id, Skill.candidate_id == candidate.id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    
    db.delete(skill)
    db.commit()

# PROJECTS
@router.post("/projects", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def add_project(proj: ProjectCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_candidate_access(current_user)
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Complete profile first")
    
    project = Project(candidate_id=candidate.id, **proj.dict())
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

@router.get("/projects", response_model=List[ProjectResponse])
def get_projects(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_candidate_access(current_user)
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if not candidate:
        return []
    return candidate.projects

@router.put("/projects/{proj_id}", response_model=ProjectResponse)
def update_project(proj_id: int, proj: ProjectCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_candidate_access(current_user)
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    project = db.query(Project).filter(Project.id == proj_id, Project.candidate_id == candidate.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    for key, value in proj.dict().items():
        setattr(project, key, value)
    db.commit()
    db.refresh(project)
    return project

@router.delete("/projects/{proj_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(proj_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_candidate_access(current_user)
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    project = db.query(Project).filter(Project.id == proj_id, Project.candidate_id == candidate.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db.delete(project)
    db.commit()

# CERTIFICATIONS
@router.post("/certifications", response_model=CertificationResponse, status_code=status.HTTP_201_CREATED)
def add_certification(cert: CertificationCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_candidate_access(current_user)
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Complete profile first")
    
    certification = Certification(candidate_id=candidate.id, **cert.dict())
    db.add(certification)
    db.commit()
    db.refresh(certification)
    return certification

@router.get("/certifications", response_model=List[CertificationResponse])
def get_certifications(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_candidate_access(current_user)
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if not candidate:
        return []
    return candidate.certifications

@router.delete("/certifications/{cert_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_certification(cert_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_candidate_access(current_user)
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    certification = db.query(Certification).filter(Certification.id == cert_id, Certification.candidate_id == candidate.id).first()
    if not certification:
        raise HTTPException(status_code=404, detail="Certification not found")
    
    db.delete(certification)
    db.commit()

@router.post("/complete-profile")
def complete_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_candidate_access(current_user)
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Upload resume first")
    
    has_experience = len(candidate.experiences) > 0
    has_education = len(candidate.education) > 0
    has_skills = len(candidate.skills) > 0
    logger.info(has_experience, candidate.experiences, has_education, candidate.education, has_skills, candidate.skills)
    
    if not (has_experience and has_education and has_skills):
        raise HTTPException(status_code=400, detail="Add at least one experience, education, and skill")
    
    candidate.profile_completed = True
    current_user.profile_completed = True
    db.commit()
    
    return {"message": "Profile completed successfully", "profile_completed": True}

@router.get("/profile-status")
def get_profile_status(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_candidate_access(current_user)
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    
    if not candidate:
        return {
            "profile_completed": False,
            "resume_uploaded": False,
            "has_experience": False,
            "has_education": False,
            "has_skills": False
        }
    
    return {
        "profile_completed": candidate.profile_completed,
        "resume_uploaded": True,
        "has_experience": len(candidate.experiences) > 0,
        "has_education": len(candidate.education) > 0,
        "has_skills": len(candidate.skills) > 0
    }
