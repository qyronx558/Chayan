"use client"

import { useState } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { ArrowDownRight, ArrowUpRight, Inbox, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TrendDatum } from "./types"
import { DataCard } from "./DataCard"

interface TooltipRow {
  value?: number | string
  dataKey?: string | number
  name?: string | number
}

function TrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipRow[]
  label?: string | number
}) {
  if (!active || !payload || payload.length === 0) return null
  const current = payload.find((p) => p.dataKey === "current")?.value ?? 0
  const previous = payload.find((p) => p.dataKey === "previous")?.value ?? 0
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm dark:border-white/10 dark:bg-[#0b1220]">
      <p className="mb-1 font-semibold text-slate-900 dark:text-slate-100">{label}</p>
      <p className="flex items-center gap-1.5 tabular-nums text-slate-600 dark:text-slate-300">
        <span className="h-2 w-2 rounded-full bg-teal-700" /> Current: <strong>{current}</strong>
      </p>
      <p className="flex items-center gap-1.5 tabular-nums text-slate-600 dark:text-slate-300">
        <span className="h-2 w-2 rounded-full bg-slate-400" /> Previous: <strong>{previous}</strong>
      </p>
    </div>
  )
}

export function TrendChart({
  trend,
  title,
  subtitle,
}: {
  trend: TrendDatum
  title: string
  subtitle: string
}) {
  const [showPrevious, setShowPrevious] = useState(true)
  const empty = trend.total === 0 && trend.points.every((p) => p.current === 0 && p.previous === 0)
  const change = trend.changePct
  return (
    <DataCard
      title={title}
      subtitle={subtitle}
      action={
        <div className="text-right">
          <p className="text-lg font-bold tabular-nums leading-none text-slate-900 dark:text-slate-50">
            {trend.total.toLocaleString("en-IN")}
          </p>
          <span
            className={cn(
              "mt-1 inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums",
              change === null
                ? "text-slate-400"
                : change === 0
                  ? "text-slate-500 dark:text-slate-400"
                  : change > 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
            )}
          >
            {change === null ? (
              "- vs prev period"
            ) : (
              <>
                {change === 0 ? (
                  <Minus className="h-3 w-3" />
                ) : change > 0 ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {change > 0 ? "+" : ""}
                {change}% vs prev
              </>
            )}
          </span>
        </div>
      }
    >
      <div className="mb-2 flex items-center gap-3 text-xs">
        <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
          <span className="h-2 w-2 rounded-full bg-teal-700" /> Current
        </span>
        <button
          type="button"
          onClick={() => setShowPrevious((v) => !v)}
          aria-pressed={showPrevious}
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-medium transition-colors",
            showPrevious
              ? "border-slate-200 text-slate-600 dark:border-white/10 dark:text-slate-300"
              : "border-slate-200 text-slate-400 opacity-60 dark:border-white/10 dark:text-slate-500"
          )}
        >
          <span className="inline-block h-0 w-3 border-t-2 border-dashed border-slate-400" /> Previous
        </button>
      </div>
      {empty ? (
        <div className="flex h-[260px] flex-col items-center justify-center gap-2 text-center">
          <Inbox className="h-8 w-8 text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No activity in this period</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">New publishes will appear here.</p>
        </div>
      ) : (
        <div className="h-[260px] w-full text-slate-400 dark:text-slate-500">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend.points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="trendCurrent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0F766E" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#0F766E" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.15} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                minTickGap={28}
                tick={{ fontSize: 11, fill: "currentColor" }}
              />
              <YAxis
                width={34}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "currentColor" }}
              />
              <Tooltip
                content={<TrendTooltip />}
                cursor={{ stroke: "#0F766E", strokeOpacity: 0.35, strokeDasharray: "3 3" }}
              />
              {showPrevious ? (
                <Area
                  type="monotone"
                  dataKey="previous"
                  name="Previous period"
                  stroke="#9CA3AF"
                  strokeWidth={1.5}
                  strokeDasharray="5 4"
                  fill="transparent"
                  dot={false}
                  activeDot={{ r: 3, fill: "#9CA3AF", strokeWidth: 0 }}
                />
              ) : null}
              <Area
                type="monotone"
                dataKey="current"
                name="Current period"
                stroke="#0F766E"
                strokeWidth={2.5}
                fill="url(#trendCurrent)"
                dot={false}
                activeDot={{ r: 4, fill: "#0F766E", strokeWidth: 2, stroke: "#fff" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </DataCard>
  )
}
