from pydantic import BaseModel
from typing import List, Optional, Dict


class JobCreate(BaseModel):
    title: str
    description: Optional[str] = None
    required_skills: List[str]
    experience_required: int
    location: str
    salary_range: str
    interview_config: Optional[Dict[str, str]] = None

class JobUpdate(BaseModel):
    title: Optional[str]
    description: Optional[str]
    required_skills: Optional[List[str]]
    experience_required: Optional[int]
    location: Optional[str]
    salary_range: Optional[str]    
    interview_config: Optional[Dict[str, str]]