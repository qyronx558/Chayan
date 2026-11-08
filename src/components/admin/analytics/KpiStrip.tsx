"use client";

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KpiItem } from "@/lib/analytics/types";
import { Sparkline } from "@/components/admin/dashboard/Sparkline";

export function KpiStrip({ items, range }: { items: KpiItem[]; range: string }) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-rule bg-paper-3  dark:bg-background/[0.06] xl:grid-cols-5 lg:grid-cols-3">
      {items.map((k) => (
        <div key={k.key} className="min-w-0 bg-background p-4  sm:p-5">
          <p className="truncate text-xs font-medium text-muted-foreground dark:text-muted-foreground">{k.label}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-2xl font-bold tabular-nums text-foreground dark:text-paper">
              {k.display ?? k.value.toLocaleString("en-IN")}
            </span>
            {k.deltaPct === null ? (
              <span className="text-[11px] font-medium text-muted-foreground">- vs prev</span>
            ) : (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-1.5 py-px text-[11px] font-semibold tabular-nums",
                  k.deltaPct === 0
                    ? "bg-paper-3 text-muted-foreground dark:bg-background/10 dark:text-muted-foreground"
                    : k.deltaPct > 0
                      ? "bg-paper-3 text-foreground dark:bg-paper-3 dark:text-foreground"
                      : "bg-paper-2 text-brick dark:bg-paper-2 dark:text-brick"
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
          <p className="mt-1 truncate text-xs text-muted-foreground dark:text-muted-foreground">{k.sub}</p>
        </div>
      ))}
    </div>
  );
}
