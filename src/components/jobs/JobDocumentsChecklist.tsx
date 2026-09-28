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
      <div className="whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">{documentsRequired}</div>
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
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Documents ready">
          <div className="h-full rounded-full bg-gradient-to-r from-[#FF9933] to-[#138808] transition-all" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs font-bold tabular-nums text-gray-700 dark:text-gray-200">{done}/{docs.length} ready</span>
        {done > 0 ? (
          <button type="button" onClick={reset} className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400">
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
                  "flex w-full items-start gap-2.5 rounded-xl border p-3 text-left text-sm transition",
                  on
                    ? "border-green-300 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950/40 dark:text-green-100"
                    : "border-gray-200 bg-white text-gray-700 hover:border-orange-300 hover:bg-orange-50/50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2",
                    on ? "border-green-600 bg-green-600 text-white" : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900",
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
      <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">Tick what you have ready - saved on this device only.</p>
    </div>
  )
}
