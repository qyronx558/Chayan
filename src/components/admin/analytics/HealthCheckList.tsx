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
      <div className="mb-3 flex items-center gap-0.5 rounded-lg bg-paper-3 p-0.5 dark:bg-background/[0.06]" role="tablist" aria-label="Health filter">
        {(["all", "issues", "healthy"] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-semibold capitalize transition-colors",
              filter === f ? "bg-background text-foreground  dark:bg-background/10 dark:text-paper" : "text-muted-foreground hover:text-foreground dark:text-muted-foreground"
            )}
          >
            {f}
          </button>
        ))}
      </div>
      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <Inbox className="h-8 w-8 text-muted-foreground dark:text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nothing in this view.</p>
        </div>
      ) : (
        <ul className="divide-y divide-rule100 ">
          {visible.map((h) => {
            const Icon = ICON[h.status];
            return (
              <li key={h.key} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                <Icon
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0",
                    h.status === "ok" ? "text-foreground" : h.status === "warning" ? "text-brick" : "text-brick"
                  )}
                  aria-label={`Status ${h.status}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground dark:text-paper">{h.title}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{h.detail}</p>
                  <p className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">Checked {timeAgo(h.checkedAt)}</p>
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
