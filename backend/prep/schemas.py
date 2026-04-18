from pydantic import BaseModel, Field
from typing import Optional, List


class PrepOnboardStatus(BaseModel):
    has_resume: bool
    resume_url: Optional[str] = None
    candidate_name: Optional[str] = None


class PrepGenerateRequest(BaseModel):
    job_role: str = Field(..., min_length=1, max_length=200)
    target_companies: List[str] = Field(default=[], max_length=10)
