"""
Mock Interview Scorecard Generator
=====================================
Evaluates all Q-A pairs from a completed mock session.
Returns per-question scores, overall readiness %, and improvement areas.
"""

import os
import json
import logging
from openai import OpenAI

logger = logging.getLogger(__name__)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def generate_scorecard(transcript: list[dict], script: dict) -> dict:
    """
    transcript: [{"speaker": "bot"|"candidate", "text": "..."}, ...]
    script: the full mock script dict with rounds and expected_answer_key
    Returns a scorecard dict.
    """
    # Build Q-A pairs from transcript
    qa_pairs = []
    # Normalise: transcript entries may use "speaker" OR "role" as the speaker key
    # (routes.py mock_transcript uses "speaker", SessionManager may use "role")
    def get_speaker(entry: dict) -> str:
        return entry.get("speaker") or entry.get("role") or ""

    def get_text(entry: dict) -> str:
        return (
            entry.get("text")
            or entry.get("content")
            or entry.get("message")
            or ""
        )

    bot_messages = [t for t in transcript if get_speaker(t) == "bot"]
    candidate_messages = [t for t in transcript if get_speaker(t) == "candidate"]

    # Build flat question list from script rounds
    all_questions = []
    for round_info in script.get("rounds", []):
        for q in round_info.get("questions", []):
            all_questions.append({
                "id": q.get("id"),
                "text": q.get("text"),
                "expected_answer_key": q.get("expected_answer_key"),
                "difficulty": q.get("difficulty"),
                "round_type": round_info.get("round_type"),
            })

    # Pair each candidate answer with corresponding question (by position)
    for i, q in enumerate(all_questions):
        if i < len(candidate_messages):
            answer = get_text(candidate_messages[i]) or "(No answer provided)"
        else:
            answer = "(No answer provided)"
        qa_pairs.append({
            "question_id": q["id"],
            "question": q["text"],
            "expected": q["expected_answer_key"],
            "answer": answer,
            "difficulty": q["difficulty"],
            "round_type": q["round_type"],
        })

    qa_json = json.dumps(qa_pairs, indent=2)

    prompt = f"""
You are a technical interview evaluator at {script.get('company', 'a top tech company')}.
Evaluate the following Q-A pairs from a mock interview for the role of {script.get('role', 'Software Engineer')}.

For each question, provide a score 0-10 and brief feedback.
Then provide an overall assessment.

Return ONLY valid JSON with this structure:
{{
  "per_question_scores": [
    {{
      "question_id": "<id>",
      "question": "<text>",
      "score": <0-10>,
      "max_score": 10,
      "feedback": "<1-2 sentences>",
      "ideal_answer": "<concise ideal answer>",
      "round_type": "<intro|dsa|system_design|behavioral>"
    }}
  ],
  "overall_readiness_percent": <0-100>,
  "round_scores": {{
    "intro": <0-100>,
    "dsa": <0-100>,
    "system_design": <0-100>,
    "behavioral": <0-100>
  }},
  "top3_improvement_areas": ["<area>", "<area>", "<area>"],
  "strengths": ["<str>", "<str>"],
  "hiring_likelihood": "strong yes | yes | maybe | no",
  "overall_feedback": "<3-4 sentence summary>"
}}

Q-A PAIRS:
{qa_json}
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=2500,
            response_format={"type": "json_object"},
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        logger.error(f"Scorecard generation failed: {e}")
        return {
            "per_question_scores": [],
            "overall_readiness_percent": 0,
            "round_scores": {"intro": 0, "dsa": 0, "system_design": 0, "behavioral": 0},
            "top3_improvement_areas": ["Could not evaluate — session may be incomplete"],
            "strengths": [],
            "hiring_likelihood": "maybe",
            "overall_feedback": "Could not generate scorecard. Please retry.",
        }
