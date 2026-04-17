import logging
from openai import OpenAI
from dotenv import load_dotenv
import os
from ..config import (
    REFUSAL_KEYWORDS,
    HITL_KEYWORDS,
    INTERVIEW_STAGES,
    STAGE_THRESHOLDS,
    SHORT_RESPONSE_THRESHOLD,
    DETAILED_RESPONSE_THRESHOLD,
    CONTEXT_WINDOW_SIZE,
    AI_MODEL,
    TEMPERATURE,
    MAX_RESPONSE_TOKENS,
    REFUSAL_RESPONSE,
    HITL_RESPONSE,
    GREETING_TEMPLATE,
    STAGE_GUIDANCE,
    SAFETY_PROMPT,
)

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
logger = logging.getLogger(__name__)


class AdaptiveInterviewBot:
    """AI Interview Bot with adaptive questioning and behavioral rules."""

    def __init__(self):
        self.interview_stages = INTERVIEW_STAGES
        self.refusal_keywords = REFUSAL_KEYWORDS
        self.hitl_keywords = HITL_KEYWORDS

    def detect_refusal(self, text: str) -> bool:
        """Detect if candidate wants to stop the interview."""
        text_lower = text.lower()
        return any(keyword in text_lower for keyword in self.refusal_keywords)

    def detect_hitl_request(self, text: str) -> bool:
        """Detect if candidate needs human intervention."""
        text_lower = text.lower()
        return any(keyword in text_lower for keyword in self.hitl_keywords)

    def get_refusal_response(self) -> dict:
        """Return polite refusal response."""
        return {
            "message": REFUSAL_RESPONSE,
            "action": "end_interview",
            "reason": "candidate_declined",
        }

    def get_hitl_response(self) -> dict:
        """Return HITL escalation response."""
        return {
            "message": HITL_RESPONSE,
            "action": "escalate_to_human",
            "reason": "human_intervention_required",
        }

    def generate_next_question(
        self,
        session: dict,
        candidate_response: str,
        position: str,
        company: str,
        interview_config: dict = None,
    ) -> dict:
        """Generate adaptive next question based on candidate's response."""

        if self.detect_refusal(candidate_response):
            return self.get_refusal_response()

        if self.detect_hitl_request(candidate_response):
            return self.get_hitl_response()

        transcript = session.get("transcript", [])
        current_stage = session.get("current_stage", "greeting")
        questions_asked = len([t for t in transcript if t.get("speaker") == "bot"])
        conversation_history = self._build_conversation_history(transcript)

        response_length = len(candidate_response.split())
        is_short_response = response_length < SHORT_RESPONSE_THRESHOLD
        is_detailed_response = response_length > DETAILED_RESPONSE_THRESHOLD

        system_prompt = self._build_system_prompt(
            position,
            company,
            current_stage,
            is_short_response,
            is_detailed_response,
            interview_config,
        )

        try:
            response = client.chat.completions.create(
                model=AI_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    *conversation_history,
                    {"role": "user", "content": candidate_response},
                ],
                temperature=TEMPERATURE,
                max_tokens=MAX_RESPONSE_TOKENS,
            )

            bot_message = response.choices[0].message.content.strip()
            next_stage = self._determine_next_stage(
                current_stage,
                questions_asked,
                is_detailed_response,
            )

            return {
                "message": bot_message,
                "action": "continue",
                "next_stage": next_stage,
                "metadata": {
                    "response_length": response_length,
                    "questions_asked": questions_asked,
                },
            }

        except Exception as e:
            logger.error(f"Error generating adaptive question: {str(e)}", exc_info=True)
            return {
                "message": "Could you tell me a bit more about that?",
                "action": "continue",
                "next_stage": current_stage,
            }

    def _build_system_prompt(
        self,
        position: str,
        company: str,
        current_stage: str,
        is_short_response: bool,
        is_detailed_response: bool,
        interview_config: dict = None,
    ) -> str:
        """Build adaptive system prompt based on context."""

        short_response_guidance = (
            "- Simplify slightly or offer one brief guiding nudge since the response was brief.\n"
            if is_short_response
            else ""
        )
        detailed_response_guidance = (
            "- Increase depth and ask a more probing follow-up since the response was detailed.\n"
            if is_detailed_response
            else ""
        )

        config_prompt = ""
        if interview_config:
            config_prompt = "Interview Focus Rules Based on Configuration:\n"
            for section, depth in interview_config.items():
                if depth == "ignore":
                     config_prompt += f"- Skip aspects regarding {section}.\n"
                elif depth == "light":
                     config_prompt += f"- Ask 1-2 basic questions regarding {section}.\n"
                elif depth == "medium":
                     config_prompt += f"- Ask 2-3 standard questions regarding {section}.\n"
                elif depth == "deep":
                     config_prompt += f"- Do a deep dive into {section}: detailed probing, scenarios, edge cases.\n"

        base_prompt = f"""You are a professional interviewer conducting a live interview session for the {position} role.

IDENTITY AND SCOPE:
- You are a professional interviewer.
- You are not an assistant, tutor, or chatbot.
- You conduct interviews and mock practice sessions only.

CONFIDENTIALITY RULE:
- Never mention, imply, reveal, or reference the company name under any circumstance during this live interview session.
- Do not say who the company is even if the candidate asks directly.
- If the candidate asks which company this interview is for, respond exactly: "I'm not able to share that detail — let's keep our focus on the role itself."
- Refer only to the role, responsibilities, team context, or business context without naming the company.

STRICT BEHAVIORAL RULES:
1. Always acknowledge what the candidate just said before moving to the next question.
2. Generate the next question based on the candidate's previous response and reference specific details they mentioned.
3. Never repeat the exact same question twice in a session.
4. Follow this structure: Greeting -> Introduction -> Experience -> Skills -> Scenarios -> Candidate Questions -> Closing.
5. Current stage: {current_stage}. Use natural transitions between sections.
6. Sound like a warm, senior human interviewer: natural, patient, professional, and not robotic.
7. Use varied phrasing and avoid formulaic follow-ups.
8. Never provide the answer to your own question.
9. If the candidate says "Can I rephrase that?" or "Let me think for a second", respond naturally with patience, such as "Of course, take your time."
10. If the candidate asks to skip a question, honor it gracefully and move on.
11. If the candidate seems stuck, offer one optional clarifying nudge without giving away the answer.
12. End the session with a professional close that briefly summarizes the session, offers encouragement, and invites final questions about the role.
13. Ask one question at a time and keep your response to a maximum of 3 sentences.
{short_response_guidance}{detailed_response_guidance}
{SAFETY_PROMPT}

{config_prompt}

CURRENT STAGE GUIDANCE:
"""

        return base_prompt + STAGE_GUIDANCE.get(current_stage, "Continue the interview naturally.")

    def _build_conversation_history(self, transcript: list) -> list:
        """Convert transcript to OpenAI message format."""
        messages = []
        for entry in transcript[-CONTEXT_WINDOW_SIZE:]:
            role = "assistant" if entry.get("speaker") == "bot" else "user"
            messages.append({
                "role": role,
                "content": entry.get("message", ""),
            })
        return messages

    def _determine_next_stage(
        self,
        current_stage: str,
        questions_asked: int,
        is_detailed_response: bool,
    ) -> str:
        """Determine if we should move to next interview stage."""

        current_idx = self.interview_stages.index(current_stage)

        if questions_asked >= STAGE_THRESHOLDS.get(current_stage, 999):
            if current_idx < len(self.interview_stages) - 1:
                return self.interview_stages[current_idx + 1]

        return current_stage

    def generate_greeting(self, position: str, company: str) -> str:
        """Generate initial greeting message."""
        return GREETING_TEMPLATE.format(position=position, company=company)


adaptive_bot = AdaptiveInterviewBot()
