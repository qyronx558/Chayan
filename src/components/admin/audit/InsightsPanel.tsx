"use client";
import { DataCard } from "@/components/admin/dashboard/DataCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { AuditInsights } from "./types";
import type { AuditFilters } from "./types";
import { AlertTriangle, Info, OctagonAlert, ArrowRight } from "lucide-react";

export function InsightsPanel({
  data,
  loading,
  days,
  onDays,
  onReview,
}: {
  data: AuditInsights | null;
  loading: boolean;
  days: number;
  onDays: (d: number) => void;
  onReview: (f: Partial<AuditFilters>) => void;
}) {
  if (loading || !data) {
    return (
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <DataCard key={i} title="Loading" subtitle="Computing insights"><Skeleton className="h-40 w-full" /></DataCard>
        ))}
      </div>
    );
  }
  const maxDay = Math.max(1, ...data.daily.map((d) => d.count));
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <DataCard title="Detected patterns" subtitle="Computed on the server from recent events">
        {data.patterns.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground dark:text-muted-foreground">No unusual patterns in this range.</p>
        ) : (
          <ul className="space-y-2">
            {data.patterns.map((p) => (
              <li key={p.key} className="flex items-start gap-2.5 rounded-lg border border-rule p-2.5 ">
                {p.severity === "critical" ? (
                  <OctagonAlert className="mt-0.5 h-4 w-4 shrink-0 text-brick" aria-label="Critical" />
                ) : p.severity === "warning" ? (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-brick" aria-label="Warning" />
                ) : (
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-brick" aria-label="Info" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground dark:text-paper">{p.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground dark:text-muted-foreground">{p.detail}</p>
                </div>
                <Button variant="outline" className="h-[30px] shrink-0 px-2.5 text-xs leading-none" onClick={() => onReview(p.filter)}>
                  Review <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DataCard>
      <DataCard
        title="Events per day"
        subtitle="Brick bars mark unusual volume"
        action={
          <div className="flex gap-1" role="group" aria-label="Range">
            {[14, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => onDays(d)}
                aria-pressed={days === d}
                className={`inline-flex h-[30px] items-center rounded-md px-2.5 text-xs font-medium leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rule ${days === d ? "bg-paper-3 text-paper" : "text-muted-foreground hover:bg-paper-3 dark:text-muted-foreground dark:hover:bg-background/5"}`}
              >
                {d}d
              </button>
            ))}
          </div>
        }
      >
        <div className="flex h-36 items-end gap-1" role="img" aria-label="Events per day chart">
          {data.daily.map((d) => (
            <div key={d.date} className="group relative min-w-0 flex-1" title={`${d.date}: ${d.count} events`}>
              <div
                className={`w-full rounded-t ${d.anomaly ? "bg-paper-2" : "bg-paper-3"}`}
                style={{ height: `${Math.max(3, Math.round((d.count / maxDay) * 130))}px` }}
              />
              <div className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-rule bg-background px-2 py-1 text-[11px] tabular-nums  group-hover:block  ">
                {d.date.slice(5)} · {d.count}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex justify-between text-[11px] tabular-nums text-muted-foreground">
          <span>{data.daily[0]?.date.slice(5)}</span>
          <span>{data.daily[data.daily.length - 1]?.date.slice(5)}</span>
        </div>
      </DataCard>
      <DataCard title="Breakdown by action" subtitle="Share of events in range">
        <div className="flex h-3 overflow-hidden rounded-full bg-paper-3 dark:bg-background/10" role="img" aria-label="Action breakdown">
          {data.byAction.map((a) => (
            <div key={a.action} className="h-full bg-paper-3 first:rounded-l-full last:rounded-r-full" style={{ width: `${Math.max(a.pct, 2)}%`, opacity: 0.45 + (a.pct / 100) * 0.55 }} title={`${a.action}: ${a.count}`} />
          ))}
        </div>
        <ul className="mt-2.5 space-y-1.5">
          {data.byAction.slice(0, 8).map((a) => (
            <li key={a.action} className="flex items-center gap-2 text-xs">
              <span className="w-28 shrink-0 truncate font-medium text-muted-foreground dark:text-muted-foreground">{a.action}</span>
              <span className="flex-1" />
              <span className="tabular-nums text-muted-foreground dark:text-muted-foreground">{a.count.toLocaleString("en-IN")} · {a.pct}%</span>
            </li>
          ))}
        </ul>
      </DataCard>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 lg:col-span-1 col-span-1">
        <DataCard title="Top actors" subtitle="Most active in range">
          <ul className="space-y-1.5">
            {data.topActors.slice(0, 6).map((a) => (
              <li key={a.actorId} className="flex items-center gap-2 text-xs">
                <span className="min-w-0 flex-1 truncate font-medium text-foreground dark:text-muted-foreground">{a.name}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground dark:text-muted-foreground">{a.count.toLocaleString("en-IN")}</span>
              </li>
            ))}
            {data.topActors.length === 0 ? <li className="text-xs text-muted-foreground">No actors yet.</li> : null}
          </ul>
        </DataCard>
        <DataCard title="Breakdown by section" subtitle="Events per entity">
          <ul className="space-y-1.5">
            {data.bySection.slice(0, 6).map((s) => (
              <li key={s.entityType} className="flex items-center gap-2 text-xs">
                <span className="min-w-0 flex-1 truncate font-medium text-foreground dark:text-muted-foreground">{s.entityType}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground dark:text-muted-foreground">{s.count.toLocaleString("en-IN")} · {s.pct}%</span>
              </li>
            ))}
            {data.bySection.length === 0 ? <li className="text-xs text-muted-foreground">No sections yet.</li> : null}
          </ul>
        </DataCard>
      </div>
    </div>
  );
}
