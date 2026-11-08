"use client";

import { DataCard } from "@/components/admin/dashboard/DataCard";
import type { FunnelStep } from "@/lib/analytics/types";

export function Funnel({ steps }: { steps: FunnelStep[] }) {
  const max = Math.max(1, ...steps.map((s) => s.value));
  return (
    <DataCard title="Conversion funnel" subtitle="Visitors → job open → apply click → signup" className="h-full">
      {steps.every((s) => s.value === 0) ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No funnel activity in this period.</p>
      ) : (
        <ol className="space-y-3" aria-label="Conversion funnel">
          {steps.map((s, i) => (
            <li key={s.key}>
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="font-medium text-foreground dark:text-muted-foreground">
                  <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-paper-3 text-[11px] font-bold text-paper">{i + 1}</span>
                  {s.label}
                </span>
                <span className="tabular-nums font-semibold text-foreground dark:text-paper">
                  {s.value.toLocaleString("en-IN")}
                  {s.stepPct !== null ? <span className="ml-1.5 text-xs font-medium text-brick dark:text-brick">{s.stepPct}%</span> : null}
                </span>
              </div>
              <span className="mt-1 block h-2 overflow-hidden rounded-full bg-paper-3 dark:bg-background/10">
                <span className="block h-full rounded-full bg-paper-3 dark:bg-paper-3" style={{ width: `${(s.value / max) * 100}%` }} />
              </span>
              {s.stepPct !== null && i > 0 ? (
                <p className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">{s.stepPct}% converted from previous step</p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </DataCard>
  );
}
