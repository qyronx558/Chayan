import { Inbox } from "lucide-react"
import { cn } from "@/lib/utils"
import { timeAgo } from "@/lib/utils"
import type { PipelineDatum } from "./types"

const SEGMENT_BAR: Record<string, string> = {
  published: "bg-emerald-500",
  pending: "bg-amber-400",
  draft: "bg-sky-400",
  rejected: "bg-rose-500",
}

const SEGMENT_DOT: Record<string, string> = {
  published: "bg-emerald-500",
  pending: "bg-amber-400",
  draft: "bg-sky-400",
  rejected: "bg-rose-500",
}

function formatReviewTime(hours: number | null): string {
  if (hours === null) return "-"
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m`
  if (hours < 48) return `${hours}h`
  return `${Math.round((hours / 24) * 10) / 10}d`
}

export function PipelineBar({ pipeline }: { pipeline: PipelineDatum }) {
  if (pipeline.total === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
        <Inbox className="h-8 w-8 text-slate-300 dark:text-slate-600" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No content yet</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">Uploads will build this pipeline.</p>
      </div>
    )
  }
  return (
    <div>
      <div
        className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10"
        role="img"
        aria-label={`${pipeline.total} items in review pipeline`}
      >
        {pipeline.segments.map((s) =>
          s.count > 0 ? (
            <span
              key={s.key}
              style={{ width: `${Math.max(s.pct, 2)}%` }}
              className={cn(SEGMENT_BAR[s.key] ?? "bg-slate-300")}
            />
          ) : null
        )}
      </div>
      <ul className="mt-3 space-y-2">
        {pipeline.segments.map((s) => (
          <li key={s.key} className="flex items-center gap-2 text-sm">
            <span className={cn("h-2 w-2 shrink-0 rounded-full", SEGMENT_DOT[s.key] ?? "bg-slate-300")} />
            <span className="flex-1 text-slate-600 dark:text-slate-300">{s.label}</span>
            <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
              {s.count.toLocaleString("en-IN")}
            </span>
            <span className="w-12 text-right text-xs tabular-nums text-slate-400">{s.pct}%</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 dark:border-white/[0.06]">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Avg review</p>
          <p className="truncate text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
            {formatReviewTime(pipeline.avgReviewHours)}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Approval</p>
          <p className="truncate text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
            {pipeline.approvalRate === null ? "-" : `${pipeline.approvalRate}%`}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Oldest wait</p>
          {pipeline.oldestPending ? (
            <>
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                {pipeline.oldestPending.title}
              </p>
              <p className="truncate text-[11px] text-slate-400">
                {pipeline.oldestPending.module} · {timeAgo(pipeline.oldestPending.createdAt)}
              </p>
            </>
          ) : (
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">-</p>
          )}
        </div>
      </div>
    </div>
  )
}
