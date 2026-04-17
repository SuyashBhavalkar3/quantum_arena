from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class ExperienceCreate(BaseModel):
    company_name: str = Field(..., min_length=2, max_length=200)
    job_title: str = Field(..., min_length=2, max_length=200)
    location: Optional[str] = Field(None, max_length=200)
    start_date: str = Field(..., min_length=4)
    end_date: Optional[str] = Field(None, min_length=4)
    is_current: bool = False
    description: Optional[str] = None
    marks: Optional[str] = Field(None, max_length=50)

class ExperienceResponse(ExperienceCreate):
    id: int
    candidate_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class EducationCreate(BaseModel):
    institution: str = Field(..., min_length=2, max_length=200)
    degree: str = Field(..., min_length=2, max_length=200)
    field_of_study: Optional[str] = Field(None, max_length=200)
    start_date: str = Field(..., min_length=4)
    end_date: Optional[str] = Field(None, min_length=4)
    grade: Optional[str] = Field(None, max_length=50)
    graduation_date: Optional[str] = Field(None, min_length=4)
    marks: Optional[str] = Field(None, max_length=50)
    location: Optional[str] = Field(None, max_length=200)

class EducationResponse(EducationCreate):
    id: int
    candidate_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class SkillCreate(BaseModel):
    languages: Optional[str] = None
    backend_technologies: Optional[str] = None
    databases: Optional[str] = None
    ai_ml_frameworks: Optional[str] = None
    tools_platforms: Optional[str] = None
    core_competencies: Optional[str] = None

class SkillResponse(SkillCreate):
    id: int
    candidate_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class ProjectCreate(BaseModel):
    project_name: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = None
    github_url: Optional[str] = Field(None, max_length=500)

class ProjectResponse(ProjectCreate):
    id: int
    candidate_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class CertificationCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)

class CertificationResponse(CertificationCreate):
    id: int
    candidate_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class CandidateProfileComplete(BaseModel):
    phone: Optional[str] = Field(None, min_length=10, max_length=20)
    linkedin_url: Optional[str] = Field(None, max_length=500)
    github_url: Optional[str] = Field(None, max_length=500)
    bio: Optional[str] = Field(None, max_length=1000)
    experiences: List[ExperienceCreate]
    education: List[EducationCreate]
    skills: List[SkillCreate]
