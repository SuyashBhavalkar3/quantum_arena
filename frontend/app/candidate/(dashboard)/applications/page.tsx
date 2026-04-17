"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle, Clock, FileText, Loader2, Sparkle } from "lucide-react";

import { applicationsAPI, jobsAPI, HRApplication, CandidateJob } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ApplicationWithJob = HRApplication & {
  job?: CandidateJob;
};

const statusStyles: Record<string, string> = {
  pending: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  resume_screened: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  assessment_scheduled:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  assessment_completed:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  interview_scheduled:
    "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  interview_completed:
    "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
  final_review: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  accepted: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const formatStatus = (value: string) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const isAssessmentWindowActive = (application: HRApplication) => {
  if (application.assessment_data?.assessment_status === "auto_submitted_violation") {
    return false;
  }

  if (application.status !== "assessment_scheduled") {
    return false;
  }

  if (!application.assessment_expires_at) {
    return false;
  }

  return new Date(application.assessment_expires_at).getTime() > Date.now();
};

const getAssessmentProgressLabel = (application: HRApplication) => {
  if (application.assessment_data?.assessment_status === "auto_submitted_violation") {
    return "Done (Auto-submitted due to violations)";
  }

  if (application.assessment_score !== null || application.status === "assessment_completed") {
    return "Done";
  }

  if (application.status === "assessment_scheduled") {
    return "Scheduled";
  }

  return "Pending";
};

const getInterviewProgressLabel = (application: HRApplication) => {
  if (application.interview_feedback?.ai_interview_status === "auto_concluded_violation") {
    return "Done (Auto-concluded due to violations)";
  }

  if (
    application.status === "interview_completed" ||
    application.status === "final_review" ||
    application.status === "accepted" ||
    application.interview_score !== null
  ) {
    return "Done";
  }

  if (application.status === "interview_scheduled") {
    return "Scheduled";
  }

  return "Pending";
};

const formatValidityNote = (application: HRApplication) => {
  if (!application.assessment_expires_at) {
    return "This test is valid for 72 hours.";
  }

  const expiresAt = new Date(application.assessment_expires_at);
  return `This test is valid until ${expiresAt.toLocaleString()}.`;
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationWithJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadApplications() {
      try {
        setLoading(true);
        const [applicationList, jobsResponse] = await Promise.all([
          applicationsAPI.getMyApplications(),
          jobsAPI.getAllJobs(),
        ]);

        const jobsById = new Map<number, CandidateJob>(
          jobsResponse.jobs.map((job) => [job.id, job])
        );

        if (mounted) {
          setApplications(
            applicationList.map((application) => ({
              ...application,
              job: jobsById.get(application.job_id),
            }))
          );
        }
      } catch (loadError) {
        if (mounted) {
          setError(
            loadError instanceof Error ? loadError.message : "Failed to load applications."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadApplications();

    return () => {
      mounted = false;
    };
  }, []);

  const sortedApplications = useMemo(() => {
    return [...applications].sort((left, right) => {
      return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
    });
  }, [applications]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F9F6F0] dark:bg-slate-950">
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 flex items-center gap-2 font-serif text-4xl font-medium text-[#2D2A24] dark:text-white">
              My Applications
              
            </h1>
            <p className="text-[#5A534A] dark:text-slate-400">
              These records come directly from the backend applications table.
            </p>
          </div>
          <Badge
            variant="outline"
            className="border-[#B8915C]/30 bg-white/50 text-[#B8915C] backdrop-blur-sm"
          >
            {sortedApplications.length} total
          </Badge>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50 dark:bg-red-950/30">
            <CardContent className="flex items-start gap-3 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <Card
                key={index}
                className="border-none bg-white/70 shadow-lg backdrop-blur-sm dark:bg-slate-900/70"
              >
                <CardContent className="p-6">
                  <Loader2 className="h-5 w-5 animate-spin text-[#B8915C]" />
                </CardContent>
              </Card>
            ))
          ) : sortedApplications.length === 0 ? (
            <Card className="border-none bg-white/70 shadow-lg backdrop-blur-sm dark:bg-slate-900/70">
              <CardContent className="p-6 text-sm text-[#5A534A] dark:text-slate-400">
                No applications found yet.
              </CardContent>
            </Card>
          ) : (
            sortedApplications.map((application) => (
              <Card
                key={application.id}
                className="border-none bg-white/70 shadow-lg backdrop-blur-sm dark:bg-slate-900/70"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-[#2D2A24] dark:text-white">
                          {application.job?.title || `Job #${application.job_id}`}
                        </h3>
                        <Badge className={statusStyles[application.status] || statusStyles.pending}>
                          {formatStatus(application.status)}
                        </Badge>
                      </div>

                      <p className="text-sm text-[#5A534A] dark:text-slate-400">
                        Application ID: {application.id}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-4 text-sm text-[#5A534A] dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Applied {new Date(application.created_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          Resume Score:{" "}
                          {application.resume_match_score !== null
                            ? `${Math.round(application.resume_match_score)}%`
                            : "Pending"}
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          Assessment: {getAssessmentProgressLabel(application)}
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          AI Interview: {getInterviewProgressLabel(application)}
                        </span>
                      </div>

                      {application.job?.location && (
                        <p className="mt-2 text-sm text-[#5A534A] dark:text-slate-400">
                          {application.job.location}
                        </p>
                      )}

                      {isAssessmentWindowActive(application) && (
                        <p className="mt-3 text-sm text-[#B8915C]">
                          This test is valid for 72 hours.
                        </p>
                      )}

                      {application.assessment_data?.assessment_status === "auto_submitted_violation" && (
                        <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                          Assessment ended automatically due to proctoring violations.
                        </p>
                      )}

                      {application.interview_feedback?.ai_interview_status === "auto_concluded_violation" && (
                        <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                          AI interview ended automatically due to proctoring violations.
                        </p>
                      )}

                      {application.status === "assessment_scheduled" &&
                        !isAssessmentWindowActive(application) && (
                          <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                            {application.assessment_expires_at
                              ? `Assessment window expired on ${new Date(
                                  application.assessment_expires_at
                                ).toLocaleString()}.`
                              : "Assessment window is unavailable."}
                          </p>
                        )}
                    </div>

                    <div className="flex gap-2">
                      {isAssessmentWindowActive(application) && (
                        <div className="flex flex-col items-end gap-2">
                          <Link href={`/candidate/assessment?applicationId=${application.id}`}>
                            <Button className="bg-[#B8915C] hover:bg-[#9F7A4F]">
                              Start Assessment
                            </Button>
                          </Link>
                          <p className="text-xs text-[#A69A8C]">{formatValidityNote(application)}</p>
                        </div>
                      )}
                      {!isAssessmentWindowActive(application) &&
                        application.status === "assessment_scheduled" && (
                        <Link href={`/candidate/assessment?applicationId=${application.id}`}>
                          <Button disabled className="bg-[#B8915C] hover:bg-[#B8915C]">
                            Start Assessment
                          </Button>
                        </Link>
                      )}
                      {application.status === "interview_scheduled" &&
                        application.interview_feedback?.ai_interview_status !== "auto_concluded_violation" && (
                        <Link
                          href={`/candidate/interview?applicationId=${application.id}&company=${encodeURIComponent(
                            application.job?.title || "Tech Company"
                          )}&position=${encodeURIComponent(
                            application.job?.title || "Software Engineer"
                          )}`}
                        >
                          <Button className="bg-[#B8915C] hover:bg-[#9F7A4F]">
                            Start AI Interview
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
