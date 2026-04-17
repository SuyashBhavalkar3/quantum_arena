from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class RoundDetail(BaseModel):
    round_name: str = Field(..., example="Technical Round 1")
    difficulty: str = Field(..., example="Medium")   # Easy | Medium | Hard
    description: Optional[str] = None


class ExperiencePostCreate(BaseModel):
    company: str = Field(..., min_length=1, max_length=200)
    role: str = Field(..., min_length=1, max_length=200)
    offer_date: Optional[str] = None          # "YYYY-MM"
    ctc: Optional[str] = None
    rounds_count: int = Field(default=0, ge=0)
    rounds_detail: Optional[List[RoundDetail]] = []
    tips: Optional[str] = None
    tags: Optional[List[str]] = []
    is_anonymous: bool = False
    # Optional author identity (supplied by frontend if user is logged in)
    user_id: Optional[int] = None


class ExperiencePostOut(BaseModel):
    id: int
    company: str
    role: str
    offer_date: Optional[str]
    ctc: Optional[str]
    rounds_count: int
    rounds_detail: Optional[List[RoundDetail]]
    tips: Optional[str]
    tags: Optional[List[str]]
    is_anonymous: bool
    is_verified: bool
    upvotes: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ExperienceFeedResponse(BaseModel):
    total: int
    posts: List[ExperiencePostOut]


class UpvoteResponse(BaseModel):
    id: int
    upvotes: int


class CompanyAutocomplete(BaseModel):
    companies: List[str]
