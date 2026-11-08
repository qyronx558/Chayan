"use client";

import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { DataCard } from "@/components/admin/dashboard/DataCard";
import type { MetricSeries } from "@/lib/analytics/types";

const COLORS: Record<string, string> = { views: "var(--color-brick)", visitors: "var(--color-ink-2)", jobs: "var(--color-brick-ink)" };

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
                  ? "border-rule bg-paper-3 text-brick dark:border-rule dark:bg-paper-3 dark:text-brick"
                  : "border-rule text-muted-foreground opacity-60 "
              )}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: COLORS[s.key] ?? "var(--color-brick)" }} />
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
          className="flex items-center gap-1.5 rounded-full border border-rule px-2 py-0.5 font-medium text-muted-foreground  dark:text-muted-foreground"
        >
          <span className="inline-block h-0 w-3 border-t-2 border-dashed border-rule-2" /> Previous period
        </button>
      </div>
      {empty ? (
        <div className="flex h-[280px] flex-col items-center justify-center gap-2 text-center">
          <Inbox className="h-8 w-8 text-muted-foreground dark:text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">No activity in this period</p>
          <p className="text-xs text-muted-foreground">Try a longer range.</p>
        </div>
      ) : (
        <div className="h-[280px] w-full" role="img" aria-label={`${title} trend chart`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.12} className="text-muted-foreground" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={32} tick={{ fontSize: 11 }} />
              <YAxis width={36} tickLine={false} axisLine={false} allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                cursor={{ stroke: "var(--color-brick)", strokeOpacity: 0.35, strokeDasharray: "3 3" }}
                content={({ active: a, payload, label }) => {
                  if (!a || !payload || payload.length === 0) return null;
                  return (
                    <div className="rounded-lg border border-rule bg-background px-3 py-2 text-xs   ">
                      <p className="mb-1 font-semibold">{label}</p>
                      {(payload as unknown as Array<{ dataKey?: string | number; value?: number | string; color?: string }>).map((p) => (
                        <p key={String(p.dataKey)} className="flex items-center gap-1.5 tabular-nums text-muted-foreground dark:text-muted-foreground">
                          <span className="h-2 w-2 rounded-full" style={{ background: p.color ?? "var(--color-brick)" }} />
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
                    <Area type="monotone" dataKey={`${s.key}_prev`} stroke="var(--color-rule-2)" strokeWidth={1.5} strokeDasharray="5 4" fill="transparent" dot={false} />
                  ) : null}
                  <Area type="monotone" dataKey={s.key} stroke={COLORS[s.key] ?? "var(--color-brick)"} strokeWidth={2.5} fill={COLORS[s.key] ?? "var(--color-brick)"} fillOpacity={0.1} dot={false} activeDot={{ r: 4, fill: COLORS[s.key] ?? "var(--color-brick)", strokeWidth: 2, stroke: "var(--color-paper)" }} />
                </g>
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground dark:text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-paper-3" /> Current</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-0 w-3 border-t-2 border-dashed border-rule-2" /> Previous</span>
      </div>
    </DataCard>
  );
}
