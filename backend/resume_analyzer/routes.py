from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from authentication.database import get_db
from authentication.utils import get_current_user
from authentication.models import User
from resume_parsing.models import Candidate
from resume_analyzer.models import ResumeAnalysis
from resume_analyzer.schemas import ResumeAnalysisResponse
from resume_analyzer.utils import analyze_resume_text
from resume_parsing.utils import extract_text
from middleware.rate_limiter import rate_limiter
import requests
import io

router = APIRouter(prefix="/v1/resume-analyzer", tags=["Resume Analyzer"], dependencies=[Depends(rate_limiter)])

@router.get("/profile", response_model=ResumeAnalysisResponse)
def analyze_profile_resume(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only candidates can access this endpoint")
        
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    if not candidate.profile_completed:
        raise HTTPException(status_code=400, detail="Profile not completed. Please complete your profile and upload a resume.")
        
    # Check if analysis already exists
    existing_analysis = db.query(ResumeAnalysis).filter(ResumeAnalysis.candidate_id == candidate.id).first()
    if existing_analysis:
        return existing_analysis
        
    if not candidate.resume_url:
        raise HTTPException(status_code=400, detail="No resume URL found in profile")
        
    # Extract text from stored resume URL
    try:
        response = requests.get(candidate.resume_url)
        response.raise_for_status()
        file_bytes = response.content
        filename = candidate.resume_url.split("/")[-1]
        
        text = extract_text(io.BytesIO(file_bytes), filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch or extract text from stored resume: {str(e)}")
        
    # Analyze text
    try:
        analysis_result = analyze_resume_text(text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze resume: {str(e)}")
        
    # Save to db
    new_analysis = ResumeAnalysis(
        candidate_id=candidate.id,
        overall_score=analysis_result.get("overall_score", 0),
        formatting_score=analysis_result.get("formatting_score", 0),
        strengths=analysis_result.get("strengths", []),
        weaknesses=analysis_result.get("weaknesses", []),
        suggestions=analysis_result.get("suggestions", [])
    )
    
    db.add(new_analysis)
    db.commit()
    db.refresh(new_analysis)
    
    return new_analysis


@router.post("/upload", response_model=ResumeAnalysisResponse)
async def analyze_uploaded_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user) # Authentication required, but no profile check
):
    if current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only candidates can access this endpoint")
        
    valid_content_types = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]
        
    if file.content_type not in valid_content_types and not file.filename.endswith((".pdf", ".doc", ".docx")):
         raise HTTPException(status_code=400, detail="Only PDF and Word documents are allowed.")
         
    try:
        file_bytes = await file.read()
        text = extract_text(io.BytesIO(file_bytes), file.filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract text from file: {str(e)}")
        
    try:
        analysis_result = analyze_resume_text(text)
        # Ensure correct defaults if missing
        return ResumeAnalysisResponse(
            overall_score=analysis_result.get("overall_score", 0),
            formatting_score=analysis_result.get("formatting_score", 0),
            strengths=analysis_result.get("strengths", []),
            weaknesses=analysis_result.get("weaknesses", []),
            suggestions=analysis_result.get("suggestions", [])
        )
    except Exception as e:
         raise HTTPException(status_code=500, detail=f"Failed to analyze resume: {str(e)}")
