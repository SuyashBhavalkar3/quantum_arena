"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle as AlertIcon,
  AlertTriangle,
  Camera,
  CheckCircle,
  Clock,
  Copy,
  Expand,
  Loader2,
  Play,
  Send,
  ShieldAlert,
} from "lucide-react";

import {
  applicationsAPI,
  assessmentAPI,
  AssessmentCodingQuestion,
  AssessmentMCQQuestion,
  AssessmentSubmitResponse,
  profileAPI,
  proctoringAPI,
} from "@/lib/api";
import { executeCode, SUPPORTED_LANGUAGES, ExecutionResult } from "@/services/codeExecutor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useCamera } from "@/hooks/useCamera";
import { useProctoring } from "@/hooks/useProctoring";
import { useAIProctoring } from "@/hooks/useAIProctoring";
import CameraFeed from "@/components/interview/CameraFeed";

type AssessmentQuestion =
  | {
      id: number;
      type: "mcq";
      title: string;
      description: string;
      points: number;
      options: string[];
    }
  | {
      id: number;
      type: "coding";
      title: string;
      description: string;
      points: number;
      starterCode: string;
    };

const buildCodingPrompt = (question: AssessmentCodingQuestion) => {
  const details = [
    question.question_text,
    question.example_input ? `Example input: ${question.example_input}` : null,
    question.example_output ? `Example output: ${question.example_output}` : null,
    question.constraints ? `Constraints: ${question.constraints}` : null,
    question.expected_function_signature
      ? `Expected function signature: ${question.expected_function_signature}`
      : null,
    question.expected_time_complexity
      ? `Expected time complexity: ${question.expected_time_complexity}`
      : null,
    question.expected_space_complexity
      ? `Expected space complexity: ${question.expected_space_complexity}`
      : null,
  ].filter(Boolean);

  return details.join("\n\n");
};

const normalizeQuestions = (
  mcqQuestions: AssessmentMCQQuestion[],
  codingQuestions: AssessmentCodingQuestion[]
): AssessmentQuestion[] => {
  const normalizedMcq: AssessmentQuestion[] = mcqQuestions.map((question, index) => ({
    id: question.id,
    type: "mcq",
    title: question.topic || `MCQ Question ${index + 1}`,
    description: question.question_text,
    points: question.marks,
    options: [
      question.option_a,
      question.option_b,
      question.option_c,
      question.option_d,
    ],
  }));

  const normalizedCoding: AssessmentQuestion[] = codingQuestions.map((question, index) => ({
    id: question.id,
    type: "coding",
    title: question.topic || `Coding Question ${index + 1}`,
    description: buildCodingPrompt(question),
    points: question.marks,
    starterCode: "",
  }));

  return [...normalizedMcq, ...normalizedCoding];
};

function AssessmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const applicationIdParam = searchParams.get("applicationId");
  const applicationId = applicationIdParam ? Number(applicationIdParam) : null;

  const [profileCompleted, setProfileCompleted] = useState<boolean | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [started, setStarted] = useState(false);
  const [startingAssessment, setStartingAssessment] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3600);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<AssessmentSubmitResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [applicationMeta, setApplicationMeta] = useState<{ company: string; position: string } | null>(null);
  const [assessmentQuestions, setAssessmentQuestions] = useState<AssessmentQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [proctoringNotice, setProctoringNotice] = useState<string | null>(null);
  const [primaryAgreementAccepted, setPrimaryAgreementAccepted] = useState(false);
  const [secondaryAgreementAccepted, setSecondaryAgreementAccepted] = useState(false);
  const [blockedByViolation, setBlockedByViolation] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState("python3");
  const [codeOutput, setCodeOutput] = useState("");
  const [codeRunning, setCodeRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);

  const {
    videoRef,
    isCameraOn,
    stream,
    error: cameraError,
    retry: retryCamera,
  } = useCamera();

  const reportViolation = useCallback(
    async (reason: string, type: string) => {
      if (!applicationId) return;
      try {
        await proctoringAPI.reportViolation(
          applicationId, type, new Date().toISOString(), reason, "assessment"
        );
      } catch (e) {
        console.error("Failed to report assessment violation", e);
      }
    },
    [applicationId]
  );

  const { violations, isOnline, isFullscreen, addViolation, requestFullscreen } = useProctoring({
    active: started && !submitted,
    requireFullscreen: true,
    onViolation: ({ reason, type }) => {
      setProctoringNotice(reason);
      void reportViolation(reason, type);
    },
  });

  const { faceCount, currentAlert: aiViolationAlert } = useAIProctoring({
    videoRef,
    active: started && !submitted && isCameraOn,
    intervalMs: 3000,
    onViolation: ({ type, message }) => { addViolation(message, type); },
  });

  useEffect(() => {
    let mounted = true;
    async function loadProfileStatus() {
      try {
        setLoadingProfile(true);
        const status = await profileAPI.getCandidateStatus();
        if (mounted) setProfileCompleted(status.profile_completed);
      } catch (e) {
        if (mounted) {
          setError(e instanceof Error ? e.message : "Failed to verify profile completion.");
          setProfileCompleted(false);
        }
      } finally {
        if (mounted) setLoadingProfile(false);
      }
    }
    loadProfileStatus();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadApplicationMeta() {
      if (!applicationId) return;
      try {
        const detail = await applicationsAPI.getMyApplicationDetail(applicationId);
        if (mounted) {
          setApplicationMeta({
            company: detail.job?.title || "Tech Company",
            position: detail.job?.title || "Software Engineer",
          });
          if (detail.assessment_data?.assessment_status === "auto_submitted_violation") {
            setBlockedByViolation(true);
            setError("This assessment was auto-submitted due to proctoring violations and cannot be restarted.");
          }
        }
      } catch { /* silently ignore */ }
    }
    loadApplicationMeta();
    return () => { mounted = false; };
  }, [applicationId]);

  useEffect(() => {
    if (profileCompleted === false) {
      const timer = setTimeout(() => router.push("/candidate/profile"), 3000);
      return () => clearTimeout(timer);
    }
  }, [profileCompleted, router]);

  const questions = useMemo(() => assessmentQuestions, [assessmentQuestions]);
  const question = questions[currentQuestion];

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleStartAssessment = async () => {
    if (!applicationId) { setError("Missing application ID."); return; }
    if (blockedByViolation) { setError("This assessment cannot be restarted."); return; }
    if (!primaryAgreementAccepted || !secondaryAgreementAccepted) {
      setError("You must accept both proctoring notices before starting."); return;
    }
    if (!stream || !isCameraOn) { setError("Camera access is required before starting."); return; }
    try {
      setStartingAssessment(true);
      setError(null);
      const fullscreenGranted = await requestFullscreen();
      if (!fullscreenGranted) { setError("Fullscreen permission is required."); return; }
      const response = await assessmentAPI.startAssessment(applicationId);
      const normalizedQuestions = normalizeQuestions(response.mcq_questions, response.coding_questions);
      setAssessmentQuestions(normalizedQuestions);
      setStarted(true);
      setTimeLeft(3600);
      setCurrentQuestion(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start assessment.");
    } finally {
      setStartingAssessment(false);
    }
  };

  const handleSubmit = useCallback(async (forcedByViolation: boolean = false) => {
    if (!applicationId) { setError("Missing application ID."); return; }
    try {
      setSubmitting(true);
      setError(null);
      const mcq_answers = questions
        .filter((item): item is Extract<AssessmentQuestion, { type: "mcq" }> => item.type === "mcq")
        .map((q) => ({ question_id: q.id, selected_option: ["A","B","C","D"][Number(answers[q.id] ?? 0)] || "A" }));
      const coding_submissions = questions
        .filter((item): item is Extract<AssessmentQuestion, { type: "coding" }> => item.type === "coding")
        .map((q) => ({ question_id: q.id, code: String(answers[q.id] ?? q.starterCode ?? ""), language: "python3" }));
      const result = await assessmentAPI.submitAssessment(applicationId, { mcq_answers, coding_submissions, forced_by_violation: forcedByViolation });
      setSubmissionResult(result);
      setSubmitted(true);
      if (forcedByViolation) setTimeout(() => router.push("/candidate/applications"), 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit assessment.");
    } finally {
      setSubmitting(false);
    }
  }, [applicationId, questions, answers, router]);

  useEffect(() => {
    if (started && !submitted && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft((p) => p - 1), 1000);
      return () => clearInterval(timer);
    }
    if (timeLeft === 0 && started && !submitted && !submitting) void handleSubmit();
  }, [handleSubmit, started, submitted, submitting, timeLeft]);

  useEffect(() => {
    if (started && !submitted && violations > 3 && !submitting) {
      setError("Assessment auto-submitted due to repeated proctoring violations.");
      void handleSubmit(true);
    }
  }, [handleSubmit, started, submitted, submitting, violations]);

  useEffect(() => {
    if (started && !submitted && !isCameraOn) {
      setProctoringNotice("Webcam disabled during assessment.");
      void reportViolation("Webcam disabled during assessment", "webcam_disabled");
    }
  }, [isCameraOn, reportViolation, started, submitted]);

  // ─── Loading ─────────────────────────────────────────────────────────────────
  if (loadingProfile) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-[#B8915C]" />
      </div>
    );
  }

  // ─── Profile Incomplete ───────────────────────────────────────────────────────
  if (profileCompleted === false) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 p-8">
        <Card className="w-full max-w-md border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertIcon className="h-5 w-5 text-amber-600" />
              Complete Your Profile First
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3">
              Your profile is incomplete. Redirecting in 3 seconds…
            </p>
            <div className="flex gap-3">
              <Link href="/candidate/profile" className="flex-1">
                <Button className="w-full">Complete Profile</Button>
              </Link>
              <Link href="/candidate/applications" className="flex-1">
                <Button variant="outline" className="w-full">Back to Applications</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Submitted ────────────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 p-8">
        <Card className="w-full max-w-sm text-center border-slate-200 dark:border-slate-800">
          <CardContent className="p-10">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-9 w-9 text-green-600" />
            </div>
            <h2 className="mb-2 text-2xl font-bold">Assessment Submitted!</h2>
            <p className="mb-6 text-slate-500 dark:text-slate-400">
              Score: {submissionResult?.total_score ?? 0}/100
            </p>
            {submissionResult?.qualifies_for_interview ? (
              <div className="space-y-3">
                <p className="text-sm text-[#B8915C]">You qualify for the AI interview.</p>
                <Link href={`/candidate/interview?applicationId=${applicationId}&company=${encodeURIComponent(applicationMeta?.company || "Tech Company")}&position=${encodeURIComponent(applicationMeta?.position || "Software Engineer")}`}>
                  <Button className="w-full">Start AI Interview</Button>
                </Link>
              </div>
            ) : (
              <Link href="/candidate/applications">
                <Button className="w-full">Back to Applications</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Pre-start / Setup — FULL SCREEN SPLIT ───────────────────────────────────
  if (!started) {
    return (
      <div className="h-screen flex flex-col overflow-hidden bg-white dark:bg-slate-950">
        {/* Top header bar */}
        <div className="flex-none flex items-center justify-between px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Assessment Setup</h1>
            <p className="text-xs text-slate-500">Application ID: {applicationId ?? "Unavailable"}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium ${
              isCameraOn ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                         : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isCameraOn ? "bg-green-500" : "bg-red-500"}`} />
              {isCameraOn ? "Camera Ready" : "Camera Off"}
            </span>
          </div>
        </div>

        {/* Full-screen two-panel layout */}
        <div className="flex-1 min-h-0 flex overflow-hidden">

          {/* LEFT PANEL — Instructions + Agreements (fills remaining space) */}
          <div className="flex-1 min-w-0 overflow-y-auto p-8 flex flex-col gap-6">

            {/* Instructions */}
            <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-6">
              <h2 className="text-base font-semibold text-blue-900 dark:text-blue-200 mb-3">📋 Instructions</h2>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
                <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">•</span> Duration: 60 minutes — auto-submits when time expires</li>
                <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">•</span> Questions are dynamically loaded from the backend when you start</li>
                <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">•</span> Once started, the assessment cannot be paused or restarted</li>
                <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">•</span> Ensure stable internet connection before proceeding</li>
              </ul>
            </div>

            {/* Proctoring Agreement */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-6">
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert className="h-5 w-5 text-[#B8915C]" />
                <h2 className="text-base font-semibold text-slate-800 dark:text-white">Proctoring Agreement</h2>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                This is a fully proctored assessment. Webcam monitoring, tab switching detection, and
                activity tracking are active throughout. More than 3 violations will trigger an automatic submission.
              </p>
              <div className="space-y-3">
                <label className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={primaryAgreementAccepted}
                    onChange={(e) => setPrimaryAgreementAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-[#B8915C]"
                  />
                  I understand this assessment is fully proctored and may auto-submit on violation.
                </label>
                <label className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={secondaryAgreementAccepted}
                    onChange={(e) => setSecondaryAgreementAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-[#B8915C]"
                  />
                  I agree to webcam monitoring, fullscreen enforcement, and activity tracking.
                </label>
              </div>
            </div>

            {/* Proctoring capabilities */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: <Camera className="h-5 w-5" />, label: "Webcam Monitoring", desc: "Camera feed required throughout" },
                { icon: <Expand className="h-5 w-5" />, label: "Fullscreen Enforced", desc: "Exiting triggers a violation" },
                { icon: <Copy className="h-5 w-5" />, label: "Activity Tracked", desc: "Copy, paste, tab switch logged" },
              ].map(({ icon, label, desc }) => (
                <div key={label} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
                  <div className="text-[#B8915C] mb-2">{icon}</div>
                  <p className="text-sm font-medium text-slate-800 dark:text-white">{label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{desc}</p>
                </div>
              ))}
            </div>

            {/* Warning */}
            <div className="flex items-start gap-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-300">
                Make sure your internet connection is stable and you are in a quiet, well-lit environment before starting.
                The test runs in a proctored fullscreen session.
              </p>
            </div>

            {/* Errors */}
            {(cameraError || error) && (
              <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-300">
                {cameraError || error}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleStartAssessment}
                disabled={startingAssessment || !stream || !isCameraOn || blockedByViolation || !primaryAgreementAccepted || !secondaryAgreementAccepted}
                className="flex-1 h-11 text-base"
              >
                {startingAssessment ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting…</>
                ) : "Start Assessment"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void retryCamera()}
                className="h-11 px-5"
              >
                Retry Camera
              </Button>
            </div>
          </div>

          {/* RIGHT PANEL — Camera preview (fixed width) */}
          <div className="w-72 flex-none flex flex-col border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Camera Preview</h3>
              <p className="text-xs text-slate-400 mt-0.5">Ensure your face is clearly visible</p>
            </div>
            <div className="flex-1 flex flex-col p-4 gap-4">
              <div className="w-full aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black">
                <CameraFeed
                  stream={stream}
                  isCameraOn={isCameraOn}
                  isMicOn={true}
                  videoRef={videoRef}
                  violationAlert={aiViolationAlert}
                />
              </div>
              <div className="space-y-2">
                {[
                  { label: "Camera", ok: isCameraOn },
                  { label: "Agreements accepted", ok: primaryAgreementAccepted && secondaryAgreementAccepted },
                ].map(({ label, ok }) => (
                  <div key={label} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                    ok ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
                       : "bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700"
                  }`}>
                    {ok
                      ? <CheckCircle className="h-4 w-4 flex-shrink-0" />
                      : <span className="w-4 h-4 rounded-full border-2 border-slate-300 flex-shrink-0" />}
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── No questions ─────────────────────────────────────────────────────────────
  if (!question) {
    return (
      <div className="flex h-screen items-center justify-center p-8 bg-slate-50 dark:bg-slate-950">
        <Card className="w-full max-w-md">
          <CardContent className="space-y-4 p-8">
            <p className="text-slate-600 dark:text-slate-400">
              No assessment questions were returned for this application.
            </p>
            <Link href="/candidate/applications">
              <Button>Back to Applications</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Active Assessment — FULL SCREEN ─────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">

      {/* ── Top bar ── */}
      <div className="flex-none flex items-center justify-between px-5 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 gap-4">
        <h1 className="text-sm font-bold text-slate-900 dark:text-white shrink-0">Assessment</h1>

        {/* Status pills */}
        <div className="flex items-center gap-2 text-xs">
          {[
            { label: isOnline ? "Online" : "Offline", ok: isOnline },
            { label: isFullscreen ? "Fullscreen" : "Windowed", ok: isFullscreen },
            { label: `Faces: ${faceCount === null ? "…" : faceCount}`, ok: faceCount === null || faceCount === 1 },
            { label: `⚠ ${violations} violations`, ok: violations === 0 },
          ].map(({ label, ok }) => (
            <span key={label} className={`px-2.5 py-0.5 rounded-full font-medium ${
              ok ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                 : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            }`}>
              {label}
            </span>
          ))}
        </div>

        {/* Timer */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono font-bold text-sm shrink-0 ${
          timeLeft < 300
            ? "border-red-300 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
            : "border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        }`}>
          <Clock className="h-4 w-4" />
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* ── Proctoring / error notices ── */}
      {proctoringNotice && (
        <div className="flex-none px-5 py-2 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-300">
          ⚠ {proctoringNotice}
        </div>
      )}
      {error && (
        <div className="flex-none px-5 py-2 bg-red-50 dark:bg-red-950/30 border-b border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* ── Question progress strip ── */}
      <div className="flex-none flex items-center gap-1.5 px-5 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        {questions.map((item, index) => (
          <button
            key={item.id}
            onClick={() => setCurrentQuestion(index)}
            title={`Q${index + 1}: ${item.title}`}
            className={`h-2 flex-1 rounded-full transition-colors ${
              index === currentQuestion ? "bg-blue-600"
              : answers[item.id] !== undefined ? "bg-green-500"
              : "bg-slate-200 dark:bg-slate-700"
            }`}
          />
        ))}
        <span className="ml-2 text-xs text-slate-500 whitespace-nowrap font-medium">
          {currentQuestion + 1} / {questions.length}
        </span>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 min-h-0 flex overflow-hidden">

        {/* Question panel (scrollable) */}
        <div className="flex-1 min-w-0 overflow-y-auto p-6">

          {/* Question meta */}
          <div className="flex items-start gap-3 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">{question.type.toUpperCase()}</Badge>
                <Badge variant="secondary">{question.points} points</Badge>
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{question.title}</h2>
            </div>
          </div>

          {/* Question description */}
          <div className="mb-5 p-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
            {question.description}
          </div>

          {/* ── MCQ Options ── */}
          {question.type === "mcq" && (
            <div className="space-y-3">
              {question.options.map((option, index) => (
                <button
                  key={option}
                  onClick={() => setAnswers((c) => ({ ...c, [question.id]: index }))}
                  className={`w-full rounded-xl border-2 px-5 py-4 text-left text-sm transition-all ${
                    answers[question.id] === index
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 shadow-sm"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900"
                  }`}
                >
                  <span className="font-semibold mr-3 text-slate-400">{["A", "B", "C", "D"][index]}.</span>
                  {option}
                </button>
              ))}
            </div>
          )}

          {/* ── Coding Editor ── */}
          {question.type === "coding" && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Language:</label>
                <select
                  value={codeLanguage}
                  onChange={(e) => setCodeLanguage(e.target.value)}
                  className="text-sm px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.id} value={lang.id}>{lang.name}</option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
                  <span className="text-xs text-slate-400 font-mono">
                    {SUPPORTED_LANGUAGES.find(l => l.id === codeLanguage)?.name ?? codeLanguage}
                  </span>
                  <button
                    onClick={() => navigator.clipboard.writeText(String(answers[question.id] ?? ""))}
                    className="text-slate-400 hover:text-slate-200 p-1 rounded transition-colors"
                    title="Copy code"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
                <Textarea
                  value={String(answers[question.id] ?? "")}
                  onChange={(e) => setAnswers((c) => ({ ...c, [question.id]: e.target.value }))}
                  className="h-52 bg-slate-900 text-slate-50 font-mono text-sm dark:bg-slate-900 border-none rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
                  placeholder={`# Write your ${SUPPORTED_LANGUAGES.find(l => l.id === codeLanguage)?.name ?? ""} solution here...`}
                  spellCheck={false}
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    const code = String(answers[question.id] ?? "");
                    if (!code.trim()) { setCodeOutput("Please write some code first."); return; }
                    setCodeRunning(true); setCodeOutput(""); setExecutionResult(null);
                    try {
                      const res = await executeCode(code, codeLanguage, `assess_${applicationId}_q${question.id}`);
                      setExecutionResult(res);
                      setCodeOutput(res.output || res.error || "(No output)");
                    } catch (err) {
                      setCodeOutput(`Execution failed: ${err instanceof Error ? err.message : "Unknown error"}`);
                    } finally { setCodeRunning(false); }
                  }}
                  disabled={codeRunning}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {codeRunning ? <><Loader2 className="h-4 w-4 animate-spin" /> Running…</> : <><Play className="h-4 w-4" /> Run Code</>}
                </button>
                {codeOutput && (
                  <button
                    onClick={() => { setCodeOutput(""); setExecutionResult(null); }}
                    className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    Clear output
                  </button>
                )}
              </div>

              {(codeOutput || codeRunning) && (
                <div className="rounded-xl border border-slate-300 dark:border-slate-700 overflow-hidden">
                  <div className={`flex items-center justify-between px-4 py-2 border-b text-xs font-medium text-slate-300 ${
                    executionResult?.status === "error" ? "bg-red-900 border-red-700" : "bg-slate-800 border-slate-700"
                  }`}>
                    <span>{executionResult?.status === "error" ? "⚠ Error" : "✓ Output"}
                      {executionResult?.cpuTime && <span className="ml-2 text-slate-400">· CPU: {executionResult.cpuTime}s</span>}
                    </span>
                  </div>
                  <pre className="p-4 bg-slate-900 text-slate-100 text-sm font-mono overflow-x-auto whitespace-pre-wrap max-h-40">
                    {codeRunning ? "Running your code…" : codeOutput}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Camera sidebar */}
        <div className="w-60 flex-none flex flex-col border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="p-3 border-b border-slate-200 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Proctoring Camera</p>
          </div>
          <div className="p-3">
            <div className="w-full aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-black">
              <CameraFeed
                stream={stream}
                isCameraOn={isCameraOn}
                isMicOn={true}
                videoRef={videoRef}
                violationAlert={aiViolationAlert}
              />
            </div>
            <p className="text-xs text-center text-slate-400 mt-2">
              {isCameraOn ? "📹 Live" : "⚠ Camera off"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Bottom nav bar ── */}
      <div className="flex-none flex items-center justify-between px-5 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
          disabled={currentQuestion === 0}
        >
          ← Previous
        </Button>

        <div className="flex items-center gap-1.5">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrentQuestion(i)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                i === currentQuestion ? "bg-blue-600 text-white"
                : answers[q.id] !== undefined ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {currentQuestion < questions.length - 1 ? (
          <Button onClick={() => setCurrentQuestion(currentQuestion + 1)}>
            Next →
          </Button>
        ) : (
          <Button
            onClick={() => handleSubmit()}
            disabled={submitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {submitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting</>
            ) : (
              <><Send className="mr-2 h-4 w-4" /> Submit Assessment</>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function AssessmentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#B8915C]" />
        </div>
      }
    >
      <AssessmentContent />
    </Suspense>
  );
}
