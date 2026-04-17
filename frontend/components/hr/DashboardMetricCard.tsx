"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LucideIcon } from "lucide-react";

type DashboardMetricCardProps = {
  label: string;
  value: number | string;
  description: string;
  icon: LucideIcon;
  loading?: boolean;
};

export default function DashboardMetricCard({
  label,
  value,
  description,
  icon: Icon,
  loading = false,
}: DashboardMetricCardProps) {
  return (
    <Card className="border-none bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
      <CardContent className="p-6">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm text-[#5A534A] dark:text-slate-400">{label}</p>
          <div className="rounded-lg bg-[#B8915C]/10 p-2">
            <Icon className="h-5 w-5 text-[#B8915C]" />
          </div>
        </div>

        {loading ? (
          <>
            <Skeleton className="mb-2 h-8 w-20" />
            <Skeleton className="h-4 w-32" />
          </>
        ) : (
          <>
            <p className="text-3xl font-bold text-[#2D2A24] dark:text-white">{value}</p>
            <p className="mt-2 text-xs text-[#A69A8C]">{description}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
