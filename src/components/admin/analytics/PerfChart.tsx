"use client";

import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import { DataCard } from "@/components/admin/dashboard/DataCard";
import type { PerfPoint } from "@/lib/analytics/types";

type Chip = "latency" | "errors" | "bot";

export function PerfChart({ points }: { points: PerfPoint[] }) {
  const [active, setActive] = useState<Chip[]>(["latency", "errors", "bot"]);
  const toggle = (c: Chip) => setActive((a) => (a.includes(c) ? a.filter((x) => x !== c) : [...a, c]));
  const chip = (key: Chip, label: string, dot: string) => (
    <button
      key={key}
      type="button"
      onClick={() => toggle(key)}
      aria-pressed={active.includes(key)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        active.includes(key)
          ? "border-teal-700/30 bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-200"
          : "border-slate-200 text-slate-400 opacity-60 dark:border-white/10"
      )}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: dot }} /> {label}
    </button>
  );
  return (
    <DataCard
      title="Performance"
      subtitle="Latency p95, errors and bot share"
      action={<div className="flex flex-wrap gap-1.5">{[chip("latency", "Latency", "#0F766E"), chip("errors", "Errors", "#DC2626"), chip("bot", "Bot share", "#2563EB")]}</div>}
    >
      <div className="h-[240px] w-full" role="img" aria-label="Performance chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.12} className="text-slate-400" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={32} tick={{ fontSize: 11 }} />
            <YAxis width={36} tickLine={false} axisLine={false} allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip cursor={{ stroke: "#0F766E", strokeOpacity: 0.35, strokeDasharray: "3 3" }} />
            {active.includes("latency") ? <Area type="monotone" dataKey="latency" stroke="#0F766E" strokeWidth={2} fill="#0F766E" fillOpacity={0.08} dot={false} /> : null}
            {active.includes("errors") ? <Area type="monotone" dataKey="errors" stroke="#DC2626" strokeWidth={2} fill="#DC2626" fillOpacity={0.08} dot={false} /> : null}
            {active.includes("bot") ? <Area type="monotone" dataKey="botShare" stroke="#2563EB" strokeWidth={2} strokeDasharray="5 4" fill="transparent" dot={false} /> : null}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </DataCard>
  );
}
