"""
Beyond Presence Avatar Session Router
GET /avatar/session  — creates a Beyond Presence call and returns LiveKit credentials.
"""

import os
import httpx
from fastapi import APIRouter

router = APIRouter(prefix="/avatar", tags=["avatar"])

BEYOND_API_BASE = "https://api.bey.dev/v1"


def _get_env() -> tuple[str | None, str | None]:
    """Return (api_key, agent_or_avatar_id) from environment."""
    api_key = os.getenv("BEYOND_PRESENCE_API_KEY") or os.getenv("BEYOND_API_KEY")
    # Prefer AGENT_ID; fall back to AVATAR_ID (user may use either)
    agent_id = (
        os.getenv("AGENT_ID")
        or os.getenv("BEYOND_AGENT_ID")
        or os.getenv("AVATAR_ID")
    )
    return api_key, agent_id


@router.get("/session")
async def get_avatar_session():
    """
    Create a Beyond Presence call session and return normalised credentials.

    Response shape:
    {
        "session_id":    str | None,
        "livekit_url":   str | None,   # wss://... — connect LiveKit client here
        "livekit_token": str | None,   # JWT for the LiveKit room
        "embed_url":     str | None,   # if ever provided by future API versions
        "stream_url":    str | None,   # if ever provided by future API versions
        "error":         str | None,   # set only when something went wrong
        "raw":           dict          # original Beyond Presence response
    }
    Frontend should: use livekit_url+token → else embed_url → else stream_url → else fallback mp4.
    """
    api_key, agent_id = _get_env()

    # ── Guard: missing config ─────────────────────────────────────────────────
    if not api_key:
        return {
            "session_id": None,
            "livekit_url": None,
            "livekit_token": None,
            "embed_url": None,
            "stream_url": None,
            "error": "BEYOND_PRESENCE_API_KEY not configured",
            "raw": {},
        }

    if not agent_id:
        return {
            "session_id": None,
            "livekit_url": None,
            "livekit_token": None,
            "embed_url": None,
            "stream_url": None,
            "error": "AGENT_ID / AVATAR_ID not configured",
            "raw": {},
        }

    # ── Call Beyond Presence: POST /v1/calls ─────────────────────────────────
    headers = {
        "x-api-key": api_key,
        "Content-Type": "application/json",
    }
    payload = {
        "agent_id": agent_id,
        "livekit_username": "Candidate",
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                f"{BEYOND_API_BASE}/calls",
                headers=headers,
                json=payload,
            )

        raw: dict = {}
        try:
            raw = resp.json()
        except Exception:
            raw = {"body": resp.text}

        if resp.status_code not in (200, 201):
            return {
                "session_id": None,
                "livekit_url": None,
                "livekit_token": None,
                "embed_url": None,
                "stream_url": None,
                "error": f"Beyond Presence API returned {resp.status_code}: {raw}",
                "raw": raw,
            }

        # ── Safely extract known fields ───────────────────────────────────────
        return {
            "session_id":    raw.get("id"),
            "livekit_url":   raw.get("livekit_url"),
            "livekit_token": raw.get("livekit_token"),
            # Future-proofing — not returned today but safe to check
            "embed_url":     raw.get("embed_url"),
            "stream_url":    raw.get("stream_url"),
            "error":         None,
            "raw":           raw,
        }

    except httpx.TimeoutException:
        return {
            "session_id": None,
            "livekit_url": None,
            "livekit_token": None,
            "embed_url": None,
            "stream_url": None,
            "error": "Request to Beyond Presence timed out",
            "raw": {},
        }
    except Exception as exc:
        return {
            "session_id": None,
            "livekit_url": None,
            "livekit_token": None,
            "embed_url": None,
            "stream_url": None,
            "error": str(exc),
            "raw": {},
        }
