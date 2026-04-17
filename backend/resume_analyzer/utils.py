import os
import json
import logging
from groq import Groq
from resume_analyzer.prompt import ANALYZER_PROMPT
from dotenv import load_dotenv

logger = logging.getLogger(__name__)
load_dotenv(override=True)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY not found in environment variables")

client = Groq(api_key=GROQ_API_KEY)

def analyze_resume_text(resume_text: str) -> dict:
    full_prompt = f"{ANALYZER_PROMPT}\n\n{resume_text}"

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {
                "role": "system",
                "content": "You are an expert resume consultant. Always return valid JSON only."
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
        # Strip markdown fences if LLM misbehaves
        clean = result.replace("```json", "").replace("```", "").strip()
        try:
            return json.loads(clean)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON from LLM: {clean}")
            raise ValueError(f"Invalid JSON returned by LLM: {str(e)}")
