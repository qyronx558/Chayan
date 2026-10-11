"use client";

import { TriangleAlert, Inbox } from "lucide-react";
import { DataCard } from "@/components/admin/dashboard/DataCard";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export interface BarRow {
  id: string;
  label: string;
  value: number;
  warn?: boolean;
  sub?: string;
}

export function BarList({ title, subtitle, rows, maxRows = 12 }: { title: string; subtitle?: string; rows: BarRow[]; maxRows?: number }) {
  const sorted = [...rows].sort((a, b) => b.value - a.value).slice(0, maxRows);
  const max = Math.max(1, ...sorted.map((r) => r.value));
  return (
    <DataCard title={title} subtitle={subtitle} className="h-full">
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <Inbox className="h-8 w-8 text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-medium text-slate-500">No data in this period</p>
        </div>
      ) : (
        <ul className="space-y-2.5" aria-label={title}>
          {sorted.map((r) => (
            <li key={r.id}>
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="flex min-w-0 items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200">
                  <span className="truncate">{r.label}</span>
                  {r.warn ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <TriangleAlert className="h-3.5 w-3.5 shrink-0 text-amber-500" aria-label="Suspected duplicate" />
                      </TooltipTrigger>
                      <TooltipContent>Suspected duplicate category name</TooltipContent>
                    </Tooltip>
                  ) : null}
                </span>
                <span className="shrink-0 font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                  {r.value.toLocaleString("en-IN")}
                  {r.sub ? <span className="ml-1.5 text-xs font-normal text-slate-400">{r.sub}</span> : null}
                </span>
              </div>
              <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                <span
                  className="block h-full rounded-full bg-teal-700 dark:bg-teal-500"
                  style={{ width: `${r.value > 0 ? Math.max((r.value / max) * 100, 2) : 0}%` }}
                />
              </span>
            </li>
          ))}
        </ul>
      )}
    </DataCard>
  );
}
