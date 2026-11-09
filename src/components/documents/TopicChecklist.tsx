"use client"

import { useEffect, useMemo, useState } from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
 storageKey: string
 items: string[]
}

/** Syllabus topics as a study tracker: search, tick, progress - saved on this device only. */
export function TopicChecklist({ storageKey, items }: Props) {
 const key = `topics:${storageKey}`
 const [done, setDone] = useState<Set<number>>(new Set())
 const [q, setQ] = useState("")

 useEffect(() => {
  try {
   const raw = window.localStorage.getItem(key)
   const arr = raw ? (JSON.parse(raw) as number[]) : []
   if (Array.isArray(arr)) setDone(new Set(arr.filter((n) => n >= 0 && n < items.length)))
  } catch {
   // storage unavailable
  }
 }, [key, items.length])

 const toggle = (i: number) => {
  setDone((prev) => {
   const next = new Set(prev)
   if (next.has(i)) next.delete(i)
   else next.add(i)
   try {
    window.localStorage.setItem(key, JSON.stringify([...next]))
   } catch {
    // ignore
   }
   return next
  })
 }

 const visible = useMemo(() => {
  const needle = q.trim().toLowerCase()
  return items.map((text, i) => ({ text, i })).filter((x) => !needle || x.text.toLowerCase().includes(needle))
 }, [items, q])

 const pct = items.length ? Math.round((done.size / items.length) * 100) : 0

 return (
  <div>
   <div className="mb-4 flex flex-wrap items-center gap-3">
    <div className="min-w-[10rem] flex-1">
     <div className="agate mb-1 flex justify-between text-[11px] text-muted-foreground">
      <span>{done.size} of {items.length} covered</span>
      <span>{pct}%</span>
     </div>
     <div className="h-1.5 w-full bg-paper-3" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Syllabus covered">
      <div className="h-full bg-ink transition-[width]" style={{ width: `${pct}%` }} />
     </div>
    </div>
    {items.length > 8 ? (
     <label className="flex items-center gap-2 border border-rule px-2.5 py-1.5 text-sm">
      <Search className="h-3.5 w-3.5 text-muted-foreground" />
      <input
       value={q}
       onChange={(e) => setQ(e.target.value)}
       placeholder="Find a topic"
       className="w-36 bg-transparent outline-none placeholder:text-muted-foreground"
       aria-label="Find a topic"
      />
     </label>
    ) : null}
   </div>
   <ul className="divide-y divide-rule border-y border-rule">
    {visible.map(({ text, i }) => {
     const on = done.has(i)
     return (
      <li key={i}>
       <label className="flex cursor-pointer items-start gap-3 py-2.5 text-sm">
        <input type="checkbox" checked={on} onChange={() => toggle(i)} className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-ink)]" />
        <span className={cn("min-w-0 flex-1", on ? "text-muted-foreground line-through" : "text-foreground")}>{text}</span>
        <span className="agate shrink-0 text-[11px] text-muted-foreground">{i + 1}</span>
       </label>
      </li>
     )
    })}
    {visible.length === 0 ? <li className="py-4 text-sm text-muted-foreground">No topic matches “{q}”.</li> : null}
   </ul>
  </div>
 )
}
