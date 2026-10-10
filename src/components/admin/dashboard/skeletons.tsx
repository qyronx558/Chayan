import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

function PanelShell({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-4 dark:border-white/[0.06] dark:bg-[#0b1220] sm:p-5",
        className
      )}
    >
      {children}
    </div>
  )
}

export function KpiStripSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 dark:border-white/[0.06] dark:bg-white/[0.06] lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white p-4 dark:bg-[#0b1220] sm:p-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-3 h-8 w-20" />
          <Skeleton className="mt-2 h-9 w-full" />
          <Skeleton className="mt-2 h-3 w-28" />
        </div>
      ))}
    </div>
  )
}

export function TrendSkeleton() {
  return (
    <PanelShell>
      <div className="flex items-start justify-between">
        <div>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-2 h-3 w-48" />
        </div>
        <Skeleton className="h-8 w-16" />
      </div>
      <Skeleton className="mt-4 h-[260px] w-full" />
    </PanelShell>
  )
}

export function AttentionSkeleton() {
  return (
    <PanelShell className="h-full">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-2 h-3 w-44" />
      <div className="mt-3 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="mt-1 h-3 w-1/2" />
            </div>
            <Skeleton className="h-6 w-10 rounded-full" />
          </div>
        ))}
      </div>
    </PanelShell>
  )
}

export function RecentSkeleton() {
  return (
    <PanelShell>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-48 rounded-lg" />
      </div>
      <div className="mt-3 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="mt-1 h-3 w-1/2" />
            </div>
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    </PanelShell>
  )
}

export function PipelineSkeleton() {
  return (
    <PanelShell>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-2 h-3 w-48" />
      <Skeleton className="mt-4 h-2.5 w-full rounded-full" />
      <div className="mt-3 space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </PanelShell>
  )
}

export function LibrarySkeleton() {
  return (
    <PanelShell>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-2 h-3 w-40" />
      <div className="mt-3 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-10" />
            </div>
            <Skeleton className="mt-1.5 h-1.5 w-full rounded-full" />
          </div>
        ))}
      </div>
    </PanelShell>
  )
}

export function TimelineSkeleton() {
  return (
    <PanelShell>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-2 h-3 w-44" />
      <div className="mt-3 space-y-3 border-l border-slate-200 pl-4 dark:border-white/10">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="mt-1 h-3 w-full" />
          </div>
        ))}
      </div>
    </PanelShell>
  )
}

export function FeedbackSkeleton() {
  return <TimelineSkeleton />
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Skeleton className="h-3 w-40" />
          <Skeleton className="mt-2 h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-80" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <KpiStripSkeleton />
      <div className="grid gap-4 lg:grid-cols-5 xl:gap-5">
        <div className="lg:col-span-3">
          <TrendSkeleton />
        </div>
        <div className="lg:col-span-2">
          <AttentionSkeleton />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-5 xl:gap-5">
        <div className="lg:col-span-3">
          <RecentSkeleton />
        </div>
        <div className="lg:col-span-2">
          <PipelineSkeleton />
        </div>
      </div>
    </div>
  )
}
