"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CalendarIcon, CheckCircle, Code, MapPin, MessageSquare, XCircle } from "lucide-react";
import {
  Clock,
  LucideIcon,
} from "lucide-react";



import Link from "next/link";
import { motion } from "framer-motion";

 type ApplicationStage =
  | "under_review"
  | "assessment_pending"
  | "assessment_scheduled"
  | "interview_scheduled"
  | "offer"
  | "rejected";

 interface Application {
  id: number;
  company: string;
  position: string;
  location: string;
  appliedDate: string;
  stage: ApplicationStage;
  interviewDate?: string;      // ISO string
  assessmentDate?: string;     // ISO string (scheduled assessment)
  offerDetails?: { salary: string; deadline: string };
  rejectionReason?: string;
}


 const stageConfig: Record<
  string,
  { label: string; color: string; icon: LucideIcon }
> = {
  under_review: {
    label: "Under Review",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    icon: Clock,
  },
  assessment_pending: {
    label: "Assessment Pending",
    color:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    icon: AlertCircle,
  },
  assessment_scheduled: {
    label: "Assessment Scheduled",
    color:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    icon: Code,
  },
  interview_scheduled: {
    label: "Interview Scheduled",
    color:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
    icon: MessageSquare,
  },
  offer: {
    label: "Offer Received",
    color:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    icon: CheckCircle,
  },
  rejected: {
    label: "Not Selected",
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    icon: XCircle,
  },
};

// Helper for classNames
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

interface ApplicationCardProps {
  application: Application;
  onScheduleClick: (id: number) => void;
  onAssessmentPassed: (id: number) => void;
}

export function ApplicationCard({
  application,
  onScheduleClick,
  onAssessmentPassed,
}: ApplicationCardProps) {
  const StageIcon = stageConfig[application.stage].icon;

  return (
    <motion.div
      className="application-card"
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400 }}
    >
      <div className="border-none bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-[#2D2A24] dark:text-white">
                {application.position}
              </h3>
              <Badge
                className={cn(
                  "stage-badge border-none flex items-center gap-1",
                  stageConfig[application.stage].color
                )}
              >
                <StageIcon className="h-3 w-3" />
                {stageConfig[application.stage].label}
              </Badge>
            </div>
            <p className="text-[#5A534A] dark:text-slate-400">
              {application.company}
            </p>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-xs text-[#A69A8C] flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                {application.location}
              </span>
              <span className="text-xs text-[#A69A8C] flex items-center">
                <CalendarIcon className="h-3 w-3 mr-1" />
                Applied {new Date(application.appliedDate).toLocaleDateString()}
              </span>
            </div>

            {/* Stage-specific actions */}

            {application.stage === "assessment_pending" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.3 }}
                className="mt-4 p-4 bg-amber-50/80 dark:bg-amber-900/20 backdrop-blur-sm rounded-lg border border-amber-200 dark:border-amber-800"
              >
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-300">
                    Action Required: Schedule Assessment
                  </p>
                </div>
                <p className="text-sm text-amber-700 dark:text-amber-400 mb-3">
                  Please schedule your assessment test to proceed.
                </p>
                <Button
                  size="sm"
                  onClick={() => onScheduleClick(application.id)}
                  variant="outline"
                  className="border-amber-600 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30"
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Schedule Now
                </Button>
              </motion.div>
            )}

            {application.stage === "assessment_scheduled" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.3 }}
                className="mt-4 p-4 bg-purple-50/80 dark:bg-purple-900/20 backdrop-blur-sm rounded-lg border border-purple-200 dark:border-purple-800"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Code className="h-4 w-4 text-purple-600" />
                  <p className="text-sm font-medium text-purple-900 dark:text-purple-300">
                    Assessment Scheduled
                  </p>
                </div>
                {application.assessmentDate && (
                  <p className="text-sm text-purple-700 dark:text-purple-400 mb-3">
                    {new Date(application.assessmentDate).toLocaleString()}
                  </p>
                )}
                <div className="flex gap-2">
                  <Link href={`/candidate/assessment?applicationId=${application.id}`}>
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                      Start Assessment
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAssessmentPassed(application.id)}
                    className="border-purple-600 text-purple-600 hover:bg-purple-50"
                  >
                    Mark Passed (Demo)
                  </Button>
                </div>
              </motion.div>
            )}

            {application.stage === "interview_scheduled" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.3 }}
                className="mt-4 p-4 bg-indigo-50/80 dark:bg-indigo-900/20 backdrop-blur-sm rounded-lg border border-indigo-200 dark:border-indigo-800"
              >
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-indigo-600" />
                  <p className="text-sm font-medium text-indigo-900 dark:text-indigo-300">
                    AI Interview Scheduled
                  </p>
                </div>
                {application.interviewDate && (
                  <p className="text-sm text-indigo-700 dark:text-indigo-400 mb-3">
                    {new Date(application.interviewDate!).toLocaleString()}
                  </p>
                )}
                <Link
                  href={`/candidate/interview?applicationId=${application.id}&company=${encodeURIComponent(
                    application.company
                  )}&position=${encodeURIComponent(application.position)}`}
                >
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                    Join Interview
                  </Button>
                </Link>
              </motion.div>
            )}

            {application.stage === "offer" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.3 }}
                className="mt-4 p-4 bg-green-50/80 dark:bg-green-900/20 backdrop-blur-sm rounded-lg border border-green-200 dark:border-green-800"
              >
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="text-sm font-medium text-green-900 dark:text-green-300">
                    Congratulations!
                  </p>
                </div>
                <p className="text-sm text-green-700 dark:text-green-400 mb-1">
                  Salary: {application.offerDetails?.salary}
                </p>
                <p className="text-xs text-green-600 dark:text-green-500 mb-3">
                  Respond by:{" "}
                  {new Date(application.offerDetails?.deadline!).toLocaleDateString()}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    Accept
                  </Button>
                  <Button size="sm" variant="outline">
                    Decline
                  </Button>
                </div>
              </motion.div>
            )}

            {application.stage === "rejected" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.3 }}
                className="mt-4 p-4 bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm rounded-lg border border-red-200 dark:border-red-800"
              >
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <p className="text-sm font-medium text-red-900 dark:text-red-300">
                    Application Closed
                  </p>
                </div>
                <p className="text-sm text-red-700 dark:text-red-400">
                  {application.rejectionReason}
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}