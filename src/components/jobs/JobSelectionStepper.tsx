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
      <li key={i} className="relative flex flex-1 gap-3 pb-5 sm:flex-col sm:gap-2 sm:pb-0 sm:pr-4">
       {!isLast ? (
        <div aria-hidden="true" className="absolute bottom-0 left-[19px] top-10 w-px bg-rule sm:left-10 sm:right-[-8px] sm:top-[19px] sm:h-px sm:w-auto" />
       ) : null}
       <span className="z-10 flex h-10 w-10 shrink-0 items-center justify-center bg-ink text-paper">
        <Icon className="h-4.5 w-4.5" />
       </span>
       <div className="min-w-0 pt-1 sm:pt-0">
        <p className="agate text-[11px] text-brick">Stage {i + 1}</p>
        <p className={cn("text-sm font-semibold leading-snug text-foreground")}>{s.label}</p>
       </div>
      </li>
     )
    })}
   </ol>
   <p className="mt-3 agate text-[11px] text-muted-foreground">Stages in listed order - see notification for marks & qualifying rules.</p>
  </div>
 )
}
