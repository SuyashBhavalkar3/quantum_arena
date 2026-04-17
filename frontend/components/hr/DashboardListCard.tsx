"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from "lucide-react";

type DashboardListCardProps<T> = {
  title: string;
  href: string;
  items: T[];
  loading?: boolean;
  emptyMessage: string;
  renderItem: (item: T) => ReactNode;
};

export default function DashboardListCard<T>({
  title,
  href,
  items,
  loading = false,
  emptyMessage,
  renderItem,
}: DashboardListCardProps<T>) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[#2D2A24] dark:text-white">{title}</h2>
        <Link href={href}>
          <Button variant="ghost" size="sm" className="text-[#B8915C] hover:text-[#9F7A4F]">
            View all <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </div>

      <Card className="border-none bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm shadow-lg">
        <CardContent className="space-y-3 p-4">
          {loading
            ? Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-lg bg-[#F1E9E0] p-4 dark:bg-slate-800/50"
                >
                  <Skeleton className="mb-2 h-4 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
              ))
            : items.length > 0
            ? items.map((item, index) => <div key={index}>{renderItem(item)}</div>)
            : (
              <div className="rounded-lg bg-[#F1E9E0] p-4 text-sm text-[#5A534A] dark:bg-slate-800/50 dark:text-slate-400">
                {emptyMessage}
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
