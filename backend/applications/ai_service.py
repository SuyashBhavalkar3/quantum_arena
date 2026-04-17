import openai
import os
import json
import logging
from typing import Dict, Any
from dotenv import load_dotenv

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")
logger = logging.getLogger(__name__)


def analyze_resume_match(parsed_resume: Dict[str, Any], job_description: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyze resume against job requirements using AI.
    Returns structured analysis with match_score (0-100).
    
    Args:
        parsed_resume: Candidate's parsed resume data with skills, experience, education
        job_description: Job info with title, description, required_skills, experience_required
    
    Returns:
        Dictionary with:
        - match_score (0-100)
        - matched_skills (list)
        - missing_skills (list)
        - experience_match (string)
        - strengths (list)
        - concerns (list)
        - recommendation (string)
    """
    
    prompt = f"""
    Analyze the candidate's resume against the job requirements and provide a detailed match score.
    
    Job Requirements:
    - Title: {job_description.get('title')}
    - Required Skills: {job_description.get('required_skills', [])}
    - Experience Required: {job_description.get('experience_required', 0)} years
    - Description: {job_description.get('description', '')[:500]}
    
    Candidate Resume:
    {str(parsed_resume)[:1000]}
    
    Provide a JSON response with:
    1. match_score (integer 0-100)
    2. matched_skills (list of matched skills)
    3. missing_skills (list of missing skills)
    4. experience_match (string: "Good match", "Partial match", or "No match")
    5. strengths (list of candidate strengths)
    6. concerns (list of potential concerns)
    7. recommendation (string: "Eligible for assessment" or "Not eligible")
    """
    
    try:
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert HR recruiter analyzing candidate resumes. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=1000
        )
        
        result = json.loads(response.choices[0].message.content)
        
        # Ensure match_score is present and is an integer
        if "match_score" not in result:
            result["match_score"] = 0
        else:
            result["match_score"] = int(result["match_score"])
        
        logger.info(f"Resume analysis completed. Match score: {result['match_score']}")
        return result
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse resume analysis response as JSON: {e}")
        return {
            "match_score": 0,
            "error": "Failed to parse AI response",
            "recommendation": "Not eligible"
        }
    except Exception as e:
        logger.error(f"Error during resume analysis: {str(e)}")
        return {
            "match_score": 0,
            "error": str(e),
            "recommendation": "Not eligible"
        }