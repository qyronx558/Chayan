"use client"

import { useEffect, useMemo, useState } from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { handFont, typeFont } from "@/components/home/fonts"
import { HandTick } from "@/components/desk/DeskKit"

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
   <div className="mb-4 flex flex-wrap items-center gap-4">
    <div className="min-w-[10rem] flex-1">
     <div className="mb-1.5 flex items-baseline justify-between">
      <span className={cn(handFont.className, "text-[1.08rem] text-foreground/80")}>{done.size === items.length && items.length > 0 ? "all covered. well done." : `${done.size} of ${items.length} covered`}</span>
      <span className={cn(typeFont.className, "text-[11px] text-muted-foreground")}>{pct}%</span>
     </div>
     <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--hs-surface-2)]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Syllabus covered">
      <div className="h-full rounded-full transition-[width]" style={{ width: `${pct}%`, background: "var(--doc-accent, var(--color-ink))" }} />
     </div>
    </div>
    {items.length > 8 ? (
     <label className="flex h-9 items-center gap-2 rounded-full border border-[var(--hs-border-strong)] bg-[var(--hs-surface)] px-3.5 text-sm focus-within:border-[var(--hs-trust)]">
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
   {/* ruled notebook lines */}
   <ul style={{ backgroundImage: "repeating-linear-gradient(180deg, transparent 0 43px, color-mix(in oklch, oklch(62% 0.09 240) 22%, transparent) 43px 44px)" }}>
    {visible.map(({ text, i }) => {
     const on = done.has(i)
     return (
      <li key={i}>
       <label className="group flex min-h-11 cursor-pointer items-center gap-3 py-1.5 text-[14.5px]">
        <input type="checkbox" checked={on} onChange={() => toggle(i)} className="peer sr-only" />
        <span className="relative h-5 w-5 shrink-0 rounded-[3px] border-[1.6px] border-foreground/40 transition-colors group-hover:border-[var(--doc-accent,var(--color-brick))] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--color-focus)]">
         {on ? <span className="absolute -left-0.5 -top-2 h-6 w-7" style={{ color: "var(--doc-accent, oklch(50% 0.12 160))" }}><HandTick className="h-6 w-7" /></span> : null}
        </span>
        <span className={cn("min-w-0 flex-1 leading-snug", on ? "text-muted-foreground line-through decoration-[1.5px]" : "text-foreground")} style={on ? { textDecorationColor: "var(--doc-accent, currentColor)" } : undefined}>{text}</span>
        <span className={cn(handFont.className, "shrink-0 text-[0.95rem] text-muted-foreground")}>{i + 1}</span>
       </label>
      </li>
     )
    })}
    {visible.length === 0 ? <li className={cn(handFont.className, "py-4 text-[1.05rem] text-muted-foreground")}>No topic matches “{q}”.</li> : null}
   </ul>
  </div>
 )
}
