from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import json
import base64
import logging
from datetime import datetime

from applications.models import Application, ApplicationStatus
from authentication.database import SessionLocal
from authentication.database import SessionLocal
from applications.models import Application
from job_management_module.models import Job
from .services.interview_session import SessionManager
from .services.code_executor import execute_code
from .services.proctoring import log_violation
from .services.sarvam_service import transcribe_audio, generate_speech
from .service import evaluate_response
from .services.interview_script_generator import (
    generate_interview_script,
    generate_follow_up_question,
    evaluate_solution
)
from .services.adaptive_interview_bot import adaptive_bot
from reports.service import generate_candidate_report_background

router = APIRouter()
session_manager = SessionManager()
logger = logging.getLogger(__name__)


def finalize_interview(application_id: int | None, session_id: str, status: str, reason: str = "completed"):
    if not application_id:
        return

    db = SessionLocal()
    try:
        application = db.query(Application).filter(Application.id == application_id).first()
        if not application:
            return

        session = session_manager.get_session(session_id) or {}
        transcript = session.get("transcript", [])
        violations = session.get("violations", [])
        ended_at = datetime.utcnow()

        feedback = dict(application.interview_feedback or {})
        feedback["ai_interview_status"] = status
        feedback["termination_reason"] = reason
        feedback["completed_at"] = ended_at.isoformat()
        feedback["duration_minutes"] = feedback.get("duration_minutes", 0)
        feedback["violation_count"] = len(violations)
        feedback["violations"] = violations
        feedback["response_count"] = len([item for item in transcript if item.get("speaker") == "candidate"])

        application.interview_feedback = feedback
        application.interview_transcript = transcript
        application.status = ApplicationStatus.INTERVIEW_COMPLETED

        db.commit()
    finally:
        db.close()

    asyncio.create_task(generate_candidate_report_background(application_id))

async def safe_send_json(websocket: WebSocket, data: dict):
    """Safely send JSON data through WebSocket with error handling"""
    try:
        await websocket.send_json(data)
        return True
    except Exception as e:
        logger.error(f"Error sending JSON to websocket: {str(e)}")
        return False

@router.get("/interview/script/{session_id}")
async def get_interview_script(session_id: str):
    """Get the generated interview script for a session."""
    session = session_manager.get_session(session_id)
    if not session:
        return {"error": "Session not found"}
    
    script = session.get("interview_script", {})
    return {
        "script": script,
        "progress": {
            "currentSection": session.get("current_section", 0),
            "currentQuestion": session.get("current_question", 0),
            "elapsedTime": session.get("elapsed_time", 0)
        }
    }

@router.websocket("/ws/interview/{session_id}")
async def interview_websocket(
    websocket: WebSocket,
    session_id: str,
    position: str = "Engineer",
    company: str = "Tech Company",
    applicationId: int | None = None,
):
    await websocket.accept()
    logger.info(f"WebSocket accepted for session: {session_id}")
    
    try:
        session = session_manager.create_session(session_id)
        session["position"] = position
        session["company"] = company
        logger.info(f"Session created: {session_id} - role={position}")

        # Fetch job configuration if available
        interview_config = None
        if applicationId:
            db = SessionLocal()
            try:
                application = db.query(Application).filter(Application.id == applicationId).first()
                if application and application.job_id:
                    job = db.query(Job).filter(Job.id == application.job_id).first()
                    if job and getattr(job, "interview_config", None):
                        interview_config = job.interview_config
            finally:
                db.close()
        session["interview_config"] = interview_config

        # Generate comprehensive interview script
        try:
            interview_script = generate_interview_script(position, company, interview_config=interview_config)
            session["interview_script"] = interview_script
            logger.info(f"Interview script generated with {len(interview_script.get('sections', []))} sections")
            
            # Send script overview to client
            await safe_send_json(websocket, {
                "type": "interview_started",
                "script": interview_script,
                "totalDuration": interview_script.get("totalDuration", 45),
                "message": f"Welcome! This is a {interview_script.get('totalDuration', 45)}-minute interview for {position}."
            })
            
        except Exception as e:
            logger.error(f"Error generating interview script: {str(e)}", exc_info=True)
            await safe_send_json(websocket, {
                "type": "error",
                "message": f"Failed to generate interview script: {str(e)}"
            })
            await websocket.close()
            return

        # Send first question from the script
        try:
            # Use adaptive bot for greeting
            greeting = adaptive_bot.generate_greeting(position, company)
            greeting_audio = generate_speech(greeting)
            session["current_stage"] = "greeting"
            session_manager.add_transcript(session_id, "bot", greeting)
            
            await safe_send_json(websocket, {
                "type": "section_started",
                "section": "Greeting",
                "text": greeting,
                "audio": greeting_audio,
                "stage": "greeting"
            })
            logger.info("Adaptive greeting sent to candidate")
                
        except Exception as e:
            logger.error(f"Error sending introduction: {str(e)}", exc_info=True)

        try:
            while True:
                try:
                    data = await websocket.receive_text()
                    message = json.loads(data)
                    msg_type = message.get("type")
                    logger.info(f"Received message type: {msg_type}")

                    if msg_type == "candidate_response":
                        response_text = message.get("text", "")
                        session_manager.add_transcript(session_id, "candidate", response_text)
                        
                        # Use adaptive interview bot
                        bot_response = adaptive_bot.generate_next_question(
                            session=session,
                            candidate_response=response_text,
                            position=position,
                            company=company,
                            interview_config=interview_config
                        )
                        
                        action = bot_response.get("action", "continue")
                        bot_message = bot_response.get("message", "")
                        
                        # Handle refusal
                        if action == "end_interview":
                            session_manager.add_transcript(session_id, "bot", bot_message)
                            await safe_send_json(websocket, {
                                "type": "interview_ended",
                                "text": bot_message,
                                "reason": bot_response.get("reason", "candidate_declined")
                            })
                            finalize_interview(applicationId, session_id, "completed", bot_response.get("reason", "candidate_declined"))
                            session_manager.end_session(session_id)
                            await websocket.close()
                            break
                        
                        # Handle HITL escalation
                        elif action == "escalate_to_human":
                            session_manager.add_transcript(session_id, "bot", bot_message)
                            await safe_send_json(websocket, {
                                "type": "human_intervention_required",
                                "text": bot_message,
                                "reason": bot_response.get("reason", "human_requested")
                            })
                            logger.info(f"HITL escalation requested for session {session_id}")
                            # Mark session for human review
                            session["requires_human"] = True
                            continue
                        
                        # Continue interview
                        else:
                            # Update stage if changed
                            next_stage = bot_response.get("next_stage")
                            if next_stage:
                                session["current_stage"] = next_stage
                            
                            # Generate speech
                            bot_audio = generate_speech(bot_message)
                            session_manager.add_transcript(session_id, "bot", bot_message)
                            
                            await safe_send_json(websocket, {
                                "type": "follow_up_question",
                                "text": bot_message,
                                "audio": bot_audio,
                                "stage": next_stage,
                                "metadata": bot_response.get("metadata", {})
                            })
                            logger.info(f"Adaptive question sent - Stage: {next_stage}")

                    elif msg_type == "move_to_next_section":
                        current = session.get("current_section", 0)
                        sections = interview_script.get("sections", [])
                        next_section_idx = current + 1
                        
                        if next_section_idx < len(sections):
                            session["current_section"] = next_section_idx
                            section = sections[next_section_idx]
                            
                            if section.get("type") == "coding":
                                # Send coding challenge
                                challenges = section.get("challenges", [])
                                if challenges:
                                    challenge = challenges[0]
                                    challenge_text = f"{challenge.get('title')}\n\n{challenge.get('description')}"
                                    
                                    await safe_send_json(websocket, {
                                        "type": "coding_challenge",
                                        "challenge": challenge,
                                        "starterCode": challenge.get("starterCode", ""),
                                        "timeLimit": challenge.get("timeLimit", 12)
                                    })
                                    logger.info("Coding challenge sent")
                            
                            elif section.get("type") == "behavioral":
                                questions = section.get("questions", [])
                                if questions:
                                    question = questions[0]
                                    q_text = question.get("question", "")
                                    q_audio = generate_speech(q_text)
                                    
                                    await safe_send_json(websocket, {
                                        "type": "behavioral_question",
                                        "question": q_text,
                                        "audio": q_audio,
                                        "timeLimit": question.get("timeLimit", 2)
                                    })
                                    logger.info("Behavioral question sent")
                            
                            elif section.get("type") == "closing":
                                closing_text = section.get("content", "Thank you for the interview!")
                                closing_audio = generate_speech(closing_text)
                                
                                await safe_send_json(websocket, {
                                    "type": "interview_closing",
                                    "text": closing_text,
                                    "audio": closing_audio
                                })
                                logger.info("Interview closing sent")
                        else:
                            # Interview complete
                            await safe_send_json(websocket, {
                                "type": "interview_complete",
                                "message": "Interview completed! Your responses will be reviewed by our AI system."
                            })
                            finalize_interview(applicationId, session_id, "completed", "normal_completion")
                            session_manager.end_session(session_id)
                            try:
                                await websocket.close()
                            except:
                                pass
                            break

                    elif msg_type == "code_submission":
                        code = message.get("code", "")
                        language = message.get("language", "javascript")
                        
                        # Execute code
                        result = execute_code(code, language, "4")
                        
                        # Evaluate solution
                        sections = interview_script.get("sections", [])
                        current_section = session.get("current_section", 0)
                        
                        problem_desc = ""
                        if current_section < len(sections):
                            section = sections[current_section]
                            challenges = section.get("challenges", [])
                            if challenges:
                                problem_desc = challenges[0].get("description", "")
                        
                        evaluation = evaluate_solution(code, language, problem_desc)
                        
                        await safe_send_json(websocket, {
                            "type": "code_evaluation",
                            "execution": result,
                            "evaluation": evaluation
                        })
                        logger.info(f"Code evaluated - Score: {evaluation.get('score', 0)}")

                    elif msg_type == "run_code":
                        code = message.get("code", "")
                        language = message.get("language", "javascript")
                        result = execute_code(code, language, "4")
                        
                        if "error" in result:
                            await safe_send_json(websocket, {
                                "type": "execution_result",
                                "error": result["error"]
                            })
                        else:
                            await safe_send_json(websocket, {
                                "type": "execution_result",
                                "output": result.get("output", ""),
                                "memory": result.get("memory", 0),
                                "cpuTime": result.get("cpuTime", 0)
                            })

                    elif msg_type == "proctor_event":
                        log_violation(session_id, message.get("event"), session_manager)

                    else:
                        await safe_send_json(websocket, {"type": "error", "message": "unsupported message type"})

                except WebSocketDisconnect:
                    logger.info(f"WebSocket disconnected during message loop: {session_id}")
                    break
                except json.JSONDecodeError:
                    logger.error("Invalid JSON received from client")
                    await safe_send_json(websocket, {"type": "error", "message": "Invalid JSON format"})
                except Exception as msg_error:
                    logger.error(f"Error processing message: {str(msg_error)}", exc_info=True)
                    await safe_send_json(websocket, {"type": "error", "message": f"Processing error: {str(msg_error)}"})


        except WebSocketDisconnect:
            logger.info(f"WebSocket disconnected: {session_id}")
            session_manager.end_session(session_id)
        except Exception as e:
            logger.error(f"Error in websocket loop: {str(e)}", exc_info=True)
            # Only try to send error if connection is still open
            try:
                await safe_send_json(websocket, {"type": "error", "message": str(e)})
                await websocket.close()
            except Exception as close_error:
                logger.error(f"Error closing websocket: {str(close_error)}")
            finally:
                session_manager.end_session(session_id)
    
    except Exception as e:
        logger.error(f"Unexpected error in websocket handler: {str(e)}", exc_info=True)
        # Try to close connection gracefully
        try:
            await websocket.close()
        except Exception as close_error:
            logger.error(f"Error closing websocket in outer handler: {str(close_error)}")
        finally:
            session_manager.end_session(session_id)
