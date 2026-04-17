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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useCamera } from "@/hooks/useCamera";
import { useProctoring } from "@/hooks/useProctoring";
import { useAIProctoring } from "@/hooks/useAIProctoring";

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
  const {
    videoRef,
    isCameraOn,
    stream,
    error: cameraError,
    retry: retryCamera,
  } = useCamera();

  const reportViolation = useCallback(
    async (reason: string, type: string) => {
      if (!applicationId) {
        return;
      }

      try {
        await proctoringAPI.reportViolation(
          applicationId,
          type,
          new Date().toISOString(),
          reason,
          "assessment"
        );
      } catch (violationError) {
        console.error("Failed to report assessment violation", violationError);
      }
    },
    [applicationId]
  );

  const {
    violations,
    isOnline,
    isFullscreen,
    addViolation,
    requestFullscreen,
  } = useProctoring({
    active: started && !submitted,
    requireFullscreen: true,
    onViolation: ({ reason, type }) => {
      setProctoringNotice(reason);
      void reportViolation(reason, type);
    },
  });

  // AI Vision Proctoring for assessment
  const {
    faceCount,
    phoneDetected: assessmentPhoneDetected,
  } = useAIProctoring({
    videoRef,
    active: started && !submitted && isCameraOn,
    intervalMs: 3000,
    onViolation: ({ type, message }) => {
      addViolation(message, type);
    },
  });

  useEffect(() => {
    let mounted = true;

    async function loadProfileStatus() {
      try {
        setLoadingProfile(true);
        const status = await profileAPI.getCandidateStatus();

        if (mounted) {
          setProfileCompleted(status.profile_completed);
        }
      } catch (profileError) {
        if (mounted) {
          setError(
            profileError instanceof Error
              ? profileError.message
              : "Failed to verify profile completion."
          );
          setProfileCompleted(false);
        }
      } finally {
        if (mounted) {
          setLoadingProfile(false);
        }
      }
    }

    loadProfileStatus();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadApplicationMeta() {
      if (!applicationId) {
        return;
      }

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
      } catch {
        // Keep interview fallbacks if detail loading fails.
      }
    }

    loadApplicationMeta();

    return () => {
      mounted = false;
    };
  }, [applicationId]);

  useEffect(() => {
    if (profileCompleted === false) {
      const timer = setTimeout(() => {
        router.push("/candidate/profile");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [profileCompleted, router]);

  const questions = useMemo(() => assessmentQuestions, [assessmentQuestions]);
  const question = questions[currentQuestion];

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  const handleStartAssessment = async () => {
    if (!applicationId) {
      setError("Missing application ID. Open the assessment from your application card.");
      return;
    }

    if (blockedByViolation) {
      setError("This assessment cannot be restarted because it was already auto-submitted after violations.");
      return;
    }

    if (!primaryAgreementAccepted || !secondaryAgreementAccepted) {
      setError("You must accept both proctoring notices before starting.");
      return;
    }

    if (!stream || !isCameraOn) {
      setError("Camera access is required before starting the assessment.");
      return;
    }

    try {
      setStartingAssessment(true);
      setError(null);
      setProctoringNotice(null);

      const fullscreenGranted = await requestFullscreen();
      if (!fullscreenGranted) {
        setError("Fullscreen permission is required to start the assessment.");
        return;
      }

      const response = await assessmentAPI.startAssessment(applicationId);
      const normalizedQuestions = normalizeQuestions(
        response.mcq_questions,
        response.coding_questions
      );

      setAssessmentQuestions(normalizedQuestions);
      setStarted(true);
      setTimeLeft(3600);
      setCurrentQuestion(0);
    } catch (startError) {
      setError(
        startError instanceof Error ? startError.message : "Failed to start assessment."
      );
    } finally {
      setStartingAssessment(false);
    }
  };

  const handleSubmit = useCallback(async (forcedByViolation: boolean = false) => {
    if (!applicationId) {
      setError("Missing application ID. Cannot submit assessment.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const mcq_answers = questions
        .filter((item): item is Extract<AssessmentQuestion, { type: "mcq" }> => item.type === "mcq")
        .map((question) => ({
          question_id: question.id,
          selected_option: ["A", "B", "C", "D"][Number(answers[question.id] ?? 0)] || "A",
        }));

      const coding_submissions = questions
        .filter((item): item is Extract<AssessmentQuestion, { type: "coding" }> => item.type === "coding")
        .map((question) => ({
          question_id: question.id,
          code: String(answers[question.id] ?? question.starterCode ?? ""),
          language: "python3",
        }));

      const result = await assessmentAPI.submitAssessment(applicationId, {
        mcq_answers,
        coding_submissions,
        forced_by_violation: forcedByViolation,
      });

      setSubmissionResult(result);
      setSubmitted(true);
      if (forcedByViolation) {
        setTimeout(() => {
          router.push("/candidate/applications");
        }, 1200);
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Failed to submit assessment."
      );
    } finally {
      setSubmitting(false);
    }
  }, [applicationId, questions, answers, router]);

  useEffect(() => {
    if (started && !submitted && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft((previous) => previous - 1), 1000);
      return () => clearInterval(timer);
    }

    if (timeLeft === 0 && started && !submitted && !submitting) {
      void handleSubmit();
    }
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

  if (loadingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#B8915C]" />
      </div>
    );
  }

  if (profileCompleted === false) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-2xl border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <AlertIcon className="h-6 w-6 text-amber-600" />
              Complete Your Profile First
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg bg-amber-50 p-4 dark:bg-amber-950/30">
              <p className="mb-4 text-amber-900 dark:text-amber-300">
                Your backend profile status is still marked incomplete. Redirecting to your
                profile page in 3 seconds...
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/candidate/profile" className="flex-1">
                <Button className="w-full">Complete Profile</Button>
              </Link>
              <Link href="/candidate/applications" className="flex-1">
                <Button variant="outline" className="w-full">
                  Back to Applications
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-lg border-slate-200 text-center dark:border-slate-800">
          <CardContent className="p-12">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="mb-2 text-2xl font-bold">Assessment Submitted!</h2>
            <p className="mb-6 text-slate-600 dark:text-slate-400">
              Score: {submissionResult?.total_score ?? 0}/100
            </p>
            {submissionResult?.next_status === "assessment_completed" && (
              <p className="mb-4 text-sm text-amber-700 dark:text-amber-300">
                Assessment ended and has been recorded. Redirecting to your applications.
              </p>
            )}
            {submissionResult?.qualifies_for_interview ? (
              <div className="space-y-3">
                <p className="text-sm text-[#B8915C]">
                  Assessment cleared. You can start the AI interview now.
                </p>
                <Link
                  href={`/candidate/interview?applicationId=${applicationId}&company=${encodeURIComponent(
                    applicationMeta?.company || "Tech Company"
                  )}&position=${encodeURIComponent(
                    applicationMeta?.position || "Software Engineer"
                  )}`}
                >
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

  if (!started) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-2xl border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-2xl">Assessment</CardTitle>
            <p className="text-slate-600 dark:text-slate-400">
              Application ID: {applicationId ?? "Unavailable"}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/30">
              <h3 className="mb-2 font-semibold text-blue-900 dark:text-blue-300">
                Instructions
              </h3>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-400">
                <li>- Duration: 60 minutes</li>
                <li>- Questions are loaded dynamically from the backend when you start</li>
                <li>- Once started, the assessment cannot be paused</li>
                <li>- Auto-submits when time expires</li>
              </ul>
            </div>

            <div className="space-y-3 rounded-lg border border-[#D6CDC2] bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-900/60">
              <p className="text-sm font-semibold text-[#2D2A24] dark:text-white">
                Proctoring agreement
              </p>
              <p className="text-sm text-[#5A534A] dark:text-slate-400">
                This is a proctored test. Webcam monitoring, tab switching detection, and
                activity tracking are active. If more than 3 violations occur, the session will
                automatically end.
              </p>
              <p className="text-sm text-[#5A534A] dark:text-slate-400">
                This is a proctored test. Webcam monitoring, tab switching detection, and
                activity tracking are active. If more than 3 violations occur, the session will
                automatically end.
              </p>
              <label className="flex items-start gap-3 text-sm text-[#5A534A] dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={primaryAgreementAccepted}
                  onChange={(event) => setPrimaryAgreementAccepted(event.target.checked)}
                  className="mt-1"
                />
                I understand this assessment is fully proctored and may auto-submit on violation.
              </label>
              <label className="flex items-start gap-3 text-sm text-[#5A534A] dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={secondaryAgreementAccepted}
                  onChange={(event) => setSecondaryAgreementAccepted(event.target.checked)}
                  className="mt-1"
                />
                I agree to webcam monitoring, fullscreen enforcement, and activity tracking.
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
              <div className="rounded-lg border border-[#D6CDC2] bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-900/60">
                <div className="mb-3 flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-[#B8915C]" />
                  <p className="text-sm font-semibold text-[#2D2A24] dark:text-white">
                    Proctoring active after start
                  </p>
                </div>
                <ul className="space-y-2 text-sm text-[#5A534A] dark:text-slate-400">
                  <li className="flex items-center gap-2">
                    <Camera className="h-4 w-4 text-[#B8915C]" />
                    Webcam monitoring required
                  </li>
                  <li className="flex items-center gap-2">
                    <Expand className="h-4 w-4 text-[#B8915C]" />
                    Fullscreen enforcement enabled
                  </li>
                  <li className="flex items-center gap-2">
                    <Copy className="h-4 w-4 text-[#B8915C]" />
                    Copy, paste, tab switch, and suspicious actions are logged
                  </li>
                </ul>
              </div>
              <div className="overflow-hidden rounded-lg border border-[#D6CDC2] bg-black dark:border-slate-700">
                {stream ? (
                  <video ref={videoRef} autoPlay muted playsInline className="h-full min-h-[180px] w-full object-cover" />
                ) : (
                  <div className="flex min-h-[180px] items-center justify-center p-4 text-center text-sm text-slate-300">
                    Webcam preview unavailable
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 rounded-lg bg-amber-50 p-4 dark:bg-amber-950/30">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600" />
              <p className="text-sm text-amber-800 dark:text-amber-400">
                Make sure your internet connection is stable before starting. The test runs in a
                proctored fullscreen session.
              </p>
            </div>

            {cameraError && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
                {cameraError}
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleStartAssessment}
                disabled={
                  startingAssessment ||
                  !stream ||
                  !isCameraOn ||
                  blockedByViolation ||
                  !primaryAgreementAccepted ||
                  !secondaryAgreementAccepted
                }
                className="h-12 flex-1 text-lg"
              >
                {startingAssessment ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  "Start Assessment"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void retryCamera()}
                className="h-12 border-[#D6CDC2]"
              >
                Retry Camera
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-lg border-slate-200 dark:border-slate-800">
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

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Assessment</h1>
            <p className="text-slate-600 dark:text-slate-400">
              Application ID: {applicationId}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 dark:bg-slate-900">
            <Clock className={`h-5 w-5 ${timeLeft < 300 ? "text-red-500" : "text-blue-600"}`} />
            <span className={`font-mono font-semibold ${timeLeft < 300 ? "text-red-500" : ""}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs text-slate-500">Network</p>
            <p className={`mt-1 text-sm font-semibold ${isOnline ? "text-green-600" : "text-red-500"}`}>
              {isOnline ? "Stable" : "Offline"}
            </p>
          </div>
          <div className="rounded-lg border bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs text-slate-500">Fullscreen</p>
            <p className={`mt-1 text-sm font-semibold ${isFullscreen ? "text-green-600" : "text-red-500"}`}>
              {isFullscreen ? "Locked" : "Exited"}
            </p>
          </div>
          <div className="rounded-lg border bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs text-slate-500">Faces Detected</p>
            <p className={`mt-1 text-sm font-semibold ${
              faceCount === null || faceCount === 1 ? "text-green-600" : "text-red-500"
            }`}>
              {faceCount === null ? "Scanning" : faceCount}
            </p>
          </div>
          <div className="rounded-lg border bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs text-slate-500">Violations</p>
            <p className={`mt-1 text-sm font-semibold ${violations > 0 ? "text-red-500" : "text-green-600"}`}>
              {violations}
            </p>
          </div>
        </div>

        <div className="mb-6 overflow-hidden rounded-lg border bg-black dark:border-slate-800">
          {stream ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="h-44 w-full object-cover opacity-90"
            />
          ) : (
            <div className="flex h-44 items-center justify-center text-sm text-slate-300">
              Webcam feed unavailable during assessment
            </div>
          )}
        </div>

        {proctoringNotice && (
          <div className="mb-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
            {proctoringNotice}
          </div>
        )}

        <div className="mb-6 flex items-center gap-2">
          {questions.map((item, index) => (
            <button
              key={item.id}
              onClick={() => setCurrentQuestion(index)}
              className={`h-2 flex-1 rounded-full transition-colors ${
                index === currentQuestion
                  ? "bg-blue-600"
                  : answers[item.id] !== undefined
                  ? "bg-green-500"
                  : "bg-slate-200 dark:bg-slate-700"
              }`}
            />
          ))}
        </div>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant="outline">{question.type.toUpperCase()}</Badge>
                  <Badge variant="secondary">{question.points} points</Badge>
                </div>
                <CardTitle className="text-xl">{question.title}</CardTitle>
              </div>
              <span className="text-sm text-slate-500">
                {currentQuestion + 1} / {questions.length}
              </span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-slate-600 dark:text-slate-400">
              {question.description}
            </p>
          </CardHeader>
          <CardContent>
            {question.type === "coding" && (
              <Textarea
                value={String(answers[question.id] ?? question.starterCode)}
                onChange={(event) =>
                  setAnswers((current) => ({ ...current, [question.id]: event.target.value }))
                }
                className="min-h-[350px] bg-slate-50 font-mono text-sm dark:bg-slate-900"
              />
            )}

            {question.type === "mcq" && (
              <div className="space-y-3">
                {question.options.map((option, index) => (
                  <button
                    key={option}
                    onClick={() =>
                      setAnswers((current) => ({ ...current, [question.id]: index }))
                    }
                    className={`w-full rounded-lg border-2 p-4 text-left transition-colors ${
                      answers[question.id] === index
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-950/30"
                        : "border-slate-200 hover:border-slate-300 dark:border-slate-800"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>
          {currentQuestion < questions.length - 1 ? (
            <Button onClick={() => setCurrentQuestion(currentQuestion + 1)}>Next</Button>
          ) : (
            <Button
              onClick={() => handleSubmit()}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Assessment
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AssessmentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#B8915C]" />
        </div>
      }
    >
      <AssessmentContent />
    </Suspense>
  );
}
