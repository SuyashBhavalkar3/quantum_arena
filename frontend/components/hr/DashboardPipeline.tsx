"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type PipelineStage = {
  label: string;
  value: number;
};

type DashboardPipelineProps = {
  title: string;
  stages: PipelineStage[];
  loading?: boolean;
};

export default function DashboardPipeline({
  title,
  stages,
  loading = false,
}: DashboardPipelineProps) {
  const maxValue = Math.max(...stages.map((stage) => stage.value), 1);

  return (
    <Card className="border-none bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm shadow-lg">
      <CardContent className="p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-[#2D2A24] dark:text-white">{title}</h2>
          <p className="mt-1 text-sm text-[#5A534A] dark:text-slate-400">
            Live breakdown from the latest backend totals
          </p>
        </div>

        <div className="space-y-4">
          {loading
            ? Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                  <Skeleton className="h-2.5 w-full" />
                </div>
              ))
            : stages.map((stage) => (
                <div key={stage.label}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-[#5A534A] dark:text-slate-400">{stage.label}</span>
                    <span className="font-medium text-[#2D2A24] dark:text-white">{stage.value}</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#F1E9E0] dark:bg-slate-800/60">
                    <div
                      className="h-full rounded-full bg-[#B8915C] transition-all duration-500"
                      style={{ width: `${(stage.value / maxValue) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
        </div>
      </CardContent>
    </Card>
  );
}
