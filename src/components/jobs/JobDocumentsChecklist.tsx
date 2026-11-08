"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
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
   <div className="mb-3 flex items-center gap-3">
    <div className="h-2 flex-1 overflow-hidden bg-paper-3" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Documents ready">
     <div className="h-full bg-ink transition-all" style={{ width: `${pct}%` }} />
    </div>
    <span className="agate text-xs tabular-nums text-muted-foreground">{done}/{docs.length} ready</span>
    {done > 0 ? (
     <button type="button" onClick={reset} className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground">
      <RotateCcw className="h-3 w-3" /> Reset
     </button>
    ) : null}
   </div>
   <ul className="space-y-2">
    {docs.map((doc, i) => {
     const on = safe[i] === true
     return (
      <li key={i}>
       <button
        type="button"
        onClick={() => toggle(i)}
        aria-pressed={on}
        className={cn(
         "flex w-full items-start gap-2.5 border p-3 text-left text-sm transition-colors",
         on
          ? "border-ink bg-paper-2 text-foreground"
          : "border-rule bg-background text-muted-foreground hover:border-brick",
        )}
       >
        <span
         className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2",
          on ? "border-ink bg-ink text-paper" : "border-rule bg-background",
         )}
        >
         {on ? <Check className="h-3.5 w-3.5" /> : null}
        </span>
        <span className={cn(on && "line-through opacity-80")}>{doc}</span>
       </button>
      </li>
     )
    })}
   </ul>
   <p className="mt-2 agate text-[11px] text-muted-foreground">Tick what you have ready - saved on this device only.</p>
  </div>
 )
}
