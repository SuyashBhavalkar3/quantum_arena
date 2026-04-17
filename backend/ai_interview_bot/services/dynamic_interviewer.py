import logging
from openai import OpenAI
from dotenv import load_dotenv
import os
import json

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
logger = logging.getLogger(__name__)

def generate_dynamic_response(
    position: str,
    company: str,
    conversation_history: list,
    current_state: str,
    candidate_response: str = None,
    execution_result: dict = None
) -> dict:
    """
    Generate the next interviewer message based on conversation state and candidate response.
    Uses OpenAI to analyze responses and generate contextually appropriate follow-ups.
    
    Returns:
        {
            "message": "The interviewer's response",
            "next_state": "next_interview_state",
            "question_type": "technical|coding|behavioral|follow_up|hint",
            "score_delta": 0-100,
            "should_ask_hint": boolean
        }
    """
    
    # Build conversation context
    conversation_str = "\n".join([
        f"{msg['role'].upper()}: {msg['content']}" 
        for msg in conversation_history[-10:]  # Last 10 messages for context
    ])
    
    # Context about execution result if code was submitted
    code_context = ""
    if execution_result:
        code_context = f"""
Code Execution Result:
- Output: {execution_result.get('output', 'No output')}
- Error: {execution_result.get('error', 'None')}
- CPU Time: {execution_result.get('cpuTime', 'N/A')}
"""
    
    prompt = f"""You are an expert technical interviewer conducting a live interview for the position of "{position}".

The company name is confidential in this session.
Do not mention, imply, or reveal the company name anywhere in your response.
If the candidate asks which company this is for, respond exactly: "I'm not able to share that detail — let's keep our focus on the role itself."

Current Interview State: {current_state}

Conversation History (last 10 messages):
{conversation_str}

Candidate's Last Response: {candidate_response or "N/A"}

{code_context}

Based on the conversation history and candidate's response, generate the next interviewer action.

IMPORTANT RULES:
1. If the candidate just greeted, acknowledge and ask if they're ready to start.
2. If the candidate is refusing the interview, ask clarifying questions - don't move to next topic.
3. Always evaluate the previous answer BEFORE asking a new question.
4. Give hints if the candidate is struggling but avoid spoon-feeding answers.
5. For coding problems, analyze the submitted code for correctness, efficiency, and edge cases.
6. Transition naturally between question types: technical → follow-up → coding → behavioral.
7. Don't ask multiple questions without waiting for responses.
8. Acknowledge what the candidate said before proceeding.
9. Sound warm, professional, and human.

Current State Transition Rules:
- "greeting" → acknowledge and confirm readiness
- "introduction" → brief introduction and shift to questions
- "ready_confirmation" → start with a technical question
- "technical_question" → wait for answer
- "candidate_answer_awaiting" → evaluate and provide feedback
- "evaluating_answer" → decide on follow-up, hint, or next question
- "coding_question" → code challenge with problem description
- "candidate_coding_awaiting" → wait for code submission
- "evaluating_code" → analyze code quality and correctness
- "behavioral_question" → ask STAR-based behavioral question
- "interview_complete" → wrap up and thank candidate

Generate a JSON response with:
{{
    "message": "Your next question or response (2-3 sentences maximum)",
    "next_state": "One of: greeting|introduction|ready_confirmation|technical_question|candidate_answer_awaiting|evaluating_answer|follow_up_question|coding_question|candidate_coding_awaiting|evaluating_code|behavioral_question|candidate_behavioral_awaiting|evaluating_behavioral|hint_or_clarification|next_question_decision|interview_complete",
    "question_type": "technical|coding|behavioral|follow_up|hint|statement",
    "score_delta": 0-100,
    "explanation": "Brief explanation of why you're giving this score"
}}

Respond with ONLY valid JSON, no other text."""

    try:
        response = client.chat.completions.create(
            model="gpt-4-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert technical recruiter conducting AI-driven interviews. Generate natural, contextual responses that evaluate candidates fairly while making smooth conversation transitions."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        response_text = response.choices[0].message.content
        logger.info(f"OpenAI response: {response_text}")
        
        # Parse JSON response
        result = json.loads(response_text.strip())
        return result
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse OpenAI response: {str(e)}")
        return {
            "message": "Let me give you feedback on that response.",
            "next_state": "next_question_decision",
            "question_type": "statement",
            "score_delta": 50,
            "explanation": "Unable to generate dynamic evaluation"
        }
    except Exception as e:
        logger.error(f"Error generating dynamic response: {str(e)}", exc_info=True)
        return {
            "message": "Let's move to the next question.",
            "next_state": "next_question_decision",
            "question_type": "statement",
            "score_delta": 50,
            "explanation": "Error in evaluation"
        }


def generate_coding_challenge(position: str, difficulty: str = "medium") -> dict:
    """Generate a coding challenge appropriate for the position"""
    
    prompt = f"""Generate a coding challenge for a "{position}" technical interview at difficulty level: {difficulty}.

The challenge should be:
- Realistic and relevant to the role
- Solvable in 10-15 minutes
- Test practical problem-solving skills
- Include test cases

Format as JSON:
{{
    "title": "Problem title",
    "description": "Detailed problem statement with examples",
    "language": "javascript",
    "timeLimit": 12,
    "difficulty": "{difficulty}",
    "starterCode": "function solve() {{\\n  // TODO: implement\\n}}",
    "expectedApproach": "Brief outline of expected solution approach",
    "testCases": [
        {{"input": "...", "expectedOutput": "..."}},
    ]
}}

Respond with ONLY valid JSON."""

    try:
        response = client.chat.completions.create(
            model="gpt-4-turbo",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.8,
            max_tokens=800
        )
        
        return json.loads(response.choices[0].message.content.strip())
    except Exception as e:
        logger.error(f"Error generating coding challenge: {str(e)}")
        return {
            "title": "Implement FizzBuzz",
            "description": "Write a function that prints numbers 1-100. For multiples of 3, print 'Fizz'. For multiples of 5, print 'Buzz'. For multiples of both, print 'FizzBuzz'.",
            "language": "javascript",
            "timeLimit": 10,
            "difficulty": difficulty,
            "starterCode": "function fizzBuzz() {\n  // TODO: implement\n}",
            "expectedApproach": "Use a loop, check divisibility with modulo operator",
            "testCases": []
        }


def evaluate_code_submission(code: str, challenge: dict, language: str) -> dict:
    """Analyze submitted code for correctness, efficiency, and style"""
    
    prompt = f"""Evaluate this code submission for a coding challenge.

Challenge: {challenge.get('title', 'Unknown')}
Description: {challenge.get('description', '')}
Expected Approach: {challenge.get('expectedApproach', '')}

Submitted Code (Language: {language}):
{code}

Evaluate and provide:
1. Does it solve the problem correctly?
2. Time and space complexity analysis
3. Code quality (readability, style, best practices)
4. Potential edge cases missed
5. Suggestions for improvement

Format as JSON:
{{
    "correct": true/false,
    "score": 0-100,
    "timeComplexity": "O(...)",
    "spaceComplexity": "O(...)",
    "strengths": ["..."],
    "improvements": ["..."],
    "feedback": "Overall assessment in 2-3 sentences"
}}

Respond with ONLY valid JSON."""

    try:
        response = client.chat.completions.create(
            model="gpt-4-turbo",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.6,
            max_tokens=600
        )
        
        return json.loads(response.choices[0].message.content.strip())
    except Exception as e:
        logger.error(f"Error evaluating code: {str(e)}")
        return {
            "correct": False,
            "score": 50,
            "timeComplexity": "Unknown",
            "spaceComplexity": "Unknown",
            "strengths": [],
            "improvements": ["Unable to evaluate"],
            "feedback": "Evaluation error occurred"
        }
