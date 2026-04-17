"""
Placement Prep Routes
======================
GET  /prep/resume-status   — Check if user has a resume Cloudinary URL in their profile
POST /prep/upload-resume   — Upload a resume PDF inline (for users without one), saves to Cloudinary
POST /prep/generate-report — Generate AI prep report + return PDF download

Resume source of truth: candidates.resume_url (Cloudinary URL).
Can be set either during profile creation OR via the inline upload here.
"""

import os
import io
import logging

import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse

from sqlalchemy.orm import Session
from authentication.database import get_db
from authentication.utils import get_current_user
from authentication.models import User
from resume_parsing.models import Candidate
from resume_parsing.utils import parse_resume, save_parsed_data
from .schemas import PrepOnboardStatus, PrepGenerateRequest
from .resume_parser import extract_resume_text, build_resume_summary
from .report_generator import generate_prep_report, generate_pdf_from_report

load_dotenv()

cloudinary.config(
    cloud_name=os.getenv("CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
)

router = APIRouter(prefix="/prep", tags=["Placement Prep"])
logger = logging.getLogger(__name__)



# ─── GET: Resume check — does the user have a Cloudinary resume URL? ──────────

@router.get("/resume-status", response_model=PrepOnboardStatus)
def prep_resume_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Check if the logged-in user has a resume Cloudinary URL saved in their
    candidate profile record (set during profile creation via /resume/upload-resume/).

    Returns has_resume=True if candidates.resume_url is non-null and non-empty.
    Returns has_resume=False if the candidate has no profile record yet or used
    the manual entry path (which does not collect a resume file).
    """
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()

    has_resume = bool(candidate and candidate.resume_url and candidate.resume_url.strip())

    return PrepOnboardStatus(
        has_resume=has_resume,
        resume_url=candidate.resume_url if has_resume else None,
        candidate_name=current_user.name,
    )


# ─── POST: Inline resume upload (for users who skipped upload during profile creation) ──

@router.post("/upload-resume", response_model=PrepOnboardStatus)
async def prep_upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Accept a PDF resume upload directly from the AI Prep Wall.
    Works for users who have a profile (manual entry) or no profile at all.

    Steps:
    1. Validate PDF content type
    2. Upload to Cloudinary (raw resource type)
    3. Parse resume text → structured JSON via existing parse_resume util
    4. Save/update candidates.resume_url and parsed_data in DB
    5. Return updated resume-status so the frontend can advance to intake questions
    """
    allowed_types = {
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only PDF and Word documents are accepted.")

    try:
        file_bytes = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read file: {e}")

    # ── Upload to Cloudinary ──────────────────────────────────────────────────
    try:
        upload_result = cloudinary.uploader.upload(
            file_bytes,
            resource_type="raw",
            public_id=f"prep_resume_{current_user.id}_{file.filename}",
            overwrite=True,
        )
        cloudinary_url: str = upload_result["secure_url"]
        logger.info(f"Resume uploaded to Cloudinary for user {current_user.id}: {cloudinary_url}")
    except Exception as e:
        logger.error(f"Cloudinary upload failed for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail=f"Resume upload failed: {e}")

    # ── Parse resume text → structured data ──────────────────────────────────
    try:
        parsed_data = parse_resume(io.BytesIO(file_bytes), file.filename or "resume.pdf")
        if not isinstance(parsed_data, dict) or "error" in parsed_data:
            parsed_data = None  # non-fatal — we still have the Cloudinary URL
    except Exception as e:
        logger.warning(f"Resume parsing failed for user {current_user.id}: {e} (continuing)")
        parsed_data = None

    # ── Save to DB: update existing candidate or create a minimal new one ────
    try:
        candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()

        if candidate:
            # Just update the resume URL (and parsed data if available)
            candidate.resume_url = cloudinary_url
            if parsed_data:
                candidate.parsed_data = parsed_data
                # Re-save parsed sections into relationship tables
                save_parsed_data(db, candidate.id, parsed_data)
        else:
            # No profile yet — create a minimal candidate record
            candidate = Candidate(
                user_id=current_user.id,
                linkedin_url="",
                resume_url=cloudinary_url,
                parsed_data=parsed_data,
            )
            db.add(candidate)
            db.flush()
            if parsed_data:
                save_parsed_data(db, candidate.id, parsed_data)

        db.commit()
        db.refresh(candidate)
        logger.info(f"Resume URL saved to DB for user {current_user.id}")
    except Exception as e:
        db.rollback()
        logger.error(f"DB save failed for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save resume record: {e}")

    return PrepOnboardStatus(
        has_resume=True,
        resume_url=cloudinary_url,
        candidate_name=current_user.name,
    )


# ─── POST: Generate AI prep report ─────────────────────────────────────────

@router.post("/generate-report")
def generate_report(
    payload: PrepGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    1. Verify the candidate has a resume Cloudinary URL in their profile
    2. Fetch the PDF from Cloudinary using requests (no file upload needed)
    3. Parse with PyMuPDF / pdfminer
    4. Also use structured parsed_data stored in DB for richer context
    5. Send everything to GPT-4o with intake form data
    6. Generate PDF
    7. Stream PDF back to client as download
    """
    # Fetch candidate record — resume_url was set during profile creation
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()

    if not candidate:
        raise HTTPException(
            status_code=400,
            detail=(
                "No candidate profile found. Please complete your profile first. "
                "The AI Prep Report requires your resume which is collected during profile setup."
            )
        )

    if not candidate.resume_url or not candidate.resume_url.strip():
        raise HTTPException(
            status_code=400,
            detail=(
                "No resume found in your profile. Please create your profile using the "
                "'Upload Resume' option so we can access your resume for report generation. "
                "If you used manual entry, your resume file was not collected."
            )
        )

    resume_url = candidate.resume_url.strip()

    # Parse resume text from Cloudinary URL
    try:
        raw_text = extract_resume_text(resume_url)
        logger.info(f"Resume text extracted for user {current_user.id}, length={len(raw_text)}")
    except Exception as e:
        logger.warning(f"Failed to fetch/parse resume from Cloudinary for user {current_user.id}: {e}")
        # Proceed with structured DB data only — don't crash
        raw_text = ""

    # Build rich resume context combining Cloudinary raw text + structured parsed_data from DB
    resume_summary = build_resume_summary(candidate.parsed_data, raw_text)

    if not resume_summary.strip():
        # Final fallback: if we have nothing, build from profile relationships
        resume_summary = _build_summary_from_relationships(candidate)

    # Generate AI report
    try:
        report_data = generate_prep_report(
            resume_summary=resume_summary,
            job_role=payload.job_role,
            target_companies=payload.target_companies,
            days_available=payload.days_available,
            current_tech_stack=payload.current_tech_stack,
            weakest_skill=payload.weakest_skill,
        )
    except Exception as e:
        logger.error(f"GPT-4o report generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"AI report generation failed: {str(e)}")

    # Build PDF
    try:
        pdf_bytes = generate_pdf_from_report(
            report=report_data,
            candidate_name=current_user.name,
            job_role=payload.job_role,
        )
    except Exception as e:
        logger.error(f"PDF generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

    filename = f"prep_report_{current_user.name.replace(' ', '_')}_{payload.job_role.replace(' ', '_')}.pdf"

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def _build_summary_from_relationships(candidate: Candidate) -> str:
    """
    Last-resort fallback: build a resume summary from the ORM relationships
    (experiences, education, skills, projects) when neither the Cloudinary PDF
    nor the parsed_data JSON blob is available.
    """
    parts = []

    if candidate.skills:
        skill = candidate.skills[0]
        skill_parts = [
            skill.languages, skill.backend_technologies, skill.databases,
            skill.ai_ml_frameworks, skill.tools_platforms, skill.core_competencies,
        ]
        all_skills = ", ".join(s for s in skill_parts if s)
        if all_skills:
            parts.append(f"SKILLS: {all_skills}")

    for exp in (candidate.experiences or [])[:3]:
        parts.append(
            f"EXPERIENCE: {getattr(exp, 'job_title', '')} at "
            f"{getattr(exp, 'company_name', '')} — "
            f"{getattr(exp, 'description', '')[:200]}"
        )

    for edu in (candidate.education or [])[:2]:
        parts.append(
            f"EDUCATION: {getattr(edu, 'degree', '')} at "
            f"{getattr(edu, 'institution', '')} "
            f"({getattr(edu, 'start_date', '')} – {getattr(edu, 'end_date', '')})"
        )

    for proj in (candidate.projects or [])[:3]:
        parts.append(
            f"PROJECT: {getattr(proj, 'project_name', '') or getattr(proj, 'title', '')} — "
            f"{getattr(proj, 'description', '')[:200]}"
        )

    return "\n".join(parts)
