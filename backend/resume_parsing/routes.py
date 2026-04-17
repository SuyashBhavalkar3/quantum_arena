
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

load_dotenv()
router = APIRouter(prefix="/resume", tags=["Resume Parsing"])

cloudinary.config(
    cloud_name=os.getenv("CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

@router.post("/upload-resume/", response_model=ResumeResponse)
async def upload_resume(
    #user_id: int = Form(...),
    phone: str = Form(...),
    linkedin_url: str = Form(...),
    file: UploadFile = File(...),
    profile_photo: UploadFile = File(...),
    bio: str = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if file.content_type not in [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]:
        raise HTTPException(status_code=400, detail="Only PDF and Word documents are allowed.")
    
    if profile_photo.content_type not in [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "image/webp"
    ]:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, JPG and WEBP images are allowed for profile photo.")

    try:
        file_bytes = await file.read()
        photo_bytes = await profile_photo.read()

        # Parse resume text → structured JSON via LLM
        parsed_data = parse_resume(io.BytesIO(file_bytes), file.filename)

        # Upload file to Cloudinary
        upload_result = cloudinary.uploader.upload(
            file_bytes, resource_type="raw", public_id=file.filename
        )
        file_url = upload_result["secure_url"]

        # Upload profile photo
        photo_upload = cloudinary.uploader.upload(
        photo_bytes,
        resource_type="image",
        public_id=f"profile_{current_user.id}"
        )

        photo_url = photo_upload["secure_url"]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

    # Save candidate base record (no parsed_data blob anymore)
    candidate = Candidate(
        user_id=current_user.id,
        phone=phone,
        linkedin_url=linkedin_url,
        resume_url=file_url,
        profile_photo_url=photo_url,
        bio=bio
    )
    db.add(candidate)
    db.commit()
    db.refresh(candidate)

    # Save parsed sections into separate tables
    if isinstance(parsed_data, dict) and "error" not in parsed_data:
        save_parsed_data(db, candidate.id, parsed_data)
        db.refresh(candidate)  # reload relationships

    return candidate
