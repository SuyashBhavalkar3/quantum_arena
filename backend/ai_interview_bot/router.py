from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import json
import logging
from datetime import datetime

from applications.models import Application, ApplicationStatus
from authentication.database import SessionLocal
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


# ── Helpers ──────────────────────────────────────────────────────────────────

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
        feedback["response_count"] = len([i for i in transcript if i.get("speaker") == "candidate"])
        application.interview_feedback = feedback
        application.interview_transcript = transcript
        application.status = ApplicationStatus.INTERVIEW_COMPLETED
        db.commit()
    finally:
        db.close()
    asyncio.create_task(generate_candidate_report_background(application_id))


async def safe_send_json(websocket: WebSocket, data: dict) -> bool:
    """Send JSON. Returns False if the socket is already closed."""
    try:
        await websocket.send_json(data)
        return True
    except Exception as e:
        logger.error(f"Error sending JSON to websocket: {e}")
        return False


async def close_websocket(websocket: WebSocket):
    try:
        await websocket.close()
    except Exception:
        pass


# ── REST endpoint ─────────────────────────────────────────────────────────────

@router.get("/interview/script/{session_id}")
async def get_interview_script(session_id: str):
    session = session_manager.get_session(session_id)
    if not session:
        return {"error": "Session not found"}
    script = session.get("interview_script", {})
    return {
        "script": script,
        "progress": {
            "currentSection": session.get("current_section", 0),
            "currentQuestion": session.get("current_question", 0),
            "elapsedTime": session.get("elapsed_time", 0),
        },
    }


# ── WebSocket handler ─────────────────────────────────────────────────────────

@router.websocket("/ws/interview/{session_id}")
async def interview_websocket(
    websocket: WebSocket,
    session_id: str,
    position: str = "Engineer",
    company: str = "Tech Company",
    applicationId: int | None = None,
):
    # ── 1. Accept immediately ─────────────────────────────────────────────────
    await websocket.accept()
    logger.info(f"WS accepted: session={session_id} role={position}")

    ws_closed = False

    # ── 2. Send keepalive ping RIGHT AWAY ────────────────────────────────────
    # Render's reverse proxy kills WebSocket if no data flows within ~30s.
    # This frame keeps the connection alive while we run slow LLM calls.
    await safe_send_json(websocket, {"type": "connecting", "message": "Preparing your interview..."})

    # ── Helpers scoped to this handler ───────────────────────────────────────
    async def end_session_and_close(status: str, reason: str):
        nonlocal ws_closed
        finalize_interview(applicationId, session_id, status, reason)
        session_manager.end_session(session_id)
        if not ws_closed:
            ws_closed = True
            await close_websocket(websocket)

    try:
        session = session_manager.create_session(session_id)
        session["position"] = position
        session["company"] = company

        # ── 3. Fetch job config (non-blocking) ───────────────────────────────
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

        # ── 4. Generate interview script in thread (avoids blocking event loop)
        try:
            interview_script = await asyncio.to_thread(
                generate_interview_script, position, company,
                interview_config=interview_config
            )
            session["interview_script"] = interview_script
            logger.info(f"Script ready: {len(interview_script.get('sections', []))} sections")

            await safe_send_json(websocket, {
                "type": "interview_started",
                "script": interview_script,
                "totalDuration": interview_script.get("totalDuration", 45),
                "message": f"Welcome! This is a {interview_script.get('totalDuration', 45)}-minute interview for {position}.",
            })

        except Exception as e:
            logger.error(f"Script generation failed: {e}", exc_info=True)
            await safe_send_json(websocket, {"type": "error", "message": f"Failed to generate interview script: {e}"})
            await end_session_and_close("error", "script_generation_failed")
            return

        # ── 5. Generate greeting in thread ───────────────────────────────────
        try:
            greeting = await asyncio.to_thread(adaptive_bot.generate_greeting, position, company)
            greeting_audio = await asyncio.to_thread(generate_speech, greeting)
            session["current_stage"] = "greeting"
            session_manager.add_transcript(session_id, "bot", greeting)
            await safe_send_json(websocket, {
                "type": "section_started",
                "section": "Greeting",
                "text": greeting,
                "audio": greeting_audio,
                "stage": "greeting",
            })
            logger.info("Greeting sent")
        except Exception as e:
            logger.error(f"Greeting generation failed: {e}", exc_info=True)
            # Non-fatal — continue to message loop

        # ── 6. Main message loop ──────────────────────────────────────────────
        while not ws_closed:
            try:
                data = await websocket.receive_text()
            except WebSocketDisconnect:
                logger.info(f"Client disconnected: {session_id}")
                ws_closed = True
                session_manager.end_session(session_id)
                break
            except RuntimeError as e:
                logger.info(f"WS receive stopped ({session_id}): {e}")
                ws_closed = True
                session_manager.end_session(session_id)
                break

            try:
                message = json.loads(data)
            except json.JSONDecodeError:
                await safe_send_json(websocket, {"type": "error", "message": "Invalid JSON format"})
                continue

            msg_type = message.get("type")
            logger.info(f"Received: {msg_type}")

            # ── candidate_response ────────────────────────────────────────────
            if msg_type == "candidate_response":
                response_text = message.get("text", "")
                session_manager.add_transcript(session_id, "candidate", response_text)

                bot_response = await asyncio.to_thread(
                    adaptive_bot.generate_next_question,
                    session=session,
                    candidate_response=response_text,
                    position=position,
                    company=company,
                    interview_config=interview_config,
                )

                action = bot_response.get("action", "continue")
                bot_message = bot_response.get("message", "")

                if action == "end_interview":
                    session_manager.add_transcript(session_id, "bot", bot_message)
                    await safe_send_json(websocket, {
                        "type": "interview_ended",
                        "text": bot_message,
                        "reason": bot_response.get("reason", "candidate_declined"),
                    })
                    await end_session_and_close("completed", bot_response.get("reason", "candidate_declined"))
                    break

                elif action == "escalate_to_human":
                    session_manager.add_transcript(session_id, "bot", bot_message)
                    await safe_send_json(websocket, {
                        "type": "human_intervention_required",
                        "text": bot_message,
                        "reason": bot_response.get("reason", "human_requested"),
                    })
                    session["requires_human"] = True

                else:
                    next_stage = bot_response.get("next_stage")
                    if next_stage:
                        session["current_stage"] = next_stage
                    bot_audio = await asyncio.to_thread(generate_speech, bot_message)
                    session_manager.add_transcript(session_id, "bot", bot_message)
                    await safe_send_json(websocket, {
                        "type": "follow_up_question",
                        "text": bot_message,
                        "audio": bot_audio,
                        "stage": next_stage,
                        "metadata": bot_response.get("metadata", {}),
                    })

            # ── move_to_next_section ──────────────────────────────────────────
            elif msg_type == "move_to_next_section":
                current = session.get("current_section", 0)
                sections = interview_script.get("sections", [])
                next_idx = current + 1

                if next_idx < len(sections):
                    session["current_section"] = next_idx
                    section = sections[next_idx]

                    if section.get("type") == "coding":
                        challenges = section.get("challenges", [])
                        if challenges:
                            await safe_send_json(websocket, {
                                "type": "coding_challenge",
                                "challenge": challenges[0],
                                "starterCode": challenges[0].get("starterCode", ""),
                                "timeLimit": challenges[0].get("timeLimit", 12),
                            })

                    elif section.get("type") == "behavioral":
                        questions = section.get("questions", [])
                        if questions:
                            q_text = questions[0].get("question", "")
                            q_audio = await asyncio.to_thread(generate_speech, q_text)
                            await safe_send_json(websocket, {
                                "type": "behavioral_question",
                                "question": q_text,
                                "audio": q_audio,
                                "timeLimit": questions[0].get("timeLimit", 2),
                            })

                    elif section.get("type") == "closing":
                        closing_text = section.get("content", "Thank you for the interview!")
                        closing_audio = await asyncio.to_thread(generate_speech, closing_text)
                        await safe_send_json(websocket, {
                            "type": "interview_closing",
                            "text": closing_text,
                            "audio": closing_audio,
                        })
                else:
                    await safe_send_json(websocket, {
                        "type": "interview_complete",
                        "message": "Interview completed! Your responses will be reviewed by our AI system.",
                    })
                    await end_session_and_close("completed", "normal_completion")
                    break

            # ── code_submission ───────────────────────────────────────────────
            elif msg_type == "code_submission":
                code = message.get("code", "")
                language = message.get("language", "javascript")
                result = await asyncio.to_thread(execute_code, code, language, "4")

                sections = interview_script.get("sections", [])
                current_section = session.get("current_section", 0)
                problem_desc = ""
                if current_section < len(sections):
                    challenges = sections[current_section].get("challenges", [])
                    if challenges:
                        problem_desc = challenges[0].get("description", "")

                evaluation = await asyncio.to_thread(evaluate_solution, code, language, problem_desc)
                await safe_send_json(websocket, {
                    "type": "code_evaluation",
                    "execution": result,
                    "evaluation": evaluation,
                })

            # ── run_code ──────────────────────────────────────────────────────
            elif msg_type == "run_code":
                code = message.get("code", "")
                language = message.get("language", "javascript")
                result = await asyncio.to_thread(execute_code, code, language, "4")
                if "error" in result:
                    await safe_send_json(websocket, {"type": "execution_result", "error": result["error"]})
                else:
                    await safe_send_json(websocket, {
                        "type": "execution_result",
                        "output": result.get("output", ""),
                        "memory": result.get("memory", 0),
                        "cpuTime": result.get("cpuTime", 0),
                    })

            # ── proctor_event ─────────────────────────────────────────────────
            elif msg_type == "proctor_event":
                log_violation(session_id, message.get("event"), session_manager)

            # ── keepalive ping from client ────────────────────────────────────
            elif msg_type == "ping":
                await safe_send_json(websocket, {"type": "pong"})

            else:
                await safe_send_json(websocket, {"type": "error", "message": "Unsupported message type"})

    except WebSocketDisconnect:
        logger.info(f"WS disconnected (outer): {session_id}")
        session_manager.end_session(session_id)
    except Exception as e:
        logger.error(f"Unexpected WS error: {e}", exc_info=True)
        if not ws_closed:
            await safe_send_json(websocket, {"type": "error", "message": str(e)})
            await close_websocket(websocket)
        session_manager.end_session(session_id)
