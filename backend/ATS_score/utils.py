from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from authentication.database import get_db
from authentication.utils import get_current_user
from authentication.models import User
from resume_parsing.models import Candidate, Skill, Experience, Project, Education
from job_management_module.models import Job
#from applications.models import Application  # you'll have this later
from groq import Groq
import os, json
from ATS_score.prompt import ATS_PROMPT
from dotenv import load_dotenv
load_dotenv(override=True)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY)


def build_candidate_profile(candidate: Candidate) -> dict:
    """Assemble candidate data from all related tables into one dict for LLM."""
    
    skills = candidate.skills[0] if candidate.skills else None
    
    return {
        "skills": {
            "languages": skills.languages if skills else "",
            "backend_technologies": skills.backend_technologies if skills else "",
            "databases": skills.databases if skills else "",
            "ai_ml_frameworks": skills.ai_ml_frameworks if skills else "",
            "tools_platforms": skills.tools_platforms if skills else "",
            "core_competencies": skills.core_competencies if skills else "",
        },
        "experiences": [
            {
                "company": exp.company_name,
                # the ORM stores job_title, not title
                "title": exp.job_title,
                "start_date": exp.start_date,
                "end_date": exp.end_date,
                # description property is aliased to `responsibilities` in
                # the Pydantic schema, but for generating the LLM profile
                # we can just use it directly.
                "responsibilities": exp.description,
            }
            for exp in candidate.experiences
        ],
        "projects": [
            {
                "name": proj.project_name,
                "description": proj.description,
            }
            for proj in candidate.projects
        ],
        "education": [
            {
                "degree": edu.degree,
                "institution": edu.institution,
                "graduation_date": edu.graduation_date,
            }
            for edu in candidate.education
        ],
        "certifications": [cert.title for cert in candidate.certifications],
    }

def calculate_ats_score(candidate_profile: dict, job: Job) -> dict:
    job_context = f"""
Job Title: {job.title}
Job Description: {job.description}
Required Skills: {', '.join(job.required_skills or [])}
Experience Required: {job.experience_required} years
Location: {job.location}
"""
    
    user_message = f"""
{ATS_PROMPT}

--- JOB ---
{job_context}

--- CANDIDATE PROFILE ---
{json.dumps(candidate_profile, indent=2)}
"""

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {"role": "system", "content": "You are an expert ATS evaluator. Always return valid JSON only."},
            {"role": "user", "content": user_message}
        ],
        temperature=0
    )

    result = response.choices[0].message.content.strip()

    try:
        return json.loads(result)
    except json.JSONDecodeError:
        # Strip markdown fences if LLM misbehaves
        clean = result.replace("```json", "").replace("```", "").strip()
        return json.loads(clean)