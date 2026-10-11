"use client";

import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { DataCard } from "@/components/admin/dashboard/DataCard";
import type { MetricSeries } from "@/lib/analytics/types";

const COLORS: Record<string, string> = { views: "#0F766E", visitors: "#2563EB", jobs: "#D97706" };

export function TrendChart({ series, title, subtitle }: { series: MetricSeries[]; title: string; subtitle: string }) {
  const [active, setActive] = useState<string[]>(() => series.map((s) => s.key));
  const [showPrev, setShowPrev] = useState(true);
  if (series.length === 0) return null;
  const labels = series[0].buckets.map((b) => b.label);
  const rows = labels.map((label, i) => {
    const row: Record<string, number | string> = { label };
    for (const s of series) {
      row[s.key] = s.buckets[i]?.current ?? 0;
      row[`${s.key}_prev`] = s.buckets[i]?.previous ?? 0;
    }
    return row;
  });
  const empty = rows.every((r) => series.every((s) => (r[s.key] as number) === 0 && (r[`${s.key}_prev`] as number) === 0));
  const toggle = (k: string) => setActive((a) => (a.includes(k) ? a.filter((x) => x !== k) : [...a, k]));
  return (
    <DataCard
      title={title}
      subtitle={subtitle}
      action={
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Metrics">
          {series.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => toggle(s.key)}
              aria-pressed={active.includes(s.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors",
                active.includes(s.key)
                  ? "border-teal-700/30 bg-teal-50 text-teal-800 dark:border-teal-500/30 dark:bg-teal-950 dark:text-teal-200"
                  : "border-slate-200 text-slate-400 opacity-60 dark:border-white/10"
              )}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: COLORS[s.key] ?? "#0F766E" }} />
              {s.label}
            </button>
          ))}
        </div>
      }
    >
      <div className="mb-2 flex items-center gap-3 text-xs">
        <button
          type="button"
          onClick={() => setShowPrev((v) => !v)}
          aria-pressed={showPrev}
          className="flex items-center gap-1.5 rounded-full border border-slate-200 px-2 py-0.5 font-medium text-slate-600 dark:border-white/10 dark:text-slate-300"
        >
          <span className="inline-block h-0 w-3 border-t-2 border-dashed border-slate-400" /> Previous period
        </button>
      </div>
      {empty ? (
        <div className="flex h-[280px] flex-col items-center justify-center gap-2 text-center">
          <Inbox className="h-8 w-8 text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No activity in this period</p>
          <p className="text-xs text-slate-400">Try a longer range.</p>
        </div>
      ) : (
        <div className="h-[280px] w-full" role="img" aria-label={`${title} trend chart`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                {series.map((s) => (
                  <linearGradient key={s.key} id={`ag-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS[s.key] ?? "#0F766E"} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={COLORS[s.key] ?? "#0F766E"} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.12} className="text-slate-400" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={32} tick={{ fontSize: 11 }} />
              <YAxis width={36} tickLine={false} axisLine={false} allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                cursor={{ stroke: "#0F766E", strokeOpacity: 0.35, strokeDasharray: "3 3" }}
                content={({ active: a, payload, label }) => {
                  if (!a || !payload || payload.length === 0) return null;
                  return (
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm dark:border-white/10 dark:bg-[#0b1220]">
                      <p className="mb-1 font-semibold">{label}</p>
                      {(payload as unknown as Array<{ dataKey?: string | number; value?: number | string; color?: string }>).map((p) => (
                        <p key={String(p.dataKey)} className="flex items-center gap-1.5 tabular-nums text-slate-600 dark:text-slate-300">
                          <span className="h-2 w-2 rounded-full" style={{ background: p.color ?? "#0F766E" }} />
                          {String(p.dataKey).replace("_prev", " (prev)")}: <strong>{p.value}</strong>
                        </p>
                      ))}
                    </div>
                  );
                }}
              />
              {series.filter((s) => active.includes(s.key)).map((s) => (
                <g key={s.key}>
                  {showPrev ? (
                    <Area type="monotone" dataKey={`${s.key}_prev`} stroke="#9CA3AF" strokeWidth={1.5} strokeDasharray="5 4" fill="transparent" dot={false} />
                  ) : null}
                  <Area type="monotone" dataKey={s.key} stroke={COLORS[s.key] ?? "#0F766E"} strokeWidth={2.5} fill={`url(#ag-${s.key})`} dot={false} activeDot={{ r: 4, fill: COLORS[s.key] ?? "#0F766E", strokeWidth: 2, stroke: "#fff" }} />
                </g>
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-teal-700" /> Current</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-0 w-3 border-t-2 border-dashed border-slate-400" /> Previous</span>
      </div>
    </DataCard>
  );
}
