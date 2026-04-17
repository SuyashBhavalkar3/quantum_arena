"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  DollarSign,
  Loader2,
  MapPin,
  Search,
  } from "lucide-react";

import { applicationsAPI, CandidateJob, jobsAPI } from "@/lib/api";
import { useProfileStatus } from "@/hooks/useProfileStatus";
import { enforceProfileCompletion } from "@/lib/profileEnforcement";
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

type ApplyState =
  | { status: "idle" }
  | { status: "applying" }
  | { status: "success"; applicationId: number; applicationStatus: string }
  | { status: "error"; message: string };

const formatStatus = (value: string) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export default function JobsPage() {
  const [jobs, setJobs] = useState<CandidateJob[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<number>>(new Set());
  const [selectedJob, setSelectedJob] = useState<CandidateJob | null>(null);
  const [applyState, setApplyState] = useState<ApplyState>({ status: "idle" });
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profileStatus, loading: profileLoading } = useProfileStatus();

  useEffect(() => {
    let mounted = true;

    async function loadJobs() {
      try {
        setLoading(true);
        const [jobsResponse, applications] = await Promise.all([
          jobsAPI.getAllJobs(),
          applicationsAPI.getMyApplications(),
        ]);

        if (mounted) {
          setJobs(jobsResponse.jobs);
          setAppliedJobIds(new Set(applications.map((application) => application.job_id)));
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load jobs.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadJobs();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredJobs = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return jobs;
    }

    return jobs.filter((job) => {
      return (
        job.title.toLowerCase().includes(query) ||
        (job.description || "").toLowerCase().includes(query) ||
        (job.location || "").toLowerCase().includes(query)
      );
    });
  }, [jobs, searchTerm]);

  const handleApply = async (job: CandidateJob) => {
    if (appliedJobIds.has(job.id)) {
      return;
    }

    const canApply = await enforceProfileCompletion();
    if (!canApply) {
      return;
    }

    setSelectedJob(job);
    setApplyState({ status: "idle" });
  };

  const submitApplication = async () => {
    if (!selectedJob) {
      return;
    }

    try {
      setApplyState({ status: "applying" });
      const application = await applicationsAPI.applyForJob(selectedJob.id);
      setAppliedJobIds((current) => new Set(current).add(selectedJob.id));
      setApplyState({
        status: "success",
        applicationId: application.id,
        applicationStatus: application.status,
      });
    } catch (applyError) {
      setApplyState({
        status: "error",
        message: applyError instanceof Error ? applyError.message : "Failed to apply for job.",
      });
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F9F6F0] dark:bg-slate-950">
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h1 className="mb-2 flex items-center gap-2 font-serif text-4xl font-medium text-[#2D2A24] dark:text-white">
              Find Your Next Opportunity
              
            </h1>
            <p className="text-[#5A534A] dark:text-slate-400">
              Browse live jobs from the backend and apply directly.
            </p>
          </div>
          <Badge
            variant="outline"
            className="border-[#B8915C]/30 bg-white/50 text-[#B8915C] backdrop-blur-sm"
          >
            {filteredJobs.length} jobs found
          </Badge>
        </motion.div>

        <Card className="mb-8 border border-white/20 bg-white/70 shadow-2xl backdrop-blur-xl dark:bg-slate-900/70">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A69A8C]" />
              <Input
                placeholder="Search job title, description, or location"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="border-[#D6CDC2] bg-white/50 pl-10 focus:border-[#B8915C] dark:bg-slate-800/50"
              />
            </div>
          </CardContent>
        </Card>

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
                className="border border-white/20 bg-white/70 shadow-2xl backdrop-blur-xl dark:bg-slate-900/70"
              >
                <CardContent className="p-6">
                  <Loader2 className="h-5 w-5 animate-spin text-[#B8915C]" />
                </CardContent>
              </Card>
            ))
          ) : (
            filteredJobs.map((job) => {
              const alreadyApplied = appliedJobIds.has(job.id);

              return (
                <motion.div
                  key={job.id}
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <Card className="border border-white/20 bg-white/70 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:shadow-2xl dark:bg-slate-900/70">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-[#B8915C] font-semibold text-white">
                          {job.title.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-[#2D2A24] dark:text-white">
                                {job.title}
                              </h3>
                              <p className="mt-1 text-sm text-[#5A534A] dark:text-slate-400">
                                Job ID: {job.id}
                              </p>
                            </div>
                            <Button
                              onClick={() => handleApply(job)}
                              size="sm"
                              disabled={alreadyApplied}
                              className={
                                alreadyApplied
                                  ? "cursor-not-allowed bg-[#B8915C]/30 text-[#8A7E70] hover:bg-[#B8915C]/30"
                                  : "bg-[#B8915C] hover:bg-[#9F7A4F]"
                              }
                            >
                              {alreadyApplied ? "Applied" : "Apply"}
                            </Button>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-[#5A534A] dark:text-slate-400">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {job.location || "Location not specified"}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              {job.salary_range || "Salary not specified"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-4 w-4" />
                              {job.experience_required
                                ? `${job.experience_required}+ years`
                                : "Experience flexible"}
                            </span>
                          </div>

                          <p className="mt-3 text-sm text-[#5A534A] dark:text-slate-400">
                            {job.description || "No description provided."}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {alreadyApplied && (
                              <Badge className="border-none bg-[#B8915C]/10 text-[#B8915C]">
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                Application exists
                              </Badge>
                            )}
                            {(job.required_skills || []).map((skill) => (
                              <Badge
                                key={skill}
                                variant="outline"
                                className="border-[#B8915C]/30 text-[#B8915C]"
                              >
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent className="max-w-lg border-white/20 bg-white/90 backdrop-blur-xl dark:bg-slate-900/90">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-[#2D2A24] dark:text-white">
              Apply for {selectedJob?.title}
            </DialogTitle>
          </DialogHeader>

          {!profileLoading && profileStatus && !profileStatus.profile_completed && (
            <div className="space-y-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-4">
                <div className="flex gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                  <div>
                    <h4 className="mb-2 font-semibold text-amber-900">Complete Your Profile First</h4>
                    <p className="text-sm text-amber-800">
                      You need a completed profile before applying for jobs.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href="/complete-profile" className="flex-1">
                  <Button className="w-full bg-[#B8915C] hover:bg-[#9F7A4F]">
                    Complete Profile
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => setSelectedJob(null)}
                  className="flex-1 border-[#D6CDC2]"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {!profileLoading && profileStatus && profileStatus.profile_completed && applyState.status === "idle" && (
            <div className="space-y-4">
              <div className="rounded-lg bg-[#B8915C]/10 p-3 text-sm text-[#B8915C]">
                This will create a real application record in the database and trigger backend
                resume analysis.
              </div>
              <Button onClick={submitApplication} className="w-full bg-[#B8915C] hover:bg-[#9F7A4F]">
                Submit Application
              </Button>
            </div>
          )}

          {applyState.status === "applying" && (
            <div className="py-8 text-center">
              <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-[#B8915C]" />
              <h3 className="mb-2 text-lg font-semibold text-[#2D2A24] dark:text-white">
                Creating your application
              </h3>
              <p className="text-sm text-[#5A534A] dark:text-slate-400">
                Saving the application record and generating the next step.
              </p>
            </div>
          )}

          {applyState.status === "error" && (
            <div className="space-y-4">
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
                {applyState.message}
              </div>
              <Button onClick={submitApplication} className="w-full bg-[#B8915C] hover:bg-[#9F7A4F]">
                Try Again
              </Button>
            </div>
          )}

          {applyState.status === "success" && (
            <div className="space-y-4 py-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                
              </div>
              <div>
                <h3 className="font-serif text-xl font-medium text-[#2D2A24] dark:text-white">
                  Application Created
                </h3>
                <p className="mt-2 text-[#5A534A] dark:text-slate-400">
                  Application ID: {applyState.applicationId}
                </p>
                <p className="text-sm text-[#B8915C]">
                  Current status: {formatStatus(applyState.applicationStatus)}
                </p>
              </div>

              <div className="flex gap-2">
                <Link href="/candidate/applications" className="flex-1">
                  <Button className="w-full bg-[#B8915C] hover:bg-[#9F7A4F]">
                    View Applications
                  </Button>
                </Link>
                {applyState.applicationStatus === "assessment_scheduled" && (
                  <Link
                    href={`/candidate/assessment?applicationId=${applyState.applicationId}`}
                    className="flex-1"
                  >
                    <Button variant="outline" className="w-full border-[#D6CDC2]">
                      Start Assessment
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
