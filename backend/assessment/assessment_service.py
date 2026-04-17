import openai
import os
import json
import logging
from typing import Dict, Any, List
from dotenv import load_dotenv

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")
logger = logging.getLogger(__name__)


MCQ_PROMPT_TEMPLATE = """
You are an expert technical recruiter and assessment designer. Your task is to generate 4 multiple choice technical questions based on a candidate's resume and job requirements.

IMPORTANT: Generate questions in valid JSON format ONLY. Do not include any text outside the JSON structure.

Resume Skills and Experience:
{resume_summary}

Job Requirements:
- Title: {job_title}
- Required Skills: {required_skills}
- Experience Required: {experience_required} years
- Job Description: {job_description}

Generate 4 MCQ technical questions that test industry-relevant concepts:
1. Backend development (REST APIs, microservices, authentication)
2. Databases (SQL, NoSQL, indexing, transactions)
3. Distributed systems (caching, load balancing, message queues)
4. Cloud platforms (AWS, Azure, GCP services)
5. System design basics (scalability, reliability, performance)
6. AI/ML frameworks (if relevant to job)
7. DevOps and deployment (Docker, CI/CD, monitoring)

Questions should:
- Be relevant to the candidate's background and job requirements
- Test practical knowledge, not just theory
- Have clear, unambiguous answers
- Cover different difficulty levels (easy, medium, hard)
- Match the candidate's skill set

For each question, provide:
- question_text: The actual question
- option_a: First option
- option_b: Second option
- option_c: Third option
- option_d: Fourth option
- correct_option: The correct answer (A, B, C, or D)
- topic: What area of knowledge this tests (e.g., "REST APIs", "Database Design", "System Architecture")
- difficulty: easy, medium, or hard
- explanation: Brief explanation of why the correct answer is right

Return the response as a valid JSON array with the structure:
[
  {{
    "question_text": "...",
    "option_a": "...",
    "option_b": "...",
    "option_c": "...",
    "option_d": "...",
    "correct_option": "A",
    "topic": "...",
    "difficulty": "medium",
    "explanation": "..."
  }},
  ...
]

Important: Return ONLY valid JSON. No additional text, no markdown code blocks, just the JSON array.
"""


async def generate_assessment_questions(
    parsed_resume: Dict[str, Any],
    job_data: Dict[str, Any],
    num_mcq: int = 4,
    num_coding: int = 1
) -> Dict[str, List[Dict[str, Any]]]:
    """
    Generate both MCQ and coding questions for assessment.
    
    Args:
        parsed_resume: Candidate's parsed resume data
        job_data: Job description and requirements
        num_mcq: Number of MCQ questions (default: 4)
        num_coding: Number of coding questions (default: 1)
    
    Returns:
        Dictionary with 'mcq_questions' and 'coding_questions' lists
    """
    
    # Generate MCQ questions
    mcq_questions = await generate_mcq_questions(parsed_resume, job_data, num_mcq)
    
    # Generate coding questions
    from assessment.dsa_service import generate_coding_questions
    coding_questions = await generate_coding_questions(parsed_resume, job_data, num_coding)
    
    return {
        "mcq_questions": mcq_questions,
        "coding_questions": coding_questions
    }


async def generate_mcq_questions(
    parsed_resume: Dict[str, Any],
    job_data: Dict[str, Any],
    num_questions: int = 4
) -> List[Dict[str, Any]]:
    """
    Generate MCQ assessment questions based on candidate resume and job requirements.
    
    Args:
        parsed_resume: Candidate's parsed resume data
        job_data: Job description and requirements
        num_questions: Number of questions to generate (default: 10)
    
    Returns:
        List of generated MCQ questions with all required fields
    """
    
    try:
        resume_summary = format_resume_for_prompt(parsed_resume)
        
        prompt = MCQ_PROMPT_TEMPLATE.format(
            resume_summary=resume_summary,
            job_title=job_data.get('title', 'Unknown'),
            required_skills=json.dumps(job_data.get('required_skills', [])),
            experience_required=job_data.get('experience_required', 0),
            job_description=job_data.get('description', '')[:1000]
        )
        
        logger.info(f"Generating {num_questions} MCQ questions using GPT")
        
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert technical assessment designer. Return only valid JSON arrays, no additional text."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=4000
        )
        
        response_text = response.choices[0].message.content.strip()
        
        # Clean up response if it contains markdown code blocks
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        
        response_text = response_text.strip()
        
        questions = json.loads(response_text)
        questions = questions[:num_questions]
        
        # Validate and clean each question
        validated_questions = []
        for q in questions:
            if validate_mcq_question(q):
                validated_questions.append(q)
        
        logger.info(f"Successfully generated {len(validated_questions)} MCQ questions")
        return validated_questions
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse LLM response as JSON: {e}")
        return []
    except Exception as e:
        logger.error(f"Error generating MCQ questions: {str(e)}")
        return []


def format_resume_for_prompt(parsed_resume: Dict[str, Any]) -> str:
    """
    Format parsed resume data into a readable prompt format.
    """
    
    summary_parts = []
    
    # Skills
    if parsed_resume.get('skills'):
        skills = parsed_resume['skills']
        if isinstance(skills, list):
            summary_parts.append(f"Skills: {', '.join(skills[:15])}")
        elif isinstance(skills, dict):
            skill_list = []
            if skills.get('languages'):
                skill_list.append(f"Languages: {skills['languages']}")
            if skills.get('backend_technologies'):
                skill_list.append(f"Backend: {skills['backend_technologies']}")
            if skills.get('databases'):
                skill_list.append(f"Databases: {skills['databases']}")
            if skills.get('ai_ml_frameworks'):
                skill_list.append(f"AI/ML: {skills['ai_ml_frameworks']}")
            if skills.get('tools_platforms'):
                skill_list.append(f"Tools: {skills['tools_platforms']}")
            if skill_list:
                summary_parts.append("Skills:\n  - " + "\n  - ".join(skill_list))
    
    # Experience
    if parsed_resume.get('experiences'):
        experiences = parsed_resume['experiences']
        if isinstance(experiences, list) and len(experiences) > 0:
            summary_parts.append(f"Total Experiences: {len(experiences)}")
            
            current_exp = None
            for exp in experiences:
                if isinstance(exp, dict) and exp.get('is_current'):
                    current_exp = exp
                    break
            
            if not current_exp and len(experiences) > 0:
                current_exp = experiences[0]
            
            if isinstance(current_exp, dict):
                job_title = current_exp.get('job_title', 'N/A')
                company = current_exp.get('company_name', 'N/A')
                exp_text = f"Current/Most Recent: {job_title} at {company}"
                summary_parts.append(exp_text)
    
    # Education
    if parsed_resume.get('education'):
        education = parsed_resume['education']
        if isinstance(education, list) and len(education) > 0:
            edu_list = []
            for edu in education[:2]:
                if isinstance(edu, dict):
                    degree = edu.get('degree', '')
                    field = edu.get('field_of_study', '')
                    if degree:
                        edu_list.append(f"{degree} in {field}" if field else degree)
            if edu_list:
                summary_parts.append("Education: " + ", ".join(edu_list))
    
    # Projects
    if parsed_resume.get('projects'):
        projects = parsed_resume['projects']
        if isinstance(projects, list) and len(projects) > 0:
            summary_parts.append(f"Projects: {len(projects)} projects")
    
    return "\n".join(summary_parts)


def validate_mcq_question(question: Dict[str, Any]) -> bool:
    """Validate that an MCQ question has all required fields."""
    
    required_fields = ['question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_option']
    
    for field in required_fields:
        if field not in question or not question[field]:
            logger.warning(f"MCQ question missing field: {field}")
            return False
    
    if question['correct_option'] not in ['A', 'B', 'C', 'D']:
        logger.warning(f"Invalid correct_option: {question['correct_option']}")
        return False
    
    return True
