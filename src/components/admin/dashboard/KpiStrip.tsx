"use client"

import type { LucideIcon } from "lucide-react"
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import type { KpiDatum } from "./types"
import { Sparkline } from "./Sparkline"

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) {
    return <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">- vs prev</span>
  }
  const flat = delta === 0
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-px text-[11px] font-semibold tabular-nums",
        flat
          ? "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400"
          : delta > 0
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
            : "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
      )}
    >
      {flat ? (
        <Minus className="h-3 w-3" />
      ) : delta > 0 ? (
        <ArrowUpRight className="h-3 w-3" />
      ) : (
        <ArrowDownRight className="h-3 w-3" />
      )}
      {delta > 0 ? "+" : ""}
      {delta}% vs prev
    </span>
  )
}

interface KpiStripProps {
  kpis: KpiDatum[]
  icons: LucideIcon[]
  range: number
}

export function KpiStrip({ kpis, icons, range }: KpiStripProps) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 dark:border-white/[0.06] dark:bg-white/[0.06] lg:grid-cols-4">
      {kpis.map((kpi, i) => {
        const Icon = icons[i] ?? icons[0]
        return (
          <div key={kpi.key} className="min-w-0 bg-white p-4 dark:bg-[#0b1220] sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                <Icon className="h-3.5 w-3.5 shrink-0 text-teal-700 dark:text-teal-400" />
                <span className="truncate">{kpi.label}</span>
              </span>
              {kpi.needsAction ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" /> : null}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
                {kpi.value.toLocaleString("en-IN")}
              </span>
              <DeltaBadge delta={kpi.deltaPct} />
            </div>
            <div className="mt-1">
              <Sparkline data={kpi.spark} id={`spark-${kpi.key}-${range}`} />
            </div>
            <div className="mt-1 flex min-w-0 items-center gap-1.5">
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{kpi.sub}</p>
              {kpi.needsAction ? (
                <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-px text-[10px] font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  Action needed
                </span>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}
