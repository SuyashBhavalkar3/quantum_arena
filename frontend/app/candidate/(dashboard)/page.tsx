"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import gsap from "gsap";
import Link from "next/link";
import {
  Briefcase,
  FileText,
  Bell,
  Award,
  Clock,
  ArrowRight,
  Target,
  MapPin,
  Calendar,
  Loader2,
  Settings,
} from "lucide-react";
import { getUserData } from "@/lib/auth";
import {
  CandidateDashboardStats,
  CandidateDashboardActivity,
  CandidateJob,
  CandidateSchedule,
  dashboardAPI,
  jobsAPI,
  schedulingAPI,
} from "@/lib/api";
import { useProfileStatus } from "@/hooks/useProfileStatus";

type DashboardStatCard = {
  label: string;
  value: number;
  change: string;
  icon: typeof FileText;
};

type StoredUserData = {
  full_name?: string;
};

type CandidateUpdateItem = {
  applicationId: number;
  jobTitle: string;
  status: string;
  resumeScore: number | null;
  message: string;
  updatedAt?: string | null;
};

const formatStatus = (value: string) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export default function CandidateDashboard() {
  const [userData, setUserData] = useState<StoredUserData | null>(null);
  const [stats, setStats] = useState<DashboardStatCard[]>([]);
  const [jobs, setJobs] = useState<CandidateJob[]>([]);
  const [interviews, setInterviews] = useState<CandidateSchedule[]>([]);
  const [applicationUpdates, setApplicationUpdates] = useState<CandidateUpdateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const statsRef = useRef<HTMLDivElement>(null);
  const jobsRef = useRef<HTMLDivElement>(null);
  const [particles, setParticles] = useState<React.ReactNode[]>([]);
  const { profileStatus, loading: profileLoading } = useProfileStatus();

  useEffect(() => {
    const stored = getUserData();
    if (stored) setUserData(stored);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, jobsData, schedulesData, activityData] = await Promise.all([
          dashboardAPI.getCandidateStats(),
          jobsAPI.getAllJobs(),
          schedulingAPI.getMySchedules(),
          dashboardAPI.getCandidateActivity(10),
        ]);

        const candidateStats: CandidateDashboardStats = statsData;
        const candidateActivity: CandidateDashboardActivity[] = activityData;
        const upcomingInterviewSchedules = schedulesData
          .filter((schedule) => schedule.schedule_type === "interview")
          .sort(
            (left, right) =>
              new Date(left.scheduled_time).getTime() - new Date(right.scheduled_time).getTime()
          );

        setStats([
          {
            label: "Applications",
            value: candidateStats.total_applications,
            change: `+${candidateStats.applications_this_week} this week`,
            icon: FileText,
          },
          {
            label: "In Progress",
            value: candidateStats.in_progress,
            change: `${candidateStats.interviews_total} interviews in pipeline`,
            icon: Briefcase,
          },
          {
            label: "Interviews",
            value: candidateStats.interviews_total,
            change: `${candidateStats.upcoming_interviews} upcoming`,
            icon: Bell,
          },
          {
            label: "Offers",
            value: candidateStats.offers_received,
            change: `${candidateStats.offers_pending_response} pending response`,
            icon: Award,
          },
        ]);
        setJobs(jobsData.jobs.slice(0, 3));
        setInterviews(upcomingInterviewSchedules.slice(0, 3));
        setApplicationUpdates(
          Array.from(
            new Map(
              candidateActivity.map((activity) => [
                activity.job_id,
                {
                  applicationId: activity.id,
                  jobTitle: activity.job_title,
                  status: activity.status,
                  resumeScore: activity.resume_score,
                  message: activity.next_step_message,
                  updatedAt: activity.updated_at,
                },
              ])
            ).values()
          ).slice(0, 3)
        );
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const newParticles: React.ReactNode[] = [];
    for (let index = 0; index < 15; index++) {
      const top = Math.random() * 100;
      const left = Math.random() * 100;
      newParticles.push(
        <div
          key={`dot-${index}`}
          className="absolute h-1.5 w-1.5 rounded-full bg-[#B8915C]/10 dark:bg-[#B8915C]/5"
          style={{ top: `${top}%`, left: `${left}%`, filter: "blur(1px)" }}
        />
      );
    }
    setParticles(newParticles);
  }, []);

  useEffect(() => {
    if (!loading) {
      const ctx = gsap.context(() => {
        gsap.from(".stat-value", {
          textContent: 0,
          duration: 1.5,
          ease: "power1.out",
          snap: { textContent: 1 },
          stagger: 0.2,
        });

        gsap.from(".stat-card", {
          y: 30,
          opacity: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "back.out(1.2)",
        });

        gsap.from(".job-card", {
          x: -20,
          opacity: 0,
          duration: 0.6,
          stagger: 0.15,
          delay: 0.4,
          ease: "power3.out",
        });

        gsap.from(".interview-item", {
          x: 20,
          opacity: 0,
          duration: 0.5,
          stagger: 0.1,
          delay: 0.6,
          ease: "power3.out",
        });
      }, [statsRef, jobsRef]);

      return () => ctx.revert();
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#B8915C]" />
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">{particles}</div>
      <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-[#B8915C]/5 blur-3xl -z-10" />
      <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[#9F7A4F]/5 blur-3xl -z-10" />

      <div className="relative z-10 mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 flex items-center gap-2 font-serif text-4xl font-medium text-[#2D2A24] dark:text-white">
            Welcome back, {userData?.full_name?.split(" ")[0] || "Candidate"}!
            
          </h1>
          <p className="text-[#5A534A] dark:text-slate-400">
            Here&apos;s what&apos;s happening with your job search
          </p>
        </div>
        <Badge
          variant="outline"
          className="border-[#B8915C]/30 bg-white/50 text-[#B8915C] backdrop-blur-sm"
        >
          <Calendar className="mr-1 h-3 w-3" />
          {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" })}
        </Badge>
      </div>

      <div ref={statsRef} className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            className="stat-card"
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Card className="border-none bg-white/70 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl dark:bg-slate-900/70">
              <CardContent className="p-6">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm text-[#5A534A] dark:text-slate-400">{stat.label}</p>
                  <div className="rounded-lg bg-[#B8915C]/10 p-2">
                    <stat.icon className="h-5 w-5 text-[#B8915C]" />
                  </div>
                </div>
                <p className="stat-value text-3xl font-bold text-[#2D2A24] dark:text-white">
                  {stat.value}
                </p>
                <p className="mt-2 text-xs text-[#A69A8C]">{stat.change}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {!profileLoading && profileStatus && !profileStatus.profile_completed && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200">
                    Complete Your Profile
                  </h3>
                  <p className="mt-1 text-orange-600 dark:text-orange-300">
                    Complete your profile to start applying for jobs
                  </p>
                </div>
                <Link href="/complete-profile">
                  <Button className="bg-orange-500 hover:bg-orange-600">
                    Complete Profile
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[#2D2A24] dark:text-white">
              Recommended for you
            </h2>
            <Link href="/candidate/jobs">
              <Button variant="ghost" size="sm" className="text-[#B8915C] hover:text-[#9F7A4F]">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div ref={jobsRef} className="space-y-4">
            {jobs.map((job) => (
              <motion.div
                key={job.id}
                className="job-card"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Card className="border-none bg-white/70 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl dark:bg-slate-900/70">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-[#2D2A24] dark:text-white">
                          {job.title}
                        </h3>
                        <p className="mt-1 text-sm text-[#5A534A] dark:text-slate-400">
                          Job ID: {job.id}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex items-center gap-1 text-xs text-[#A69A8C]">
                            <MapPin className="h-3 w-3" />
                            {job.location || "Location not specified"}
                          </div>
                          {job.required_skills?.[0] && (
                            <Badge className="border-none bg-[#B8915C]/10 text-[#B8915C]">
                              {job.required_skills[0]}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Link href="/candidate/jobs">
                        <Button size="sm" className="bg-[#B8915C] hover:bg-[#9F7A4F]">
                          Apply
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-[#2D2A24] dark:text-white">
            Upcoming Interviews & Updates
          </h2>
          <Card className="border-none bg-white/70 shadow-lg backdrop-blur-sm dark:bg-slate-900/70">
            <CardContent className="space-y-3 p-4">
              {interviews.length > 0 &&
                interviews.map((interview) => (
                  <motion.div
                    key={interview.id}
                    className="interview-item"
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <div className="cursor-pointer rounded-lg bg-[#F1E9E0] p-3 dark:bg-slate-800/50">
                      <div className="flex items-start gap-2">
                        <div className="mt-2 h-2 w-2 rounded-full bg-[#B8915C]" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[#2D2A24] dark:text-white">
                            Interview for application #{interview.application_id}
                          </p>
                          <p className="text-xs text-[#5A534A] dark:text-slate-400">
                            AI Interview
                          </p>
                          <div className="mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3 text-[#A69A8C]" />
                            <p className="text-xs text-[#5A534A] dark:text-slate-400">
                              {new Date(interview.scheduled_time).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              }
              {applicationUpdates.length > 0 &&
                applicationUpdates.map((update) => (
                  <motion.div
                    key={update.applicationId}
                    className="interview-item"
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <div className="rounded-lg bg-[#F1E9E0] p-3 dark:bg-slate-800/50">
                      <div className="flex items-start gap-2">
                        <div className="mt-2 h-2 w-2 rounded-full bg-[#B8915C]" />
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-[#2D2A24] dark:text-white">
                                {update.jobTitle}
                              </p>
                              <p className="text-xs text-[#5A534A] dark:text-slate-400">
                                {update.message}
                              </p>
                            </div>
                            <Badge className="border-none bg-[#B8915C]/10 text-[#B8915C]">
                              {formatStatus(update.status)}
                            </Badge>
                          </div>
                          {update.resumeScore !== null && (
                            <p className="mt-2 text-xs text-[#5A534A] dark:text-slate-400">
                              Resume score: {Math.round(update.resumeScore)}%
                            </p>
                          )}
                          {update.updatedAt && (
                            <p className="mt-1 text-xs text-[#A69A8C]">
                              Updated {new Date(update.updatedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              }
              {interviews.length === 0 && applicationUpdates.length === 0 && (
                <p className="text-sm text-[#5A534A] dark:text-slate-400">
                  No application updates available yet.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-none bg-white/70 shadow-lg backdrop-blur-sm dark:bg-slate-900/70">
            <CardContent className="space-y-2 p-4">
              <h3 className="mb-3 font-semibold text-[#2D2A24] dark:text-white">Quick actions</h3>
              <Link href="/candidate/jobs">
                <Button
                  variant="outline"
                  className="w-full justify-start border-[#D6CDC2] text-[#4A443C] hover:bg-[#F1E9E0]"
                >
                  <Briefcase className="mr-2 h-4 w-4 text-[#B8915C]" />
                  Browse jobs
                </Button>
              </Link>
              <Link href="/candidate/applications">
                <Button
                  variant="outline"
                  className="w-full justify-start border-[#D6CDC2] text-[#4A443C] hover:bg-[#F1E9E0]"
                >
                  <Target className="mr-2 h-4 w-4 text-[#B8915C]" />
                  Track applications
                </Button>
              </Link>
              <Link href="/candidate/profile">
                <Button
                  variant="outline"
                  className="w-full justify-start border-[#D6CDC2] text-[#4A443C] hover:bg-[#F1E9E0]"
                >
                  <Settings className="mr-2 h-4 w-4 text-[#B8915C]" />
                  Update profile
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
