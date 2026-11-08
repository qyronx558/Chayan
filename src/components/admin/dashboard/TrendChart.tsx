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
    <div className="rounded-lg border border-rule bg-background px-3 py-2 text-xs   ">
      <p className="mb-1 font-semibold text-foreground dark:text-paper">{label}</p>
      <p className="flex items-center gap-1.5 tabular-nums text-muted-foreground dark:text-muted-foreground">
        <span className="h-2 w-2 rounded-full bg-paper-3" /> Current: <strong>{current}</strong>
      </p>
      <p className="flex items-center gap-1.5 tabular-nums text-muted-foreground dark:text-muted-foreground">
        <span className="h-2 w-2 rounded-full bg-ink-2" /> Previous: <strong>{previous}</strong>
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
          <p className="text-lg font-bold tabular-nums leading-none text-foreground dark:text-paper">
            {trend.total.toLocaleString("en-IN")}
          </p>
          <span
            className={cn(
              "mt-1 inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums",
              change === null
                ? "text-muted-foreground"
                : change === 0
                  ? "text-muted-foreground dark:text-muted-foreground"
                  : change > 0
                    ? "text-foreground dark:text-foreground"
                    : "text-brick dark:text-brick"
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
        <span className="flex items-center gap-1.5 font-medium text-muted-foreground dark:text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-paper-3" /> Current
        </span>
        <button
          type="button"
          onClick={() => setShowPrevious((v) => !v)}
          aria-pressed={showPrevious}
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-medium transition-colors",
            showPrevious
              ? "border-rule text-muted-foreground  dark:text-muted-foreground"
              : "border-rule text-muted-foreground opacity-60  dark:text-muted-foreground"
          )}
        >
          <span className="inline-block h-0 w-3 border-t-2 border-dashed border-rule-2" /> Previous
        </button>
      </div>
      {empty ? (
        <div className="flex h-[260px] flex-col items-center justify-center gap-2 text-center">
          <Inbox className="h-8 w-8 text-muted-foreground dark:text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">No activity in this period</p>
          <p className="text-xs text-muted-foreground dark:text-muted-foreground">New publishes will appear here.</p>
        </div>
      ) : (
        <div className="h-[260px] w-full text-muted-foreground dark:text-muted-foreground">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend.points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
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
                cursor={{ stroke: "var(--color-brick)", strokeOpacity: 0.35, strokeDasharray: "3 3" }}
              />
              {showPrevious ? (
                <Area
                  type="monotone"
                  dataKey="previous"
                  name="Previous period"
                  stroke="var(--color-rule-2)"
                  strokeWidth={1.5}
                  strokeDasharray="5 4"
                  fill="transparent"
                  dot={false}
                  activeDot={{ r: 3, fill: "var(--color-rule-2)", strokeWidth: 0 }}
                />
              ) : null}
              <Area
                type="monotone"
                dataKey="current"
                name="Current period"
                stroke="var(--color-brick)"
                strokeWidth={2.5}
                fill="var(--color-brick)" fillOpacity={0.1}
                dot={false}
                activeDot={{ r: 4, fill: "var(--color-brick)", strokeWidth: 2, stroke: "var(--color-paper)" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </DataCard>
  )
}
