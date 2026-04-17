"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertCircle, ArrowLeft, Download, FileText, Loader2, Sparkle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CandidateReport, hrAPI } from "@/lib/api";

const labelForStatus = (status?: string | null) =>
  status
    ? status
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : "Unknown";

const formatViolationLabel = (value: unknown) =>
  typeof value === "string"
    ? value
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : "Violation";

export default function HRReportPage() {
  const params = useParams<{ applicationId: string }>();
  const applicationId = Number(params.applicationId);

  const [report, setReport] = useState<CandidateReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadReport() {
      try {
        setLoading(true);
        setError(null);
        const data = await hrAPI.getCandidateReport(applicationId);
        if (mounted) {
          setReport(data);
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load report.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    if (Number.isFinite(applicationId)) {
      loadReport();
    } else {
      setError("Invalid application id.");
      setLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [applicationId]);

  const handleDownload = async () => {
    if (!report) {
      return;
    }

    try {
      setDownloadLoading(true);
      const blob = await hrAPI.downloadCandidateReport(report.id);
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `candidate_report_${report.application_id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "Failed to download report.");
    } finally {
      setDownloadLoading(false);
    }
  };

  const chartEntries = useMemo(() => Object.entries(report?.chart_images ?? {}), [report?.chart_images]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-80" />
        <Skeleton className="h-36 w-full" />
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/hr/applicants"
            className="mb-3 inline-flex items-center gap-2 text-sm text-[#5A534A] transition-colors hover:text-[#2D2A24]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Applicants
          </Link>
          <h1 className="flex items-center gap-2 font-serif text-4xl font-medium text-[#2D2A24] dark:text-white">
            Evaluation Report
            
          </h1>
          <p className="mt-2 text-[#5A534A] dark:text-slate-400">
            Native HR view for application #{applicationId}.
          </p>
        </div>

        {report?.status === "completed" && (
          <Button
            onClick={handleDownload}
            disabled={downloadLoading}
            className="bg-[#B8915C] hover:bg-[#9F7A4F]"
          >
            {downloadLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Download PDF
          </Button>
        )}
      </div>

      {error && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 text-orange-600 dark:text-orange-300" />
            <p className="text-sm text-orange-700 dark:text-orange-300">{error}</p>
          </CardContent>
        </Card>
      )}

      {report && (
        <>
          <Card className="border-none bg-white/70 shadow-lg backdrop-blur-sm dark:bg-slate-900/70">
            <CardContent className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="font-serif text-3xl font-medium text-[#2D2A24] dark:text-white">
                    {report.subject?.candidate_name ?? "Candidate"}
                  </h2>
                  <p className="mt-2 text-[#5A534A] dark:text-slate-400">
                    {report.subject?.job_title ?? `Application #${report.application_id}`}
                  </p>
                  <p className="mt-3 max-w-3xl text-sm text-[#5A534A] dark:text-slate-400">
                    {report.candidate_summary ?? "Report summary unavailable."}
                  </p>
                </div>

                <div className="flex flex-col items-start gap-2">
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

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-lg bg-[#F1E9E0] p-4 dark:bg-slate-800/50">
                  <p className="text-xs uppercase tracking-wide text-[#A69A8C]">Application</p>
                  <p className="mt-2 text-2xl font-semibold text-[#2D2A24] dark:text-white">
                    #{report.application_id}
                  </p>
                </div>
                <div className="rounded-lg bg-[#F1E9E0] p-4 dark:bg-slate-800/50">
                  <p className="text-xs uppercase tracking-wide text-[#A69A8C]">Assessment Score</p>
                  <p className="mt-2 text-2xl font-semibold text-[#2D2A24] dark:text-white">
                    {report.assessment ? `${Math.round(report.assessment.score)}%` : "N/A"}
                  </p>
                </div>
                <div className="rounded-lg bg-[#F1E9E0] p-4 dark:bg-slate-800/50">
                  <p className="text-xs uppercase tracking-wide text-[#A69A8C]">Interview Score</p>
                  <p className="mt-2 text-2xl font-semibold text-[#2D2A24] dark:text-white">
                    {report.interview ? `${Math.round(report.interview.score)}%` : "N/A"}
                  </p>
                </div>
                <div className="rounded-lg bg-[#F1E9E0] p-4 dark:bg-slate-800/50">
                  <p className="text-xs uppercase tracking-wide text-[#A69A8C]">Recommendation</p>
                  <p className="mt-2 text-2xl font-semibold text-[#B8915C]">
                    {report.final_recommendation ?? "Neutral"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card className="border-none bg-white/70 shadow-lg backdrop-blur-sm dark:bg-slate-900/70">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-[#2D2A24] dark:text-white">
                  Assessment Analysis
                </h2>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-[#F1E9E0] p-4 dark:bg-slate-800/50">
                    <p className="text-xs uppercase tracking-wide text-[#A69A8C]">Accuracy</p>
                    <p className="mt-2 text-xl font-semibold text-[#2D2A24] dark:text-white">
                      {report.assessment ? `${report.assessment.accuracy_percent}%` : "N/A"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[#F1E9E0] p-4 dark:bg-slate-800/50">
                    <p className="text-xs uppercase tracking-wide text-[#A69A8C]">Time Spent</p>
                    <p className="mt-2 text-xl font-semibold text-[#2D2A24] dark:text-white">
                      {report.assessment ? `${report.assessment.duration_minutes} min` : "N/A"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 rounded-lg bg-[#F1E9E0] p-4 dark:bg-slate-800/50">
                  <p className="text-sm font-medium text-[#2D2A24] dark:text-white">Section Performance</p>
                  <div className="mt-3 space-y-2 text-sm text-[#5A534A] dark:text-slate-400">
                    {Object.entries(report.assessment?.section_scores ?? {}).map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between">
                        <span>{label}</span>
                        <span className="font-medium text-[#2D2A24] dark:text-white">{value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 rounded-lg bg-[#F1E9E0] p-4 dark:bg-slate-800/50">
                  <p className="text-sm font-medium text-[#2D2A24] dark:text-white">
                    Assessment Violations
                  </p>
                  <p className="mt-1 text-sm text-[#5A534A] dark:text-slate-400">
                    {report.assessment?.violation_count ?? 0} detected
                  </p>
                  <div className="mt-3 space-y-2">
                    {(report.assessment?.violations ?? []).slice(0, 6).map((violation, index) => (
                      <div
                        key={`${String(violation.timestamp ?? index)}-${index}`}
                        className="rounded-md bg-white/70 p-3 text-sm text-[#5A534A] dark:bg-slate-900/60 dark:text-slate-400"
                      >
                        <p className="font-medium text-[#2D2A24] dark:text-white">
                          {formatViolationLabel(violation.type)}
                        </p>
                        <p>{String(violation.timestamp ?? "Timestamp unavailable")}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none bg-white/70 shadow-lg backdrop-blur-sm dark:bg-slate-900/70">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-[#2D2A24] dark:text-white">
                  AI Interview Analysis
                </h2>
                <p className="mt-2 text-sm text-[#5A534A] dark:text-slate-400">
                  {report.interview?.summary ?? report.interview_summary ?? "Interview summary unavailable."}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-[#F1E9E0] p-4 dark:bg-slate-800/50">
                    <p className="text-xs uppercase tracking-wide text-[#A69A8C]">Status</p>
                    <p className="mt-2 text-xl font-semibold text-[#2D2A24] dark:text-white">
                      {labelForStatus(report.interview?.status)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[#F1E9E0] p-4 dark:bg-slate-800/50">
                    <p className="text-xs uppercase tracking-wide text-[#A69A8C]">Duration</p>
                    <p className="mt-2 text-xl font-semibold text-[#2D2A24] dark:text-white">
                      {report.interview ? `${report.interview.duration_minutes} min` : "N/A"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 rounded-lg bg-[#F1E9E0] p-4 dark:bg-slate-800/50">
                  <p className="text-sm font-medium text-[#2D2A24] dark:text-white">Skill Ratings</p>
                  <div className="mt-3 space-y-2 text-sm text-[#5A534A] dark:text-slate-400">
                    {Object.entries(report.interview?.skill_ratings ?? {}).map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between">
                        <span>{label}</span>
                        <span className="font-medium text-[#2D2A24] dark:text-white">{value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 rounded-lg bg-[#F1E9E0] p-4 dark:bg-slate-800/50">
                  <p className="text-sm font-medium text-[#2D2A24] dark:text-white">
                    Interview Violations
                  </p>
                  <p className="mt-1 text-sm text-[#5A534A] dark:text-slate-400">
                    {report.interview?.violation_count ?? 0} detected
                  </p>
                  <div className="mt-3 space-y-2">
                    {(report.interview?.violations ?? []).slice(0, 6).map((violation, index) => (
                      <div
                        key={`${String(violation.timestamp ?? index)}-${index}`}
                        className="rounded-md bg-white/70 p-3 text-sm text-[#5A534A] dark:bg-slate-900/60 dark:text-slate-400"
                      >
                        <p className="font-medium text-[#2D2A24] dark:text-white">
                          {formatViolationLabel(violation.type)}
                        </p>
                        <p>{String(violation.timestamp ?? "Timestamp unavailable")}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-none bg-white/70 shadow-lg backdrop-blur-sm dark:bg-slate-900/70">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-[#2D2A24] dark:text-white">
                Report Visualizations
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-6 xl:grid-cols-2">
                {chartEntries.map(([key, value]) => (
                  <div key={key} className="rounded-lg bg-[#F1E9E0] p-4 dark:bg-slate-800/50">
                    <p className="mb-3 flex items-center gap-2 text-sm font-medium text-[#2D2A24] dark:text-white">
                      <FileText className="h-4 w-4 text-[#B8915C]" />
                      {labelForStatus(key)}
                    </p>
                    <img
                      src={`data:image/png;base64,${value}`}
                      alt={key}
                      className="w-full rounded-lg border border-[#D6CDC2] bg-white/80"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <Card className="border-none bg-white/70 shadow-lg backdrop-blur-sm dark:bg-slate-900/70">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-[#2D2A24] dark:text-white">Strengths</h2>
                <ul className="mt-4 space-y-3 text-sm text-[#5A534A] dark:text-slate-400">
                  {(report.strengths ?? []).map((item, index) => (
                    <li key={`${item}-${index}`} className="rounded-lg bg-[#F1E9E0] p-3 dark:bg-slate-800/50">
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-none bg-white/70 shadow-lg backdrop-blur-sm dark:bg-slate-900/70">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-[#2D2A24] dark:text-white">
                  Areas for Improvement
                </h2>
                <ul className="mt-4 space-y-3 text-sm text-[#5A534A] dark:text-slate-400">
                  {(report.weaknesses ?? []).map((item, index) => (
                    <li key={`${item}-${index}`} className="rounded-lg bg-[#F1E9E0] p-3 dark:bg-slate-800/50">
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-none bg-white/70 shadow-lg backdrop-blur-sm dark:bg-slate-900/70">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-[#2D2A24] dark:text-white">
                  Final Recommendation
                </h2>
                <div className="mt-4 rounded-lg bg-[#F1E9E0] p-4 dark:bg-slate-800/50">
                  <p className="text-2xl font-semibold text-[#B8915C]">
                    {report.final_recommendation ?? "Neutral"}
                  </p>
                </div>
                <div className="mt-4 space-y-3 text-sm text-[#5A534A] dark:text-slate-400">
                  {(report.behavioral_observations ?? []).map((item, index) => (
                    <div key={`${item}-${index}`} className="rounded-lg bg-[#F1E9E0] p-3 dark:bg-slate-800/50">
                      {item}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
