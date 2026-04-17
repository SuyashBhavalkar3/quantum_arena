from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    is_employer: bool
    company_name: Optional[str] = Field(None, max_length=200)
    company_website: Optional[str] = Field(None, max_length=500)
    company_description: Optional[str] = Field(None, max_length=2000)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    is_employer: Optional[bool] = None


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    user_id: Optional[int] = None
    is_employer: Optional[bool] = None


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    is_employer: bool
    company_name: Optional[str] = None
    company_website: Optional[str] = None
    company_description: Optional[str] = None
    profile_completed: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    company_name: Optional[str] = Field(None, max_length=200)
    company_website: Optional[str] = Field(None, max_length=500)
    company_description: Optional[str] = Field(None, max_length=2000)
