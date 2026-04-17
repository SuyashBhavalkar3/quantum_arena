from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON, Boolean, Float, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from authentication.database import Base
import enum

class QuestionType(str, enum.Enum):
    MCQ = "mcq"
    CODING = "coding"

class Assessment(Base):
    __tablename__ = "assessments"
    
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False, unique=True)
    
    # Assessment metadata
    mcq_score = Column(Integer, nullable=True, default=0)  # Out of 40
    dsa_score = Column(Integer, nullable=True, default=0)  # Out of 60
    total_score = Column(Integer, nullable=True, default=0)  # Out of 100
    completed = Column(Boolean, default=False)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    application = relationship("Application", back_populates="assessments")
    questions = relationship("AssessmentQuestion", back_populates="assessment", cascade="all, delete-orphan")
    answers = relationship("AssessmentAnswer", back_populates="assessment", cascade="all, delete-orphan")
    code_submissions = relationship("CodeSubmission", back_populates="assessment", cascade="all, delete-orphan")
    

class AssessmentQuestion(Base):
    """Questions for assessment - supports both MCQ and coding questions"""
    __tablename__ = "assessment_questions"
    
    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False)
    
    # Question type
    question_type = Column(SQLEnum(QuestionType), nullable=False, default=QuestionType.MCQ)
    
    # Common fields
    question_text = Column(Text, nullable=False)
    topic = Column(String, nullable=True)
    difficulty = Column(String, nullable=True)
    marks = Column(Integer, nullable=False, default=4)  # 4 for MCQ, 60 for coding
    
    # MCQ-specific fields
    option_a = Column(String, nullable=True)
    option_b = Column(String, nullable=True)
    option_c = Column(String, nullable=True)
    option_d = Column(String, nullable=True)
    correct_option = Column(String, nullable=True)  # A, B, C, or D
    explanation = Column(Text, nullable=True)
    
    # Coding-specific fields
    example_input = Column(Text, nullable=True)
    example_output = Column(Text, nullable=True)
    test_cases = Column(JSON, nullable=True)  # [{"input": "...", "output": "..."}]
    expected_time_complexity = Column(String, nullable=True)  # e.g., "O(n)"
    expected_space_complexity = Column(String, nullable=True)  # e.g., "O(1)"
    constraints = Column(Text, nullable=True)
    expected_function_signature = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    assessment = relationship("Assessment", back_populates="questions")
    answers = relationship("AssessmentAnswer", back_populates="question")
    code_submissions = relationship("CodeSubmission", back_populates="question")


class AssessmentAnswer(Base):
    """Candidate's answers to MCQ questions"""
    __tablename__ = "assessment_answers"
    
    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(Integer, ForeignKey("assessment_questions.id", ondelete="CASCADE"), nullable=False)
    
    # Candidate's response for MCQ
    selected_option = Column(String, nullable=True)  # A, B, C, D
    is_correct = Column(Boolean, nullable=True)
    marks_obtained = Column(Integer, nullable=True, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    assessment = relationship("Assessment", back_populates="answers")
    question = relationship("AssessmentQuestion", back_populates="answers")


class CodeSubmission(Base):
    """Candidate's code submissions for coding questions"""
    __tablename__ = "code_submissions"
    
    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(Integer, ForeignKey("assessment_questions.id", ondelete="CASCADE"), nullable=False)
    
    # Code submission
    code = Column(Text, nullable=False)
    language = Column(String, nullable=False, default="python3")  # python3, java, cpp, etc.
    
    # Execution results
    execution_output = Column(Text, nullable=True)
    execution_error = Column(Text, nullable=True)
    execution_time = Column(Float, nullable=True)  # in seconds
    memory_used = Column(Float, nullable=True)  # in MB
    
    # Scoring
    test_cases_passed = Column(Integer, nullable=True, default=0)
    total_test_cases = Column(Integer, nullable=True, default=0)
    marks_obtained = Column(Integer, nullable=True, default=0)  # Out of 30
    
    # Evaluation metadata
    is_correct = Column(Boolean, nullable=True, default=False)
    evaluation_feedback = Column(JSON, nullable=True)  # {"correctness": "...", "complexity": "..."}
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    assessment = relationship("Assessment", back_populates="code_submissions")
    question = relationship("AssessmentQuestion", back_populates="code_submissions")
