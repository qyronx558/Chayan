"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading analytics">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Skeleton className="h-4 w-48" />
          <Skeleton className="mt-2 h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-80" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-rule lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-background p-4 ">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-8 w-20" />
            <Skeleton className="mt-2 h-9 w-full" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <Skeleton className="h-[340px] rounded-xl lg:col-span-3" />
        <Skeleton className="h-[340px] rounded-xl lg:col-span-2" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[300px] rounded-xl" />
        <Skeleton className="h-[300px] rounded-xl" />
      </div>
    </div>
  );
}
