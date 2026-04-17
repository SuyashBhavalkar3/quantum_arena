"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import CodeCompilerPanel from "./CodeCompilerPanel";
import AvatarCanvas from "./AvatarCanvas";
import CameraFeed from "./CameraFeed";
import ChatPanel from "./ChatPanel";
import { useCamera } from "@/hooks/useCamera";
import { useTimer } from "@/hooks/useTimer";
import { useProctoring } from "@/hooks/useProctoring";
import { useAIProctoring } from "@/hooks/useAIProctoring";
import { proctoringAPI } from "@/lib/api";
import { useSarvamTTS } from "@/hooks/useSarvamTTS";
import { useSTT } from "@/hooks/useSTT";
import {
  ConversationMessage,
  InterviewContext,
  initialContext,
} from "@/services/conversationStateManager";
import { Card, CardContent } from "@/components/ui/card";
import DisqualificationScreen from "./DisqualificationScreen";
import CompletionScreen from "./CompletionScreen";

interface DynamicInterviewLayoutProps {
  applicationId?: string;
  company?: string;
  position?: string;
}

const BACKEND_WS = process.env.NEXT_PUBLIC_BACKEND_WS || "ws://127.0.0.1:8000";
const BACKEND_URL = BACKEND_WS.replace("ws://", "http://").replace("wss://", "https://");

export default function DynamicInterviewLayout({
  applicationId = "test",
  company = "Tech Company",
  position = "Software Engineer",
}: DynamicInterviewLayoutProps) {
  const router = useRouter();

  // ─── Interview state (UNCHANGED) ──────────────────────────────────────────
  const [context, setContext] = useState<InterviewContext>({
    ...initialContext,
    position,
    company,
  });
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [disqualified, setDisqualified] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [currentCodingProblem, setCurrentCodingProblem] = useState<any>(null);
  const [sessionArmed, setSessionArmed] = useState(false);
  const [primaryAgreementAccepted, setPrimaryAgreementAccepted] = useState(false);
  const [secondaryAgreementAccepted, setSecondaryAgreementAccepted] = useState(false);

  // ─── WebSocket (UNCHANGED) ────────────────────────────────────────────────
  const wsRef = useRef<WebSocket | null>(null);

  // ─── TTS Hook ─────────────────────────────────────────────────────────────
  const {
    speak: speakText,
  } = useSarvamTTS({
    onSpeakingStart: () => setIsAISpeaking(true),
    onSpeakingEnd: () => {
      setIsAISpeaking(false);
      setIsWaitingForResponse(false);
    },
  });

  // ─── STT Hook (for ChatPanel voice input) ────────────────────────────────
  const [sttTranscript, setSttTranscript] = useState("");
  const {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
  } = useSTT({
    onTranscriptionReceived: (text) => {
      setSttTranscript(text);
    },
    backendUrl: BACKEND_URL,
  });

  // ─── Camera & microphone (UNCHANGED) ─────────────────────────────────────
  const {
    videoRef,
    isCameraOn,
    toggleCamera,
    isMicOn,
    toggleMic,
    stream,
    error: cameraError,
    retry: retryCamera,
  } = useCamera();

  // ─── Proctoring ──────────────────────────────────────────────────────────
  const {
    violations,
    isFullscreen,
    requestFullscreen,
    addViolation,
    disqualify,
  } = useProctoring({
    maxViolations: 3,
    active: !completed && !disqualified,
    requireFullscreen: true,
    onViolation: ({ reason, type }) => {
      if (applicationId && applicationId !== "test") {
        void proctoringAPI.reportViolation(
          Number(applicationId),
          type,
          new Date().toISOString(),
          reason,
          "interview"
        );
      }
      sendWebSocketMessage({
        type: "proctor_event",
        event: { type, reason, timestamp: new Date().toISOString() },
      });
    },
  });

  // ─── AI Vision Proctoring (face-api.js + COCO-SSD) ────────────────────────
  const {
    faceCount,
    phoneDetected,
    modelsLoaded: aiModelsLoaded,
    currentAlert: aiViolationAlert,
  } = useAIProctoring({
    videoRef,
    active: sessionArmed && !completed && !disqualified && isCameraOn,
    intervalMs: 3000,
    onViolation: ({ type, message }) => {
      addViolation(message, type);
    },
  });

  // ─── Timer (UNCHANGED) ───────────────────────────────────────────────────
  const { timeLeft } = useTimer({
    initialTime: context.totalDuration * 60,
    active: context.currentState !== "greeting",
    onExpire: () => handleInterviewEnd(),
  });

  useEffect(() => {
    void requestFullscreen();
  }, [requestFullscreen]);

  // ─── WebSocket connection (UNCHANGED) ────────────────────────────────────
  useEffect(() => {
    if (!sessionArmed || !isCameraOn || !isFullscreen) return;

    const sessionId = `app_${applicationId}_${Date.now()}`;
    try {
      const wsUrl = `${BACKEND_WS}/ws/interview/${sessionId}?applicationId=${encodeURIComponent(
        applicationId
      )}&position=${encodeURIComponent(position)}&company=${encodeURIComponent(company)}`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        addMessage("system", "Interview started. Connecting to AI interviewer...");
      };
      wsRef.current.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        handleBackendMessage(msg);
      };
      wsRef.current.onerror = () => {
        console.error("WebSocket error");
        addMessage("system", "Connection error occurred");
      };
      wsRef.current.onclose = () => {};

      return () => {
        if (wsRef.current) wsRef.current.close();
      };
    } catch (error) {
      console.error("WebSocket setup failed:", error);
      addMessage("system", "Failed to connect to interview server");
    }
  }, [applicationId, company, isCameraOn, isFullscreen, position, sessionArmed]);

  // ─── Add message (UNCHANGED) ────────────────────────────────────────────
  const addMessage = useCallback(
    (role: "candidate" | "ai" | "system", content: string, metadata?: any) => {
      const newMessage: ConversationMessage = {
        id: `msg_${Date.now()}_${Math.random()}`,
        role,
        content,
        timestamp: Date.now(),
        metadata,
      };
      setMessages((prev) => [...prev, newMessage]);

      if (role === "ai" && content) {
        setTimeout(() => speakText(content), 100);
      }
      return newMessage;
    },
    [speakText]
  );

  // ─── Handle backend messages (UNCHANGED) ────────────────────────────────
  const handleBackendMessage = (msg: any) => {
    switch (msg.type) {
      case "interview_started":
        addMessage("ai", `Welcome! Starting interview for ${position} at ${company}`);
        setIsWaitingForResponse(false);
        break;
      case "section_started":
      case "behavioral_question":
      case "follow_up_question":
        addMessage("ai", msg.text || msg.question);
        break;
      case "coding_challenge":
        setCurrentCodingProblem(msg.challenge);
        addMessage("ai", `Coding Challenge: ${msg.challenge?.title}\n\n${msg.challenge?.description}`);
        break;
      case "code_evaluation":
        addMessage("ai", `Score: ${msg.evaluation?.score}/100\nFeedback: ${msg.evaluation?.feedback}`);
        setContext((prev) => ({
          ...prev,
          score: (prev.score + (msg.evaluation?.score || 0)) / (prev.questionsAsked + 1),
        }));
        setIsWaitingForResponse(false);
        break;
      case "execution_result":
        addMessage("system", `Execution Output:\n${msg.output || msg.error || "No output"}`, {
          executionResult: { output: msg.output, error: msg.error },
        });
        break;
      case "interview_complete":
        handleInterviewEnd();
        break;
      case "error":
        addMessage("system", `Error: ${msg.message}`);
        if (msg.critical) disqualify(msg.message);
        break;
    }
  };

  // ─── Send WebSocket message (UNCHANGED) ─────────────────────────────────
  const sendWebSocketMessage = (data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  };

  // ─── Handle candidate message (UNCHANGED) ──────────────────────────────
  const handleSendMessage = useCallback(
    (message: string) => {
      if (!message.trim()) return;
      addMessage("candidate", message);
      setIsWaitingForResponse(true);
      sendWebSocketMessage({
        type: "candidate_response",
        text: message,
        context,
      });
      setContext((prev) => ({
        ...prev,
        lastCandidateResponse: message,
        questionsAsked: prev.questionsAsked + 1,
      }));
    },
    [addMessage, context]
  );

  // ─── Handle code submission (UNCHANGED) ─────────────────────────────────
  const handleCodeSubmit = useCallback(
    (code: string, language: string) => {
      addMessage("candidate", `Submitted code in ${language}`);
      setIsWaitingForResponse(true);
      sendWebSocketMessage({
        type: "code_submission",
        code,
        language,
        problemId: currentCodingProblem?.id,
        context,
      });
    },
    [addMessage, context, currentCodingProblem]
  );

  // ─── Handle interview end (UNCHANGED) ──────────────────────────────────
  const handleInterviewEnd = () => {
    setCompleted(true);
    if (wsRef.current) wsRef.current.close();
  };

  // ─── Auto-disqualify on violations (UNCHANGED) ─────────────────────────
  useEffect(() => {
    if (violations > 3 && !disqualified) {
      setDisqualified(true);
      void (async () => {
        if (applicationId && applicationId !== "test") {
          await proctoringAPI
            .terminateSession(Number(applicationId), "interview", "auto_concluded_violation", "Exceeded maximum interview violations", violations)
            .catch((e) => console.error("Failed to terminate interview", e));
        }
        if (wsRef.current) {
          sendWebSocketMessage({
            type: "proctor_event",
            event: { type: "auto_disqualification", reason: "Exceeded maximum interview violations", timestamp: new Date().toISOString() },
          });
          wsRef.current.close();
        }
        router.push("/candidate/applications");
      })();
    }
  }, [applicationId, disqualified, router, violations]);

  // ─── Webcam-disabled violation (UNCHANGED) ─────────────────────────────
  useEffect(() => {
    if (sessionArmed && !completed && !disqualified && !isCameraOn) {
      if (applicationId && applicationId !== "test") {
        void proctoringAPI
          .reportViolation(Number(applicationId), "webcam_disabled", new Date().toISOString(), "Webcam disabled during AI interview", "interview")
          .catch((e) => console.error("Failed to report webcam violation", e));
      }
      sendWebSocketMessage({
        type: "proctor_event",
        event: { type: "webcam_disabled", reason: "Webcam disabled during AI interview", timestamp: new Date().toISOString() },
      });
    }
  }, [applicationId, completed, disqualified, isCameraOn, sessionArmed]);

  // ─── STT transcript → auto-send ────────────────────────────────────────
  useEffect(() => {
    if (sttTranscript) {
      handleSendMessage(sttTranscript);
      setSttTranscript("");
    }
  }, [sttTranscript, handleSendMessage]);

  const handleStartRecording = useCallback(async () => {
    await startRecording();
  }, [startRecording]);
  const handleStopRecording = useCallback(async () => {
    await stopRecording();
  }, [stopRecording]);

  // ─── Screens (UNCHANGED) ───────────────────────────────────────────────
  if (disqualified) return <DisqualificationScreen reason="Exceeded maximum violations" />;
  if (completed) return <CompletionScreen />;

  // Setup screen (UNCHANGED)
  if ((!isCameraOn || !isFullscreen || !sessionArmed) && context.currentState === "greeting") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Secure Interview Setup</h2>
            <p className="text-slate-600 mb-6">
              Please enable your camera and enter fullscreen mode to start the interview.
            </p>
            <div className="space-y-3 text-left">
              <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
                This is a proctored test. Webcam monitoring, tab switching detection, and
                activity tracking are active. If more than 3 violations occur, the session will
                automatically end.
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
                This is a proctored test. Webcam monitoring, tab switching detection, and
                activity tracking are active. If more than 3 violations occur, the session will
                automatically end.
              </div>
              <label className="flex items-start gap-3 text-sm text-slate-600">
                <input type="checkbox" checked={primaryAgreementAccepted} onChange={(e) => setPrimaryAgreementAccepted(e.target.checked)} className="mt-1" />
                I understand this AI interview is proctored and can be auto-concluded on violations.
              </label>
              <label className="flex items-start gap-3 text-sm text-slate-600">
                <input type="checkbox" checked={secondaryAgreementAccepted} onChange={(e) => setSecondaryAgreementAccepted(e.target.checked)} className="mt-1" />
                I agree to webcam monitoring, fullscreen enforcement, and activity tracking.
              </label>
              <button onClick={toggleCamera} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium">
                Enable Camera
              </button>
              <button onClick={() => void requestFullscreen()} className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-lg font-medium">
                Enter Fullscreen
              </button>
              {cameraError && (
                <button onClick={() => void retryCamera()} className="w-full border border-slate-300 hover:bg-slate-100 py-2 rounded-lg font-medium">
                  Retry Camera Access
                </button>
              )}
              <button
                onClick={() => setSessionArmed(true)}
                disabled={!isCameraOn || !isFullscreen || !primaryAgreementAccepted || !secondaryAgreementAccepted}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white py-2 rounded-lg font-medium"
              >
                Start AI Interview
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ── 3-COLUMN GRID LAYOUT ──────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* ── Header Stats Bar ── */}
      <div className="flex-none px-4 py-2 grid grid-cols-2 gap-2 text-sm lg:grid-cols-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg">
          <p className="text-slate-500 dark:text-slate-400 text-[10px]">Time Left</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white font-mono">
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg">
          <p className="text-slate-500 dark:text-slate-400 text-[10px]">Questions</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white">{context.questionsAsked}</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg">
          <p className="text-slate-500 dark:text-slate-400 text-[10px]">Score</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white">{Math.round(context.score)}%</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg">
          <p className="text-slate-500 dark:text-slate-400 text-[10px]">Violations</p>
          <p className="text-lg font-bold text-red-600 dark:text-red-400">{violations}</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg">
          <p className="text-slate-500 dark:text-slate-400 text-[10px]">Fullscreen</p>
          <p className={`text-lg font-bold ${isFullscreen ? "text-green-600" : "text-red-500"}`}>
            {isFullscreen ? "On" : "Off"}
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg">
          <p className="text-slate-500 dark:text-slate-400 text-[10px]">Faces</p>
          <p className={`text-lg font-bold ${faceCount === null || faceCount === 1 ? "text-green-600" : "text-red-500"}`}>
            {faceCount === null ? (aiModelsLoaded ? "-" : "…") : faceCount}
          </p>
        </div>
        {phoneDetected && (
          <div className="col-span-2 lg:col-span-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-2 rounded-lg flex items-center gap-2">
            <span className="text-red-600 dark:text-red-400 text-sm font-bold animate-pulse">📱 PHONE DETECTED</span>
            <span className="text-red-500 dark:text-red-400 text-xs">— Electronic devices are not allowed during the interview</span>
          </div>
        )}
      </div>

      {/* ── 3-Column Main Grid ── */}
      <div
        className="flex-1 min-h-0"
        style={{
          display: "grid",
          gridTemplateColumns: "40% 30% 30%",
        }}
      >
        {/* ═══ COL 1: Compiler Panel (40%) ═══ */}
        <div className="min-h-0 overflow-hidden p-3">
          <CodeCompilerPanel
            problem={currentCodingProblem}
            onCodeSubmit={handleCodeSubmit}
            sessionId={`app_${applicationId}`}
          />
        </div>

        {/* ═══ COL 2: Chat Panel (30%) ═══ */}
        <div className="min-h-0 overflow-hidden">
          <ChatPanel
            messages={messages}
            onSendMessage={handleSendMessage}
            isWaitingForResponse={isWaitingForResponse}
            isAISpeaking={isAISpeaking}
            isRecording={isRecording}
            isProcessing={isProcessing}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
          />
        </div>

        {/* ═══ COL 3: Interview Panel (30%) — split vertically ═══ */}
        <div className="min-h-0 overflow-hidden flex flex-col border-l border-slate-200 dark:border-slate-700">
          {/* Avatar View — 60% height */}
          <div className="min-h-0 overflow-hidden bg-[#0a0a0f]" style={{ flex: 6 }}>
            <AvatarCanvas
              isSpeaking={isAISpeaking}
            />
          </div>

          {/* Divider */}
          <div className="flex-none h-px bg-slate-700" />

          {/* Camera Feed — 40% height */}
          <div className="overflow-hidden" style={{ flex: 4 }}>
            <CameraFeed
              stream={stream}
              isCameraOn={isCameraOn}
              isMicOn={isMicOn}
              videoRef={videoRef}
              violationAlert={aiViolationAlert}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
