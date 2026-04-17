// Conversation State Manager - Manages the interview flow state machine

export type InterviewState =
  | "greeting"
  | "introduction"
  | "ready_confirmation"
  | "technical_question"
  | "candidate_answer_awaiting"
  | "evaluating_answer"
  | "follow_up_question"
  | "coding_question"
  | "candidate_coding_awaiting"
  | "evaluating_code"
  | "behavioral_question"
  | "candidate_behavioral_awaiting"
  | "evaluating_behavioral"
  | "hint_or_clarification"
  | "next_question_decision"
  | "interview_complete"
  | "interview_closed";

export interface ConversationMessage {
  id: string;
  role: "candidate" | "ai" | "system";
  content: string;
  timestamp: number;
  type?: "text" | "code" | "execution_result" | "hint";
  metadata?: {
    executionResult?: any;
    codingProblem?: any;
    questionType?: string;
  };
}

export interface InterviewContext {
  currentState: InterviewState;
  messages: ConversationMessage[];
  score: number;
  violationCount: number;
  questionsAsked: number;
  questionsCorrect: number;
  elapsedTime: number;
  totalDuration: number;
  position: string;
  company: string;
  currentCodingProblem?: any;
  lastCandidateResponse?: string;
  evaluationFeedback?: string;
  hintGiven?: boolean;
}

export const initialContext: InterviewContext = {
  currentState: "greeting",
  messages: [],
  score: 0,
  violationCount: 0,
  questionsAsked: 0,
  questionsCorrect: 0,
  elapsedTime: 0,
  totalDuration: 45,
  position: "Engineer",
  company: "Tech Company",
};

export const stateTransitions: Record<InterviewState, InterviewState[]> = {
  greeting: ["introduction"],
  introduction: ["ready_confirmation"],
  ready_confirmation: ["technical_question"],
  technical_question: ["candidate_answer_awaiting"],
  candidate_answer_awaiting: ["evaluating_answer"],
  evaluating_answer: [
    "follow_up_question",
    "hint_or_clarification",
    "next_question_decision",
  ],
  follow_up_question: ["candidate_answer_awaiting"],
  coding_question: ["candidate_coding_awaiting"],
  candidate_coding_awaiting: ["evaluating_code"],
  evaluating_code: [
    "hint_or_clarification",
    "next_question_decision",
    "behavioral_question",
  ],
  behavioral_question: ["candidate_behavioral_awaiting"],
  candidate_behavioral_awaiting: ["evaluating_behavioral"],
  evaluating_behavioral: ["next_question_decision"],
  hint_or_clarification: [
    "candidate_answer_awaiting",
    "candidate_coding_awaiting",
  ],
  next_question_decision: [
    "technical_question",
    "coding_question",
    "behavioral_question",
    "interview_complete",
  ],
  interview_complete: ["interview_closed"],
  interview_closed: [],
};

/**
 * Validates if a state transition is allowed
 */
export const isValidTransition = (
  from: InterviewState,
  to: InterviewState
): boolean => {
  return stateTransitions[from]?.includes(to) ?? false;
};

/**
 * Determines next state based on context and AI decision
 */
export const determineNextState = (
  currentState: InterviewState,
  aiDecision: string,
  context: InterviewContext
): InterviewState => {
  const possibleStates = stateTransitions[currentState];

  // If time is running out, move to closing
  if (context.elapsedTime > context.totalDuration * 0.9) {
    if (possibleStates.includes("interview_complete")) {
      return "interview_complete";
    }
  }

  // Parse AI decision to determine next state
  if (aiDecision.includes("follow_up")) {
    return possibleStates.includes("follow_up_question")
      ? "follow_up_question"
      : possibleStates[0];
  }

  if (aiDecision.includes("coding")) {
    return possibleStates.includes("coding_question")
      ? "coding_question"
      : possibleStates[0];
  }

  if (aiDecision.includes("behavioral")) {
    return possibleStates.includes("behavioral_question")
      ? "behavioral_question"
      : possibleStates[0];
  }

  if (aiDecision.includes("hint")) {
    return possibleStates.includes("hint_or_clarification")
      ? "hint_or_clarification"
      : possibleStates[0];
  }

  if (aiDecision.includes("complete")) {
    return possibleStates.includes("interview_complete")
      ? "interview_complete"
      : possibleStates[0];
  }

  // Default behavior
  if (currentState === "evaluating_answer") {
    if (context.questionsAsked < 3) {
      return possibleStates.includes("follow_up_question")
        ? "follow_up_question"
        : possibleStates[0];
    } else if (context.questionsAsked < 6) {
      return possibleStates.includes("coding_question")
        ? "coding_question"
        : possibleStates[0];
    } else {
      return possibleStates.includes("behavioral_question")
        ? "behavioral_question"
        : possibleStates[0];
    }
  }

  return possibleStates[0] || "interview_complete";
};

/**
 * Validates state before transition
 */
export const validateStateTransition = (
  from: InterviewState,
  to: InterviewState
): { valid: boolean; error?: string } => {
  if (!isValidTransition(from, to)) {
    return {
      valid: false,
      error: `Cannot transition from ${from} to ${to}`,
    };
  }
  return { valid: true };
};
