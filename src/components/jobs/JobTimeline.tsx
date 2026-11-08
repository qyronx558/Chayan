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
         s.done ? "bg-ink" : "bg-rule-2",
        )}
       />
      ) : null}
      <div className="relative flex flex-col items-start gap-1.5 pr-3">
       <span
        className={cn(
         "z-10 flex h-7 w-7 items-center justify-center text-xs font-bold",
         s.done
          ? "border-ink bg-ink text-paper"
          : s.isLast
           ? "border-brick bg-brick text-paper"
           : "border-rule bg-background text-muted-foreground",
        )}
       >
        {s.done ? <Check className="h-3.5 w-3.5" /> : i + 1}
       </span>
       <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-foreground" title={s.label}>
         {s.label}
        </p>
        <p className={cn("text-xs tabular-nums", s.isLast ? "font-semibold text-brick" : "text-muted-foreground")}>
         {formatDate(s.date)}
        </p>
       </div>
      </div>
     </li>
    ))}
   </ol>

   {/* Mobile: vertical timeline */}
   <ol className="relative space-y-4 border-l border-rule pl-5 sm:hidden">
    {stages.map((s) => (
     <li key={s.key} className="relative">
      <span
       aria-hidden="true"
       className={cn(
        "absolute -left-[29px] top-0 flex h-6 w-6 items-center justify-center text-[10px] font-bold",
        s.done ? "border-ink bg-ink text-paper" : s.isLast ? "border-brick bg-brick text-paper" : "border-rule bg-background text-muted-foreground",
       )}
      >
       {s.done ? <Check className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
      </span>
      <p className="text-sm font-semibold text-foreground">{s.label}</p>
      <p className={cn("text-xs tabular-nums", s.isLast ? "font-semibold text-brick" : "text-muted-foreground")}>{formatDate(s.date)}</p>
     </li>
    ))}
   </ol>
   <p className="mt-3 agate text-[11px] text-muted-foreground">Timeline built from official dates only - no assumed exam schedule.</p>
  </div>
 )
}
