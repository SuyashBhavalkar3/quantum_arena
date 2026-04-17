import json
import os
import re
from typing import Any, Dict

from dotenv import load_dotenv
from groq import Groq

load_dotenv(override=True)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")


def _safe_json_load(content: str) -> Dict[str, Any]:
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        cleaned = content.replace("```json", "").replace("```", "").strip()
        return json.loads(cleaned)


def _fallback_parse(query: str) -> Dict[str, Any]:
    lowered = query.lower().strip()

    create_match = re.search(
        r"add (?:a )?job post for (?P<title>.+?)(?: with (?P<exp>\d+) years? experience)?(?: and skills? (?P<skills>.+))?$",
        lowered,
    )
    if create_match:
        skills_raw = create_match.group("skills") or ""
        skills = [
            skill.strip().title()
            for skill in re.split(r",| and ", skills_raw)
            if skill.strip()
        ]
        return {
            "action": "create_job",
            "title": create_match.group("title").strip().title(),
            "description": None,
            "required_skills": skills,
            "experience_required": int(create_match.group("exp") or 0),
            "location": None,
            "salary_range": None,
        }

    delete_match = re.search(r"delete job post for (?P<title>.+)$", lowered)
    if delete_match:
        return {
            "action": "delete_job",
            "title": delete_match.group("title").strip().title(),
        }

    candidate_match = re.search(r"list candidates for (?P<title>.+?) role?$", lowered)
    if candidate_match:
        return {
            "action": "list_candidates",
            "title": candidate_match.group("title").strip().title(),
        }

    if "show all active job posts" in lowered or "list all active job posts" in lowered:
        return {"action": "list_jobs"}

    return {"action": "unsupported"}


def _normalize_job_payload(parsed: Dict[str, Any], fallback: Dict[str, Any]) -> Dict[str, Any]:
    required_skills = parsed.get("required_skills")
    if isinstance(required_skills, str):
        required_skills = [required_skills]
    elif not isinstance(required_skills, list):
        required_skills = fallback.get("required_skills", [])

    normalized_skills = [str(skill).strip() for skill in required_skills if str(skill).strip()]

    experience_required = parsed.get("experience_required", fallback.get("experience_required", 0))
    try:
        experience_required = int(experience_required or 0)
    except (TypeError, ValueError):
        experience_required = int(fallback.get("experience_required", 0) or 0)

    return {
        "action": "create_job",
        "title": (parsed.get("title") or fallback.get("title") or "").strip() or None,
        "description": parsed.get("description"),
        "required_skills": normalized_skills,
        "experience_required": experience_required,
        "location": parsed.get("location"),
        "salary_range": parsed.get("salary_range"),
    }


def interpret_hr_command(query: str) -> Dict[str, Any]:
    fallback = _fallback_parse(query)
    if not GROQ_API_KEY:
        return fallback

    prompt = f"""
You are an HR assistant.

Convert the user's instruction into either:
1. a supported HR action JSON, or
2. a job post JSON payload for create_job.

Return ONLY valid JSON.

Supported actions:
- create_job
- list_jobs
- delete_job
- list_candidates
- unsupported

Interpret this HR command:
{query}

Rules:
- For create_job, return these exact keys:
  {{
    "action": "create_job",
    "title": "string",
    "description": "string | null",
    "required_skills": ["string"],
    "experience_required": number,
    "location": "string | null",
    "salary_range": "string | null"
  }}
- experience_required must be an integer
- required_skills must be an array
- If a field is missing, set it to null, except required_skills which should be []
- For list_jobs, no title is needed
- For delete_job and list_candidates, extract the role title
- If the command does not match supported actions, return action="unsupported"
"""

    client = Groq(api_key=GROQ_API_KEY)
    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {
                "role": "system",
                "content": "You are an HR operations assistant. Return valid JSON only.",
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.1,
    )
    parsed = _safe_json_load(response.choices[0].message.content.strip())

    if parsed.get("action") == "create_job":
        return _normalize_job_payload(parsed, fallback)

    return {
        "action": parsed.get("action", fallback["action"]),
        "title": parsed.get("title") or fallback.get("title"),
        "experience_required": parsed.get("experience_required", fallback.get("experience_required", 0)),
    }
