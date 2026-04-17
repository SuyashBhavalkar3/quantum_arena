"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Camera, Expand, AlertTriangle, CheckCircle } from "lucide-react";
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

  // Setup screen — full-screen two-panel layout
  if ((!isCameraOn || !isFullscreen || !sessionArmed) && context.currentState === "greeting") {
    return (
      <div className="h-screen flex flex-col overflow-hidden bg-slate-950">
        {/* Header bar */}
        <div className="flex-none flex items-center justify-between px-6 py-3 border-b border-slate-800">
          <div>
            <h1 className="text-lg font-bold text-white">AI Interview Setup</h1>
            <p className="text-sm text-slate-400">{position} at {company}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium ${
              isCameraOn ? "bg-green-900/40 text-green-400 border border-green-800/50"
                         : "bg-red-900/40 text-red-400 border border-red-800/50"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isCameraOn ? "bg-green-400" : "bg-red-400"}`} />
              {isCameraOn ? "Camera On" : "Camera Off"}
            </span>
            <span className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium ${
              isFullscreen ? "bg-green-900/40 text-green-400 border border-green-800/50"
                           : "bg-slate-800 text-slate-400 border border-slate-700"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isFullscreen ? "bg-green-400" : "bg-slate-500"}`} />
              {isFullscreen ? "Fullscreen Active" : "Not Fullscreen"}
            </span>
          </div>
        </div>

        {/* Full-screen two-panel body */}
        <div className="flex-1 min-h-0 flex overflow-hidden">

          {/* LEFT PANEL — Instructions + Agreements */}
          <div className="flex-1 min-w-0 overflow-y-auto p-8 flex flex-col gap-6">

            {/* Interview Guidelines */}
            <div className="rounded-xl bg-blue-950/40 border border-blue-800/40 p-6">
              <h2 className="text-base font-semibold text-blue-300 mb-3">📋 Interview Guidelines</h2>
              <ul className="space-y-2 text-sm text-blue-300/80">
                <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span> Camera and microphone must remain on throughout the session</li>
                <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span> Mix of oral questions and coding challenges</li>
                <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span> AI proctored — more than 3 violations = auto disqualified</li>
                <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span> Ensure a quiet, well-lit environment before starting</li>
                <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span> Questions will be spoken aloud — keep your volume on</li>
              </ul>
            </div>

            {/* Proctoring Agreement */}
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert className="h-5 w-5 text-amber-400" />
                <h2 className="text-base font-semibold text-white">Proctoring Agreement</h2>
              </div>
              <p className="text-sm text-slate-400 mb-5">
                This AI interview is fully proctored. Webcam monitoring, fullscreen enforcement, and activity
                tracking are active throughout. More than 3 violations will automatically conclude the session.
              </p>
              <div className="space-y-4">
                <label className="flex items-start gap-3 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={primaryAgreementAccepted}
                    onChange={(e) => setPrimaryAgreementAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-amber-400"
                  />
                  I understand this AI interview is proctored and can be auto-concluded on violations.
                </label>
                <label className="flex items-start gap-3 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={secondaryAgreementAccepted}
                    onChange={(e) => setSecondaryAgreementAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-amber-400"
                  />
                  I agree to webcam monitoring, fullscreen enforcement, and activity tracking.
                </label>
              </div>
            </div>

            {/* Readiness checklist */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Camera enabled", ok: isCameraOn },
                { label: "Fullscreen active", ok: isFullscreen },
                { label: "Primary agreement", ok: primaryAgreementAccepted },
                { label: "Secondary agreement", ok: secondaryAgreementAccepted },
              ].map(({ label, ok }) => (
                <div key={label} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm border ${
                  ok ? "bg-green-950/40 text-green-400 border-green-800/40"
                     : "bg-slate-800/60 text-slate-400 border-slate-700/40"
                }`}>
                  {ok
                    ? <CheckCircle className="h-4 w-4 flex-shrink-0" />
                    : <span className="w-4 h-4 rounded-full border-2 border-slate-600 flex-shrink-0" />}
                  {label}
                </div>
              ))}
            </div>

            {/* Camera error */}
            {cameraError && (
              <div className="flex items-center gap-3 rounded-xl bg-red-950/40 border border-red-800/40 p-4 text-sm text-red-400">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {cameraError}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              {!isCameraOn && (
                <button
                  onClick={toggleCamera}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
                >
                  <Camera className="h-4 w-4" /> Enable Camera
                </button>
              )}
              {!isFullscreen && (
                <button
                  onClick={() => void requestFullscreen()}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-colors"
                >
                  <Expand className="h-4 w-4" /> Enter Fullscreen
                </button>
              )}
              {cameraError && (
                <button
                  onClick={() => void retryCamera()}
                  className="flex-1 py-3 rounded-xl border border-slate-600 hover:bg-slate-800 text-slate-300 text-sm font-medium transition-colors"
                >
                  Retry Camera
                </button>
              )}
              <button
                onClick={() => setSessionArmed(true)}
                disabled={!isCameraOn || !isFullscreen || !primaryAgreementAccepted || !secondaryAgreementAccepted}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-950 disabled:text-emerald-700 text-white text-sm font-semibold transition-colors"
              >
                Start AI Interview
              </button>
            </div>
          </div>

          {/* RIGHT PANEL — Camera preview */}
          <div className="w-72 flex-none flex flex-col border-l border-slate-800 bg-slate-900">
            <div className="p-4 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-slate-200">Camera Preview</h3>
              <p className="text-xs text-slate-500 mt-0.5">Ensure your face is clearly visible</p>
            </div>
            <div className="flex-1 flex flex-col p-4 gap-4">
              <div className="w-full aspect-video rounded-xl overflow-hidden border border-slate-700 bg-black">
                <CameraFeed
                  stream={stream}
                  isCameraOn={isCameraOn}
                  isMicOn={isMicOn}
                  videoRef={videoRef}
                  violationAlert={aiViolationAlert}
                />
              </div>
              <p className="text-xs text-center text-slate-500">
                {isCameraOn ? "✓ Camera preview active" : "Enable camera to see preview"}
              </p>
            </div>
          </div>
        </div>
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
