import logging

logger = logging.getLogger(__name__)

import os
import json
from dotenv import load_dotenv

# Load environment variables first
load_dotenv(override=True)

from groq import Groq
from pdfminer.high_level import extract_text as extract_pdf_text
from docx import Document
from resume_parsing.prompt import PARSING_PROMPT

# Load Groq API key
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
# logger.info(f"[DEBUG] Groq API Key: {GROQ_API_KEY}")

if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY not found in environment variables")

client = Groq(api_key=GROQ_API_KEY)


def extract_text(file_stream, filename: str):
    extension = filename.split(".")[-1].lower()

    if extension == "pdf":
        # Extract text from PDF
        from pdfminer.high_level import extract_text
        text = extract_text(file_stream)

    elif extension in ["doc", "docx"]:
        # Extract text from Word document
        try:
            doc = Document(file_stream)
            text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        except Exception as e:
            raise ValueError(f"Failed to parse Word document: {str(e)}")

    else:
        raise ValueError("Unsupported file format")

    return text

def parse_resume_with_groq(resume_text):
    full_prompt = f"{PARSING_PROMPT}\n\n{resume_text}"

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {
                "role": "system",
                "content": "You are an expert AI resume parser that extracts structured JSON."
            },
            {
                "role": "user",
                "content": full_prompt
            }
        ],
        temperature=0
    )

    result = response.choices[0].message.content.strip()

    try:
        return json.loads(result)
    except json.JSONDecodeError:
        return {
            "error": "Invalid JSON returned",
            "raw_output": result
        }
    
def parse_resume(file, file_path):
    try:
        text = extract_text(file, file_path)
        logger.info(f"[DEBUG] Extracted text length: {len(text)}")
        
        result = parse_resume_with_groq(text)
        logger.info(f"[DEBUG] Raw parse result: {result}")
        
        # Validate and normalize the parsed data
        if isinstance(result, dict) and "error" not in result:
            result = validate_and_normalize_parsed_data(result)
            counts = count_parsed_items(result)
            logger.info(f"[DEBUG] Normalized data counts: {counts}")
        
        return result
    except Exception as e:
        logger.info(f"[ERROR] parse_resume failed: {str(e)}")
        import traceback
        traceback.print_exc()
        raise

from sqlalchemy.orm import Session
from candidate_profile.models import Education, Experience, Project, Skill, Certification
from resume_parsing.validation import validate_and_normalize_parsed_data, count_parsed_items

def save_parsed_data(db: Session, candidate_id: int, parsed_data: dict):
    """
    Takes parsed JSON from LLM and saves each section
    into its respective table linked to the candidate.
    """
    try:
        # --- Education (array of objects) ---
        education_list = parsed_data.get("education", [])
        # Ensure it's always a list
        if isinstance(education_list, dict):
            education_list = [education_list]
        
        for edu in education_list:
            if edu and any(edu.values()):
                db.add(Education(
                    candidate_id=candidate_id,
                    degree=edu.get("degree"),
                    institution=edu.get("institution"),
                    field_of_study=edu.get("field_of_study"),
                    start_date=edu.get("start_date"),
                    end_date=edu.get("end_date"),
                    grade=edu.get("grade"),
                    graduation_date=edu.get("graduation_date"),
                    marks=edu.get("marks"),
                    location=edu.get("location"),
                ))
                logger.info(f"[DEBUG] Added education: {edu.get('degree')} at {edu.get('institution')}")

        # --- Experience (array of objects) ---
        experience_list = parsed_data.get("experience", [])
        # Ensure it's always a list
        if isinstance(experience_list, dict):
            experience_list = [experience_list]
        
        for exp in experience_list:
            if exp and any(exp.values()):
                db.add(Experience(
                    candidate_id=candidate_id,
                    company_name=exp.get("company_name"),
                    job_title=exp.get("job_title"),
                    start_date=exp.get("start_date"),
                    end_date=exp.get("end_date"),
                    location=exp.get("location"),
                    is_current=exp.get("is_current", False),
                    description=exp.get("description"),
                    marks=exp.get("marks"),
                ))
                logger.info(f"[DEBUG] Added experience: {exp.get('job_title')} at {exp.get('company_name')}")

        # --- Projects (array of objects) ---
        projects_list = parsed_data.get("projects", [])
        if isinstance(projects_list, dict):
            projects_list = [projects_list]
        
        for proj in projects_list:
            if proj and proj.get("project_name"):
                db.add(Project(
                    candidate_id=candidate_id,
                    project_name=proj.get("project_name"),
                    description=proj.get("description"),
                    github_url=proj.get("github_url"),
                ))
                logger.info(f"[DEBUG] Added project: {proj.get('project_name')}")

        # --- Skills (single object with multiple fields) ---
        skills = parsed_data.get("skills", {})
        if skills and any(skills.values()):
            db.add(Skill(
                candidate_id=candidate_id,
                languages=skills.get("languages"),
                backend_technologies=skills.get("backend_technologies"),
                databases=skills.get("databases"),
                ai_ml_frameworks=skills.get("ai_ml_frameworks"),
                tools_platforms=skills.get("tools_platforms"),
                core_competencies=skills.get("core_competencies"),
            ))
            logger.info(f"[DEBUG] Added skills")

        # --- Certifications (array of objects OR comma-separated string) ---
        certs = parsed_data.get("certifications", [])
        
        # Handle array of objects (new format)
        if isinstance(certs, list):
            for cert in certs:
                if isinstance(cert, dict):
                    title = cert.get("title", "")
                elif isinstance(cert, str):
                    title = cert
                else:
                    continue
                
                if title and title.strip():
                    db.add(Certification(candidate_id=candidate_id, title=title.strip()))
                    logger.info(f"[DEBUG] Added certification: {title}")
        
        # Handle comma-separated string (legacy format)
        elif isinstance(certs, str) and certs.strip():
            for cert in certs.split(","):
                cert = cert.strip()
                if cert:
                    db.add(Certification(candidate_id=candidate_id, title=cert))
                    logger.info(f"[DEBUG] Added certification: {cert}")

        db.commit()
        logger.info(f"[DEBUG] Successfully saved all parsed data for candidate {candidate_id}")
    except Exception as e:
        logger.info(f"[ERROR] save_parsed_data failed: {str(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise