"use client";

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KpiItem } from "@/lib/analytics/types";
import { Sparkline } from "@/components/admin/dashboard/Sparkline";

export function KpiStrip({ items, range }: { items: KpiItem[]; range: string }) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 dark:border-white/[0.06] dark:bg-white/[0.06] xl:grid-cols-5 lg:grid-cols-3">
      {items.map((k) => (
        <div key={k.key} className="min-w-0 bg-white p-4 dark:bg-[#0b1220] sm:p-5">
          <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">{k.label}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
              {k.display ?? k.value.toLocaleString("en-IN")}
            </span>
            {k.deltaPct === null ? (
              <span className="text-[11px] font-medium text-slate-400">- vs prev</span>
            ) : (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-1.5 py-px text-[11px] font-semibold tabular-nums",
                  k.deltaPct === 0
                    ? "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400"
                    : k.deltaPct > 0
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                )}
              >
                {k.deltaPct === 0 ? <Minus className="h-3 w-3" /> : k.deltaPct > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {k.deltaPct > 0 ? "+" : ""}{k.deltaPct}% vs prev
              </span>
            )}
          </div>
          {k.spark.length > 0 ? (
            <div className="mt-1"><Sparkline data={k.spark} id={`akpi-${k.key}-${range}`} /></div>
          ) : null}
          <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{k.sub}</p>
        </div>
      ))}
    </div>
  );
}
