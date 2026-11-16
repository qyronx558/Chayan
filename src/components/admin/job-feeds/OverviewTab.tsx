"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { AlertTriangle, ArrowRight, PauseCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { T_CARD } from "@/components/admin/list/tokens"
import { METHOD_LABEL, PROVIDER_LABEL, statsLine, type FeedsResponse, type SettingsResponse } from "./types"

function Stat({ label, value, hint, tone }: { label: string; value: number | string; hint?: string; tone?: "warn" | "muted" }) {
  return (
    <Card className={cn(T_CARD, "p-4")}>
      <p className={cn("text-2xl font-semibold tabular-nums", tone === "warn" ? "text-amber-600" : "text-foreground")}>{value}</p>
      <p className="text-sm font-medium">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  )
}

export function OverviewTab({ feeds, settings }: { feeds: FeedsResponse; settings: SettingsResponse | undefined }) {
  const s = feeds.summary
  const recent = [...feeds.data]
    .filter((f) => f.lastRunAt)
    .sort((a, b) => new Date(b.lastRunAt as string).getTime() - new Date(a.lastRunAt as string).getTime())
    .slice(0, 8)
  const problems = feeds.data.filter((f) => f.lastStatus === "ERROR" || f.lastStatus === "HELD")

  return (
    <div className="space-y-4">
      {settings && !settings.settings.enabled && (
        <Card className="flex items-center gap-3 border-amber-300 bg-amber-50 p-4 text-sm dark:bg-amber-950/30">
          <PauseCircle className="h-5 w-5 shrink-0 text-amber-600" />
          Automatic seeding is paused. Turn it on in Settings to resume scheduled syncs.
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Live jobs from sources" value={s.liveJobs.toLocaleString("en-IN")} hint={`${s.enabled} of ${s.feeds} sources on`} />
        <Stat label="New in 24 hours" value={s.created24h.toLocaleString("en-IN")} />
        <Stat label="Waiting for review" value={s.pendingReview} hint="AI-extracted jobs" tone={s.pendingReview ? "warn" : undefined} />
        <Stat label="Need attention" value={s.problems} hint="Errors or held syncs" tone={s.problems ? "warn" : undefined} />
      </div>

      {s.pendingReview > 0 && (
        <Link
          href="/admin/review"
          className="flex items-center justify-between rounded-2xl border border-rule px-4 py-3 text-sm font-medium hover:bg-muted"
        >
          Review {s.pendingReview} AI-extracted jobs in Content verification (Private Jobs) <ArrowRight className="h-4 w-4" />
        </Link>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className={cn(T_CARD, "p-4")}>
          <h3 className="text-sm font-semibold">Latest syncs</h3>
          {recent.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No sync has run yet.</p>
          ) : (
            <ul className="mt-2 divide-y divide-rule">
              {recent.map((f) => (
                <li key={f.id} className="flex items-start justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{f.company.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{statsLine(f.lastStats)}</p>
                  </div>
                  <div className="shrink-0 text-right text-xs text-muted-foreground">
                    <p>{formatDistanceToNow(new Date(f.lastRunAt as string), { addSuffix: true })}</p>
                    <p>{f.lastStats?.method ? METHOD_LABEL[f.lastStats.method] ?? f.lastStats.method : PROVIDER_LABEL[f.provider]}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className={cn(T_CARD, "p-4")}>
          <h3 className="text-sm font-semibold">Needs attention</h3>
          {problems.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Every source synced cleanly.</p>
          ) : (
            <ul className="mt-2 divide-y divide-rule">
              {problems.map((f) => (
                <li key={f.id} className="flex gap-2.5 py-2.5">
                  <AlertTriangle className={cn("mt-0.5 h-4 w-4 shrink-0", f.lastStatus === "ERROR" ? "text-red-600" : "text-amber-600")} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{f.company.name}</p>
                    <p className="break-words text-xs text-muted-foreground">{f.lastError}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
