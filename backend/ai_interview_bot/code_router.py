import logging

logger = logging.getLogger(__name__)

import os
import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

# Code execution router
code_router = APIRouter(prefix="/api", tags=["code-execution"])

class CodeExecutionRequest(BaseModel):
    code: str
    language: str
    sessionId: str
    versionIndex: str = 3

class CodeExecutionResponse(BaseModel):
    output: str = ""
    error: Optional[str] = None
    cpuTime: Optional[str] = None
    memory: Optional[str] = None
    status: str = "success"

@code_router.post("/execute-code", response_model=CodeExecutionResponse)
async def execute_code_endpoint(request: CodeExecutionRequest):
    """Execute code using JDoodle API"""
    
    # Validate fields
    if not request.code or not isinstance(request.code, str):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid code field: {type(request.code)}"
        )
    
    if not request.language or not isinstance(request.language, str):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid language field: {type(request.language)}"
        )
    
    if not request.sessionId or not isinstance(request.sessionId, str):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid sessionId field: {type(request.sessionId)}"
        )
    
    client_id = os.getenv("JDOODLE_CLIENT_ID")
    client_secret = os.getenv("JDOODLE_CLIENT_SECRET")
    
    if not client_id or not client_secret:
        raise HTTPException(
            status_code=500,
            detail="JDoodle credentials not configured"
        )
    
    # Map frontend language names to JDoodle language identifiers
    language_map = {
        "javascript": "javascript",
        "python3": "python3",
        "java": "java",
        "cpp14": "cpp14",
        "csharp": "csharp",
    }
    
    jdoodle_language = language_map.get(request.language, "javascript")
    
    payload = {
        "clientId": client_id,
        "clientSecret": client_secret,
        "script": request.code,
        "language": jdoodle_language,
        "versionIndex": request.versionIndex
    }
    
    logger.info(f"JDoodle payload: {payload}")
    
    try:
        response = requests.post(
            "https://api.jdoodle.com/v1/execute",
            json=payload,
            timeout=10
        )
        
        # Check for HTTP errors without raising
        if response.status_code != 200:
            logger.info(f"JDoodle HTTP Error: {response.status_code}")
            logger.info(f"Response: {response.text}")
            return CodeExecutionResponse(
                output="",
                error=f"JDoodle API error {response.status_code}: {response.text[:200]}",
                status="error"
            )
        
        data = response.json()
        
        if data.get("statusCode") == 200:
            return CodeExecutionResponse(
                output=data.get("output", ""),
                error=None,
                cpuTime=data.get("cpuTime"),
                memory=data.get("memory"),
                status="success"
            )
        else:
            return CodeExecutionResponse(
                output="",
                error=f"Execution failed: {data.get('statusCode', 'Unknown error')}",
                status="error"
            )
    except requests.exceptions.Timeout:
        return CodeExecutionResponse(
            output="",
            error="Execution timeout - code took too long to run",
            status="error"
        )
    except requests.RequestException as e:
        return CodeExecutionResponse(
            output="",
            error=f"Request failed: {str(e)}",
            status="error"
        )
    except Exception as e:
        return CodeExecutionResponse(
            output="",
            error=f"Unexpected error: {str(e)}",
            status="error"
        )
