"use client"

import { Calendar, Check } from "lucide-react"
import { formatDate, cn } from "@/lib/utils"
import { buildTimeline } from "@/lib/job-insights"

interface Props {
  importantDates: Record<string, string> | null
  startDate: string | null
  lastDate: string | null
}

export function JobTimeline({ importantDates, startDate, lastDate }: Props) {
  const stages = buildTimeline(importantDates, startDate, lastDate)
  if (stages.length === 0) return null

  return (
    <div aria-label="Application timeline">
      {/* Desktop: horizontal stepper */}
      <ol className="hidden gap-0 sm:flex">
        {stages.map((s, i) => (
          <li key={s.key} className="relative flex-1 pb-1">
            {i > 0 ? (
              <div
                aria-hidden="true"
                className={cn(
                  "absolute left-[-50%] right-[50%] top-[13px] h-0.5",
                  s.done ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700",
                )}
              />
            ) : null}
            <div className="relative flex flex-col items-start gap-1.5 pr-3">
              <span
                className={cn(
                  "z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold",
                  s.done
                    ? "border-green-600 bg-green-600 text-white"
                    : s.isLast
                      ? "border-red-500 bg-red-500 text-white"
                      : "border-orange-400 bg-white text-orange-700 dark:bg-gray-800",
                )}
              >
                {s.done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-gray-900 dark:text-white" title={s.label}>
                  {s.label}
                </p>
                <p className={cn("text-xs tabular-nums", s.isLast ? "font-bold text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-300")}>
                  {formatDate(s.date)}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ol>

      {/* Mobile: vertical timeline */}
      <ol className="relative space-y-4 border-l-2 border-gray-200 pl-5 sm:hidden dark:border-gray-700">
        {stages.map((s) => (
          <li key={s.key} className="relative">
            <span
              aria-hidden="true"
              className={cn(
                "absolute -left-[29px] top-0 flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-bold",
                s.done ? "border-green-600 bg-green-600 text-white" : s.isLast ? "border-red-500 bg-red-500 text-white" : "border-orange-400 bg-white text-orange-700 dark:bg-gray-800",
              )}
            >
              {s.done ? <Check className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
            </span>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{s.label}</p>
            <p className={cn("text-xs tabular-nums", s.isLast ? "font-bold text-red-600" : "text-gray-600 dark:text-gray-300")}>{formatDate(s.date)}</p>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-[11px] text-gray-500 dark:text-gray-400">Timeline built from official dates only - no assumed exam schedule.</p>
    </div>
  )
}
