"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Briefcase, Clock3, FileText, Loader2, Target, Users } from "lucide-react";

import DashboardListCard from "@/components/hr/DashboardListCard";
import DashboardMetricCard from "@/components/hr/DashboardMetricCard";
import DashboardPipeline from "@/components/hr/DashboardPipeline";
import {
  dashboardAPI,
  getCurrentUser,
  hrAPI,
  HRDashboardStats,
  HRJob,
  HRPendingActionItem,
  HRRecentApplicant,
} from "@/lib/api";
import { getAuthToken } from "@/lib/auth";

type DashboardState = {
  stats: HRDashboardStats | null;
  jobs: HRJob[];
  applicants: HRRecentApplicant[];
  pendingActions: {
    pending_review: HRPendingActionItem[];
    assessment_completed: HRPendingActionItem[];
    interview_completed: HRPendingActionItem[];
  } | null;
};

const formatRelativeDate = (value?: string) => {
  if (!value) return "Updated recently";

  const parsed = new Date(value);
  const diffMs = Date.now() - parsed.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 30) return `${diffDays} days ago`;

  return parsed.toLocaleDateString();
};

const formatStatusLabel = (status: string) =>
  status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const getApplicantScore = (applicant: HRRecentApplicant) =>
  applicant.final_score ??
  applicant.interview_score ??
  applicant.assessment_score ??
  applicant.resume_score ??
  0;

export default function HRDashboard() {
  const [data, setData] = useState<DashboardState>({
    stats: null,
    jobs: [],
    applicants: [],
    pendingActions: null,
  });
  const [hrName, setHrName] = useState("HR");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);

        const token = getAuthToken();
        if (!token) {
          throw new Error("No authentication token found.");
        }

        const currentUser = await getCurrentUser(token);
        const [stats, jobsResponse, applicants, pendingActions] = await Promise.all([
          dashboardAPI.getHRStats(),
          hrAPI.getJobs(),
          dashboardAPI.getRecentApplicants(6),
          dashboardAPI.getPendingActions(),
        ]);

        const jobs = jobsResponse.jobs.filter((job) => job.created_by === currentUser.id);

        if (!mounted) {
          return;
        }

        setHrName(currentUser.name?.split(" ")[0] || "HR");
        setData({
          stats,
          jobs,
          applicants,
          pendingActions,
        });
      } catch (loadError) {
        if (!mounted) {
          return;
        }

        const message =
          loadError instanceof Error ? loadError.message : "Failed to load HR dashboard.";
        setError(message);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const metrics = useMemo(() => {
    const stats = data.stats;
    const totalJobs = stats?.total_jobs ?? 0;
    const totalApplications = stats?.total_applications ?? 0;
    const activeJobs = data.jobs.length;
    const closedJobs = Math.max(totalJobs - activeJobs, 0);
    const applicantsPerJob =
      activeJobs > 0 ? (totalApplications / activeJobs).toFixed(1) : "0.0";

    return [
      {
        label: "Total Jobs Posted",
        value: totalJobs,
        description: `${activeJobs} jobs currently returned by the jobs API`,
        icon: Briefcase,
      },
      {
        label: "Total Applicants",
        value: totalApplications,
        description: `${stats?.applications_this_month ?? 0} applications in the last 30 days`,
        icon: Users,
      },
      {
        label: "Applicants Per Job",
        value: applicantsPerJob,
        description: "Average applicants across active job records",
        icon: Target,
      },
      {
        label: "Shortlisted Candidates",
        value: (stats?.in_assessment ?? 0) + (stats?.in_interview ?? 0) + (stats?.hired_total ?? 0),
        description: `${stats?.hired_total ?? 0} hires and ${stats?.in_interview ?? 0} in interviews`,
        icon: FileText,
      },
      {
        label: "Rejected Candidates",
        value: stats?.rejected ?? 0,
        description: "Rejected applications from your jobs",
        icon: AlertCircle,
      },
      {
        label: "Active Job Postings",
        value: activeJobs,
        description: "Open jobs visible in the current jobs feed",
        icon: Briefcase,
      },
      {
        label: "Closed Job Postings",
        value: closedJobs,
        description: "Jobs counted in stats but not returned as active",
        icon: Clock3,
      },
    ];
  }, [data.jobs.length, data.stats]);

  const pipelineStages = useMemo(() => {
    const stats = data.stats;

    return [
      { label: "Pending Review", value: stats?.pending_review ?? 0 },
      { label: "Assessment Stage", value: stats?.in_assessment ?? 0 },
      { label: "Interview Stage", value: stats?.in_interview ?? 0 },
      { label: "Hired", value: stats?.hired_total ?? 0 },
    ];
  }, [data.stats]);

  const recentJobs = useMemo(
    () =>
      [...data.jobs]
        .sort((left, right) => {
          return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
        })
        .slice(0, 4),
    [data.jobs]
  );

  if (loading && !data.stats) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#B8915C]" />
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#B8915C]/5 blur-3xl -z-10" />
      <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[#9F7A4F]/5 blur-3xl -z-10" />

      <div className="relative z-10 mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 flex items-center gap-2 font-serif text-4xl font-medium text-[#2D2A24] dark:text-white">
            Welcome back, {hrName}!
            
          </h1>
          <p className="text-[#5A534A] dark:text-slate-400">
            Here&apos;s what&apos;s happening across your hiring pipeline.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="border-[#B8915C]/30 bg-white/50 text-[#B8915C] backdrop-blur-sm"
          >
            {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" })}
          </Badge>
          <Link href="/hr/jobs/new">
            <Button className="bg-[#B8915C] hover:bg-[#9F7A4F]">Post New Job</Button>
          </Link>
        </div>
      </div>

      {error && (
        <Card className="mb-6 border-orange-200 bg-orange-50 dark:bg-orange-900/20">
          <CardContent className="flex items-start gap-3 p-6">
            <AlertCircle className="mt-0.5 h-5 w-5 text-orange-600 dark:text-orange-300" />
            <div>
              <h2 className="font-semibold text-orange-800 dark:text-orange-200">
                Dashboard data is partially unavailable
              </h2>
              <p className="mt-1 text-sm text-orange-700 dark:text-orange-300">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <DashboardMetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            description={metric.description}
            icon={metric.icon}
            loading={loading}
          />
        ))}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DashboardPipeline
            title="Recruitment Funnel"
            stages={pipelineStages}
            loading={loading}
          />
        </div>

        <Card className="border-none bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm shadow-lg">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-[#2D2A24] dark:text-white">
              Pending Actions
            </h2>
            <p className="mt-1 text-sm text-[#5A534A] dark:text-slate-400">
              Candidates waiting for the next HR step
            </p>

            <div className="mt-4 space-y-3">
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-[#B8915C]" />
              ) : (
                [
                  {
                    label: "Review resumes",
                    value: data.pendingActions?.pending_review.length ?? 0,
                  },
                  {
                    label: "Assess completed",
                    value: data.pendingActions?.assessment_completed.length ?? 0,
                  },
                  {
                    label: "Interview feedback ready",
                    value: data.pendingActions?.interview_completed.length ?? 0,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-lg bg-[#F1E9E0] p-3 dark:bg-slate-800/50"
                  >
                    <span className="text-sm text-[#4A443C] dark:text-slate-300">{item.label}</span>
                    <span className="text-sm font-semibold text-[#2D2A24] dark:text-white">
                      {item.value}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardListCard
          title="Recent Jobs"
          href="/hr/jobs"
          items={recentJobs}
          loading={loading}
          emptyMessage="No jobs are available for this HR account yet."
          renderItem={(job) => (
            <div className="rounded-lg bg-[#F1E9E0] p-4 dark:bg-slate-800/50">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-[#2D2A24] dark:text-white">{job.title}</p>
                  <p className="mt-1 text-sm text-[#5A534A] dark:text-slate-400">
                    {job.location || "Location not specified"}
                  </p>
                </div>
                <Badge className="border-none bg-[#B8915C]/10 text-[#B8915C]">
                  {formatRelativeDate(job.created_at)}
                </Badge>
              </div>
              <p className="mt-3 text-sm text-[#5A534A] dark:text-slate-400">
                {job.salary_range || "Salary range not provided"}
              </p>
            </div>
          )}
        />

        <DashboardListCard
          title="Recent Applicants"
          href="/hr/applicants"
          items={data.applicants}
          loading={loading}
          emptyMessage="No applicants have been returned by the HR dashboard API."
          renderItem={(applicant) => (
            <div className="rounded-lg bg-[#F1E9E0] p-4 dark:bg-slate-800/50">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-[#2D2A24] dark:text-white">
                    Candidate #{applicant.candidate_id}
                  </p>
                  <p className="mt-1 text-sm text-[#5A534A] dark:text-slate-400">
                    {applicant.job_title}
                  </p>
                </div>
                <Badge className="border-none bg-[#B8915C]/10 text-[#B8915C]">
                  {Math.round(getApplicantScore(applicant))}%
                </Badge>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-[#5A534A] dark:text-slate-400">
                  {formatStatusLabel(applicant.status)}
                </span>
                <span className="text-[#A69A8C]">{formatRelativeDate(applicant.applied_at)}</span>
              </div>
            </div>
          )}
        />
      </div>
    </div>
  );
}
