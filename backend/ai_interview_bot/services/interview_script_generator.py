import logging
from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
logger = logging.getLogger(__name__)


def generate_interview_script(position: str, company: str, industry: str = "Technology") -> dict:
    """Generate a comprehensive 45-minute interview script based on role and industry.
    
    Returns a structured interview with sections, timing, and questions.
    """
    
    prompt = f"""You are an expert technical recruiter. Generate a comprehensive 45-minute technical interview script for the following role.

Position: {position}
Company: {company}
Industry: {industry}

This script will be used in a live interview session where the company name must remain confidential.
Do not include the company name anywhere in the generated script content.
Refer only to the role, team, product context, or business context in generic terms.

Create a structured interview with the following sections (total 45 minutes):

1. INTRODUCTION (2 minutes)
   - Greeting and brief role-focused introduction

2. TECHNICAL ASSESSMENT (20 minutes)
   - 5-6 technical questions relevant to the role
   - Mix of foundational and advanced questions
   - Each question should take 3-4 minutes

3. CODING CHALLENGE (15 minutes)
   - 1-2 coding problems appropriate for the role
   - Include problem statement and expected solution approach
   - Total time: 12-15 minutes

4. BEHAVIORAL QUESTIONS (5 minutes)
   - 2-3 behavioral questions
   - Focus on teamwork, problem-solving, adaptability

5. CLOSING (3 minutes)
   - Role-focused wrap-up
   - Invite final questions about the role
   - Next steps explanation

Format your response as a JSON object with this structure:
{{
  "title": "Interview Script for [Position]",
  "totalDuration": 45,
  "sections": [
    {{
      "name": "Introduction",
      "duration": 2,
      "type": "intro",
      "content": "...",
      "instructions": "..."
    }},
    {{
      "name": "Technical Assessment",
      "duration": 20,
      "type": "technical",
      "questions": [
        {{
          "id": 1,
          "question": "...",
          "type": "theory",
          "timeLimit": 4,
          "difficulty": "medium",
          "expectedAnswer": "..."
        }}
      ]
    }},
    {{
      "name": "Coding Challenge",
      "duration": 15,
      "type": "coding",
      "challenges": [
        {{
          "id": 1,
          "title": "...",
          "description": "...",
          "language": "javascript",
          "timeLimit": 12,
          "difficulty": "medium",
          "starterCode": "...",
          "expectedApproach": "..."
        }}
      ]
    }},
    {{
      "name": "Behavioral Questions",
      "duration": 5,
      "type": "behavioral",
      "questions": [
        {{
          "id": 1,
          "question": "...",
          "timeLimit": 2,
          "expectedFramework": "STAR method recommended"
        }}
      ]
    }},
    {{
      "name": "Closing",
      "duration": 3,
      "type": "closing",
      "content": "..."
    }}
  ]
}}

Make the interview highly relevant to {position} in the {industry} industry. Be specific and detailed.
Maintain a warm, human interviewer tone throughout."""

    try:
        logger.info(f"Generating interview script for {position} at {company}")
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert recruiter. Generate interview scripts in valid JSON format only. No markdown, no extra text."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
        )
        
        script_text = response.choices[0].message.content
        logger.info(f"Interview script generated successfully")
        
        # Parse JSON response
        import json
        script = json.loads(script_text)
        return script
        
    except Exception as e:
        logger.error(f"Error generating interview script: {str(e)}", exc_info=True)
        return {
            "error": str(e),
            "title": f"Interview for {position}",
            "totalDuration": 45,
            "sections": []
        }


def generate_follow_up_question(session: dict, section_type: str) -> str:
    """Generate a follow-up question based on candidate's previous answer."""
    
    transcript = session.get("transcript", [])
    position = session.get("position", "Engineering")
    
    if not transcript:
        return "Tell me about your experience with this technology."
    
    last_response = transcript[-1].get("message", "")
    
    prompt = f"""Based on this candidate response to a {section_type} interview question, generate a relevant follow-up question.

Position: {position}
Previous Response: "{last_response}"

Generate a follow-up question that:
1. Digs deeper into their answer
2. Tests their depth of knowledge
3. Is specific and actionable
4. Takes about 2-3 minutes to answer

Return ONLY the question, no explanation."""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert interviewer. Generate insightful follow-up questions."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        logger.error(f"Error generating follow-up: {str(e)}")
        return "Can you elaborate on that?"


def evaluate_solution(code: str, language: str, problem_description: str) -> dict:
    """Evaluate coding solution and provide feedback."""
    
    prompt = f"""Evaluate this coding solution:

Language: {language}
Problem: {problem_description}

Code:
```{language}
{code}
```

Provide a JSON evaluation with:
{{
  "score": 0-100,
  "isCorrect": true/false,
  "strengths": ["..."],
  "improvements": ["..."],
  "feedback": "..."
}}

Be encouraging but honest. Focus on logic, efficiency, and code quality."""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert code reviewer. Evaluate solutions fairly."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.5,
        )
        
        import json
        evaluation = json.loads(response.choices[0].message.content)
        return evaluation
        
    except Exception as e:
        logger.error(f"Error evaluating solution: {str(e)}")
        return {
            "score": 0,
            "isCorrect": False,
            "feedback": "Unable to evaluate solution"
        }
