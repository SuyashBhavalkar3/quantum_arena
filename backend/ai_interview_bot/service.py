import os
import base64
import logging
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# configure OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
logger = logging.getLogger(__name__)


def evaluate_response(session: dict) -> str:
    """Use the LLM to decide the next question given the current session state.

    Session transcript entries should contain speaker and message.  This function
    builds a chat conversation for the model, instructs it to behave like a
    recruiter, and returns the assistant's next utterance.
    """
    # prepare conversation messages based on transcript history
    messages = []
    system_prompt = (
        "You are a professional technical recruiter conducting an interview. "
        "Based on the candidate's previous answers, either ask a follow-up question "
        "or move the conversation forward to the next stage. Only one question or "
        "comment should be provided at a time. Do not provide code or explanations unless asked."
    )
    messages.append({"role": "system", "content": system_prompt})

    transcript = session.get("transcript", [])
    
    # If no transcript yet, ask for the initial question
    if not transcript:
        messages.append({
            "role": "user",
            "content": "Please ask the first technical interview question to assess the candidate's skills."
        })
        logger.info("Generating initial interview question")
    else:
        for entry in transcript:
            role = "assistant" if entry["speaker"] == "bot" else "user"
            messages.append({"role": role, "content": entry["message"]})

    try:
        logger.info(f"Calling GPT with {len(messages)} messages")
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages
        )
        response = completion.choices[0].message.content
        logger.info(f"GPT response: {response}")
        return response
    except Exception as e:
        logger.error(f"[LLM evaluate error] {e}", exc_info=True)
        return "I'm sorry, I encountered an error and cannot continue the interview. Please try again later."