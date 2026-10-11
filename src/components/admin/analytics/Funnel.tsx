"use client";

import { DataCard } from "@/components/admin/dashboard/DataCard";
import type { FunnelStep } from "@/lib/analytics/types";

export function Funnel({ steps }: { steps: FunnelStep[] }) {
  const max = Math.max(1, ...steps.map((s) => s.value));
  return (
    <DataCard title="Conversion funnel" subtitle="Visitors → job open → apply click → signup" className="h-full">
      {steps.every((s) => s.value === 0) ? (
        <p className="py-10 text-center text-sm text-slate-500">No funnel activity in this period.</p>
      ) : (
        <ol className="space-y-3" aria-label="Conversion funnel">
          {steps.map((s, i) => (
            <li key={s.key}>
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-teal-700 text-[11px] font-bold text-white">{i + 1}</span>
                  {s.label}
                </span>
                <span className="tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                  {s.value.toLocaleString("en-IN")}
                  {s.stepPct !== null ? <span className="ml-1.5 text-xs font-medium text-teal-700 dark:text-teal-300">{s.stepPct}%</span> : null}
                </span>
              </div>
              <span className="mt-1 block h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                <span className="block h-full rounded-full bg-teal-700 dark:bg-teal-500" style={{ width: `${(s.value / max) * 100}%` }} />
              </span>
              {s.stepPct !== null && i > 0 ? (
                <p className="mt-0.5 text-[11px] tabular-nums text-slate-400">{s.stepPct}% converted from previous step</p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </DataCard>
  );
}
