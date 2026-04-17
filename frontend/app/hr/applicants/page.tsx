"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle, Download, Eye, FileText, Loader2, Search, Target } from "lucide-react";

import {
  CandidateReport,
  getCurrentUser,
  hrAPI,
  HRApplication,
  HRApplicationDetail,
  HRJob,
} from "@/lib/api";
import { getAuthToken } from "@/lib/auth";

const statusConfig: Record<string, string> = {
  pending: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-0",
  resume_screened:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-0",
  assessment_scheduled:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-0",
  assessment_completed:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-0",
  interview_scheduled:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-0",
  interview_completed:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-0",
  final_review:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-0",
  accepted:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-0",
  rejected: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-0",
};

const labelForStatus = (status: string) =>
  status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const scoreForApplicant = (application: HRApplication | HRApplicationDetail) =>
  application.final_score ??
  application.interview_score ??
  application.assessment_score ??
  application.resume_match_score ??
  0;

const getApplicantTitle = (application: HRApplication | HRApplicationDetail) =>
  application.candidate_name?.trim() ||
  (application.candidate_email ? application.candidate_email : `Candidate #${application.user_id}`);

const getApplicantSubtitle = (application: HRApplication | HRApplicationDetail) =>
  application.candidate_email?.trim() || `Candidate ID #${application.candidate_id}`;

type ApplicantWithJob = HRApplication & {
  jobTitle: string;
};

function ApplicantsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialJobFilter = searchParams.get("job") ?? "all";

  const [jobs, setJobs] = useState<HRJob[]>([]);
  const [applications, setApplications] = useState<ApplicantWithJob[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [jobFilter, setJobFilter] = useState(initialJobFilter);
  const [selectedApplicant, setSelectedApplicant] = useState<HRApplicationDetail | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<"final_review" | "rejected" | null>(null);
  const [reportActionLoading, setReportActionLoading] = useState<"generate" | "download" | null>(null);
  const [selectedReport, setSelectedReport] = useState<CandidateReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadApplicants() {
      try {
        setLoading(true);
        setError(null);

        const token = getAuthToken();
        if (!token) {
          throw new Error("No authentication token found.");
        }

        const currentUser = await getCurrentUser(token);
        const jobsResponse = await hrAPI.getJobs();
        const ownedJobs = jobsResponse.jobs.filter((job) => job.created_by === currentUser.id);
        const applicantGroups = await Promise.all(
          ownedJobs.map(async (job) => {
            const applicants = await hrAPI.getJobApplicants(job.id);
            return applicants.map((application) => ({
              ...application,
              jobTitle: job.title,
            }));
          })
        );

        if (!mounted) {
          return;
        }

        setJobs(ownedJobs);
        setApplications(applicantGroups.flat());
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load applicants.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadApplicants();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToastMessage(null);
    }, 3500);

    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  const filteredApplications = useMemo(() => {
    return applications
      .filter((application) => {
        const search = searchTerm.trim().toLowerCase();
        const matchesSearch =
          search.length === 0 ||
          application.jobTitle.toLowerCase().includes(search) ||
          (application.candidate_name || "").toLowerCase().includes(search) ||
          (application.candidate_email || "").toLowerCase().includes(search) ||
          String(application.candidate_id).includes(search) ||
          String(application.id).includes(search);

        const matchesStatus =
          filterStatus === "all" || application.status === filterStatus;
        const matchesJob =
          jobFilter === "all" || String(application.job_id) === jobFilter;

        return matchesSearch && matchesStatus && matchesJob;
      })
      .sort((left, right) => scoreForApplicant(right) - scoreForApplicant(left));
  }, [applications, filterStatus, jobFilter, searchTerm]);

  const openDetails = async (applicationId: number) => {
    try {
      setError(null);
      setDetailsLoading(true);
      setReportLoading(true);
      const [detail, report] = await Promise.all([
        hrAPI.getApplicationDetail(applicationId),
        hrAPI.getCandidateReport(applicationId).catch((reportError) => {
          if (reportError instanceof Error && reportError.message === "Report not found") {
            return null;
          }
          throw reportError;
        }),
      ]);
      setSelectedApplicant(detail);
      setSelectedReport(report);
      setNotes(detail.hr_notes || "");
    } catch (detailError) {
      setError(
        detailError instanceof Error
          ? detailError.message
          : "Failed to load applicant details."
      );
    } finally {
      setDetailsLoading(false);
      setReportLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedApplicant) {
      return;
    }

    try {
      setError(null);
      setReportActionLoading("generate");
      await hrAPI.generateCandidateReport(selectedApplicant.id);
      const refreshed = await hrAPI.getCandidateReport(selectedApplicant.id);
      setSelectedReport(refreshed);
    } catch (reportError) {
      setError(
        reportError instanceof Error ? reportError.message : "Failed to generate report."
      );
    } finally {
      setReportActionLoading(null);
    }
  };

  const handleViewReport = async () => {
    if (!selectedReport) {
      return;
    }
    router.push(`/hr/reports/${selectedReport.application_id}`);
  };

  const handleDownloadReport = async () => {
    if (!selectedReport) {
      return;
    }

    try {
      setReportActionLoading("download");
      const blob = await hrAPI.downloadCandidateReport(selectedReport.id);
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `candidate_report_${selectedReport.application_id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
    } catch (downloadError) {
      setError(
        downloadError instanceof Error ? downloadError.message : "Failed to download report."
      );
    } finally {
      setReportActionLoading(null);
    }
  };

  const handleStatusUpdate = async (status: "final_review" | "rejected") => {
    if (!selectedApplicant) {
      return;
    }

    try {
      setError(null);
      setActionLoading(status);
      const updated = await hrAPI.updateApplicationStatus(selectedApplicant.id, {
        status,
        hr_notes: notes,
      });

      setApplications((current) =>
        current.map((application) =>
          application.id === updated.id ? { ...application, ...updated } : application
        )
      );
      setSelectedApplicant((current) =>
        current ? { ...current, ...updated, hr_notes: notes } : current
      );
      if (status === "final_review") {
        setToastMessage("Email sent successfully to the candidate.");
      }
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Failed to update application status."
      );
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      {toastMessage && (
        <div className="fixed right-6 top-6 z-[70] max-w-sm rounded-xl border border-emerald-200 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-sm dark:border-emerald-900/40 dark:bg-slate-900/95">
          <div className="flex items-start gap-3">
            <CheckCircle className="mt-0.5 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm font-medium text-[#2D2A24] dark:text-white">{toastMessage}</p>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="flex items-center gap-2 font-serif text-4xl font-medium text-[#2D2A24] dark:text-white">
          Applicants
          
        </h1>
        <p className="mt-2 text-[#5A534A] dark:text-slate-400">
          Review applications flowing into your posted jobs.
        </p>
      </div>

      {error && (
        <Card className="mb-6 border-orange-200 bg-orange-50 dark:bg-orange-900/20">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 text-orange-600 dark:text-orange-300" />
            <p className="text-sm text-orange-700 dark:text-orange-300">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6 border-none bg-white/70 shadow-lg backdrop-blur-sm dark:bg-slate-900/70">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A69A8C]" />
              <Input
                placeholder="Search by candidate ID, application ID, or role..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="border-[#D6CDC2] bg-white pl-10 dark:bg-slate-800"
              />
            </div>

            <Select value={jobFilter} onValueChange={setJobFilter}>
              <SelectTrigger className="border-[#D6CDC2] bg-white dark:bg-slate-800">
                <SelectValue placeholder="Filter by job" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobs</SelectItem>
                {jobs.map((job) => (
                  <SelectItem key={job.id} value={String(job.id)}>
                    {job.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="border-[#D6CDC2] bg-white dark:bg-slate-800">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.keys(statusConfig).map((status) => (
                  <SelectItem key={status} value={status}>
                    {labelForStatus(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Card
                key={index}
                className="border-none bg-white/70 shadow-lg backdrop-blur-sm dark:bg-slate-900/70"
              >
                <CardContent className="p-6">
                  <Skeleton className="mb-3 h-6 w-48" />
                  <Skeleton className="mb-2 h-4 w-72" />
                  <Skeleton className="h-4 w-40" />
                </CardContent>
              </Card>
            ))
          : filteredApplications.map((application) => (
              <Card
                key={application.id}
                className="border-none bg-white/70 shadow-lg transition-all duration-300 hover:shadow-xl dark:bg-slate-900/70"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <h2 className="text-lg font-semibold text-[#2D2A24] dark:text-white">
                          {getApplicantTitle(application)}
                        </h2>
                        <Badge className={statusConfig[application.status] ?? statusConfig.pending}>
                          {labelForStatus(application.status)}
                        </Badge>
                      </div>

                      <p className="text-sm text-[#5A534A] dark:text-slate-400">
                        {getApplicantSubtitle(application)}
                      </p>
                      <p className="mb-3 mt-1 text-[#5A534A] dark:text-slate-400">
                        {application.jobTitle}
                      </p>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                        <div className="rounded-md bg-[#F1E9E0] p-3 text-sm dark:bg-slate-800/50">
                          <div className="flex items-center gap-2 text-[#5A534A] dark:text-slate-400">
                            <Target className="h-4 w-4 text-[#B8915C]" />
                            Resume
                          </div>
                          <p className="mt-1 font-semibold text-[#2D2A24] dark:text-white">
                            {Math.round(application.resume_match_score ?? 0)}%
                          </p>
                        </div>
                        <div className="rounded-md bg-[#F1E9E0] p-3 text-sm dark:bg-slate-800/50">
                          <div className="flex items-center gap-2 text-[#5A534A] dark:text-slate-400">
                            <FileText className="h-4 w-4 text-[#B8915C]" />
                            Assessment
                          </div>
                          <p className="mt-1 font-semibold text-[#2D2A24] dark:text-white">
                            {application.assessment_score !== null
                              ? `${Math.round(application.assessment_score)}%`
                              : "Pending"}
                          </p>
                        </div>
                        <div className="rounded-md bg-[#F1E9E0] p-3 text-sm dark:bg-slate-800/50">
                          <div className="flex items-center gap-2 text-[#5A534A] dark:text-slate-400">
                            <CheckCircle className="h-4 w-4 text-[#B8915C]" />
                            Interview
                          </div>
                          <p className="mt-1 font-semibold text-[#2D2A24] dark:text-white">
                            {application.interview_score !== null
                              ? `${Math.round(application.interview_score)}%`
                              : "Pending"}
                          </p>
                        </div>
                        <div className="rounded-md bg-[#F1E9E0] p-3 text-sm dark:bg-slate-800/50">
                          <div className="flex items-center gap-2 text-[#5A534A] dark:text-slate-400">
                            
                            Overall
                          </div>
                          <p className="mt-1 font-semibold text-[#2D2A24] dark:text-white">
                            {Math.round(scoreForApplicant(application))}%
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDetails(application.id)}
                      className="border-[#D6CDC2] text-[#4A443C] hover:bg-[#F1E9E0]"
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {!loading && filteredApplications.length === 0 && (
        <Card className="mt-4 border-none bg-white/70 shadow-lg backdrop-blur-sm dark:bg-slate-900/70">
          <CardContent className="p-6 text-sm text-[#5A534A] dark:text-slate-400">
            No applicants matched the selected filters.
          </CardContent>
        </Card>
      )}

      <Dialog
        open={!!selectedApplicant || detailsLoading}
        onOpenChange={() => {
          setSelectedApplicant(null);
          setSelectedReport(null);
        }}
      >
        <DialogContent className="max-w-2xl border-none bg-white/95 shadow-2xl backdrop-blur-xl dark:bg-slate-900/95">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-[#2D2A24] dark:text-white">
              {detailsLoading
                ? "Loading applicant details..."
                : selectedApplicant
                  ? getApplicantTitle(selectedApplicant)
                  : "Candidate"}
            </DialogTitle>
          </DialogHeader>

          {detailsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            selectedApplicant && (
              <div className="space-y-5">
                <div className="rounded-lg bg-[#F1E9E0] p-4 dark:bg-slate-800/50">
                  <p className="font-medium text-[#2D2A24] dark:text-white">
                    {selectedApplicant.job?.title || "Associated Job"}
                  </p>
                  <p className="mt-1 text-sm text-[#5A534A] dark:text-slate-400">
                    {selectedApplicant.job?.location || "Location not provided"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    ["Resume Match", selectedApplicant.resume_match_score],
                    ["Assessment", selectedApplicant.assessment_score],
                    ["Interview", selectedApplicant.interview_score],
                    ["Final Score", selectedApplicant.final_score],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg bg-[#F1E9E0] p-4 dark:bg-slate-800/50">
                      <p className="text-xs uppercase tracking-wide text-[#A69A8C]">{label}</p>
                      <p className="mt-2 text-2xl font-semibold text-[#2D2A24] dark:text-white">
                        {value !== null && value !== undefined ? `${Math.round(Number(value))}%` : "N/A"}
                      </p>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium text-[#2D2A24] dark:text-white">
                    HR Notes
                  </p>
                  <Textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Add notes for this application..."
                    className="min-h-28 border-[#D6CDC2] bg-white dark:bg-slate-800"
                  />
                </div>

                <div className="rounded-lg bg-[#F1E9E0] p-4 dark:bg-slate-800/50">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-[#2D2A24] dark:text-white">
                        Evaluation Report
                      </p>
                      {reportLoading ? (
                        <p className="mt-1 text-sm text-[#5A534A] dark:text-slate-400">
                          Loading report status...
                        </p>
                      ) : selectedReport ? (
                        <>
                          <p className="mt-1 text-sm text-[#5A534A] dark:text-slate-400">
                            Status: {selectedReport.status}
                          </p>
                          {selectedReport.generated_at && (
                            <p className="mt-1 text-xs text-[#A69A8C]">
                              Generated {new Date(selectedReport.generated_at).toLocaleString()}
                            </p>
                          )}
                          {selectedReport.error_message && (
                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                              {selectedReport.error_message}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="mt-1 text-sm text-[#5A534A] dark:text-slate-400">
                          No report generated yet for this application.
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {selectedReport?.status === "completed" ? (
                        <>
                          <Button
                            variant="outline"
                            onClick={handleViewReport}
                            disabled={reportActionLoading !== null}
                            className="border-[#D6CDC2] text-[#4A443C] hover:bg-[#F1E9E0]"
                          >
                            {reportActionLoading === "download" ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Eye className="mr-2 h-4 w-4" />
                            )}
                            View Report
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleDownloadReport}
                            disabled={reportActionLoading !== null}
                            className="border-[#D6CDC2] text-[#4A443C] hover:bg-[#F1E9E0]"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download Report
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={handleGenerateReport}
                          disabled={reportActionLoading !== null}
                          className="bg-[#B8915C] hover:bg-[#9F7A4F]"
                        >
                          {reportActionLoading === "generate" ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="mr-2 h-4 w-4" />
                          )}
                          Generate Report
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => handleStatusUpdate("final_review")}
                    disabled={actionLoading !== null}
                    className="bg-[#B8915C] hover:bg-[#9F7A4F]"
                  >
                    Accept For Final Review
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleStatusUpdate("rejected")}
                    disabled={actionLoading !== null}
                    className="border-[#D6CDC2] text-[#4A443C] hover:bg-red-50 hover:text-red-600"
                  >
                    Reject
                  </Button>
                </div>
              </div>
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ApplicantsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#B8915C]" />
        </div>
      }
    >
      <ApplicantsContent />
    </Suspense>
  );
}
