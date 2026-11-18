"use client"

import {
 PenLine,
 PersonStanding,
 MessagesSquare,
 FileCheck2,
 Stethoscope,
 Trophy,
 CircleDot,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { handFont } from "@/components/home/fonts"
import { inferSelectionSteps, type SelectionStep } from "@/lib/job-insights"
import { containsHtml } from "@/lib/blog-prose"
import { RichTextView } from "@/components/shared/RichTextView"

const ICONS: Record<SelectionStep["icon"], typeof PenLine> = {
 exam: PenLine,
 physical: PersonStanding,
 interview: MessagesSquare,
 document: FileCheck2,
 medical: Stethoscope,
 final: Trophy,
 other: CircleDot,
}

export function JobSelectionStepper({ selectionProcess }: { selectionProcess: string | null }) {
 if (!selectionProcess) return null
 if (containsHtml(selectionProcess)) {
  return <RichTextView html={selectionProcess} className="text-muted-foreground" />
 }
 const steps = inferSelectionSteps(selectionProcess)
 if (steps.length <= 1) {
  return <div className="whitespace-pre-line text-sm text-muted-foreground">{selectionProcess}</div>
 }
 return (
  <div>
   <ol className="flex flex-col gap-0 sm:flex-row sm:items-start">
    {steps.map((s, i) => {
     const Icon = ICONS[s.icon]
     const isLast = i === steps.length - 1
     return (
      <li key={i} className="relative flex flex-1 gap-4 pb-6 sm:flex-col sm:items-center sm:gap-2.5 sm:pb-0 sm:text-center">
       {!isLast ? (
        <>
         {/* pencil line to the next stage */}
         <svg aria-hidden="true" viewBox="0 0 100 12" preserveAspectRatio="none" className="absolute left-[calc(50%+26px)] right-[calc(-50%+26px)] top-[18px] hidden h-3 sm:block">
          <path d={i % 2 ? "M1 6 C 25 2, 55 10, 99 5" : "M1 5 C 30 10, 60 2, 99 6"} fill="none" stroke="var(--hs-border-strong)" strokeWidth="1.6" strokeDasharray="5 4" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
         </svg>
         <span aria-hidden="true" className="absolute bottom-0 left-[21px] top-12 w-0 border-l-[1.6px] border-dashed border-[var(--hs-border-strong)] sm:hidden" />
        </>
       ) : null}
       <span className={cn("relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[1.6px] bg-[var(--hs-paper-slip)]", isLast ? "border-[var(--color-brick)] text-[var(--color-brick)]" : "border-foreground/70 text-foreground")}>
        <Icon className="h-[18px] w-[18px]" />
        <span className={cn(handFont.className, "absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--hs-paper-slip)] text-[0.95rem] leading-none text-[var(--color-brick)]")}>{i + 1}</span>
       </span>
       <div className="min-w-0 pt-1.5 sm:max-w-[9.5rem] sm:pt-0">
        <p className={cn("text-[13.5px] font-semibold leading-snug text-foreground")}>{s.label}</p>
        {isLast ? <p className={cn(handFont.className, "text-[0.98rem] leading-tight text-[var(--color-brick)]")}>the finish line</p> : null}
       </div>
      </li>
     )
    })}
   </ol>
   <p className={cn(handFont.className, "mt-5 text-[1rem] text-muted-foreground")}>Stages in listed order. See the notification for marks &amp; qualifying rules.</p>
  </div>
 )
}
