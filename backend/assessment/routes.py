from fastapi import APIRouter, Depends, HTTPException, status
import json
from sqlalchemy.orm import Session
from authentication.database import get_db
from authentication.utils import get_current_user
from authentication.models import User
from applications.models import Application, ApplicationStatus
from assessment.models import Assessment, AssessmentQuestion, AssessmentAnswer, CodeSubmission, QuestionType
from assessment.schemas import (
    AssessmentStartResponse,
    MCQQuestionResponse,
    CodingQuestionResponse,
    SubmitAssessmentRequest,
    AssessmentResultResponse,
    AssessmentFeedbackResponse,
    MCQAnswerDetail,
    CodingSubmissionDetail
)
from assessment.dsa_service import evaluate_coding_submission
from middleware.rate_limiter import rate_limiter
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
INTERVIEW_THRESHOLD = 0  # Testing mode: every completed assessment can proceed to interview
ASSESSMENT_VIOLATION_STATUS = "auto_submitted_violation"

router = APIRouter(prefix="/v1/assessment", tags=["Assessment"], dependencies=[Depends(rate_limiter)])


def _deserialize_test_cases(value):
    if value is None:
        return []
    if isinstance(value, str):
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return []
    return value


async def _start_assessment(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Start assessment for a candidate.
    
    Returns:
    - 4 MCQ questions (10 marks each = 40 marks total)
    - 1 coding question (60 marks total)
    
    Correct answers are NOT included.
    """
    
    if current_user.is_employer:
        raise HTTPException(status_code=403, detail="Employers cannot take assessments")
    
    # Verify application belongs to current user
    application = db.query(Application).filter(
        Application.id == application_id,
        Application.user_id == current_user.id
    ).first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    if application.assessment_data and application.assessment_data.get("assessment_status") == ASSESSMENT_VIOLATION_STATUS:
        raise HTTPException(
            status_code=400,
            detail="Assessment was already auto-submitted due to proctoring violations"
        )

    if application.status != ApplicationStatus.ASSESSMENT_SCHEDULED:
        raise HTTPException(
            status_code=400,
            detail="Assessment is not available for this application yet"
        )

    if not application.assessment_available_at or not application.assessment_expires_at:
        raise HTTPException(
            status_code=400,
            detail="Assessment availability window has not been initialized"
        )

    now = datetime.utcnow()
    available_at = application.assessment_available_at.replace(tzinfo=None) if application.assessment_available_at.tzinfo else application.assessment_available_at
    expires_at = application.assessment_expires_at.replace(tzinfo=None) if application.assessment_expires_at.tzinfo else application.assessment_expires_at

    if now < available_at:
        raise HTTPException(status_code=400, detail="Assessment is not available yet")

    if now > expires_at:
        raise HTTPException(status_code=400, detail="Assessment link has expired")
    
    # Assessment should exist by this point (created during application)
    assessment = db.query(Assessment).filter(
        Assessment.application_id == application_id
    ).first()
    
    if not assessment:
        raise HTTPException(
            status_code=400,
            detail="Assessment not yet generated. Your resume did not meet the minimum threshold."
        )
    
    if assessment.completed:
        raise HTTPException(status_code=400, detail="Assessment already completed")
    
    # Update started_at if not already started
    if not assessment.started_at:
        assessment.started_at = datetime.utcnow()
        db.commit()
    
    # Fetch MCQ questions
    mcq_questions_db = db.query(AssessmentQuestion).filter(
        AssessmentQuestion.assessment_id == assessment.id,
        AssessmentQuestion.question_type == QuestionType.MCQ
    ).all()
    
    mcq_questions = [
        MCQQuestionResponse(
            id=q.id,
            question_text=q.question_text,
            option_a=q.option_a,
            option_b=q.option_b,
            option_c=q.option_c,
            option_d=q.option_d,
            topic=q.topic,
            difficulty=q.difficulty,
            marks=q.marks
        )
        for q in mcq_questions_db
    ]
    
    # Fetch coding questions
    coding_questions_db = db.query(AssessmentQuestion).filter(
        AssessmentQuestion.assessment_id == assessment.id,
        AssessmentQuestion.question_type == QuestionType.CODING
    ).all()
    
    coding_questions = [
        CodingQuestionResponse(
            id=q.id,
            question_text=q.question_text,
            topic=q.topic,
            difficulty=q.difficulty,
            example_input=q.example_input,
            example_output=q.example_output,
            expected_time_complexity=q.expected_time_complexity,
            expected_space_complexity=q.expected_space_complexity,
            constraints=q.constraints,
            expected_function_signature=q.expected_function_signature,
            marks=q.marks
        )
        for q in coding_questions_db
    ]
    
    return AssessmentStartResponse(
        id=assessment.id,
        application_id=assessment.application_id,
        mcq_questions=mcq_questions,
        coding_questions=coding_questions,
        started_at=assessment.started_at,
        completed=assessment.completed
    )


@router.get("/start/{application_id}", response_model=AssessmentStartResponse)
async def start_assessment_get(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return await _start_assessment(application_id, current_user, db)


@router.post("/start/{application_id}", response_model=AssessmentStartResponse)
async def start_assessment_post(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return await _start_assessment(application_id, current_user, db)


@router.post("/submit/{application_id}", response_model=AssessmentResultResponse)
async def submit_assessment(
    application_id: int,
    submission: SubmitAssessmentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit assessment answers and code.
    
    Workflow:
    1. Evaluate MCQ answers (4 marks each)
    2. Execute and evaluate coding submission (60 marks)
    3. Calculate total score (MCQ + coding)
    4. Update assessment and application
    """
    
    if current_user.is_employer:
        raise HTTPException(status_code=403, detail="Employers cannot submit assessments")
    
    # Verify application
    application = db.query(Application).filter(
        Application.id == application_id,
        Application.user_id == current_user.id
    ).first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Get assessment
    assessment = db.query(Assessment).filter(
        Assessment.application_id == application_id
    ).first()
    
    if not assessment:
        raise HTTPException(status_code=400, detail="Assessment not found")
    
    if assessment.completed:
        raise HTTPException(status_code=400, detail="Assessment already submitted")
    
    # ===== EVALUATE MCQ ANSWERS =====
    mcq_correct = 0
    total_mcq = len(submission.mcq_answers)
    mcq_score = 0
    
    for answer_data in submission.mcq_answers:
        question = db.query(AssessmentQuestion).filter(
            AssessmentQuestion.id == answer_data.question_id,
            AssessmentQuestion.assessment_id == assessment.id,
            AssessmentQuestion.question_type == QuestionType.MCQ
        ).first()
        
        if not question:
            raise HTTPException(status_code=400, detail=f"MCQ question {answer_data.question_id} not found")
        
        # Check if answer is correct
        is_correct = answer_data.selected_option == question.correct_option
        marks_obtained = 10 if is_correct else 0
        
        if is_correct:
            mcq_correct += 1
            mcq_score += 10
        
        # Store the answer
        answer_record = AssessmentAnswer(
            assessment_id=assessment.id,
            question_id=answer_data.question_id,
            selected_option=answer_data.selected_option,
            is_correct=is_correct,
            marks_obtained=marks_obtained
        )
        db.add(answer_record)
    
    logger.info(f"MCQ evaluation: {mcq_correct}/{total_mcq} correct, Score: {mcq_score}/40")
    
    # ===== EVALUATE CODING SUBMISSIONS =====
    coding_score = 0
    total_coding_test_cases = 0
    coding_test_cases_passed = 0
    
    for code_data in submission.coding_submissions:
        question = db.query(AssessmentQuestion).filter(
            AssessmentQuestion.id == code_data.question_id,
            AssessmentQuestion.assessment_id == assessment.id,
            AssessmentQuestion.question_type == QuestionType.CODING
        ).first()
        
        if not question:
            raise HTTPException(status_code=400, detail=f"Coding question {code_data.question_id} not found")
        
        # Execute and evaluate code
        test_cases = _deserialize_test_cases(question.test_cases)
        evaluation = await evaluate_coding_submission(
            code=code_data.code,
            language=code_data.language,
            test_cases=test_cases,
            expected_time_complexity=question.expected_time_complexity
        )
        
        marks_obtained = evaluation["marks_obtained"]
        coding_score += marks_obtained
        
        total_coding_test_cases += evaluation["total_test_cases"]
        coding_test_cases_passed += evaluation["test_cases_passed"]
        
        # Store code submission
        code_submission = CodeSubmission(
            assessment_id=assessment.id,
            question_id=code_data.question_id,
            code=code_data.code,
            language=code_data.language,
            test_cases_passed=evaluation["test_cases_passed"],
            total_test_cases=evaluation["total_test_cases"],
            marks_obtained=marks_obtained,
            is_correct=evaluation["is_correct"],
            evaluation_feedback=evaluation["feedback"]
        )
        db.add(code_submission)
    
    logger.info(f"Coding evaluation: {coding_test_cases_passed}/{total_coding_test_cases} test cases passed, Score: {coding_score}/60")
    
    # ===== CALCULATE TOTAL SCORE =====
    total_score = mcq_score + coding_score
    
    # Update assessment
    assessment.mcq_score = mcq_score
    assessment.dsa_score = coding_score
    assessment.total_score = total_score
    assessment.completed = True
    assessment.completed_at = datetime.utcnow()

    assessment_data = dict(application.assessment_data or {})
    assessment_data["violations"] = assessment_data.get("violations", [])
    assessment_data["assessment_completed_at"] = assessment.completed_at.isoformat()
    assessment_data["assessment_status"] = (
        ASSESSMENT_VIOLATION_STATUS if submission.forced_by_violation else "completed"
    )
    assessment_data["locked_due_to_violation"] = submission.forced_by_violation
    application.assessment_data = assessment_data

    # Update application
    application.assessment_score = total_score
    qualifies_for_interview = total_score >= INTERVIEW_THRESHOLD and not submission.forced_by_violation
    application.status = (
        ApplicationStatus.INTERVIEW_SCHEDULED
        if qualifies_for_interview
        else ApplicationStatus.ASSESSMENT_COMPLETED
    )
    
    db.commit()
    db.refresh(assessment)
    
    logger.info(f"Assessment {assessment.id} completed. MCQ: {mcq_score}/40, Coding: {coding_score}/60, Total: {total_score}/100")
    
    return AssessmentResultResponse(
        id=assessment.id,
        application_id=assessment.application_id,
        mcq_score=mcq_score,
        coding_score=coding_score,
        total_score=total_score,
        mcq_correct=mcq_correct,
        total_mcq=total_mcq,
        coding_test_cases_passed=coding_test_cases_passed,
        total_coding_test_cases=total_coding_test_cases,
        qualifies_for_interview=qualifies_for_interview,
        next_status=application.status.value,
        completed_at=assessment.completed_at
    )


@router.get("/result/{application_id}", response_model=AssessmentFeedbackResponse)
async def get_assessment_result(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed assessment results and feedback.
    
    Returns:
    - MCQ answers with correct/incorrect status
    - coding submissions with test case results
    - Overall score breakdown
    """
    
    if current_user.is_employer:
        raise HTTPException(status_code=403, detail="Employers cannot access this endpoint")
    
    # Verify application
    application = db.query(Application).filter(
        Application.id == application_id,
        Application.user_id == current_user.id
    ).first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Get assessment
    assessment = db.query(Assessment).filter(
        Assessment.application_id == application_id
    ).first()
    
    if not assessment:
        raise HTTPException(status_code=400, detail="Assessment not found")
    
    if not assessment.completed:
        raise HTTPException(status_code=400, detail="Assessment not yet completed")
    
    # Get MCQ answers
    mcq_answers_db = db.query(AssessmentAnswer).filter(
        AssessmentAnswer.assessment_id == assessment.id
    ).all()
    
    mcq_answers = []
    for answer in mcq_answers_db:
        question = answer.question
        mcq_answers.append(
            MCQAnswerDetail(
                question_id=answer.question_id,
                question_text=question.question_text,
                selected_option=answer.selected_option,
                correct_option=question.correct_option,
                is_correct=answer.is_correct,
                marks_obtained=answer.marks_obtained or 0
            )
        )
    
    # Get coding submissions
    coding_submissions_db = db.query(CodeSubmission).filter(
        CodeSubmission.assessment_id == assessment.id
    ).all()
    
    coding_submissions = []
    for submission in coding_submissions_db:
        question = submission.question
        coding_submissions.append(
            CodingSubmissionDetail(
                question_id=submission.question_id,
                question_text=question.question_text,
                code=submission.code,
                language=submission.language,
                test_cases_passed=submission.test_cases_passed or 0,
                total_test_cases=submission.total_test_cases or 0,
                marks_obtained=submission.marks_obtained or 0,
                execution_feedback=submission.evaluation_feedback
            )
        )
    
    # Testing mode: threshold relaxed to 0 so completed assessments can reach interview stage.
    passed = assessment.total_score >= INTERVIEW_THRESHOLD
    
    return AssessmentFeedbackResponse(
        mcq_score=assessment.mcq_score or 0,
        coding_score=assessment.dsa_score or 0,
        total_score=assessment.total_score or 0,
        passed=passed,
        mcq_answers=mcq_answers,
        coding_submissions=coding_submissions
    )
