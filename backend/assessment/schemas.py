from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime


class MCQQuestionResponse(BaseModel):
    """MCQ question response WITHOUT correct answer"""
    id: int
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    marks: int = 4
    
    class Config:
        from_attributes = True


class CodingQuestionResponse(BaseModel):
    """Coding question response"""
    id: int
    question_text: str
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    example_input: Optional[str] = None
    example_output: Optional[str] = None
    expected_time_complexity: Optional[str] = None
    expected_space_complexity: Optional[str] = None
    constraints: Optional[str] = None
    expected_function_signature: Optional[str] = None
    marks: int = 60
    
    class Config:
        from_attributes = True


class AssessmentStartResponse(BaseModel):
    """Response when candidate starts assessment"""
    id: int
    application_id: int
    mcq_questions: List[MCQQuestionResponse]
    coding_questions: List[CodingQuestionResponse]
    started_at: Optional[datetime] = None
    completed: bool
    
    class Config:
        from_attributes = True


class MCQAnswerSubmission(BaseModel):
    """Single MCQ answer submission"""
    question_id: int
    selected_option: str  # A, B, C, or D


class CodingSubmission(BaseModel):
    """Single coding submission"""
    question_id: int
    code: str
    language: str = "python3"  # python3, java, cpp17, etc.


class SubmitAssessmentRequest(BaseModel):
    """Submit both MCQ answers and coding submissions"""
    mcq_answers: List[MCQAnswerSubmission]
    coding_submissions: List[CodingSubmission]
    forced_by_violation: bool = False


class AssessmentResultResponse(BaseModel):
    """Assessment result with score breakdown"""
    id: int
    application_id: int
    mcq_score: int  # Out of 40
    coding_score: int  # Out of 60
    total_score: int  # Out of 100
    mcq_correct: int
    total_mcq: int
    coding_test_cases_passed: int
    total_coding_test_cases: int
    qualifies_for_interview: bool = False
    next_status: Optional[str] = None
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class MCQAnswerDetail(BaseModel):
    """Detailed MCQ answer with correctness"""
    question_id: int
    question_text: str
    selected_option: Optional[str]
    correct_option: str
    is_correct: Optional[bool]
    marks_obtained: int
    
    class Config:
        from_attributes = True


class CodingSubmissionDetail(BaseModel):
    """Detailed coding submission with results"""
    question_id: int
    question_text: str
    code: str
    language: str
    test_cases_passed: int
    total_test_cases: int
    marks_obtained: int
    execution_feedback: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True


class AssessmentFeedbackResponse(BaseModel):
    """Detailed feedback after assessment completion"""
    mcq_score: int
    coding_score: int
    total_score: int
    passed: bool
    mcq_answers: List[MCQAnswerDetail]
    coding_submissions: List[CodingSubmissionDetail]
    
    class Config:
        from_attributes = True
