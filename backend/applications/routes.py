from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
import json
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import datetime, timedelta
from authentication.database import get_db
from authentication.utils import get_current_user
from authentication.models import User
from applications.models import Application, ApplicationStatus
from applications.schemas import ApplicationCreate, ApplicationResponse, ApplicationDetailResponse, ApplicationUpdate
from applications.ai_service import analyze_resume_match
from assessment.models import Assessment, AssessmentQuestion, QuestionType
from assessment.assessment_service import generate_assessment_questions
from resume_parsing.models import Candidate
from candidate_profile.models import Experience, Education, Skill, Project, Certification
from job_management_module.models import Job
from notifications.email_service import send_final_review_selected
from notifications.models import Notification, NotificationType
from middleware.rate_limiter import rate_limiter
import logging

logger = logging.getLogger(__name__)

# Configuration
RESUME_SCORE_THRESHOLD = 10  # Lowered for testing so the full candidate flow can be exercised
ASSESSMENT_VALIDITY_HOURS = 72

router = APIRouter(prefix="/v1/applications", tags=["Applications"], dependencies=[Depends(rate_limiter)])


def _serialize_test_cases(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, str):
        return value
    return json.dumps(value)


def compile_candidate_resume_data(candidate_id: int, db: Session) -> Dict[str, Any]:
    """
    Compile candidate resume data from individual profile tables.
    
    Args:
        candidate_id: Candidate ID
        db: Database session
    
    Returns:
        Dictionary with compiled resume data including experiences, education, skills, projects, certifications
    """
    
    resume_data = {}
    
    # Fetch experiences
    experiences = db.query(Experience).filter(Experience.candidate_id == candidate_id).all()
    resume_data['experiences'] = [
        {
            'company_name': exp.company_name,
            'job_title': exp.job_title,
            'location': exp.location,
            'start_date': exp.start_date,
            'end_date': exp.end_date,
            'is_current': exp.is_current,
            'description': exp.description
        }
        for exp in experiences
    ]
    
    # Fetch education
    education = db.query(Education).filter(Education.candidate_id == candidate_id).all()
    resume_data['education'] = [
        {
            'institution': edu.institution,
            'degree': edu.degree,
            'field_of_study': edu.field_of_study,
            'grade': edu.grade,
            'graduation_date': edu.graduation_date,
            'location': edu.location
        }
        for edu in education
    ]
    
    # Fetch skills
    skill_record = db.query(Skill).filter(Skill.candidate_id == candidate_id).first()
    resume_data['skills'] = {}
    if skill_record:
        resume_data['skills'] = {
            'languages': skill_record.languages,
            'backend_technologies': skill_record.backend_technologies,
            'databases': skill_record.databases,
            'ai_ml_frameworks': skill_record.ai_ml_frameworks,
            'tools_platforms': skill_record.tools_platforms,
            'core_competencies': skill_record.core_competencies
        }
    
    # Fetch projects
    projects = db.query(Project).filter(Project.candidate_id == candidate_id).all()
    resume_data['projects'] = [
        {
            'project_name': proj.project_name,
            'description': proj.description,
            'github_url': proj.github_url
        }
        for proj in projects
    ]
    
    # Fetch certifications
    certifications = db.query(Certification).filter(Certification.candidate_id == candidate_id).all()
    resume_data['certifications'] = [
        {
            'title': cert.title
        }
        for cert in certifications
    ]
    
    logger.info(f"Compiled resume data for candidate {candidate_id}: {len(experiences)} experiences, {len(education)} education records, {len(projects)} projects, {len(certifications)} certifications")
    
    return resume_data

# CANDIDATE ROUTES

@router.post("/apply", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def apply_for_job(
    application: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Candidate applies for a job - triggers AI resume analysis and assessment generation.
    
    Workflow:
    1. Create application record
    2. Analyze resume against job description
    3. Save resume_score and resume_analysis to database
    4. If score >= threshold, generate 4 MCQ + 1 coding question
    5. Update application status
    """
    
    if current_user.is_employer:
        raise HTTPException(status_code=403, detail="Employers cannot apply for jobs")
    
    # Check profile completion
    if not current_user.profile_completed:
        raise HTTPException(status_code=400, detail="Complete your profile before applying")
    
    job = db.query(Job).filter(Job.id == application.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if not candidate:
        raise HTTPException(status_code=400, detail="Complete your profile before applying")
    
    if not candidate.profile_completed:
        raise HTTPException(status_code=400, detail="Complete your profile (add experiences, education, skills)")
    
    existing = db.query(Application).filter(
        Application.job_id == application.job_id,
        Application.user_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already applied for this job")
    
    # Step 1: Create application record
    new_application = Application(
        job_id=application.job_id,
        candidate_id=candidate.id,
        user_id=current_user.id,
        status=ApplicationStatus.PENDING
    )
    
    db.add(new_application)
    db.commit()
    db.refresh(new_application)
    
    logger.info(f"Application {new_application.id} created for job {job.id}")
    
    # Step 2: Compile candidate resume data from profile tables
    resume_data = compile_candidate_resume_data(candidate.id, db)
    
    # Check if candidate has any profile data
    has_profile_data = (
        len(resume_data.get('experiences', [])) > 0 or
        len(resume_data.get('education', [])) > 0 or
        bool(resume_data.get('skills')) or
        len(resume_data.get('projects', [])) > 0 or
        len(resume_data.get('certifications', [])) > 0
    )
    
    logger.info(f"Candidate {candidate.id} profile data availability - Experiences: {len(resume_data.get('experiences', []))}, Education: {len(resume_data.get('education', []))}, Has skills: {bool(resume_data.get('skills'))}")
    
    # Step 3: AI analysis - Resume scoring and matching
    job_data = {
        "title": job.title if job.title else "Unknown",
        "description": job.description if job.description else "",
        "required_skills": job.required_skills if job.required_skills else [],
        "experience_required": job.experience_required if job.experience_required else 0
    }
    
    # Perform analysis if candidate has profile data
    if has_profile_data:
        try:
            logger.info(f"Starting resume analysis for application {new_application.id}")
            # Call function to analyze resume match using compiled resume data
            analysis = analyze_resume_match(resume_data, job_data)
            
            logger.info(f"Resume analysis completed. Match score: {analysis.get('match_score', 0)}")
            
            # Step 4: Save resume_score and resume_analysis to database
            new_application.resume_match_score = analysis.get("match_score", 0)
            new_application.resume_analysis = analysis
            new_application.status = ApplicationStatus.RESUME_SCREENED
            
            db.commit()
            db.refresh(new_application)
            
            logger.info(f"Resume analysis saved for application {new_application.id}. Score: {new_application.resume_match_score}")
            
        except Exception as e:
            logger.error(f"Error during resume analysis for application {new_application.id}: {str(e)}", exc_info=True)
            # Set a default score on error
            new_application.resume_match_score = 50
            new_application.resume_analysis = {
                "match_score": 50,
                "error": f"Analysis failed: {str(e)}",
                "recommendation": "Manual review required"
            }
            new_application.status = ApplicationStatus.RESUME_SCREENED
            db.commit()
            db.refresh(new_application)
    else:
        logger.warning(f"No profile data found for candidate {candidate.id}. Setting default score.")
        # If no profile data, set default values
        new_application.resume_match_score = 50
        new_application.resume_analysis = {
            "match_score": 50,
            "note": "Resume not yet completed. Please add experiences, education, skills, and projects to your profile.",
            "recommendation": "Review candidate profile"
        }
        new_application.status = ApplicationStatus.RESUME_SCREENED
        db.commit()
        db.refresh(new_application)
    
    # Step 5: Threshold check and assessment generation
    resume_score = new_application.resume_match_score or 0
    logger.info(f"Resume score for application {new_application.id}: {resume_score}")
    
    # Only generate assessment if resume score is available and meets threshold, and we have profile data
    if resume_score >= RESUME_SCORE_THRESHOLD and has_profile_data:
        logger.info(f"Score {resume_score} >= threshold {RESUME_SCORE_THRESHOLD}. Generating assessment questions...")
        
        try:
            # Generate the fixed assessment structure: 4 MCQ + 1 coding question
            questions_data = await generate_assessment_questions(
                parsed_resume=resume_data,
                job_data=job_data,
                num_mcq=4,   # 4 MCQ questions (10 marks each = 40 marks)
                num_coding=1 # 1 coding question (60 marks)
            )
            
            mcq_questions = questions_data.get("mcq_questions", [])
            coding_questions = questions_data.get("coding_questions", [])
            
            if (len(mcq_questions) > 0 or len(coding_questions) > 0):
                try:
                    # Create assessment record
                    assessment = Assessment(
                        application_id=new_application.id
                    )
                    db.add(assessment)
                    db.flush()  # Get the assessment ID
                    
                    # Store MCQ questions
                    for question_data in mcq_questions:
                        question = AssessmentQuestion(
                            assessment_id=assessment.id,
                            question_type=QuestionType.MCQ,
                            question_text=question_data.get('question_text'),
                            option_a=question_data.get('option_a'),
                            option_b=question_data.get('option_b'),
                            option_c=question_data.get('option_c'),
                            option_d=question_data.get('option_d'),
                            correct_option=question_data.get('correct_option'),
                            topic=question_data.get('topic'),
                            difficulty=question_data.get('difficulty'),
                            explanation=question_data.get('explanation'),
                            marks=10  # Each MCQ is worth 10 marks
                        )
                        db.add(question)
                    
                    # Store coding questions
                    for question_data in coding_questions:
                        question = AssessmentQuestion(
                            assessment_id=assessment.id,
                            question_type=QuestionType.CODING,
                            question_text=question_data.get('question_text'),
                            topic=question_data.get('topic'),
                            difficulty=question_data.get('difficulty'),
                            example_input=question_data.get('example_input'),
                            example_output=question_data.get('example_output'),
                            test_cases=_serialize_test_cases(question_data.get('test_cases')),
                            expected_time_complexity=question_data.get('expected_time_complexity'),
                            expected_space_complexity=question_data.get('expected_space_complexity'),
                            constraints=question_data.get('constraints'),
                            expected_function_signature=question_data.get('expected_function_signature'),
                            marks=60  # The coding question is worth 60 marks
                        )
                        db.add(question)
                    
                    # Mark assessment availability window once the candidate passes resume screening.
                    new_application.status = ApplicationStatus.ASSESSMENT_SCHEDULED
                    available_at = datetime.utcnow()
                    new_application.assessment_available_at = available_at
                    new_application.assessment_expires_at = available_at + timedelta(hours=ASSESSMENT_VALIDITY_HOURS)
                    db.commit()
                    db.refresh(new_application)
                    
                    logger.info(f"Successfully generated {len(mcq_questions)} MCQ and {len(coding_questions)} coding questions for application {new_application.id}")
                except Exception:
                    db.rollback()
                    raise
            else:
                logger.warning(f"No questions generated for application {new_application.id}. Keeping RESUME_SCREENED status.")
                
        except Exception as e:
            logger.error(f"Error during assessment generation for application {new_application.id}: {str(e)}", exc_info=True)
            # Don't fail the application - assessment generation error is not critical
            logger.info(f"Application {new_application.id} remains in RESUME_SCREENED status despite assessment generation error")
    else:
        if resume_score < RESUME_SCORE_THRESHOLD:
            logger.info(f"Score {resume_score} < threshold {RESUME_SCORE_THRESHOLD}. Candidate not eligible for assessment.")
        elif not has_profile_data:
            logger.warning(f"No profile data for assessment generation for application {new_application.id}")
    
    return new_application


@router.get("/my-applications", response_model=List[ApplicationResponse])
def get_my_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all applications submitted by the current candidate"""
    
    if current_user.is_employer:
        raise HTTPException(status_code=403, detail="Employers cannot access this endpoint")
    
    applications = db.query(Application).filter(
        Application.user_id == current_user.id
    ).order_by(Application.created_at.desc()).all()
    
    return applications


@router.get("/my-applications/{application_id}", response_model=ApplicationDetailResponse)
def get_my_application_detail(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific application"""
    
    application = db.query(Application).filter(
        Application.id == application_id,
        Application.user_id == current_user.id
    ).first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    return {
        **ApplicationResponse.model_validate(application).model_dump(),
        "assessment_data": application.assessment_data,
        "interview_transcript": application.interview_transcript,
        "interview_feedback": application.interview_feedback,
        "job": {
            "id": application.job.id,
            "title": application.job.title,
            "description": application.job.description,
            "location": application.job.location
        } if application.job else None
    }


# HR ROUTES

@router.get("/job/{job_id}/applicants", response_model=List[ApplicationResponse])
def get_job_applicants(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """HR: Get all applicants for a specific job"""
    
    if not current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only employers can access this endpoint")
    
    # Verify job belongs to this employer
    job = db.query(Job).filter(Job.id == job_id, Job.created_by == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or unauthorized")
    
    applications = db.query(Application).filter(
        Application.job_id == job_id
    ).order_by(Application.resume_match_score.desc()).all()
    
    return applications


@router.get("/job/{job_id}/top-scorers")
def get_top_scorers(
    job_id: int,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """HR: Get top scoring candidates for a job"""
    
    if not current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only employers can access this endpoint")
    
    job = db.query(Job).filter(Job.id == job_id, Job.created_by == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or unauthorized")
    
    top_applications = db.query(Application).filter(
        Application.job_id == job_id,
        Application.resume_match_score.isnot(None)
    ).order_by(Application.resume_match_score.desc()).limit(limit).all()
    
    return {
        "job_id": job_id,
        "job_title": job.title,
        "total_applicants": db.query(Application).filter(Application.job_id == job_id).count(),
        "top_scorers": [
            {
                "application_id": app.id,
                "candidate_id": app.candidate_id,
                "user_id": app.user_id,
                "resume_match_score": app.resume_match_score,
                "assessment_score": app.assessment_score,
                "interview_score": app.interview_score,
                "final_score": app.final_score,
                "status": app.status,
                "created_at": app.created_at
            }
            for app in top_applications
        ]
    }


@router.get("/application/{application_id}/detail", response_model=ApplicationDetailResponse)
def get_application_detail_hr(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """HR: Get detailed application information"""
    
    if not current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only employers can access this endpoint")
    
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Verify job belongs to this employer
    if application.job.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized access")
    
    return {
        **ApplicationResponse.model_validate(application).model_dump(),
        "assessment_data": application.assessment_data,
        "interview_transcript": application.interview_transcript,
        "interview_feedback": application.interview_feedback,
        "job": {
            "id": application.job.id,
            "title": application.job.title,
            "description": application.job.description,
            "location": application.job.location
        } if application.job else None
    }


@router.patch("/application/{application_id}", response_model=ApplicationResponse)
def update_application_status(
    application_id: int,
    update_data: ApplicationUpdate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """HR: Update application status and add notes"""
    
    if not current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only employers can update applications")
    
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Verify job belongs to this employer
    if application.job.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized: You can only update applications for your jobs")
    
    if update_data.status:
        application.status = update_data.status
    if update_data.hr_notes:
        application.hr_notes = update_data.hr_notes

    if update_data.status == ApplicationStatus.FINAL_REVIEW:
        candidate_name = application.user.name if application.user else "Candidate"
        company_name = (
            current_user.company_name
            or (application.job.employer.company_name if application.job and application.job.employer else None)
            or "HR Team"
        )
        notification = Notification(
            user_id=application.user_id,
            application_id=application.id,
            type=NotificationType.APPLICATION_STATUS,
            title="Advanced to Final Review",
            message=(
                f"You have advanced to the final review stage for {application.job.title}. "
                "Our HR team will review your profile and evaluation report next."
            ),
            email_sent=False,
        )
        db.add(notification)
    
    db.commit()
    db.refresh(application)

    if update_data.status == ApplicationStatus.FINAL_REVIEW and application.user and application.user.email:
        background_tasks.add_task(
            send_final_review_selected,
            application.user.email,
            application.user.name or "Candidate",
            application.job.title if application.job else "the role",
            current_user.company_name or "HR Team",
        )
    
    return application


@router.get("/dashboard/stats")
def get_hr_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """HR: Get dashboard statistics"""
    
    if not current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only employers can access this endpoint")
    
    # Get all jobs by this employer
    jobs = db.query(Job).filter(Job.created_by == current_user.id).all()
    job_ids = [job.id for job in jobs]
    
    total_applications = db.query(Application).filter(Application.job_id.in_(job_ids)).count()
    pending_review = db.query(Application).filter(
        Application.job_id.in_(job_ids),
        Application.status == ApplicationStatus.PENDING
    ).count()
    
    screened = db.query(Application).filter(
        Application.job_id.in_(job_ids),
        Application.status == ApplicationStatus.RESUME_SCREENED
    ).count()
    
    in_assessment = db.query(Application).filter(
        Application.job_id.in_(job_ids),
        Application.status.in_([ApplicationStatus.ASSESSMENT_SCHEDULED, ApplicationStatus.ASSESSMENT_COMPLETED])
    ).count()
    
    in_interview = db.query(Application).filter(
        Application.job_id.in_(job_ids),
        Application.status.in_([ApplicationStatus.INTERVIEW_SCHEDULED, ApplicationStatus.INTERVIEW_COMPLETED])
    ).count()
    
    return {
        "total_jobs": len(jobs),
        "total_applications": total_applications,
        "pending_review": pending_review,
        "screened": screened,
        "in_assessment": in_assessment,
        "in_interview": in_interview
    }
