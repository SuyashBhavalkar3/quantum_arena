"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { ProfileCompletionStatus } from "@/lib/profileCompletion";

interface ProfileCompletionCardProps {
  status: ProfileCompletionStatus;
  showDetails?: boolean;
}

export function ProfileCompletionCard({ status, showDetails = true }: ProfileCompletionCardProps) {
  const { percentage, isComplete, missingFields } = status;

  return (
    <Card className={`border-2 ${isComplete ? 'border-green-200 dark:border-green-800' : 'border-amber-200 dark:border-amber-800'}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {isComplete ? (
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Profile Completion</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {isComplete ? 'Your profile is complete!' : `${missingFields.length} field${missingFields.length > 1 ? 's' : ''} remaining`}
              </p>
            </div>
          </div>
          <Badge variant={isComplete ? "default" : "secondary"} className={isComplete ? "bg-green-600" : "bg-amber-600"}>
            {percentage}%
          </Badge>
        </div>

        <Progress value={percentage} className="h-2 mb-4" />

        {showDetails && !isComplete && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Missing Information:</p>
            <div className="flex flex-wrap gap-2">
              {missingFields.map((field) => (
                <Badge key={field} variant="outline" className="text-xs">
                  {field}
                </Badge>
              ))}
            </div>
            <Link href="/candidate/profile">
              <Button className="w-full mt-2" variant={isComplete ? "outline" : "default"}>
                Complete Profile <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}

        {!isComplete && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-3 flex items-start gap-1">
            <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <span>Complete your profile to apply for jobs, take assessments, and attend interviews.</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
