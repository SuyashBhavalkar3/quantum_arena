
from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, APIRouter, Form
from sqlalchemy.orm import Session
import cloudinary, cloudinary.uploader
import os, io
from dotenv import load_dotenv
from authentication.database import get_db
from resume_parsing.models import Candidate
from resume_parsing.schemas import ResumeResponse
from authentication.utils import get_current_user
from resume_parsing.utils import parse_resume
from resume_parsing.utils import save_parsed_data
from authentication.models import User
from job_management_module.models import Job
from ATS_score.utils import build_candidate_profile, calculate_ats_score

router = APIRouter(prefix="/ats-scores", tags=["ATS Scores"])


from ATS_score.models import ATSScore

@router.post("/{job_id}/score/{candidate_id}")
def score_single_candidate(
    job_id: int,
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    profile = build_candidate_profile(candidate)
    ats_result = calculate_ats_score(profile, job)

    # Check if score already exists → update it, else create new
    existing = db.query(ATSScore).filter(
        ATSScore.candidate_id == candidate_id,
        ATSScore.job_id == job_id
    ).first()

    if existing:
        for key, value in ats_result.items():
            setattr(existing, key, value)
        db.commit()
        db.refresh(existing)
        record = existing
    else:
        record = ATSScore(
            candidate_id=candidate_id,
            job_id=job_id,
            overall_score=ats_result.get("overall_score"),
            skill_match_score=ats_result.get("skill_match_score"),
            experience_match_score=ats_result.get("experience_match_score"),
            education_match_score=ats_result.get("education_match_score"),
            matched_skills=ats_result.get("matched_skills"),
            missing_skills=ats_result.get("missing_skills"),
            recommendation=ats_result.get("recommendation"),
            summary=ats_result.get("summary"),
        )
        db.add(record)
        db.commit()
        db.refresh(record)

    return {
        "job_id": job_id,
        "candidate_id": candidate_id,
        "ats_score_id": record.id,
        "ats_result": ats_result
    }


@router.get("/{job_id}/rank-candidates")
def rank_all_candidates(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    candidates = db.query(Candidate).all()
    if not candidates:
        raise HTTPException(status_code=404, detail="No candidates found")

    results = []
    for candidate in candidates:
        profile = build_candidate_profile(candidate)

        try:
            ats_result = calculate_ats_score(profile, job)

            # Upsert per candidate
            existing = db.query(ATSScore).filter(
                ATSScore.candidate_id == candidate.id,
                ATSScore.job_id == job_id
            ).first()

            if existing:
                for key, value in ats_result.items():
                    setattr(existing, key, value)
                db.commit()
            else:
                db.add(ATSScore(
                    candidate_id=candidate.id,
                    job_id=job_id,
                    overall_score=ats_result.get("overall_score"),
                    skill_match_score=ats_result.get("skill_match_score"),
                    experience_match_score=ats_result.get("experience_match_score"),
                    education_match_score=ats_result.get("education_match_score"),
                    matched_skills=ats_result.get("matched_skills"),
                    missing_skills=ats_result.get("missing_skills"),
                    recommendation=ats_result.get("recommendation"),
                    summary=ats_result.get("summary"),
                ))
                db.commit()

            results.append({
                "candidate_id": candidate.id,
                "user_id": candidate.user_id,
                "overall_score": ats_result.get("overall_score", 0),
                "recommendation": ats_result.get("recommendation", ""),
                "matched_skills": ats_result.get("matched_skills", []),
                "missing_skills": ats_result.get("missing_skills", []),
                "skill_match_score": ats_result.get("skill_match_score", 0),
                "experience_match_score": ats_result.get("experience_match_score", 0),
                "summary": ats_result.get("summary", ""),
            })

        except Exception as e:
            results.append({
                "candidate_id": candidate.id,
                "user_id": candidate.user_id,
                "overall_score": 0,
                "error": str(e)
            })

    ranked = sorted(results, key=lambda x: x["overall_score"], reverse=True)

    return {
        "job_id": job_id,
        "job_title": job.title,
        "total_candidates": len(ranked),
        "ranked_candidates": ranked
    }


# Bonus: fetch saved scores without re-calling LLM
@router.get("/{job_id}/scores")
def get_saved_scores(job_id: int, db: Session = Depends(get_db)):
    """Return already-computed ATS scores from DB, sorted by score."""
    
    scores = (
        db.query(ATSScore)
        .filter(ATSScore.job_id == job_id)
        .order_by(ATSScore.overall_score.desc())
        .all()
    )

    return {
        "job_id": job_id,
        "total": len(scores),
        "scores": scores
    }