from pydantic import BaseModel
from typing import List

class ResumeAnalysisResponse(BaseModel):
    overall_score: int
    formatting_score: int
    strengths: List[str]
    weaknesses: List[str]
    suggestions: List[str]

    class Config:
        from_attributes = True
