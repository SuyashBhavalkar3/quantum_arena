"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle } from "lucide-react";

interface ProfileStatus {
  percentage: number;
  isComplete: boolean;
  missingFields: string[];
}

interface ProfileCompletionStatusProps {
  profileStatus: ProfileStatus;
}

export default function ProfileCompletionStatus({ profileStatus }: ProfileCompletionStatusProps) {
  return (
    <Card
      className={`status-card mb-6 border-none bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl border border-white/20 ${
        profileStatus.isComplete
          ? "border-green-200 dark:border-green-800"
          : "border-amber-200 dark:border-amber-800"
      }`}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {profileStatus.isComplete ? (
              <CheckCircle className="h-8 w-8 text-green-600" />
            ) : (
              <AlertCircle className="h-8 w-8 text-amber-600" />
            )}
            <div>
              <h3 className="font-semibold text-lg text-[#2D2A24] dark:text-white">
                {profileStatus.isComplete ? "Profile Complete!" : "Complete Your Profile"}
              </h3>
              <p className="text-sm text-[#5A534A] dark:text-slate-400">
                {profileStatus.isComplete
                  ? "You can now apply for jobs, take assessments, and attend interviews"
                  : `${profileStatus.missingFields.length} field${
                      profileStatus.missingFields.length > 1 ? "s" : ""
                    } remaining`}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div
              className={`text-3xl font-bold ${
                profileStatus.isComplete ? "text-green-600" : "text-amber-600"
              }`}
            >
              {profileStatus.percentage}%
            </div>
          </div>
        </div>

        <Progress
          value={profileStatus.percentage}
          className="h-3 bg-[#D6CDC2] dark:bg-slate-700 [&>div]:bg-[#B8915C]"
        />

        {!profileStatus.isComplete && (
          <div className="mt-4 flex flex-wrap gap-2">
            {profileStatus.missingFields.map((field) => (
              <Badge key={field} variant="outline" className="border-[#B8915C]/30 text-[#B8915C]">
                {field}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}