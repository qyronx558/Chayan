"use client"

import { useState, useEffect, useCallback, useMemo, type CSSProperties } from "react"
import Link from "next/link"
import {
 ChevronLeft,
 ChevronRight,
 AlertCircle,
 Loader2,
 Search,
 X,
 Plus,
 Minus,
 Maximize2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogDescription,
} from "@/components/ui/dialog"
import { formatDate } from "@/lib/utils"
import { monthLabel, toMonthKey, getMonthMatrix, toDayKey, humanizeKey } from "@/lib/dates"
import { CALENDAR_TYPE_STYLES, type CalendarEvent, type CalendarEventType } from "@/lib/calendar"
import { cn } from "@/lib/utils"
import { handFont, typeFont } from "@/components/home/fonts"
import { PenLoop, paperShadow } from "@/components/desk/DeskKit"

const FILTERS: { label: string; value: string }[] = [
 { label: "All", value: "" },
 { label: "Last Date", value: "last_date" },
 { label: "Exam Date", value: "exam" },
 { label: "Admit Card", value: "admit_card" },
 { label: "Result", value: "result" },
 { label: "Admission", value: "admission" },
]

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const COLLAPSED_LIMIT = 3

function shiftMonth(month: string, delta: number): string {
 const [y, m] = month.split("-").map((v) => parseInt(v, 10))
 const d = new Date(Date.UTC(y, m - 1 + delta, 1))
 return toMonthKey(d)
}

function dayNumber(dayKey: string): number {
 return new Date(`${dayKey}T12:00:00`).getDate()
}

function weekdayName(dayKey: string): string {
 return new Date(`${dayKey}T12:00:00`).toLocaleDateString("en-IN", { weekday: "long" })
}

function daysUntil(dateIso: string): number {
 const now = new Date()
 const a = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
 const d = new Date(dateIso)
 const b = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
 return Math.round((b - a) / 86400000)
}

export function ExamCalendarClient() {
 const [month, setMonth] = useState(() => toMonthKey(new Date()))
 const [type, setType] = useState("")
 const [query, setQuery] = useState("")
 const [events, setEvents] = useState<CalendarEvent[]>([])
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState("")
 const [selectedDay, setSelectedDay] = useState<string | null>(null)
 const [expandedDay, setExpandedDay] = useState<string | null>(null)
 const [dialogDay, setDialogDay] = useState<string | null>(null)
 const [urlReady, setUrlReady] = useState(false)

 // Read shareable state from URL once (no framework navigation needed).
 useEffect(() => {
  try {
   const params = new URLSearchParams(window.location.search)
   const m = params.get("month")
   const t = params.get("type")
   const q = params.get("q")
   const day = params.get("day")
   if (m && /^\d{4}-\d{2}$/.test(m)) setMonth(m)
   if (t !== null) setType(t)
   if (q !== null) setQuery(q.slice(0, 80))
   if (day && /^\d{4}-\d{2}-\d{2}$/.test(day)) {
    setSelectedDay(day)
    setExpandedDay(day)
   }
  } catch {
   // ignore malformed URLs
  } finally {
   setUrlReady(true)
  }
 }, [])

 // Keep URL shareable without triggering navigation.
 useEffect(() => {
  if (!urlReady) return
  try {
   const params = new URLSearchParams()
   params.set("month", month)
   if (type) params.set("type", type)
   if (query.trim()) params.set("q", query.trim())
   if (selectedDay) params.set("day", selectedDay)
   window.history.replaceState(null, "", `/exam-calendar?${params.toString()}`)
  } catch {
   // clipboard/share still works via visible state
  }
 }, [month, type, query, selectedDay, urlReady])

 const fetchEvents = useCallback(async (m: string, t: string) => {
  setLoading(true)
  setError("")
  try {
   const params = new URLSearchParams()
   params.set("month", m)
   if (t) params.set("type", t)
   const res = await fetch(`/api/exam-calendar?${params}`)
   const json = await res.json()
   if (json.success) setEvents(json.data)
   else setError(json.error || "Failed to load calendar")
  } catch {
   setError("Failed to load calendar. Please try again.")
  } finally {
   setLoading(false)
  }
 }, [])

 useEffect(() => {
  fetchEvents(month, type)
 }, [fetchEvents, month, type])

 // Collapse expanded/selected day when it no longer belongs to the view.
 useEffect(() => {
  setExpandedDay((prev) => (prev && !prev.startsWith(month) ? null : prev))
  setSelectedDay((prev) => (prev && !prev.startsWith(month) ? null : prev))
 }, [month])

 const filteredEvents = useMemo(() => {
  const q = query.trim().toLowerCase()
  if (!q) return events
  return events.filter((e) =>
   `${e.title} ${e.department} ${e.label}`.toLowerCase().includes(q)
  )
 }, [events, query])

 const typeCounts = useMemo(() => {
  const counts = new Map<string, number>()
  for (const e of events) {
   const key = e.type.startsWith("admission") ? "admission" : e.type
   counts.set(key, (counts.get(key) || 0) + 1)
  }
  return counts
 }, [events])

 const eventsByDay = useMemo(() => {
  const map = new Map<string, CalendarEvent[]>()
  for (const e of filteredEvents) {
   const key = toDayKey(e.date)
   const list = map.get(key) || []
   list.push(e)
   map.set(key, list)
  }
  for (const list of map.values()) {
   list.sort((a, b) => {
    const order: Record<CalendarEventType, number> = {
     last_date: 0,
     exam: 1,
     admit_card: 2,
     result: 3,
     admission_last: 4,
     admission_begin: 5,
    }
    return order[a.type] - order[b.type] || a.title.localeCompare(b.title)
   })
  }
  return map
 }, [filteredEvents])

 const heroStats = useMemo(() => {
  let deadlines = 0
  let exams = 0
  for (const e of filteredEvents) {
   if (e.type === "last_date") deadlines++
   else if (e.type === "exam") exams++
  }
  return { events: filteredEvents.length, deadlines, exams }
 }, [filteredEvents])

 const weeks = useMemo(() => getMonthMatrix(month), [month])

 const groupedDays = useMemo(
  () => Array.from(eventsByDay.entries()).sort((a, b) => a[0].localeCompare(b[0])),
  [eventsByDay]
 )

 const dialogEvents = dialogDay ? eventsByDay.get(dialogDay) || [] : []
 const today = new Date()
 const todayKey = toDayKey(today)
 const todayMonthKey = toMonthKey(today)
 const isCurrentMonth = month === todayMonthKey
 const [curY, curM] = month.split("-").map((v) => parseInt(v, 10))

 const selectDay = useCallback((dayKey: string, scroll = false) => {
  setSelectedDay(dayKey)
  if (scroll) {
   requestAnimationFrame(() => {
    document.getElementById(`day-${dayKey}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
   })
  }
 }, [])

 const toggleExpand = useCallback((dayKey: string) => {
  setExpandedDay((prev) => (prev === dayKey ? null : dayKey))
  setSelectedDay(dayKey)
 }, [])

 return (
  <div className="home-saas text-foreground">
  <div className="container mx-auto max-w-7xl px-4 pb-16 pt-8">
   {/* ---- Hero: the calendar on the wall ---- */}
   <header className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
    <div className="min-w-0">
     <p className={cn(handFont.className, "text-[1.25rem] text-[var(--color-brick)]")}>exam calendar</p>
     <h1 className="mt-1 font-display text-[2.3rem] font-black leading-[1.05] text-foreground sm:text-[3.1rem]">
      Every date that matters,
      <br />
      on one wall.
     </h1>
     <p className="mt-4 max-w-lg text-[16px] leading-relaxed text-muted-foreground">
      Last dates, exam days, admit cards and results, marked the way you would mark the calendar above your desk.
      Tap any day to see everything on it.
     </p>
     <p className={cn(handFont.className, "mt-4 text-[1.25rem] leading-snug text-foreground/75")}>
      {loading ? (
       "counting the dates…"
      ) : (
       <>
        this month:{" "}
        <span className="relative inline-block px-1 text-foreground">
         {heroStats.events}
         <PenLoop className="-inset-x-1 -inset-y-0.5 h-[calc(100%+0.25rem)] w-[calc(100%+0.5rem)]" color={INK.last_date} />
        </span>{" "}
        dates, <span style={{ color: INK.last_date }}>{heroStats.deadlines} last dates</span>,{" "}
        <span style={{ color: INK.exam }}>{heroStats.exams} exams</span>
       </>
      )}
     </p>
    </div>

    <WallCalendar month={month} weeks={weeks} eventsByDay={eventsByDay} todayKey={todayKey} />
   </header>

   {/* ---- Toolbar ---- */}
   <div className="mb-6 mt-14 flex flex-col gap-5">
    <div className="flex flex-wrap items-center justify-between gap-4" data-tour="cal-month-nav">
     <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Previous month" className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--hs-border-strong)] bg-[var(--hs-surface)] text-foreground transition-colors hover:border-[var(--color-brick)] hover:text-[var(--color-brick)]">
       <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-[170px] text-center font-display text-[1.5rem] font-black text-foreground">
       {monthLabel(month)}
      </span>
      <button type="button" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Next month" className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--hs-border-strong)] bg-[var(--hs-surface)] text-foreground transition-colors hover:border-[var(--color-brick)] hover:text-[var(--color-brick)]">
       <ChevronRight className="h-4 w-4" />
      </button>
      <input
       type="month"
       value={month}
       onChange={(e) => e.target.value && setMonth(e.target.value)}
       aria-label="Jump to month"
       className="h-10 rounded-full border border-[var(--hs-border-strong)] bg-[var(--hs-surface)] px-4 text-xs font-medium text-foreground outline-none focus-visible:border-[var(--hs-trust)]"
      />
      <button
       type="button"
       className={cn(handFont.className, "px-2 text-[1.15rem] text-[var(--color-brick)] underline decoration-wavy decoration-1 underline-offset-4 disabled:no-underline disabled:opacity-40")}
       disabled={isCurrentMonth && selectedDay === todayKey}
       onClick={() => {
        setMonth(todayMonthKey)
        selectDay(todayKey, true)
       }}
      >
       back to today
      </button>
     </div>

     <div className="group relative flex h-11 w-full items-center rounded-full border border-[var(--hs-border-strong)] bg-[var(--hs-surface)] pl-4 pr-1.5 transition-[border-color,box-shadow] focus-within:border-[var(--hs-trust)] focus-within:shadow-[0_0_0_4px_var(--hs-trust-soft)] sm:w-72" data-tour="cal-search">
      <Search className="pointer-events-none h-4 w-4 shrink-0 text-muted-foreground" />
      <input
       value={query}
       onChange={(e) => setQuery(e.target.value)}
       placeholder="Search exam, department…"
       aria-label="Search calendar events"
       className="min-w-0 flex-1 bg-transparent px-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
      />
      {query && (
       <button
        type="button"
        onClick={() => setQuery("")}
        aria-label="Clear search"
        className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-paper-2 hover:text-brick"
       >
        <X className="h-4 w-4" />
       </button>
      )}
     </div>
    </div>

    <div className="flex flex-wrap items-center gap-x-1 gap-y-2" role="radiogroup" aria-label="Filter by event type" data-tour="cal-filters">
     {FILTERS.map((f, i) => {
      const active = type === f.value
      const count = f.value === "" ? filteredEvents.length : typeCounts.get(f.value) || 0
      const ink = f.value ? INK[f.value as keyof typeof INK] : "var(--color-brick)"
      return (
       <button
        key={f.value}
        type="button"
        role="radio"
        aria-checked={active}
        onClick={() => setType(f.value)}
        className={cn("relative px-3.5 py-1.5 text-[13.5px] transition-colors", active ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground")}
       >
        {active && (
         <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          <path className="hs-draw" d={i % 2 ? "M55 3 C 84 2, 98 10, 97 20 C 96 31, 74 37, 50 37 C 24 37, 3 31, 3 20 C 3 9, 22 3, 46 3 C 58 3, 68 4, 76 7" : "M45 3 C 16 3, 2 10, 3 20 C 4 31, 26 37, 50 37 C 76 37, 97 30, 97 19 C 97 9, 78 3, 54 3 C 42 3, 32 4, 24 7"} fill="none" stroke={ink} strokeWidth="1.8" strokeLinecap="round" vectorEffect="non-scaling-stroke" style={{ ["--len" as string]: 280, animationDuration: ".5s" } as CSSProperties} />
         </svg>
        )}
        {f.value && <span className="mr-1.5 inline-block h-2 w-2 -translate-y-px rounded-full" style={{ background: ink }} aria-hidden />}
        {f.label}
        <sup className={cn(typeFont.className, "ml-1 text-[10px]", active ? "text-foreground/70" : "text-muted-foreground")}>{count}</sup>
       </button>
      )
     })}
     {(query || type) && (
      <button
       type="button"
       onClick={() => { setQuery(""); setType("") }}
       className={cn(handFont.className, "ml-2 text-[1.05rem] text-brick underline decoration-wavy decoration-1 underline-offset-4")}
      >
       rub it out
      </button>
     )}
     <span className={cn(handFont.className, "ml-auto hidden text-[1.05rem] text-muted-foreground sm:inline")}>
      {groupedDays.length} marked day{groupedDays.length === 1 ? "" : "s"}, {filteredEvents.length} date{filteredEvents.length === 1 ? "" : "s"}
     </span>
    </div>
   </div>

   {/* ---- Month grid: the big wall sheet ---- */}
   <div className="relative mb-12 mt-8" data-tour="cal-grid">
    {/* spiral binding */}
    <div className="pointer-events-none absolute inset-x-6 -top-3 z-10 flex justify-between" aria-hidden>
     {Array.from({ length: 22 }).map((_, i) => (
      <span key={i} className={cn("h-6 w-2.5 rounded-full border-2 border-[oklch(55%_0.01_250)]", i > 13 && "hidden sm:block")} style={{ background: "linear-gradient(180deg, oklch(88% 0.005 250), oklch(64% 0.01 250))" }} />
     ))}
    </div>
    <div className="overflow-hidden rounded-[4px] border border-[var(--hs-border)] bg-[var(--hs-paper-slip)]" style={{ boxShadow: paperShadow }}>
     <div className="flex items-end justify-between gap-3 bg-[color-mix(in_oklch,var(--color-brick)_90%,black)] px-4 pb-3 pt-6 text-[oklch(97%_0.01_90)] sm:px-6">
      <span className="font-display text-[1.6rem] font-black leading-none sm:text-[2.2rem]">{monthLabel(month).split(" ")[0]}</span>
      <span className={cn(typeFont.className, "text-[12px] font-bold opacity-85")}>{curY}</span>
     </div>
     <div className={cn(typeFont.className, "grid grid-cols-7 border-b border-[var(--hs-border-strong)] text-center text-[11px] font-bold")}>
      {WEEKDAYS.map((d, i) => (
       <div key={d} className={cn("py-2.5", i === 0 ? "text-[var(--color-brick)]" : "text-muted-foreground")}>{d.toUpperCase()}</div>
      ))}
     </div>

     {loading ? (
      <div className="grid grid-cols-7">
       {Array.from({ length: 35 }).map((_, i) => (
        <div key={i} className="min-h-[76px] border-b border-r border-dotted border-[var(--hs-border-strong)] p-2 sm:min-h-[128px]">
         <span className="hs-skel block h-5 w-5" />
         <span className="hs-skel mt-2 block h-5 w-full" />
         <span className="hs-skel mt-1 hidden h-5 w-full sm:block" />
        </div>
       ))}
      </div>
     ) : (
      <div className="grid grid-cols-7">
       {weeks.flatMap((week, w) =>
        week.map((day, c) => {
         if (day === null) {
          return <div key={`${w}-${c}`} className="min-h-[64px] border-b border-r border-dotted border-[var(--hs-border-strong)] bg-[repeating-linear-gradient(135deg,transparent_0_6px,color-mix(in_oklch,var(--color-ink)_5%,transparent)_6px_7px)] sm:min-h-[128px]" />
         }
         const dayKey = `${curY}-${String(curM).padStart(2, "0")}-${String(day).padStart(2, "0")}`
         const dayEvents = eventsByDay.get(dayKey) || []
         const isToday = dayKey === todayKey
         const isSelected = selectedDay === dayKey
         const isExpanded = expandedDay === dayKey
         const visible = isExpanded ? dayEvents : dayEvents.slice(0, COLLAPSED_LIMIT)
         const hidden = dayEvents.length - visible.length
         const sunday = c === 0

         return (
          <div
           key={dayKey}
           role="button"
           tabIndex={0}
           data-tour={dayEvents.length > 0 ? "cal-day" : undefined}
           aria-pressed={isSelected}
           aria-label={`${formatDate(dayKey)}: ${dayEvents.length} events`}
           onClick={() => selectDay(dayKey)}
           onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectDay(dayKey) }
           }}
           className={cn(
            "group relative flex min-h-[76px] cursor-pointer flex-col border-b border-r border-dotted border-[var(--hs-border-strong)] p-1 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-focus)] sm:min-h-[132px] sm:p-2",
            isSelected && "bg-[color-mix(in_oklch,var(--hs-marigold)_16%,transparent)] shadow-[inset_0_0_0_2px_color-mix(in_oklch,var(--hs-marigold)_70%,transparent)]",
            !isSelected && "hover:bg-[color-mix(in_oklch,var(--color-ink)_3%,transparent)]"
           )}
          >
           <span className="flex items-start justify-between gap-1">
            <span className={cn("relative inline-flex h-7 min-w-7 items-center justify-center font-display text-[15px] font-bold sm:h-8 sm:min-w-8 sm:text-[1.25rem]", sunday ? "text-[var(--color-brick)]" : "text-foreground")}>
             {day}
             {isToday && (
              <svg viewBox="0 0 40 40" className="pointer-events-none absolute -inset-1 h-[calc(100%+0.5rem)] w-[calc(100%+0.5rem)]" aria-hidden>
               <path d="M22 3 C 11 2, 3 9, 3 20 C 3 31, 11 38, 21 37 C 31 36, 38 29, 37 19 C 36 9, 29 3, 17 5" fill="none" stroke="var(--hs-trust)" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
             )}
            </span>
            {isToday && <span className={cn(handFont.className, "hidden text-[0.85rem] leading-none text-[var(--hs-trust)] sm:block")}>today</span>}
            {dayEvents.length > 0 && (
             <button
              type="button"
              title={`Open full view for ${formatDate(dayKey)}`}
              aria-label={`Open full view for ${formatDate(dayKey)}`}
              onClick={(e) => { e.stopPropagation(); setDialogDay(dayKey) }}
              className="rounded-full p-1 text-muted-foreground hover:bg-paper-2 hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 sm:opacity-0"
             >
              <Maximize2 className="h-3 w-3" />
             </button>
            )}
           </span>

           {dayEvents.length > 0 && (
            <>
             {/* Mobile: ink dots + count */}
             <span className="mt-1 flex flex-col items-start gap-1 sm:hidden">
              <span className="flex gap-0.5">
               {dayEvents.slice(0, 3).map((e, idx) => (
                <span key={`${e.date}-${idx}`} title={`${humanizeKey(e.label)}: ${e.title}`} className="h-1.5 w-1.5 rounded-full" style={{ background: inkOf(e.type) }} />
               ))}
              </span>
              <button
               type="button"
               onClick={(e) => { e.stopPropagation(); setDialogDay(dayKey) }}
               className={cn(handFont.className, "text-[0.95rem] leading-none text-[var(--color-brick)] underline decoration-1 underline-offset-2")}
              >
               {dayEvents.length}
              </button>
             </span>

             {/* Desktop: written-in entries */}
             <span className={cn("mt-1.5 hidden flex-col gap-1 sm:flex", isExpanded && "max-h-44 overflow-y-auto pr-0.5")}>
              {visible.map((e, idx) => (
               <Link
                key={`${e.date}-${idx}`}
                href={e.href}
                onClick={(ev) => ev.stopPropagation()}
                title={`${humanizeKey(e.label)} - ${e.title}`}
                className="flex items-center truncate rounded-[2px] border-l-[3px] px-1.5 py-[3px] text-[11px] font-medium leading-tight text-foreground transition-colors hover:brightness-95"
                style={{ borderColor: inkOf(e.type), background: `color-mix(in oklch, ${inkOf(e.type)} 13%, transparent)` }}
               >
                <span className="truncate">{e.title}</span>
               </Link>
              ))}
              {hidden > 0 && !isExpanded && (
               <button
                type="button"
                onClick={(e) => { e.stopPropagation(); toggleExpand(dayKey) }}
                aria-expanded={false}
                aria-label={`Show ${hidden} more events on ${formatDate(dayKey)}`}
                className={cn(handFont.className, "flex items-center gap-1 px-1 text-[0.95rem] leading-tight text-[var(--color-brick)] hover:underline")}
               >
                <Plus className="h-3 w-3" /> {hidden} more
               </button>
              )}
              {isExpanded && (
               <button
                type="button"
                onClick={(e) => { e.stopPropagation(); toggleExpand(dayKey) }}
                aria-expanded={true}
                className={cn(handFont.className, "flex items-center gap-1 px-1 text-[0.95rem] leading-tight text-muted-foreground hover:text-foreground")}
               >
                <Minus className="h-3 w-3" /> show less
               </button>
              )}
             </span>

             {dayEvents.length > 3 && (
              <button
               type="button"
               onClick={(e) => { e.stopPropagation(); setDialogDay(dayKey) }}
               className="mt-1 text-[10px] font-medium text-brick underline decoration-1 underline-offset-4 sm:hidden"
              >
               +{dayEvents.length - 3} more
              </button>
             )}
            </>
           )}
          </div>
         )
        })
       )}
      </div>
     )}
     {/* legend, printed at the foot of the sheet like on a real calendar */}
     <div className={cn(typeFont.className, "flex flex-wrap gap-x-5 gap-y-1.5 px-4 py-3 text-[11px] text-muted-foreground sm:px-6")}>
      {(Object.keys(CALENDAR_TYPE_STYLES) as CalendarEventType[])
       .filter((k) => k !== "admission_begin")
       .map((k) => (
        <span key={k} className="flex items-center gap-1.5">
         <svg viewBox="0 0 24 8" className="h-2 w-6" aria-hidden><path d="M1 5 C 6 1, 12 7, 23 3" fill="none" stroke={inkOf(k)} strokeWidth="2.6" strokeLinecap="round" /></svg>
         {CALENDAR_TYPE_STYLES[k].label}
        </span>
       ))}
     </div>
    </div>
   </div>

   {error && (
    <div className="mb-8 flex flex-wrap items-center gap-3 rounded-[3px] border border-dashed border-[var(--color-brick)] bg-[var(--hs-paper-slip)] p-4 text-sm font-medium text-brick">
     <span className="flex items-center gap-2"><AlertCircle className="h-4 w-4 shrink-0" /> {error}</span>
     <Button size="sm" variant="outline" onClick={() => fetchEvents(month, type)} className="ml-auto font-medium">
      Retry
     </Button>
    </div>
   )}

   {!loading && !error && groupedDays.length === 0 && (
    <div className="mb-8 rounded-[3px] border border-dashed border-[var(--hs-border-strong)] bg-[var(--hs-paper-slip)] px-6 py-12 text-center">
     <p className={cn(handFont.className, "text-[1.5rem] text-foreground")}>Nothing marked on this page.</p>
     <p className="mt-1 text-sm text-muted-foreground">Turn to another month, or rub out the search and filters.</p>
     <Button size="sm" variant="outline" className="mt-4 font-medium" onClick={() => { setQuery(""); setType("") }}>
      Clear filters
     </Button>
    </div>
   )}

   {/* ---- Agenda: the diary ---- */}
   <div className="mb-5 flex items-end justify-between gap-3">
    <div>
     <p className={cn(handFont.className, "text-[1.15rem] text-[var(--color-brick)]")}>the diary</p>
     <h2 className="font-display text-[1.7rem] font-black leading-tight text-foreground">Day by day, {monthLabel(month)}</h2>
    </div>
    {selectedDay && (
     <button
      type="button"
      onClick={() => setSelectedDay(null)}
      className={cn(handFont.className, "text-[1.05rem] text-brick underline decoration-wavy decoration-1 underline-offset-4")}
     >
      clear selection
     </button>
    )}
   </div>
   <div className="grid gap-6 md:grid-cols-2" data-tour="cal-agenda">
    {groupedDays.map(([dayKey, dayEvents], gi) => {
     const left = daysUntil(dayEvents[0].date)
     const urgent = left >= 0 && left <= 7
     const past = left < 0
     const d = new Date(`${dayKey}T12:00:00`)
     return (
      <div
       key={dayKey}
       id={`day-${dayKey}`}
       className={cn(
        "relative scroll-mt-24 rounded-[3px] border bg-[var(--hs-paper-slip)] transition-shadow",
        gi % 2 ? "md:rotate-[0.3deg]" : "md:-rotate-[0.25deg]",
        selectedDay === dayKey ? "border-[var(--hs-marigold)] shadow-[0_0_0_2px_var(--hs-marigold)]" : "border-[var(--hs-border)]",
        past && "opacity-70"
       )}
       style={selectedDay === dayKey ? undefined : { boxShadow: paperShadow }}
      >
       <div className="flex">
        {/* the torn calendar leaf */}
        <div className={cn("flex w-[76px] shrink-0 flex-col items-center justify-center border-r border-dashed border-[var(--hs-border-strong)] py-3", dayKey === todayKey && "bg-[color-mix(in_oklch,var(--hs-trust)_10%,transparent)]")}>
         <span className={cn(typeFont.className, "text-[10px] font-bold", d.getDay() === 0 ? "text-[var(--color-brick)]" : "text-muted-foreground")}>{d.toLocaleDateString("en-IN", { month: "short" }).toUpperCase()}</span>
         <span className={cn("font-display text-[2rem] font-black leading-none", d.getDay() === 0 ? "text-[var(--color-brick)]" : "text-foreground")}>{dayNumber(dayKey)}</span>
         <span className={cn(typeFont.className, "mt-0.5 text-[10px] text-muted-foreground")}>{weekdayName(dayKey).slice(0, 3).toUpperCase()}</span>
        </div>
        <div className="min-w-0 flex-1 px-4 py-3" style={{ backgroundImage: "repeating-linear-gradient(180deg, transparent 0 43px, color-mix(in oklch, oklch(62% 0.09 240) 16%, transparent) 43px 44px)", backgroundPosition: "0 2.6rem" }}>
         <h3 className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 pb-1">
          <span className="text-[15px] font-bold text-foreground">{weekdayName(dayKey)}</span>
          <span className={cn(typeFont.className, "text-[11px] text-muted-foreground")}>
           {dayEvents.length} date{dayEvents.length === 1 ? "" : "s"}
          </span>
          {urgent && (
           <span className={cn(handFont.className, "-rotate-[2deg] text-[1.05rem] text-[var(--color-brick)]")}>
            {left === 0 ? "today!" : left === 1 ? "tomorrow!" : `in ${left} days`}
           </span>
          )}
          {past && <span className={cn(handFont.className, "text-[1rem] text-muted-foreground")}>gone by</span>}
         </h3>
         <div>
          {dayEvents.map((e, idx) => (
           <Link
            key={`${e.date}-${idx}`}
            href={e.href}
            className="group flex h-11 items-center gap-3"
           >
            <span className="h-6 w-[3px] shrink-0 rounded-full" style={{ background: inkOf(e.type) }} />
            <div className="min-w-0 flex-1">
             <p className="truncate text-[13.5px] font-semibold leading-tight text-foreground group-hover:underline group-hover:decoration-[var(--color-brick)] group-hover:underline-offset-2">
              {e.title}
             </p>
             <p className="truncate text-[11.5px] leading-tight text-muted-foreground">{e.department}</p>
            </div>
            <span className={cn(handFont.className, "shrink-0 text-[0.95rem] leading-none")} style={{ color: inkOf(e.type) }}>{humanizeKey(e.label).toLowerCase()}</span>
           </Link>
          ))}
         </div>
        </div>
       </div>
      </div>
     )
    })}
   </div>

   {/* ---- Full-day dialog: guarantees every same-day item is viewable ---- */}
   <Dialog open={dialogDay !== null} onOpenChange={(open) => { if (!open) setDialogDay(null) }}>
    <DialogContent className="home-saas max-h-[85vh] overflow-y-auto rounded-[4px] border-[var(--hs-border-strong)] bg-[var(--hs-paper-slip)] text-foreground sm:rounded-[4px]">
     <DialogHeader>
      <p className={cn(typeFont.className, "text-[10.5px] text-muted-foreground")}>{dialogDay ? weekdayName(dialogDay).toUpperCase() : ""}</p>
      <DialogTitle className="font-display text-2xl font-black">
       {dialogDay ? formatDate(dialogDay) : ""}
      </DialogTitle>
      <DialogDescription className={cn(handFont.className, "text-[1.05rem]")}>
       {dialogEvents.length} date{dialogEvents.length === 1 ? "" : "s"} written on this day. tap one to open it.
      </DialogDescription>
     </DialogHeader>
     <div>
      {dialogEvents.map((e, idx) => (
       <Link
        key={`${e.date}-${idx}`}
        href={e.href}
        className="group flex items-center gap-3 border-t border-dashed border-[var(--hs-border-strong)] py-3 first:border-t-0"
       >
        <span className="h-8 w-[3px] shrink-0 rounded-full" style={{ background: inkOf(e.type) }} />
        <span className="min-w-0 flex-1">
         <span className="block truncate text-sm font-semibold text-foreground group-hover:underline">{e.title}</span>
         <span className="block truncate text-xs text-muted-foreground">{e.department}</span>
        </span>
        <span className={cn(handFont.className, "shrink-0 text-[0.95rem]")} style={{ color: inkOf(e.type) }}>{humanizeKey(e.label).toLowerCase()}</span>
       </Link>
      ))}
      {dialogEvents.length === 0 && (
       <p className={cn(handFont.className, "py-6 text-center text-[1.1rem] text-muted-foreground")}>nothing on this day.</p>
      )}
     </div>
    </DialogContent>
   </Dialog>

   {loading && (
    <span className="sr-only" role="status" aria-live="polite">
     <Loader2 className="h-4 w-4 animate-spin" /> Loading calendar…
    </span>
   )}
  </div>
  </div>
 )
}

/* ---- pen colours for each kind of date (page-only; the shared calendar styles stay as they are) ---- */
const INK = {
 last_date: "oklch(56% 0.19 27)",
 exam: "oklch(56% 0.14 255)",
 admit_card: "oklch(56% 0.12 155)",
 result: "oklch(56% 0.14 310)",
 admission: "oklch(66% 0.14 70)",
} as const

function inkOf(t: CalendarEventType): string {
 return t.startsWith("admission") ? INK.admission : INK[t as keyof typeof INK]
}

/** The calendar hanging on its nail: a real mini-month, dates marked in pen. Decorative. */
function WallCalendar({ month, weeks, eventsByDay, todayKey }: { month: string; weeks: (number | null)[][]; eventsByDay: Map<string, CalendarEvent[]>; todayKey: string }) {
 const [y, m] = month.split("-").map((v) => parseInt(v, 10))
 return (
  <div className="relative mx-auto w-full max-w-[22rem] pt-10" aria-hidden>
   {/* nail and string */}
   <span className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 rounded-full" style={{ background: "radial-gradient(circle at 35% 30%, oklch(85% 0.01 250), oklch(45% 0.01 250))", boxShadow: "1px 2px 2px rgb(0 0 0 / .35)" }} />
   <svg viewBox="0 0 200 44" className="absolute inset-x-0 top-1.5 h-11 w-full" preserveAspectRatio="none">
    <path d="M100 4 L 40 42 M100 4 L 160 42" stroke="oklch(45% 0.03 60)" strokeWidth="1.2" fill="none" vectorEffect="non-scaling-stroke" />
   </svg>
   <div className="hs-sway relative" style={{ animationDuration: "9s", transformOrigin: "50% -2.5rem" }}>
    <div className="overflow-hidden rounded-[3px] bg-[oklch(98%_0.008_90)] text-[oklch(25%_0.02_60)]" style={{ boxShadow: "0 24px 40px -24px rgb(40 20 0 / .6), 0 1px 2px rgb(0 0 0 / .1)" }}>
     <div className="h-3" style={{ background: "repeating-linear-gradient(90deg, oklch(50% 0.01 250) 0 3px, transparent 3px 9px)" }} />
     <div className="px-4 pb-1 pt-2 text-center">
      <p className="font-display text-[1.7rem] font-black leading-none text-[oklch(45%_0.17_28)]">{monthLabel(month).split(" ")[0]}</p>
      <p className={cn(typeFont.className, "text-[10px] font-bold")}>{y}</p>
     </div>
     <div className={cn(typeFont.className, "grid grid-cols-7 px-3 pb-3 text-center text-[10px]")}>
      {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
       <span key={i} className={cn("py-1 font-bold", i === 0 ? "text-[oklch(50%_0.18_28)]" : "text-[oklch(45%_0.02_60)]")}>{d}</span>
      ))}
      {weeks.flatMap((week, w) =>
       week.map((day, c) => {
        if (day === null) return <span key={`${w}-${c}`} />
        const key = `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`
        const evs = eventsByDay.get(key)
        const ink = evs?.length ? inkOf(evs[0].type) : null
        return (
         <span key={key} className={cn("relative py-1 text-[11px] font-bold", c === 0 && "text-[oklch(50%_0.18_28)]")}>
          {day}
          {ink && (
           <svg viewBox="0 0 40 40" className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2">
            <path d={c % 2 ? "M20 3 C 31 2, 38 10, 37 21 C 36 32, 27 38, 18 37 C 8 36, 2 28, 3 18 C 4 9, 11 4, 23 4" : "M22 3 C 11 2, 3 9, 3 20 C 3 31, 11 38, 21 37 C 31 36, 38 29, 37 19 C 36 9, 29 3, 17 5"} fill="none" stroke={ink} strokeWidth="2.2" strokeLinecap="round" />
           </svg>
          )}
          {key === todayKey && <span className="absolute inset-x-1 bottom-0 h-[3px] rounded-full bg-[oklch(42%_0.075_205)]" />}
         </span>
        )
       })
      )}
     </div>
    </div>
   </div>
   <p className={cn(handFont.className, "mt-3 text-center text-[1rem] text-muted-foreground")}>circled = something due that day</p>
  </div>
 )
}
