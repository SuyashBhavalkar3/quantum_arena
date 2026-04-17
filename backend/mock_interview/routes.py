"""
Mock Interview Routes
======================
GET  /mock/companies           — Autocomplete list of popular companies
POST /mock/start               — Fetch company intel, generate script, create session
WS   /ws/mock/{session_id}     — Voice-only interview session (Sarvam TTS + Web Speech)
POST /mock/{session_id}/scorecard — Generate & return scorecard after session ends
"""

import json
import uuid
import logging
import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import Optional

from .company_intel_service import get_company_intel, get_popular_companies
from .mock_interview_script import generate_mock_script, get_adaptive_followup
from .scorecard import generate_scorecard
from ai_interview_bot.services.sarvam_service import generate_speech
from ai_interview_bot.services.interview_session import SessionManager

router = APIRouter(tags=["Mock Interview"])
logger = logging.getLogger(__name__)
session_manager = SessionManager()


# ─── GET: Company autocomplete ────────────────────────────────────────────────

@router.get("/mock/companies")
def mock_companies(q: Optional[str] = Query(None)):
    companies = get_popular_companies()
    if q:
        companies = [c for c in companies if q.lower() in c.lower()]
    return {"companies": companies}


# ─── POST: Start a mock session ───────────────────────────────────────────────

@router.post("/mock/start")
def start_mock_session(company: str, role: str):
    """
    Fetches company intel, generates interview script, creates a session.
    Returns session_id for the WebSocket connection.
    """
    company = company.strip()
    role = role.strip()

    try:
        intel = get_company_intel(company)
    except Exception as e:
        logger.warning(f"Intel fetch failed for {company}: {e}")
        intel = {"company": company, "tech_stack": [], "culture_keywords": [],
                  "interview_format": "standard", "known_question_types": [], "recent_highlights": []}

    try:
        script = generate_mock_script(intel, role)
    except Exception as e:
        logger.error(f"Script generation failed: {e}")
        return {"error": f"Could not generate interview script: {str(e)}"}, 500

    session_id = str(uuid.uuid4())
    session = session_manager.create_session(session_id)
    session["mock_script"] = script
    session["company_intel"] = intel
    session["company"] = company
    session["role"] = role
    session["current_round_idx"] = 0
    session["current_question_idx"] = 0
    session["mock_transcript"] = []

    # Preview for UI
    rounds_preview = [
        {
            "round_type": r["round_type"],
            "title": r["title"],
            "duration_minutes": r["duration_minutes"],
            "question_count": len(r.get("questions", [])),
        }
        for r in script.get("rounds", [])
    ]

    return {
        "session_id": session_id,
        "company": company,
        "role": role,
        "total_duration_minutes": script.get("total_duration_minutes", 45),
        "rounds_preview": rounds_preview,
    }


# ─── WebSocket: Voice-only mock interview ────────────────────────────────────

async def safe_send(ws: WebSocket, data: dict) -> bool:
    try:
        await ws.send_json(data)
        return True
    except Exception as e:
        logger.error(f"WS send error: {e}")
        return False


@router.websocket("/ws/mock/{session_id}")
async def mock_interview_ws(websocket: WebSocket, session_id: str):
    await websocket.accept()
    session = session_manager.get_session(session_id)

    if not session:
        await websocket.send_json({"type": "error", "message": "Session not found. Call /mock/start first."})
        await websocket.close()
        return

    script = session.get("mock_script", {})
    company = session.get("company", "Company")
    role = session.get("role", "Engineer")
    rounds = script.get("rounds", [])

    def get_current_question() -> Optional[dict]:
        r_idx = session.get("current_round_idx", 0)
        q_idx = session.get("current_question_idx", 0)
        if r_idx < len(rounds):
            qs = rounds[r_idx].get("questions", [])
            if q_idx < len(qs):
                return qs[q_idx]
        return None

    def get_current_round() -> Optional[dict]:
        r_idx = session.get("current_round_idx", 0)
        if r_idx < len(rounds):
            return rounds[r_idx]
        return None

    try:
        # ── Opening greeting ──
        greeting = (
            f"Welcome to your mock interview for the {role} position. "
            f"This will be a {script.get('total_duration_minutes', 45)}-minute session. "
            f"We'll cover {len(rounds)} rounds. Let's begin!"
        )
        greeting_audio = generate_speech(greeting)
        session_manager.add_transcript(session_id, "bot", greeting)
        await safe_send(websocket, {
            "type": "mock_started",
            "text": greeting,
            "audio": greeting_audio,
            "rounds": [{"round_type": r["round_type"], "title": r["title"]} for r in rounds],
        })

        # ── Send first round intro + first question ──
        current_round = get_current_round()
        current_q = get_current_question()

        if current_round and current_q:
            round_intro = f"Starting the {current_round['title']}."
            q_text = current_q["text"]
            full_msg = f"{round_intro} {q_text}"
            audio = generate_speech(full_msg)
            session_manager.add_transcript(session_id, "bot", full_msg)
            await safe_send(websocket, {
                "type": "question",
                "text": q_text,
                "audio": audio,
                "round_type": current_round["round_type"],
                "round_title": current_round["title"],
                "difficulty": current_q.get("difficulty", "medium"),
                "question_id": current_q.get("id"),
                "round_idx": session.get("current_round_idx", 0),
                "question_idx": session.get("current_question_idx", 0),
                "total_rounds": len(rounds),
                "total_questions_in_round": len(current_round.get("questions", [])),
            })

        # ── Main loop ──
        while True:
            try:
                data = await websocket.receive_text()
                try:
                    message = json.loads(data)
                except json.JSONDecodeError:
                    message = {"type": "candidate_answer", "text": data}
                    
                msg_type = message.get("type", "candidate_answer")

                if msg_type == "candidate_answer":
                    answer_text = message.get("text", "") or message.get("content", "") or message.get("message", "")
                    if not answer_text:
                        answer_text = ""
                    session_manager.add_transcript(session_id, "candidate", answer_text)
                    session["mock_transcript"].append({
                        "speaker": "candidate",
                        "text": answer_text,
                        "question_id": get_current_question().get("id") if get_current_question() else None,
                    })

                    # Check for adaptive follow-up
                    current_q = get_current_question()
                    followup = ""
                    if current_q and answer_text:
                        followup = get_adaptive_followup(current_q, answer_text, session.get("company_intel", {}))

                    if followup:
                        # Send follow-up question
                        fu_audio = generate_speech(followup)
                        session_manager.add_transcript(session_id, "bot", followup)
                        await safe_send(websocket, {
                            "type": "followup_question",
                            "text": followup,
                            "audio": fu_audio,
                        })
                    else:
                        # Advance to next question
                        r_idx = session.get("current_round_idx", 0)
                        q_idx = session.get("current_question_idx", 0)
                        current_round_obj = rounds[r_idx] if r_idx < len(rounds) else None
                        total_qs = len(current_round_obj.get("questions", [])) if current_round_obj else 0

                        if q_idx + 1 < total_qs:
                            # Next question in same round
                            session["current_question_idx"] = q_idx + 1
                            new_q = get_current_question()
                            if new_q:
                                msg = new_q["text"]
                                audio = generate_speech(msg)
                                session_manager.add_transcript(session_id, "bot", msg)
                                await safe_send(websocket, {
                                    "type": "question",
                                    "text": msg,
                                    "audio": audio,
                                    "round_type": current_round_obj["round_type"],
                                    "round_title": current_round_obj["title"],
                                    "difficulty": new_q.get("difficulty", "medium"),
                                    "question_id": new_q.get("id"),
                                    "round_idx": r_idx,
                                    "question_idx": session["current_question_idx"],
                                    "total_rounds": len(rounds),
                                    "total_questions_in_round": total_qs,
                                })
                        elif r_idx + 1 < len(rounds):
                            # Move to next round
                            session["current_round_idx"] = r_idx + 1
                            session["current_question_idx"] = 0
                            new_round = rounds[session["current_round_idx"]]
                            new_q = get_current_question()

                            transition = f"Great! Now let's move to the {new_round['title']}."
                            if new_q:
                                full_msg = f"{transition} {new_q['text']}"
                                audio = generate_speech(full_msg)
                                session_manager.add_transcript(session_id, "bot", full_msg)
                                await safe_send(websocket, {
                                    "type": "round_transition",
                                    "text": new_q["text"],
                                    "audio": audio,
                                    "round_type": new_round["round_type"],
                                    "round_title": new_round["title"],
                                    "difficulty": new_q.get("difficulty", "medium"),
                                    "question_id": new_q.get("id"),
                                    "round_idx": session["current_round_idx"],
                                    "question_idx": 0,
                                    "total_rounds": len(rounds),
                                    "total_questions_in_round": len(new_round.get("questions", [])),
                                })
                        else:
                            # All rounds complete — generate scorecard
                            closing = "Excellent! That concludes your mock interview. Generating your scorecard now..."
                            closing_audio = generate_speech(closing)
                            session_manager.add_transcript(session_id, "bot", closing)
                            await safe_send(websocket, {
                                "type": "session_ending",
                                "text": closing,
                                "audio": closing_audio,
                            })

                            # Generate scorecard
                            full_transcript = session.get("mock_transcript", [])
                            try:
                                scorecard = generate_scorecard(full_transcript, script)
                            except Exception as e:
                                logger.error(f"Generate scorecard failed: {e}")
                                scorecard = {"error": "Failed to generate full scorecard, connection dropped.", "partial": True}

                            await safe_send(websocket, {
                                "type": "scorecard",
                                "scorecard": scorecard,
                            })
                            session_manager.end_session(session_id)
                            await websocket.close()
                            break

                elif msg_type == "end_session":
                    # Manual end — generate scorecard
                    full_transcript = session.get("mock_transcript", [])
                    try:
                        scorecard = generate_scorecard(full_transcript, script)
                    except Exception as e:
                        logger.error(f"Generate scorecard failed on manual end: {e}", exc_info=True)
                        scorecard = {
                            "per_question_scores": [],
                            "overall_readiness_percent": 0,
                            "round_scores": {"intro": 0, "dsa": 0, "system_design": 0, "behavioral": 0},
                            "top3_improvement_areas": ["Session ended early — scorecard incomplete"],
                            "strengths": [],
                            "hiring_likelihood": "maybe",
                            "overall_feedback": "Could not generate scorecard for this session.",
                            "partial": True,
                        }
                    await safe_send(websocket, {"type": "scorecard", "scorecard": scorecard})
                    session_manager.end_session(session_id)
                    await websocket.close()
                    break

            except WebSocketDisconnect:
                logger.info(f"Mock WS disconnected: {session_id}")
                session_manager.end_session(session_id)
                break
            except Exception as e:
                logger.error(f"Mock WS message error: {e}", exc_info=True)
                await safe_send(websocket, {"type": "error", "message": str(e)})

    except WebSocketDisconnect:
        session_manager.end_session(session_id)
    except Exception as e:
        logger.error(f"Mock WS fatal error: {e}", exc_info=True)
        try:
            await websocket.close()
        except Exception:
            pass
        session_manager.end_session(session_id)
