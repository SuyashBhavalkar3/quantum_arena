from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Union

from .database import get_db
from .models import User
from .schemas import UserCreate, LoginRequest, Token, UserOut, UserUpdate
from .utils import get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, get_current_user
from middleware.rate_limiter import rate_limiter

router = APIRouter(prefix="/v1/auth", tags=["Authentication"], dependencies=[Depends(rate_limiter)])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Register a new user as either an employer or candidate"""
    
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_password = get_password_hash(user_in.password)
    user = User(
        name=user_in.name,
        email=user_in.email,
        hashed_password=hashed_password,
        is_employer=user_in.is_employer,
        company_name=user_in.company_name if user_in.is_employer else None,
        company_website=user_in.company_website if user_in.is_employer else None,
        company_description=user_in.company_description if user_in.is_employer else None,
        profile_completed=False
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)

    return user


@router.post("/login", response_model=Token)
def login(user_in: LoginRequest, db: Session = Depends(get_db)):
    """Login a user and return JWT token"""
    
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if user_in.is_employer is not None and user.is_employer != user_in.is_employer:
        raise HTTPException(status_code=401, detail="Invalid role for this email")
    
    access_token = create_access_token(user_id=user.id, is_employer=user.is_employer)
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserOut)
def get_current_user_endpoint(current_user: User = Depends(get_current_user)):
    """Get current authenticated user's profile"""
    return current_user


@router.put("/me", response_model=UserOut)
def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user's profile"""
    
    if user_update.name:
        current_user.name = user_update.name
    
    if current_user.is_employer:
        if user_update.company_name:
            current_user.company_name = user_update.company_name
        if user_update.company_website:
            current_user.company_website = user_update.company_website
        if user_update.company_description:
            current_user.company_description = user_update.company_description
        
        # Mark profile as completed if company info is provided
        if current_user.company_name:
            current_user.profile_completed = True
    
    db.commit()
    db.refresh(current_user)
    
    return current_user
