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
          <p className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">No unusual patterns in this range.</p>
        ) : (
          <ul className="space-y-2">
            {data.patterns.map((p) => (
              <li key={p.key} className="flex items-start gap-2.5 rounded-lg border border-slate-200 p-2.5 dark:border-white/[0.06]">
                {p.severity === "critical" ? (
                  <OctagonAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-label="Critical" />
                ) : p.severity === "warning" ? (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-label="Warning" />
                ) : (
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-label="Info" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{p.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{p.detail}</p>
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
        subtitle="Amber bars mark unusual volume"
        action={
          <div className="flex gap-1" role="group" aria-label="Range">
            {[14, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => onDays(d)}
                aria-pressed={days === d}
                className={`inline-flex h-[30px] items-center rounded-md px-2.5 text-xs font-medium leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${days === d ? "bg-teal-700 text-white" : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5"}`}
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
                className={`w-full rounded-t ${d.anomaly ? "bg-amber-400" : "bg-teal-600/80"}`}
                style={{ height: `${Math.max(3, Math.round((d.count / maxDay) * 130))}px` }}
              />
              <div className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] tabular-nums shadow-sm group-hover:block dark:border-white/10 dark:bg-[#0b1220]">
                {d.date.slice(5)} · {d.count}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex justify-between text-[11px] tabular-nums text-slate-400">
          <span>{data.daily[0]?.date.slice(5)}</span>
          <span>{data.daily[data.daily.length - 1]?.date.slice(5)}</span>
        </div>
      </DataCard>
      <DataCard title="Breakdown by action" subtitle="Share of events in range">
        <div className="flex h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10" role="img" aria-label="Action breakdown">
          {data.byAction.map((a) => (
            <div key={a.action} className="h-full bg-teal-600 first:rounded-l-full last:rounded-r-full" style={{ width: `${Math.max(a.pct, 2)}%`, opacity: 0.45 + (a.pct / 100) * 0.55 }} title={`${a.action}: ${a.count}`} />
          ))}
        </div>
        <ul className="mt-2.5 space-y-1.5">
          {data.byAction.slice(0, 8).map((a) => (
            <li key={a.action} className="flex items-center gap-2 text-xs">
              <span className="w-28 shrink-0 truncate font-medium text-slate-600 dark:text-slate-300">{a.action}</span>
              <span className="flex-1" />
              <span className="tabular-nums text-slate-500 dark:text-slate-400">{a.count.toLocaleString("en-IN")} · {a.pct}%</span>
            </li>
          ))}
        </ul>
      </DataCard>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 lg:col-span-1 col-span-1">
        <DataCard title="Top actors" subtitle="Most active in range">
          <ul className="space-y-1.5">
            {data.topActors.slice(0, 6).map((a) => (
              <li key={a.actorId} className="flex items-center gap-2 text-xs">
                <span className="min-w-0 flex-1 truncate font-medium text-slate-700 dark:text-slate-200">{a.name}</span>
                <span className="shrink-0 tabular-nums text-slate-500 dark:text-slate-400">{a.count.toLocaleString("en-IN")}</span>
              </li>
            ))}
            {data.topActors.length === 0 ? <li className="text-xs text-slate-400">No actors yet.</li> : null}
          </ul>
        </DataCard>
        <DataCard title="Breakdown by section" subtitle="Events per entity">
          <ul className="space-y-1.5">
            {data.bySection.slice(0, 6).map((s) => (
              <li key={s.entityType} className="flex items-center gap-2 text-xs">
                <span className="min-w-0 flex-1 truncate font-medium text-slate-700 dark:text-slate-200">{s.entityType}</span>
                <span className="shrink-0 tabular-nums text-slate-500 dark:text-slate-400">{s.count.toLocaleString("en-IN")} · {s.pct}%</span>
              </li>
            ))}
            {data.bySection.length === 0 ? <li className="text-xs text-slate-400">No sections yet.</li> : null}
          </ul>
        </DataCard>
      </div>
    </div>
  );
}
