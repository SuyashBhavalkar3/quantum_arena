"""
Adaptive Interview Bot Configuration
Customize bot behavior, keywords, and thresholds here.
"""

# ============================================================================
# BEHAVIORAL KEYWORDS
# ============================================================================

# Keywords that indicate candidate wants to stop the interview
REFUSAL_KEYWORDS = [
    "don't want",
    "not interested",
    "stop interview",
    "exit",
    "quit",
    "cancel",
    "end interview",
    "leave",
    "discontinue",
    "withdraw",
]

# Keywords that indicate need for human intervention
HITL_KEYWORDS = [
    "human recruiter",
    "speak to human",
    "real person",
    "complaint",
    "technical issue",
    "problem with",
    "not working",
    "speak to someone",
    "talk to manager",
    "escalate",
    "help me",
]

# ============================================================================
# INTERVIEW STAGES
# ============================================================================

# Interview flow stages in order
INTERVIEW_STAGES = [
    "greeting",
    "introduction",
    "experience",
    "skills",
    "scenarios",
    "candidate_questions",
    "closing"
]

# Number of questions before advancing to next stage
STAGE_THRESHOLDS = {
    "greeting": 1,
    "introduction": 2,
    "experience": 5,
    "skills": 8,
    "scenarios": 11,
    "candidate_questions": 13,
    "closing": 15
}

# ============================================================================
# RESPONSE ANALYSIS
# ============================================================================

# Word count thresholds for response classification
SHORT_RESPONSE_THRESHOLD = 20   # Words
DETAILED_RESPONSE_THRESHOLD = 80  # Words

# Context window (number of previous messages to consider)
CONTEXT_WINDOW_SIZE = 10

# ============================================================================
# AI MODEL CONFIGURATION
# ============================================================================

# OpenAI model to use
AI_MODEL = "gpt-4o-mini"

# Temperature for response generation (0.0 - 1.0)
# Lower = more focused, Higher = more creative
TEMPERATURE = 0.7

# Maximum tokens for bot response
MAX_RESPONSE_TOKENS = 200

# ============================================================================
# INTERVIEW TIMING
# ============================================================================

# Default interview duration (minutes)
DEFAULT_INTERVIEW_DURATION = 45

# Time allocation per stage (minutes)
STAGE_DURATIONS = {
    "greeting": 2,
    "introduction": 5,
    "experience": 15,
    "skills": 10,
    "scenarios": 8,
    "candidate_questions": 3,
    "closing": 2
}

# ============================================================================
# RESPONSE TEMPLATES
# ============================================================================

# Refusal response template
REFUSAL_RESPONSE = (
    "Thank you for your time. I completely understand. "
    "If you would like to continue in the future, feel free to reconnect. "
    "Have a great day."
)

# HITL response template
HITL_RESPONSE = (
    "I'll connect you with a human recruiter who can assist you further."
)

# Greeting template
GREETING_TEMPLATE = (
    "Hello, and welcome. I'll be guiding this interview for the {position} role today. "
    "We'll keep the conversation focused on your experience, how you approach problems, "
    "and how you think about the work. To start, could you introduce yourself and share a bit about your background?"
)

# ============================================================================
# STAGE-SPECIFIC GUIDANCE
# ============================================================================

STAGE_GUIDANCE = {
    "greeting": (
        "Welcome the candidate warmly and ask them to introduce themselves."
    ),
    "introduction": (
        "Ask about their background and what interests them about this role."
    ),
    "experience": (
        "Dig into their work experience, projects, and achievements. "
        "Ask follow-ups based on their answers."
    ),
    "skills": (
        "Assess technical and soft skills relevant to the position. "
        "Ask specific questions."
    ),
    "scenarios": (
        "Present hypothetical problems or scenarios to assess problem-solving ability."
    ),
    "candidate_questions": (
        "Invite the candidate to ask questions about the role. "
        "If they ask which company this interview is for, respond exactly: "
        "\"I'm not able to share that detail — let's keep our focus on the role itself.\""
    ),
    "closing": (
        "Thank them, explain next steps, and end professionally."
    )
}

# ============================================================================
# SAFETY & COMPLIANCE
# ============================================================================

# Topics to avoid (discriminatory questions)
PROHIBITED_TOPICS = [
    "age",
    "race",
    "ethnicity",
    "religion",
    "marital status",
    "pregnancy",
    "family plans",
    "disabilities",
    "national origin",
    "sexual orientation",
    "gender identity",
]

# Safety prompt addition
SAFETY_PROMPT = (
    "Never ask discriminatory questions about age, race, religion, "
    "marital status, pregnancy, disabilities, or national origin. "
    "Keep all questions professional and job-relevant."
)

# ============================================================================
# LOGGING & MONITORING
# ============================================================================

# Enable detailed logging
ENABLE_DEBUG_LOGGING = True

# Log refusal events
LOG_REFUSALS = True

# Log HITL escalations
LOG_HITL_EVENTS = True

# Log stage transitions
LOG_STAGE_CHANGES = True

# ============================================================================
# ADVANCED SETTINGS
# ============================================================================

# Minimum response length to consider valid (words)
MIN_VALID_RESPONSE_LENGTH = 3

# Maximum consecutive short responses before prompting
MAX_SHORT_RESPONSES = 3

# Enable context-aware questioning
ENABLE_CONTEXT_AWARENESS = True

# Enable adaptive stage progression
ENABLE_ADAPTIVE_PROGRESSION = True

# Require detailed response to advance stage
REQUIRE_DETAILED_FOR_ADVANCEMENT = True

# ============================================================================
# CUSTOMIZATION EXAMPLES
# ============================================================================

"""
Example 1: Make bot more patient with short responses
------------------------------------------------------
SHORT_RESPONSE_THRESHOLD = 30  # Increase from 20
MAX_SHORT_RESPONSES = 5        # Increase from 3


Example 2: Faster interview progression
----------------------------------------
STAGE_THRESHOLDS = {
    "greeting": 1,
    "introduction": 1,
    "experience": 3,
    "skills": 5,
    "scenarios": 7,
    "candidate_questions": 9,
    "closing": 10
}


Example 3: More creative responses
-----------------------------------
TEMPERATURE = 0.9              # Increase from 0.7
MAX_RESPONSE_TOKENS = 300      # Increase from 200


Example 4: Stricter refusal detection
--------------------------------------
REFUSAL_KEYWORDS = [
    "don't want",
    "not interested",
    "stop",
    "exit",
    "quit",
    "cancel",
    "end",
    "leave",
    "discontinue",
    "withdraw",
    "abort",
    "terminate",
    "done",
    "finished",
]


Example 5: Custom greeting for specific role
---------------------------------------------
GREETING_TEMPLATE = (
    "Welcome. I'll be guiding this interview for the {position} role today. "
    "This will be a {duration}-minute conversation where we'll discuss your "
    "experience, skills, and fit for the role. Ready to begin?"
)
"""

# ============================================================================
# VALIDATION
# ============================================================================

def validate_config():
    """Validate configuration settings."""
    errors = []
    
    # Check thresholds
    if SHORT_RESPONSE_THRESHOLD >= DETAILED_RESPONSE_THRESHOLD:
        errors.append("SHORT_RESPONSE_THRESHOLD must be less than DETAILED_RESPONSE_THRESHOLD")
    
    # Check stage order
    if len(INTERVIEW_STAGES) != len(STAGE_THRESHOLDS):
        errors.append("INTERVIEW_STAGES and STAGE_THRESHOLDS must have same length")
    
    # Check temperature
    if not 0.0 <= TEMPERATURE <= 1.0:
        errors.append("TEMPERATURE must be between 0.0 and 1.0")
    
    # Check context window
    if CONTEXT_WINDOW_SIZE < 1:
        errors.append("CONTEXT_WINDOW_SIZE must be at least 1")
    
    if errors:
        raise ValueError(f"Configuration errors:\n" + "\n".join(f"  - {e}" for e in errors))
    
    return True


# Validate on import
validate_config()
