"use client";

import { DataCard } from "@/components/admin/dashboard/DataCard";
import { cn } from "@/lib/utils";
import type { HeatCell } from "@/lib/analytics/types";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function Heatmap({ cells }: { cells: HeatCell[] }) {
  const max = Math.max(1, ...cells.map((c) => c.value));
  const at = (dow: number, hour: number) => cells.find((c) => c.dow === dow && c.hour === hour)?.value ?? 0;
  return (
    <DataCard title="Visit-time heatmap" subtitle="Sessions by weekday and hour (7 × 24)" className="h-full">
      <div className="overflow-x-auto">
        <div className="min-w-[560px]" role="img" aria-label="Visit time heatmap by weekday and hour">
          <div className="grid grid-cols-[36px_repeat(24,1fr)] gap-[2px] text-[10px]">
            <span />
            {Array.from({ length: 24 }, (_, h) => (
              <span key={h} className="text-center tabular-nums text-slate-400">{h % 3 === 0 ? `${h}h` : ""}</span>
            ))}
            {DOW.map((d, dow) => (
              <div key={d} className="contents">
                <span className="flex items-center font-medium text-slate-500">{d}</span>
                {Array.from({ length: 24 }, (_, hour) => {
                  const v = at(dow, hour);
                  const t = v / max;
                  return (
                    <span
                      key={hour}
                      title={`${d} ${hour}:00 - ${v} visits`}
                      className={cn("h-4 rounded-[3px]", t === 0 ? "bg-slate-100 dark:bg-white/[0.06]" : t < 0.25 ? "bg-teal-100 dark:bg-teal-950" : t < 0.5 ? "bg-teal-300 dark:bg-teal-800" : t < 0.75 ? "bg-teal-500" : "bg-teal-700")}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </DataCard>
  );
}
