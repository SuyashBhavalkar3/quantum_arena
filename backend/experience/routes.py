"""
Experience Wall Routes
======================
Fully public/anonymous — no login required to post or browse.
Optional: users may provide user_id if they're logged in (for future profile link).
"""

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import Optional
from authentication.database import get_db
from .models import ExperiencePost
from .schemas import (
    ExperiencePostCreate,
    ExperiencePostOut,
    ExperienceFeedResponse,
    UpvoteResponse,
    CompanyAutocomplete,
)

router = APIRouter(prefix="/experience", tags=["Experience Wall"])


# ─── POST: Submit an experience (no auth required) ──────────────────────────

@router.post("/submit", response_model=ExperiencePostOut, status_code=201)
def submit_experience(
    payload: ExperiencePostCreate,
    db: Session = Depends(get_db),
):
    """
    Anyone can submit an experience post.
    Set is_anonymous=True to hide identity.
    """
    rounds_detail_data = None
    if payload.rounds_detail:
        rounds_detail_data = [r.model_dump() for r in payload.rounds_detail]

    post = ExperiencePost(
        user_id=payload.user_id,
        is_anonymous=payload.is_anonymous,
        company=payload.company.strip(),
        role=payload.role.strip(),
        offer_date=payload.offer_date,
        ctc=payload.ctc,
        rounds_count=payload.rounds_count or (len(payload.rounds_detail) if payload.rounds_detail else 0),
        rounds_detail=rounds_detail_data,
        tips=payload.tips,
        tags=payload.tags or [],
        is_verified=False,
        upvotes=0,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


# ─── GET: Experience feed with filters ──────────────────────────────────────

@router.get("/feed", response_model=ExperienceFeedResponse)
def get_experience_feed(
    company: Optional[str] = Query(None, description="Filter by company name"),
    role: Optional[str] = Query(None, description="Filter by role (partial match)"),
    year: Optional[int] = Query(None, description="Filter by offer year (YYYY)"),
    sort: str = Query("recency", description="Sort: 'recency' or 'upvotes'"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    query = db.query(ExperiencePost)

    if company:
        query = query.filter(ExperiencePost.company.ilike(f"%{company}%"))
    if role:
        query = query.filter(ExperiencePost.role.ilike(f"%{role}%"))
    if year:
        query = query.filter(ExperiencePost.offer_date.like(f"{year}%"))

    total = query.count()

    if sort == "upvotes":
        query = query.order_by(desc(ExperiencePost.upvotes))
    else:
        query = query.order_by(desc(ExperiencePost.created_at))

    posts = query.offset((page - 1) * page_size).limit(page_size).all()
    return ExperienceFeedResponse(total=total, posts=posts)


# ─── POST: Upvote an experience ─────────────────────────────────────────────

@router.post("/{post_id}/upvote", response_model=UpvoteResponse)
def upvote_experience(
    post_id: int,
    db: Session = Depends(get_db),
):
    post = db.query(ExperiencePost).filter(ExperiencePost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Experience post not found")

    post.upvotes = (post.upvotes or 0) + 1
    db.commit()
    db.refresh(post)
    return UpvoteResponse(id=post.id, upvotes=post.upvotes)


# ─── GET: Company autocomplete ───────────────────────────────────────────────

@router.get("/companies", response_model=CompanyAutocomplete)
def get_companies(
    q: Optional[str] = Query(None, description="Partial company name for autocomplete"),
    db: Session = Depends(get_db),
):
    query = db.query(ExperiencePost.company).distinct()
    if q:
        query = query.filter(ExperiencePost.company.ilike(f"%{q}%"))
    companies = [row[0] for row in query.order_by(ExperiencePost.company).limit(20).all()]
    return CompanyAutocomplete(companies=companies)
