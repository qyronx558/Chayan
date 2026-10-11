"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, TriangleAlert, OctagonX, Play, Inbox } from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DataCard } from "@/components/admin/dashboard/DataCard";
import type { HealthItem } from "@/lib/analytics/types";

type Filter = "all" | "issues" | "healthy";

const ICON: Record<HealthItem["status"], typeof CheckCircle2> = {
  ok: CheckCircle2,
  warning: TriangleAlert,
  critical: OctagonX,
};

export function HealthCheckList({ items, onRunAll, running }: { items: HealthItem[]; onRunAll: () => void; running: boolean }) {
  const [filter, setFilter] = useState<Filter>("all");
  const visible = items.filter((h) => (filter === "all" ? true : filter === "issues" ? h.status !== "ok" : h.status === "ok"));
  return (
    <DataCard
      title="Health checks"
      subtitle="8 automated checks across tracking, links and content"
      className="h-full"
      action={
        <Button size="sm" variant="outline" onClick={onRunAll} disabled={running} aria-live="polite">
          <Play className="mr-1 h-3.5 w-3.5" /> {running ? "Running…" : "Run all"}
        </Button>
      }
    >
      <div className="mb-3 flex items-center gap-0.5 rounded-lg bg-slate-100 p-0.5 dark:bg-white/[0.06]" role="tablist" aria-label="Health filter">
        {(["all", "issues", "healthy"] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-semibold capitalize transition-colors",
              filter === f ? "bg-white text-slate-900 shadow-sm dark:bg-white/10 dark:text-slate-100" : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
            )}
          >
            {f}
          </button>
        ))}
      </div>
      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <Inbox className="h-8 w-8 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-500">Nothing in this view.</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-white/[0.06]">
          {visible.map((h) => {
            const Icon = ICON[h.status];
            return (
              <li key={h.key} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                <Icon
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0",
                    h.status === "ok" ? "text-emerald-600" : h.status === "warning" ? "text-amber-500" : "text-rose-600"
                  )}
                  aria-label={`Status ${h.status}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{h.title}</p>
                  <p className="line-clamp-2 text-xs text-slate-500">{h.detail}</p>
                  <p className="mt-0.5 text-[11px] tabular-nums text-slate-400">Checked {timeAgo(h.checkedAt)}</p>
                </div>
                <Button size="sm" variant="ghost" asChild className="shrink-0">
                  <Link href={h.href}>{h.actionLabel}</Link>
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </DataCard>
  );
}
