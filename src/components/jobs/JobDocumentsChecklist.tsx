"use client"

import { useEffect, useMemo, useState } from "react"
import { RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { handFont } from "@/components/home/fonts"
import { HandTick } from "@/components/desk/DeskKit"
import { stepify } from "@/lib/job-insights"
import { containsHtml, stripHtmlToText } from "@/lib/blog-prose"
import { RichTextView } from "@/components/shared/RichTextView"

interface Props {
 jobId: string
 documentsRequired: string | null
}

export function JobDocumentsChecklist({ jobId, documentsRequired }: Props) {
 const docs = useMemo(() => {
  if (!documentsRequired) return []
  if (containsHtml(documentsRequired)) {
   // Rich HTML: split on list items / line breaks without inventing items
   const text = stripHtmlToText(documentsRequired)
   return stepify(text).slice(0, 12)
  }
  return stepify(documentsRequired).slice(0, 12)
 }, [documentsRequired])

 const storageKey = `job-docs:${jobId}`
 // Lazy init from device storage - no setState-in-effect, no cascading renders.
 // Parent remounts per job via key={jobId}, so initializer runs fresh for each job.
 const [checked, setChecked] = useState<boolean[]>(() => {
  const empty = new Array(docs.length).fill(false)
  try {
   if (typeof window === "undefined") return empty
   const raw = window.localStorage.getItem(storageKey)
   if (!raw) return empty
   const parsed = JSON.parse(raw) as boolean[]
   if (Array.isArray(parsed) && parsed.length === docs.length) return parsed
   return empty
  } catch {
   return empty
  }
 })

 // Persist ticks to this device only.
 useEffect(() => {
  if (checked.length !== docs.length) return
  try {
   localStorage.setItem(storageKey, JSON.stringify(checked))
  } catch {
   // private mode etc.
  }
 }, [checked, docs.length, storageKey])

 if (!documentsRequired) return null
 // If only one free-text line (not a list), render as before - checklist adds no value.
 if (docs.length <= 1) {
  return containsHtml(documentsRequired) ? (
   <RichTextView html={documentsRequired} />
  ) : (
   <div className="whitespace-pre-line text-sm text-foreground">{documentsRequired}</div>
  )
 }

 const safe = checked.length === docs.length ? checked : new Array(docs.length).fill(false)
 const done = safe.filter(Boolean).length
 const pct = docs.length > 0 ? Math.round((done / docs.length) * 100) : 0

 const toggle = (i: number) => setChecked((c) => {
  const base = c.length === docs.length ? c : new Array(docs.length).fill(false)
  return base.map((v, idx) => (idx === i ? !v : v))
 })
 const reset = () => setChecked(new Array(docs.length).fill(false))

 return (
  <div>
   <div className="mb-4 flex items-center gap-3">
    <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--hs-surface-2)]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Documents ready">
     <div className="h-full rounded-full bg-[oklch(52%_0.1_160)] transition-all" style={{ width: `${pct}%` }} />
    </div>
    <span className={cn(handFont.className, "text-[1.05rem] tabular-nums text-foreground/80")}>{done === docs.length ? "all ready!" : `${done} of ${docs.length} ready`}</span>
    {done > 0 ? (
     <button type="button" onClick={reset} className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground">
      <RotateCcw className="h-3 w-3" /> Reset
     </button>
    ) : null}
   </div>
   <ul className="grid gap-x-8 sm:grid-cols-2">
    {docs.map((doc, i) => {
     const on = safe[i] === true
     return (
      <li key={i}>
       <button
        type="button"
        onClick={() => toggle(i)}
        aria-pressed={on}
        className="group flex w-full items-start gap-3 border-b border-dashed border-[var(--hs-border)] py-2.5 text-left text-[14px] transition-colors"
       >
        <span className={cn("relative mt-0.5 h-5 w-5 shrink-0 rounded-[3px] border-[1.6px] transition-colors", on ? "border-[oklch(52%_0.1_160)]" : "border-foreground/40 group-hover:border-[var(--color-brick)]")}>
         {on ? <HandTick className="absolute -left-0.5 -top-2 h-6 w-7 text-[oklch(50%_0.12_160)]" /> : null}
        </span>
        <span className={cn("leading-snug", on ? "text-muted-foreground line-through decoration-[oklch(52%_0.1_160)] decoration-[1.5px]" : "text-foreground")}>{doc}</span>
       </button>
      </li>
     )
    })}
   </ul>
   <p className={cn(handFont.className, "mt-3 text-[1rem] text-muted-foreground")}>Tick what you have ready. Saved on this device only.</p>
  </div>
 )
}
