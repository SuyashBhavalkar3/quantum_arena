"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import DynamicInterviewLayout from "@/components/interview/DynamicInterviewLayout";
import { applicationsAPI } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";

function InterviewContent() {
  const searchParams = useSearchParams();
  const applicationId = searchParams.get("applicationId") || "test";
  const company = searchParams.get("company") || "Tech Company";
  const position = searchParams.get("position") || "Software Engineer";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function validateAccess() {
      if (applicationId === "test") {
        if (mounted) {
          setLoading(false);
        }
        return;
      }

      try {
        const detail = await applicationsAPI.getMyApplicationDetail(Number(applicationId));

        if (
          detail.status !== "interview_scheduled" &&
          detail.status !== "interview_completed" &&
          detail.status !== "accepted"
        ) {
          throw new Error("AI interview is not available for this application yet.");
        }

        if (detail.interview_feedback?.ai_interview_status === "auto_concluded_violation") {
          throw new Error("This AI interview was already auto-concluded due to proctoring violations.");
        }
      } catch (accessError) {
        if (mounted) {
          setError(
            accessError instanceof Error ? accessError.message : "Failed to validate interview access."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void validateAccess();

    return () => {
      mounted = false;
    };
  }, [applicationId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#B8915C]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-xl border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30">
          <CardContent className="flex items-start gap-3 p-6">
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <DynamicInterviewLayout
      applicationId={applicationId}
      company={company}
      position={position}
    />
  );
}

export default function InterviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading interview...</div>}>
      <InterviewContent />
    </Suspense>
  );
}
