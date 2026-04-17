import json
import logging
import os
from typing import Any, Dict, List

import openai
import requests
from dotenv import load_dotenv

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")
JDOODLE_CLIENT_ID = os.getenv("JDOODLE_CLIENT_ID")
JDOODLE_CLIENT_SECRET = os.getenv("JDOODLE_CLIENT_SECRET")
logger = logging.getLogger(__name__)


CODING_PROMPT_TEMPLATE = """
You are an expert technical interviewer specializing in practical coding assessments.

Generate exactly 1 coding question suitable for an interview.

Resume Skills and Experience:
{resume_summary}

Job Requirements:
- Title: {job_title}
- Required Skills: {required_skills}

Generate 1 coding question that:
1. Is relevant to the job role when possible, otherwise uses a general programming or logic problem
2. Is solvable in 30-40 minutes
3. Has a clear problem statement
4. Includes input and output examples
5. Includes constraints
6. Includes an expected function signature
7. Includes 3-5 test cases

For the question, provide:
- question_text
- difficulty
- topic
- example_input
- example_output
- explanation
- expected_time_complexity
- expected_space_complexity
- test_cases
- constraints
- expected_function_signature

Return ONLY valid JSON array:
[
  {{
    "question_text": "...",
    "difficulty": "medium",
    "topic": "...",
    "example_input": "...",
    "example_output": "...",
    "explanation": "...",
    "expected_time_complexity": "...",
    "expected_space_complexity": "...",
    "test_cases": [
      {{"input": "...", "output": "..."}}
    ],
    "constraints": "...",
    "expected_function_signature": "def solve(...):"
  }}
]
"""


async def generate_coding_questions(
    parsed_resume: Dict[str, Any],
    job_data: Dict[str, Any],
    num_questions: int = 1,
) -> List[Dict[str, Any]]:
    try:
        from assessment.assessment_service import format_resume_for_prompt

        resume_summary = format_resume_for_prompt(parsed_resume)

        prompt = CODING_PROMPT_TEMPLATE.format(
            resume_summary=resume_summary,
            job_title=job_data.get("title", "Software Engineer"),
            required_skills=json.dumps(job_data.get("required_skills", [])),
        )

        logger.info("Generating %s coding question(s) using GPT", num_questions)

        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert coding interviewer. Return only valid JSON arrays.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.6,
            max_tokens=2500,
        )

        response_text = response.choices[0].message.content.strip()

        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]

        questions = json.loads(response_text.strip())[:num_questions]
        validated_questions = [question for question in questions if validate_coding_question(question)]
        logger.info("Successfully generated %s coding question(s)", len(validated_questions))
        return validated_questions
    except json.JSONDecodeError as error:
        logger.error("Failed to parse coding questions JSON: %s", error)
        return []
    except Exception as error:
        logger.error("Error generating coding questions: %s", error)
        return []


def validate_coding_question(question: Dict[str, Any]) -> bool:
    required_fields = [
        "question_text",
        "difficulty",
        "topic",
        "example_input",
        "example_output",
        "test_cases",
        "constraints",
        "expected_function_signature",
    ]

    for field in required_fields:
        if field not in question or not question[field]:
            logger.warning("Coding question missing field: %s", field)
            return False

    if not isinstance(question["test_cases"], list) or len(question["test_cases"]) == 0:
        logger.warning("Coding question has invalid test_cases")
        return False

    return True


async def execute_code_jdoodle(code: str, language: str, stdin: str = "") -> Dict[str, Any]:
    if not JDOODLE_CLIENT_ID or not JDOODLE_CLIENT_SECRET:
        logger.error("JDoodle credentials not configured")
        return {
            "success": False,
            "error": "Code execution service not configured",
            "output": "",
            "time": 0,
            "memory": 0,
        }

    url = "https://api.jdoodle.com/v1/execute"
    payload = {
        "clientId": JDOODLE_CLIENT_ID,
        "clientSecret": JDOODLE_CLIENT_SECRET,
        "script": code,
        "language": language,
        "stdin": stdin,
        "versionIndex": "0",
    }

    try:
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()
        result = response.json()
        return {
            "success": True,
            "output": result.get("output", "").strip(),
            "error": result.get("error", ""),
            "time": float(result.get("cpuTime", 0)),
            "memory": float(result.get("memory", 0)),
        }
    except requests.exceptions.Timeout:
        logger.error("JDoodle API timeout")
        return {"success": False, "error": "Execution timeout", "output": "", "time": 0, "memory": 0}
    except Exception as error:
        logger.error("JDoodle execution error: %s", error)
        return {"success": False, "error": str(error), "output": "", "time": 0, "memory": 0}


async def evaluate_coding_submission(
    code: str,
    language: str,
    test_cases: List[Dict[str, str]],
    expected_time_complexity: str = None,
) -> Dict[str, Any]:
    total_test_cases = len(test_cases)
    passed_test_cases = 0
    execution_results = []

    for index, test_case in enumerate(test_cases):
        test_input = test_case.get("input", "")
        expected_output = test_case.get("output", "").strip()
        result = await execute_code_jdoodle(code, language, test_input)

        if not result["success"]:
            execution_results.append({"test_case": index + 1, "passed": False, "error": result["error"]})
            continue

        actual_output = result["output"].strip()
        if actual_output == expected_output:
            passed_test_cases += 1
            execution_results.append({"test_case": index + 1, "passed": True, "time": result["time"]})
        else:
            execution_results.append(
                {
                    "test_case": index + 1,
                    "passed": False,
                    "expected": expected_output,
                    "actual": actual_output,
                }
            )

    correctness_ratio = passed_test_cases / total_test_cases if total_test_cases else 0
    marks = int(round(correctness_ratio * 60))

    return {
        "marks_obtained": marks,
        "test_cases_passed": passed_test_cases,
        "total_test_cases": total_test_cases,
        "is_correct": passed_test_cases == total_test_cases,
        "execution_results": execution_results,
        "feedback": {
            "correctness": f"{passed_test_cases}/{total_test_cases} test cases passed",
            "score_breakdown": f"{marks}/60 marks",
            "suggestion": "All test cases passed!" if passed_test_cases == total_test_cases else "Review failed test cases",
            "expected_time_complexity": expected_time_complexity,
        },
    }
