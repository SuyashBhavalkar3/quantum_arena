"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertCircle, ArrowLeft, CheckCircle, Download, FileText,
  Loader2, BarChart2, TrendingUp, ShieldAlert, Star, Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CandidateReport, candidateReportsAPI } from "@/lib/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const labelForStatus = (status?: string | null) =>
  status?.split("_").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ") ?? "Unknown";

const formatViolationLabel = (value: unknown) =>
  typeof value === "string"
    ? value.split("_").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ")
    : "Violation";

const scoreColor = (score: number) => {
  if (score >= 75) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 50) return "text-[#B8915C]";
  return "text-red-500 dark:text-red-400";
};

const recommendationStyle = (rec?: string | null) => {
  if (!rec) return "bg-[#F1E9E0] text-[#2D2A24] border border-[#E8E0D6]";
  const r = rec.toLowerCase();
  if (r.includes("hire") && !r.includes("no"))
    return "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200";
  if (r.includes("no hire") || r.includes("reject"))
    return "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200";
  return "bg-[#F1E9E0] dark:bg-slate-800/50 text-[#B8915C] border border-[#E8E0D6]";
};

// ─── Generation step config ────────────────────────────────────────────────────
const STEPS = [
  { label: "Reading your assessment data", delay: 0 },
  { label: "Analysing interview responses", delay: 3000 },
  { label: "Evaluating competency scores", delay: 7000 },
  { label: "Generating AI summary", delay: 12000 },
  { label: "Building performance charts", delay: 18000 },
  { label: "Compiling final report", delay: 25000 },
];

// ─── Generating Loader ────────────────────────────────────────────────────────
function GeneratingLoader({ applicationId }: { applicationId: number }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [doneIds, setDoneIds] = useState<number[]>([]);

  useEffect(() => {
    const timers = STEPS.map((step, i) =>
      setTimeout(() => {
        setActiveIdx(i);
        if (i > 0) setDoneIds((prev) => [...prev, i - 1]);
      }, step.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <Card className="border border-[#E8E0D6] bg-white dark:bg-slate-900 shadow-lg w-full">
      <CardContent className="p-8">
        {/* Icon + title */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative mb-5">
            {/* Outer ring pulse */}
            <span className="absolute inset-0 rounded-full bg-[#B8915C]/20 animate-ping" style={{ animationDuration: "1.6s" }} />
            <div className="relative w-16 h-16 rounded-full bg-[#F1E9E0] border-2 border-[#B8915C]/30 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-[#B8915C]" />
            </div>
          </div>

          <h3 className="text-lg font-semibold text-[#2D2A24] dark:text-white">
            Generating Your Report
          </h3>
          <p className="mt-1 text-sm text-[#7A6E65] dark:text-slate-400">
            AI is analysing your performance for Application #{applicationId}
          </p>
        </div>

        {/* Animated progress bar */}
        <div className="h-1.5 w-full bg-[#E8E0D6] dark:bg-slate-700 rounded-full overflow-hidden mb-6">
          <motion.div
            className="h-full bg-[#B8915C] rounded-full"
            initial={{ width: "4%" }}
            animate={{ width: `${Math.round(((activeIdx + 1) / STEPS.length) * 100)}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>

        {/* Step list */}
        <div className="space-y-3">
          {STEPS.map((step, i) => {
            const done = doneIds.includes(i);
            const active = activeIdx === i;
            return (
              <div
                key={step.label}
                className={`flex items-center gap-3 text-sm transition-all duration-300 ${
                  done   ? "text-emerald-600 dark:text-emerald-400" :
                  active ? "text-[#2D2A24] dark:text-white font-medium" :
                           "text-[#C4BAB2] dark:text-slate-600"
                }`}
              >
                {done ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                ) : active ? (
                  <Loader2 className="w-4 h-4 text-[#B8915C] animate-spin flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-[#D6CDC2] dark:border-slate-600 flex-shrink-0" />
                )}
                {step.label}
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-center text-xs text-[#A69A8C]">
          This usually takes 15–45 seconds — please don&apos;t close the page.
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Score progress bar ───────────────────────────────────────────────────────
function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-[#5A534A] dark:text-slate-400">{label}</span>
        <span className={`text-xs font-semibold ${scoreColor(value)}`}>{value}%</span>
      </div>
      <div className="h-1.5 bg-[#E8E0D6] dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            value >= 75 ? "bg-emerald-500" : value >= 50 ? "bg-[#B8915C]" : "bg-red-400"
          }`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * Page state machine:
 *   "loading"     → initial mount, attempting to fetch existing report
 *   "generating"  → no report found, triggering AI generation + polling
 *   "ready"       → report fetched successfully
 *   "error"       → unrecoverable error
 */
type Stage = "loading" | "generating" | "ready" | "error";

export default function CandidateReportPage() {
  const params = useParams<{ applicationId: string }>();
  const applicationId = Number(params.applicationId);

  const [stage, setStage]                   = useState<Stage>("loading");
  const [report, setReport]                 = useState<CandidateReport | null>(null);
  const [error, setError]                   = useState<string | null>(null);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const generationLock                      = useRef(false);

  // ── Orchestration ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!Number.isFinite(applicationId)) {
      setError("Invalid application ID.");
      setStage("error");
      return;
    }

    let cancelled = false;

    async function run() {
      // 1. Try to get existing report
      try {
        const data = await candidateReportsAPI.getMyReport(applicationId);
        if (!cancelled) { setReport(data); setStage("ready"); }
        return;
      } catch {
        // Report doesn't exist yet — fall through to generation
      }

      // 2. Show generating state IMMEDIATELY
      if (!cancelled) setStage("generating");

      // 3. Kick off generation (idempotent — safe to call even if already running)
      if (!generationLock.current) {
        generationLock.current = true;
        try {
          await candidateReportsAPI.generateMyReport(applicationId);
        } catch (genErr: any) {
          // Generation may fail if it's already in progress — continue polling
          console.warn("Generate call:", genErr?.message);
        }
      }

      // 4. Poll every 3 s for up to 90 s
      let polls = 0;
      await new Promise<void>((resolve) => {
        const tick = setInterval(async () => {
          if (cancelled) { clearInterval(tick); resolve(); return; }
          polls++;
          try {
            const data = await candidateReportsAPI.getMyReport(applicationId);
            clearInterval(tick);
            if (!cancelled) { setReport(data); setStage("ready"); }
            resolve();
          } catch {
            if (polls >= 30) {
              clearInterval(tick);
              if (!cancelled) {
                setError("Report generation is taking longer than expected. Please refresh the page in a few moments.");
                setStage("error");
              }
              resolve();
            }
          }
        }, 3000);
      });
    }

    run();
    return () => { cancelled = true; };
  }, [applicationId]);

  // ── Download ────────────────────────────────────────────────────────────────
  const handleDownload = async () => {
    if (!report) return;
    try {
      setDownloadLoading(true);
      const blob = await candidateReportsAPI.downloadMyReport(report.id, applicationId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `my_report_${applicationId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed.");
    } finally {
      setDownloadLoading(false);
    }
  };

  const chartEntries = useMemo(() => Object.entries(report?.chart_images ?? {}), [report?.chart_images]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Page header (always visible) ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/candidate/applications"
            className="mb-3 inline-flex items-center gap-2 text-sm text-[#5A534A] dark:text-slate-400 hover:text-[#2D2A24] dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Applications
          </Link>
          <h1 className="font-serif text-4xl font-medium text-[#2D2A24] dark:text-white">
            My Evaluation Report
          </h1>
          <p className="mt-2 text-[#5A534A] dark:text-slate-400">
            AI-generated candidate evaluation for Application #{applicationId}
          </p>
        </div>

        {stage === "ready" && report?.status === "completed" && (
          <Button onClick={handleDownload} disabled={downloadLoading} className="bg-[#B8915C] hover:bg-[#9F7A4F]">
            {downloadLoading
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <Download className="mr-2 h-4 w-4" />}
            Download PDF
          </Button>
        )}
      </div>

      {/* ── Content area ── */}
      <AnimatePresence mode="sync">

        {/* Loading skeleton */}
        {stage === "loading" && (
          <motion.div key="loading" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-[#E8E0D6] dark:border-slate-800 shadow-sm animate-pulse" />
              ))}
            </div>
          </motion.div>
        )}

        {/* Generating animated loader */}
        {stage === "generating" && (
          <motion.div
            key="generating"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <GeneratingLoader applicationId={applicationId} />
          </motion.div>
        )}

        {/* Error state */}
        {stage === "error" && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card className="border border-red-200 bg-red-50 dark:bg-red-900/20">
              <CardContent className="flex items-start gap-3 p-5">
                <AlertCircle className="mt-0.5 h-5 w-5 text-red-600 dark:text-red-300 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
                  <button
                    onClick={() => {
                      generationLock.current = false;
                      setStage("loading");
                      setError(null);
                    }}
                    className="mt-2 text-xs text-[#B8915C] underline underline-offset-2 hover:text-[#9F7A4F]"
                  >
                    Try again
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Full report */}
        {stage === "ready" && report && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >

            {/* ── Hero card ── */}
            <Card className="border-none bg-white/70 shadow-lg backdrop-blur-sm dark:bg-slate-900/70">
              <CardContent className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="font-serif text-3xl font-medium text-[#2D2A24] dark:text-white">
                      {report.subject?.candidate_name ?? "Your Application"}
                    </h2>
                    <p className="mt-1 text-[#5A534A] dark:text-slate-400">
                      {report.subject?.job_title ?? `Application #${report.application_id}`}
                    </p>
                    {report.candidate_summary && (
                      <p className="mt-3 max-w-3xl text-sm text-[#5A534A] dark:text-slate-400 leading-relaxed">
                        {report.candidate_summary}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className="border-none bg-[#B8915C]/10 text-[#B8915C]">
                      {labelForStatus(report.status)}
                    </Badge>
                    {report.generated_at && (
                      <p className="text-xs text-[#A69A8C]">
                        Generated {new Date(report.generated_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                  {[
                    { label: "Application", value: `#${report.application_id}`, plain: true },
                    { label: "Assessment",  value: report.assessment  ? `${Math.round(report.assessment.score)}%`  : "N/A", score: report.assessment?.score },
                    { label: "Interview",   value: report.interview   ? `${Math.round(report.interview.score)}%`   : "N/A", score: report.interview?.score  },
                    { label: "Recommendation", value: report.final_recommendation ?? "Pending", gold: true },
                  ].map(({ label, value, plain, score, gold }) => (
                    <div key={label} className="rounded-xl bg-[#F1E9E0] dark:bg-slate-800/50 p-4">
                      <p className="text-xs uppercase tracking-wide text-[#A69A8C]">{label}</p>
                      <p className={`mt-2 text-2xl font-bold ${
                        plain ? "text-[#2D2A24] dark:text-white" :
                        gold  ? "text-[#B8915C]" :
                        score !== undefined ? scoreColor(score) : "text-[#A69A8C]"
                      }`}>
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* ── Final verdict ── */}
            {report.final_recommendation && (
              <Card className="border-none bg-white/70 shadow-lg backdrop-blur-sm dark:bg-slate-900/70">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-[#B8915C]/10 flex items-center justify-center">
                      <Star className="w-5 h-5 text-[#B8915C]" />
                    </div>
                    <h2 className="text-xl font-semibold text-[#2D2A24] dark:text-white">Final Verdict</h2>
                  </div>
                  <div className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-lg font-semibold ${recommendationStyle(report.final_recommendation)}`}>
                    {report.final_recommendation}
                  </div>
                  {(report.behavioral_observations ?? []).length > 0 && (
                    <div className="mt-4 space-y-2">
                      {(report.behavioral_observations ?? []).map((obs, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-[#5A534A] dark:text-slate-400">
                          <CheckCircle className="w-4 h-4 text-[#B8915C] flex-shrink-0 mt-0.5" /> {obs}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ── Strengths / Weaknesses ── */}
            {((report.strengths ?? []).length > 0 || (report.weaknesses ?? []).length > 0) && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {(report.strengths ?? []).length > 0 && (
                  <Card className="border-none bg-white/70 shadow-lg backdrop-blur-sm dark:bg-slate-900/70">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-[#2D2A24] dark:text-white">Your Strengths</h2>
                      </div>
                      <ul className="space-y-2">
                        {(report.strengths ?? []).map((item, i) => (
                          <li key={i} className="flex items-start gap-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 text-sm text-[#2D2A24] dark:text-slate-300">
                            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" /> {item}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
                {(report.weaknesses ?? []).length > 0 && (
                  <Card className="border-none bg-white/70 shadow-lg backdrop-blur-sm dark:bg-slate-900/70">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                          <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-[#2D2A24] dark:text-white">Areas to Improve</h2>
                      </div>
                      <ul className="space-y-2">
                        {(report.weaknesses ?? []).map((item, i) => (
                          <li key={i} className="flex items-start gap-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-sm text-[#2D2A24] dark:text-slate-300">
                            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" /> {item}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* ── Assessment + Interview ── */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              {/* Assessment */}
              <Card className="border-none bg-white/70 shadow-lg backdrop-blur-sm dark:bg-slate-900/70">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-[#2D2A24] dark:text-white mb-4">Assessment Results</h2>
                  {report.assessment ? (
                    <>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="rounded-xl bg-[#F1E9E0] dark:bg-slate-800/50 p-4">
                          <p className="text-xs uppercase tracking-wide text-[#A69A8C]">Accuracy</p>
                          <p className={`mt-2 text-xl font-bold ${scoreColor(report.assessment.accuracy_percent)}`}>
                            {report.assessment.accuracy_percent}%
                          </p>
                        </div>
                        <div className="rounded-xl bg-[#F1E9E0] dark:bg-slate-800/50 p-4">
                          <p className="text-xs uppercase tracking-wide text-[#A69A8C]">Time Spent</p>
                          <p className="mt-2 text-xl font-bold text-[#2D2A24] dark:text-white">
                            {report.assessment.duration_minutes} min
                          </p>
                        </div>
                      </div>
                      {Object.keys(report.assessment.section_scores ?? {}).length > 0 && (
                        <div className="rounded-xl bg-[#F1E9E0] dark:bg-slate-800/50 p-4">
                          <p className="text-sm font-medium text-[#2D2A24] dark:text-white mb-3">Section Scores</p>
                          <div className="space-y-3">
                            {Object.entries(report.assessment.section_scores).map(([label, value]) => (
                              <ScoreBar key={label} label={label} value={value} />
                            ))}
                          </div>
                        </div>
                      )}
                      {report.assessment.violation_count > 0 && (
                        <div className="mt-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
                          <p className="text-sm font-medium text-red-700 dark:text-red-300">
                            {report.assessment.violation_count} proctoring violation{report.assessment.violation_count !== 1 ? "s" : ""} detected
                          </p>
                          <div className="mt-2 space-y-1">
                            {(report.assessment.violations ?? []).slice(0, 5).map((v, i) => (
                              <p key={i} className="text-xs text-red-600 dark:text-red-400">
                                • {formatViolationLabel(v.type)} — {String(v.timestamp ?? "")}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-[#A69A8C]">Assessment data not available.</p>
                  )}
                </CardContent>
              </Card>

              {/* Interview */}
              <Card className="border-none bg-white/70 shadow-lg backdrop-blur-sm dark:bg-slate-900/70">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-[#2D2A24] dark:text-white mb-4">AI Interview Results</h2>
                  {report.interview ? (
                    <>
                      {(report.interview.summary || report.interview_summary) && (
                        <p className="text-sm text-[#5A534A] dark:text-slate-400 mb-4 leading-relaxed">
                          {report.interview.summary || report.interview_summary}
                        </p>
                      )}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="rounded-xl bg-[#F1E9E0] dark:bg-slate-800/50 p-4">
                          <p className="text-xs uppercase tracking-wide text-[#A69A8C]">Status</p>
                          <p className="mt-2 text-sm font-semibold text-[#2D2A24] dark:text-white">
                            {labelForStatus(report.interview.status)}
                          </p>
                        </div>
                        <div className="rounded-xl bg-[#F1E9E0] dark:bg-slate-800/50 p-4">
                          <p className="text-xs uppercase tracking-wide text-[#A69A8C]">Duration</p>
                          <p className="mt-2 text-xl font-bold text-[#2D2A24] dark:text-white">
                            {report.interview.duration_minutes} min
                          </p>
                        </div>
                      </div>
                      {Object.keys(report.interview.skill_ratings ?? {}).length > 0 && (
                        <div className="rounded-xl bg-[#F1E9E0] dark:bg-slate-800/50 p-4">
                          <p className="text-sm font-medium text-[#2D2A24] dark:text-white mb-3">Skill Ratings</p>
                          <div className="space-y-3">
                            {Object.entries(report.interview.skill_ratings).map(([label, value]) => (
                              <ScoreBar key={label} label={label} value={value} />
                            ))}
                          </div>
                        </div>
                      )}
                      {report.interview.violation_count > 0 && (
                        <div className="mt-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
                          <p className="text-sm font-medium text-red-700 dark:text-red-300">
                            {report.interview.violation_count} proctoring violation{report.interview.violation_count !== 1 ? "s" : ""} detected
                          </p>
                          <div className="mt-2 space-y-1">
                            {(report.interview.violations ?? []).slice(0, 5).map((v, i) => (
                              <p key={i} className="text-xs text-red-600 dark:text-red-400">
                                • {formatViolationLabel(v.type)} — {String(v.timestamp ?? "")}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-[#A69A8C]">Interview data not available.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* ── Charts ── */}
            {chartEntries.length > 0 && (
              <Card className="border-none bg-white/70 shadow-lg backdrop-blur-sm dark:bg-slate-900/70">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded-xl bg-[#B8915C]/10 flex items-center justify-center">
                      <BarChart2 className="w-5 h-5 text-[#B8915C]" />
                    </div>
                    <h2 className="text-xl font-semibold text-[#2D2A24] dark:text-white">Performance Visualizations</h2>
                  </div>
                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    {chartEntries.map(([key, value]) => (
                      <div key={key} className="rounded-xl bg-[#F1E9E0] dark:bg-slate-800/50 p-4">
                        <p className="mb-3 flex items-center gap-2 text-sm font-medium text-[#2D2A24] dark:text-white">
                          <FileText className="h-4 w-4 text-[#B8915C]" />
                          {labelForStatus(key)}
                        </p>
                        <img
                          src={`data:image/png;base64,${value}`}
                          alt={key}
                          className="w-full rounded-lg border border-[#D6CDC2] dark:border-slate-700 bg-white/80"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
