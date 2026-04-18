"""
Mock Interview Script Generator
=================================
Generates a structured 45-minute company-specific interview script via GPT-4o.
"""

import os
import json
import logging
from openai import OpenAI

logger = logging.getLogger(__name__)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SCRIPT_SCHEMA = """
Return ONLY valid JSON (no markdown) with this exact structure:

{
  "company": "<str>",
  "role": "<str>",
  "total_duration_minutes": 45,
  "rounds": [
    {
      "round_type": "intro",
      "title": "Introduction Round",
      "duration_minutes": 8,
      "questions": [
        {
          "id": "intro_1",
          "text": "<question text>",
          "difficulty": "easy",
          "expected_answer_key": "<key points the interviewer looks for>",
          "follow_up_triggers": ["<keyword that triggers a follow-up>"]
        }
      ]
    },
    {
      "round_type": "dsa",
      "title": "Data Structures & Algorithms",
      "duration_minutes": 15,
      "questions": [
        {
          "id": "dsa_1",
          "text": "<algorithmic question>",
          "difficulty": "medium",
          "expected_answer_key": "<approach, time/space complexity>",
          "follow_up_triggers": ["<edge case>", "<optimization"]
        },
        {
          "id": "dsa_2",
          "text": "<harder adaptive question>",
          "difficulty": "hard",
          "expected_answer_key": "<approach>",
          "follow_up_triggers": []
        }
      ]
    },
    {
      "round_type": "system_design",
      "title": "System Design",
      "duration_minutes": 12,
      "questions": [
        {
          "id": "sd_1",
          "text": "<system design question specific to company's products>",
          "difficulty": "hard",
          "expected_answer_key": "<key components: load balancer, DB choice, caching, etc.>",
          "follow_up_triggers": ["<scalability>", "<failure handling>"]
        }
      ]
    },
    {
      "round_type": "behavioral",
      "title": "Behavioral & Culture Fit",
      "duration_minutes": 10,
      "questions": [
        {
          "id": "beh_1",
          "text": "<STAR behavioral question aligned with company culture>",
          "difficulty": "medium",
          "expected_answer_key": "<STAR structure, leadership, impact>",
          "follow_up_triggers": []
        },
        {
          "id": "beh_2",
          "text": "<second behavioral question>",
          "difficulty": "easy",
          "expected_answer_key": "<values alignment>",
          "follow_up_triggers": []
        }
      ]
    }
  ]
}
"""


def generate_mock_script(company_intel: dict, role: str) -> dict:
    """
    Generate a 45-minute structured interview script tailored to the company and role.
    """
    company = company_intel.get("company", "Company")
    tech_stack = ", ".join(company_intel.get("tech_stack", []))
    interview_format = company_intel.get("interview_format", "")
    question_types = ", ".join(company_intel.get("known_question_types", []))
    culture = ", ".join(company_intel.get("culture_keywords", []))

    prompt = f"""
You are an expert technical interviewer at {company}.
Generate a realistic 45-minute mock interview script for the role of {role}.

COMPANY CONTEXT:
- Tech Stack: {tech_stack}
- Culture Keywords: {culture}
- Interview Format: {interview_format}
- Known Question Types: {question_types}

Make questions company-specific (reference their products/services where relevant), but DO NOT explicitly say or write the company name in the conversational text or script. Refer only to "the company", "our team", or use generalized wording.
Focus the introduction and welcome purely on the role ({role}), without mentioning the company name.
DSA questions should reflect the company's known difficulty level.
System design should relate to problems {company} actually solves.
Behavioral questions should use {company}'s known leadership principles or values.

{SCRIPT_SCHEMA}
"""

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.5,
        max_tokens=3000,
        response_format={"type": "json_object"},
    )

    return json.loads(response.choices[0].message.content)


def get_adaptive_followup(
    question: dict,
    candidate_answer: str,
    company_intel: dict,
) -> str:
    """
    Given a question and the candidate's answer, generate an adaptive follow-up or move on.
    Returns either a follow-up question string or "" to proceed to next question.
    """
    triggers = question.get("follow_up_triggers", [])
    answer_lower = candidate_answer.lower()

    # Check if any follow-up trigger keyword is missing from answer
    unaddressed = [t for t in triggers if t.lower() not in answer_lower]

    if not unaddressed:
        return ""  # Answer was complete, move on

    trigger = unaddressed[0]
    prompt = f"""
The candidate answered a technical question but missed the topic of "{trigger}".
Generate ONE concise follow-up question (max 2 sentences) probing this specific area.
Return just the question text, nothing else.

Original question: {question.get('text', '')}
Candidate's answer: {candidate_answer[:500]}
Missing area: {trigger}
"""
    try:
        resp = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            max_tokens=150,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"Followup generation failed: {e}")
        return ""
