"use client"

import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { CheckCircle2, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AttentionDatum } from "./types"
import { DataCard } from "./DataCard"

export type AttentionTone = "amber" | "red" | "teal" | "sky"

export interface AttentionRow extends AttentionDatum {
  icon: LucideIcon
  tone: AttentionTone
}

const TONE_ICON: Record<AttentionTone, string> = {
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
  red: "bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400",
  teal: "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
  sky: "bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400",
}

export function AttentionList({
  title,
  subtitle,
  items,
}: {
  title: string
  subtitle: string
  items: AttentionRow[]
}) {
  const allClear = items.every((i) => i.count === 0)
  return (
    <DataCard title={title} subtitle={subtitle} className="h-full">
      {allClear ? (
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-3 text-sm text-slate-500 dark:border-white/[0.06] dark:text-slate-400">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          Nothing needs attention right now.
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-white/[0.06]">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className="group flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      TONE_ICON[item.tone]
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                      {item.label}
                    </span>
                    <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                      {item.sub}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold tabular-nums text-slate-700 dark:bg-white/10 dark:text-slate-200">
                    {item.count.toLocaleString("en-IN")}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-teal-700 dark:text-slate-600" />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </DataCard>
  )
}
