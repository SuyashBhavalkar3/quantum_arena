from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, Dict, Any, List


# -------------------------
# Resume Create
# -------------------------
class ResumeCreate(BaseModel):
    user_id: int
    phone: str = Field(..., min_length=10, max_length=20)
    linkedin_url: str = Field(..., min_length=10)


# -------------------------
# Candidate Profile Models
# -------------------------
class ResumeResponse(BaseModel):
    id: int
    user_id: int
    phone: Optional[str]
    linkedin_url: Optional[str]
    resume_url: Optional[str]
    parsed_data: Optional[Dict[str, Any]]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CandidateProfileResponse(BaseModel):
    id: int
    user_id: int
    phone: str
    linkedin_url: str
    resume_url: str
    parsed_data: Optional[Dict[str, Any]]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CandidateProfileUpdate(BaseModel):
    phone: Optional[str] = Field(None, min_length=10, max_length=20)
    linkedin_url: Optional[str] = Field(None, min_length=10)


# -------------------------
# Education Schema
# -------------------------
class EducationSchema(BaseModel):
    id: int
    institution: Optional[str]
    degree: Optional[str]
    field_of_study: Optional[str]
    start_date: Optional[str]
    end_date: Optional[str]
    grade: Optional[str]
    marks: Optional[str]
    location: Optional[str]

    model_config = ConfigDict(from_attributes=True)


# -------------------------
# Experience Schema
# -------------------------
class ExperienceSchema(BaseModel):
    id: int
    company_name: Optional[str]

    # DB column = job_title
    title: Optional[str] = Field(None, alias="job_title")

    start_date: Optional[str]
    end_date: Optional[str]
    location: Optional[str]

    # DB column = description
    responsibilities: Optional[str] = Field(None, alias="description")

    model_config = ConfigDict(
        from_attributes=True,
        validate_by_name=True
    )


# -------------------------
# Project Schema
# -------------------------
class ProjectSchema(BaseModel):
    id: int
    project_name: Optional[str]
    description: Optional[str]
    github_url: Optional[str]

    model_config = ConfigDict(from_attributes=True)


# -------------------------
# Skill Schema
# -------------------------
class SkillSchema(BaseModel):
    id: int
    languages: Optional[str]
    backend_technologies: Optional[str]
    databases: Optional[str]
    ai_ml_frameworks: Optional[str]
    tools_platforms: Optional[str]
    core_competencies: Optional[str]

    model_config = ConfigDict(from_attributes=True)


# -------------------------
# Certification Schema
# -------------------------
class CertificationSchema(BaseModel):
    id: int
    title: Optional[str]

    model_config = ConfigDict(from_attributes=True)


# -------------------------
# Full Resume Response
# -------------------------
class ResumeFullResponse(BaseModel):
    id: int
    user_id: int
    phone: Optional[str]
    linkedin_url: Optional[str]
    resume_url: Optional[str]
    created_at: datetime

    education: List[EducationSchema] = Field(default_factory=list)
    experiences: List[ExperienceSchema] = Field(default_factory=list)
    projects: List[ProjectSchema] = Field(default_factory=list)
    skills: List[SkillSchema] = Field(default_factory=list)
    certifications: List[CertificationSchema] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)