"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import {
 CalendarDays,
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
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogDescription,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/utils"
import { monthLabel, toMonthKey, getMonthMatrix, toDayKey, humanizeKey } from "@/lib/dates"
import { CALENDAR_TYPE_STYLES, type CalendarEvent, type CalendarEventType } from "@/lib/calendar"
import { cn } from "@/lib/utils"

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

function isWeekendIndex(col: number): boolean {
 return col === 0 || col === 6
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
  <div className="container mx-auto max-w-7xl px-4 py-8">
   <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
    <header className="mb-8 flex flex-col gap-6 border-b-2 border-rule-2 pb-5 lg:flex-row lg:items-end lg:justify-between">
     <div className="min-w-0">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
       <h1 className="font-display text-[2rem] font-bold leading-[1.05] text-foreground sm:text-[2.6rem]">
        Never miss an exam date
       </h1>
       <span className="agate text-xs text-muted-foreground">{monthLabel(month)}</span>
      </div>
      <p className="mt-2 max-w-xl text-[1.0625rem] leading-relaxed text-muted-foreground">
       Application deadlines, exam dates, admit cards and results in one monthly view.
       Tap any day to see everything scheduled.
      </p>
     </div>

     <dl className="grid shrink-0 grid-cols-3 border-y border-rule">
      {[
       { label: "Events", value: heroStats.events },
       { label: "Deadlines", value: heroStats.deadlines },
       { label: "Exams", value: heroStats.exams },
      ].map((s) => (
       <div
        key={s.label}
        className="min-w-[84px] border-r border-rule px-4 py-2.5 text-center last:border-r-0 sm:min-w-[96px]"
       >
        <dd className="text-2xl font-bold tabular-nums text-foreground">
         {loading ? "–" : s.value}
        </dd>
        <dt className="agate mt-0.5 block text-[10px] text-muted-foreground">
         {s.label}
        </dt>
       </div>
      ))}
     </dl>
    </header>

    {/* ---- Toolbar ---- */}
    <div className="mb-6 flex flex-col gap-4">
     <div className="flex flex-wrap items-center justify-between gap-3" data-tour="cal-month-nav">
      <div className="flex flex-wrap items-center gap-2">
       <Button variant="outline" size="sm" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Previous month" className="font-bold">
        <ChevronLeft className="h-4 w-4" />
       </Button>
       <span className="min-w-[160px] text-center font-display text-lg font-bold text-foreground">
        {monthLabel(month)}
       </span>
       <Button variant="outline" size="sm" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Next month" className="font-bold">
        <ChevronRight className="h-4 w-4" />
       </Button>
       <input
        type="month"
        value={month}
        onChange={(e) => e.target.value && setMonth(e.target.value)}
        aria-label="Jump to month"
        className="rounded-none border border-rule bg-transparent px-2 py-1 text-xs font-medium text-foreground"
       />
       <Button
        variant="ghost"
        size="sm"
        className="font-medium text-brick"
        disabled={isCurrentMonth && selectedDay === todayKey}
        onClick={() => {
         setMonth(todayMonthKey)
         selectDay(todayKey, true)
        }}
       >
        Today
       </Button>
      </div>

      <div className="relative w-full sm:w-64" data-tour="cal-search">
       <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
       <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search exam, department…"
        aria-label="Search calendar events"
        className="pl-9 pr-8 font-medium"
       />
       {query && (
        <button
         type="button"
         onClick={() => setQuery("")}
         aria-label="Clear search"
         className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground"
        >
         <X className="h-4 w-4" />
        </button>
       )}
      </div>
     </div>

     <div className="flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label="Filter by event type" data-tour="cal-filters">
      {FILTERS.map((f) => {
       const active = type === f.value
       const count = f.value === "" ? filteredEvents.length : typeCounts.get(f.value) || 0
       return (
        <button
         key={f.value}
         type="button"
         role="radio"
         aria-checked={active}
         onClick={() => setType(f.value)}
         className={cn(
          "border px-3 py-1 text-xs font-medium transition-colors",
          active
           ? "border-ink bg-ink text-paper"
           : "border-rule bg-transparent text-muted-foreground hover:border-brick hover:text-brick"
         )}
        >
         {f.label}
         <span className={cn("ml-1.5 px-1 text-[10px]", active ? "text-paper/70" : "text-muted-foreground")}>
          {count}
         </span>
        </button>
       )
      })}
      {(query || type) && (
       <button
        type="button"
        onClick={() => { setQuery(""); setType("") }}
        className="ml-1 px-3 py-1 text-xs font-medium text-brick underline decoration-1 underline-offset-4 hover:decoration-2"
       >
        Clear filters
       </button>
      )}
     </div>

     <div className="agate flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
      {(Object.keys(CALENDAR_TYPE_STYLES) as CalendarEventType[])
       .filter((k) => k !== "admission_begin")
       .map((k) => (
        <span key={k} className="flex items-center gap-1.5">
         <span className={cn("h-2.5 w-2.5 rounded-sm", CALENDAR_TYPE_STYLES[k].dot)} />
         {CALENDAR_TYPE_STYLES[k].label}
        </span>
       ))}
      <span className="ml-auto hidden sm:inline">
       {groupedDays.length} active day{groupedDays.length === 1 ? "" : "s"}, {filteredEvents.length} event{filteredEvents.length === 1 ? "" : "s"}
      </span>
     </div>
    </div>

    {/* ---- Month grid ---- */}
    <Card className="mb-8 overflow-hidden border border-rule" data-tour="cal-grid">
     <CardContent className="p-0">
      <div className="agate grid grid-cols-7 border-b border-rule bg-paper-2 text-center text-[11px] text-muted-foreground">
       {WEEKDAYS.map((d) => (
        <div key={d} className="py-2.5">{d}</div>
       ))}
      </div>

      {loading ? (
       <div className="grid grid-cols-7 gap-px bg-rule">
        {Array.from({ length: 35 }).map((_, i) => (
         <div key={i} className="min-h-[76px] bg-background p-2 sm:min-h-[128px]">
          <Skeleton className="h-5 w-5 rounded-none" />
          <Skeleton className="mt-2 h-6 w-full" />
          <Skeleton className="mt-1 hidden h-6 w-full sm:block" />
         </div>
        ))}
       </div>
      ) : (
       <div className="grid grid-cols-7 gap-px bg-rule">
        {weeks.flatMap((week, w) =>
         week.map((day, c) => {
          if (day === null) {
           return <div key={`${w}-${c}`} className="min-h-[64px] bg-paper-2 sm:min-h-[128px]" />
          }
          const dayKey = `${curY}-${String(curM).padStart(2, "0")}-${String(day).padStart(2, "0")}`
          const dayEvents = eventsByDay.get(dayKey) || []
          const isToday = dayKey === todayKey
          const isSelected = selectedDay === dayKey
          const isExpanded = expandedDay === dayKey
          const visible = isExpanded ? dayEvents : dayEvents.slice(0, COLLAPSED_LIMIT)
          const hidden = dayEvents.length - visible.length
          const weekend = isWeekendIndex(c)

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
             "group flex min-h-[76px] cursor-pointer flex-col bg-background p-1 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-focus)] sm:min-h-[132px] sm:p-2",
             weekend && "bg-paper-2",
             isSelected && "bg-paper-3",
             isSelected && "ring-2 ring-inset ring-brick"
            )}
           >
            <span className="flex items-center justify-between gap-1">
             <span
              className={cn(
               "inline-flex h-6 min-w-6 items-center justify-center px-1 text-xs font-bold sm:h-7 sm:min-w-7 sm:text-sm",
               isToday
                ? "bg-ink text-paper"
                : "text-foreground"
              )}
             >
              {day}
             </span>
             {dayEvents.length > 0 && (
              <span className="flex items-center gap-1">
               <span className="agate hidden border border-rule px-1.5 text-[10px] text-muted-foreground lg:inline">
                {dayEvents.length}
               </span>
               <button
                type="button"
                title={`Open full view for ${formatDate(dayKey)}`}
                aria-label={`Open full view for ${formatDate(dayKey)}`}
                onClick={(e) => { e.stopPropagation(); setDialogDay(dayKey) }}
                className="p-0.5 text-muted-foreground hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 sm:opacity-0"
               >
                <Maximize2 className="h-3 w-3" />
               </button>
              </span>
             )}
            </span>

            {dayEvents.length === 0 ? (
             <span className="mt-2 hidden text-[10px] font-medium text-rule sm:block">-</span>
            ) : (
             <>
              {/* Mobile: bold color bars + count (space-efficient, tappable) */}
              <span className="mt-1.5 flex flex-col gap-1 sm:hidden">
               {dayEvents.slice(0, 2).map((e, idx) => (
                <span key={`${e.date}-${idx}`} title={`${humanizeKey(e.label)}: ${e.title}`} className={cn("h-1 w-full", CALENDAR_TYPE_STYLES[e.type].dot)} />
               ))}
               <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setDialogDay(dayKey) }}
                className="mt-0.5 bg-ink px-1 py-0.5 text-[10px] font-bold text-paper"
               >
                {dayEvents.length}
               </button>
              </span>

              {/* Desktop: bold pills, every item visible up to limit, rest behind +more */}
              <span className={cn("mt-1.5 hidden flex-col gap-1 sm:flex", isExpanded && "max-h-44 overflow-y-auto pr-0.5")}>
               {visible.map((e, idx) => (
                <Link
                 key={`${e.date}-${idx}`}
                 href={e.href}
                 onClick={(ev) => ev.stopPropagation()}
                 title={`${humanizeKey(e.label)} - ${e.title}`}
                 className={cn(
                  "flex items-center truncate border border-l-2 px-1.5 py-1 text-[11px] font-medium leading-tight",
                  CALENDAR_TYPE_STYLES[e.type].pill
                 )}
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
                 className="flex items-center justify-center gap-1 border border-rule px-1.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:border-brick hover:text-brick"
                >
                 <Plus className="h-3 w-3" /> {hidden} more
                </button>
               )}
               {isExpanded && (
                <button
                 type="button"
                 onClick={(e) => { e.stopPropagation(); toggleExpand(dayKey) }}
                 aria-expanded={true}
                 className="flex items-center justify-center gap-1 rounded-md border border-rule bg-background px-1.5 py-1 text-[11px] font-bold text-foreground hover:bg-paper-3 dark:border-rule-2 dark:bg-ink dark:text-muted-foreground"
                >
                 <Minus className="h-3 w-3" /> Show less
                </button>
               )}
              </span>

              {/* Mobile +more also needs inline access: reuse dialog entry */}
              {dayEvents.length > 2 && (
               <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setDialogDay(dayKey) }}
                className="mt-1 text-[10px] font-medium text-brick underline decoration-1 underline-offset-4 sm:hidden"
               >
                +{dayEvents.length - 2} more
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
     </CardContent>
    </Card>

    {error && (
     <div className="mb-6 flex flex-wrap items-center gap-3 border-y border-brick bg-paper-2 p-4 text-sm font-medium text-brick">
      <span className="flex items-center gap-2"><AlertCircle className="h-4 w-4 shrink-0" /> {error}</span>
      <Button size="sm" variant="outline" onClick={() => fetchEvents(month, type)} className="ml-auto font-medium">
       Retry
      </Button>
     </div>
    )}

    {!loading && !error && groupedDays.length === 0 && (
     <Card className="border-y border-rule bg-paper-2">
      <CardContent className="py-12 text-center">
       <CalendarDays className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
       <p className="font-display text-lg font-bold text-foreground">No events for this view</p>
       <p className="mt-1 text-sm text-muted-foreground">Try another month or clear search and filters.</p>
       <Button size="sm" variant="outline" className="mt-4 font-medium" onClick={() => { setQuery(""); setType("") }}>
        Clear filters
       </Button>
      </CardContent>
     </Card>
    )}

    {/* ---- Agenda: full same-day visibility ---- */}
    <div className="mb-4 flex items-center justify-between">
     <h2 className="font-display text-xl font-bold text-foreground">
      Schedule, {monthLabel(month)}
     </h2>
     {selectedDay && (
      <button
       type="button"
       onClick={() => setSelectedDay(null)}
       className="text-xs font-medium text-brick underline decoration-1 underline-offset-4 hover:decoration-2"
      >
       Clear selection
      </button>
     )}
    </div>
    <div className="space-y-6" data-tour="cal-agenda">
     {groupedDays.map(([dayKey, dayEvents]) => {
      const left = daysUntil(dayEvents[0].date)
      const urgent = left >= 0 && left <= 7
      const past = left < 0
      return (
       <div key={dayKey} id={`day-${dayKey}`} className={cn("scroll-mt-24", selectedDay === dayKey && "border-l-2 border-brick pl-3")}>
        <h3 className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-rule pb-2">
         <span className={cn(
          "flex h-9 w-9 flex-col items-center justify-center leading-none",
          dayKey === todayKey
           ? "bg-ink text-paper"
           : "border border-rule text-foreground"
         )}>
          <span className="text-base font-bold">{dayNumber(dayKey)}</span>
         </span>
         <span className="font-display text-lg font-bold text-foreground">
          {formatDate(dayKey)}
          <span className="agate ml-2 text-xs font-normal text-muted-foreground">{weekdayName(dayKey)}</span>
         </span>
         <span className="agate text-xs text-muted-foreground">
          {dayEvents.length} event{dayEvents.length === 1 ? "" : "s"}
         </span>
         {urgent && (
          <span className="agate text-xs text-brick">
           {left === 0 ? "Today" : left === 1 ? "Tomorrow" : `In ${left} days`}
          </span>
         )}
         {past && (
          <span className="agate text-xs text-muted-foreground">
           Passed
          </span>
         )}
        </h3>
        <div>
         {dayEvents.map((e, idx) => (
          <Link
           key={`${e.date}-${idx}`}
           href={e.href}
           className={cn(
            "group flex items-center gap-3 border-t border-rule py-3 transition-colors first:border-t-0",
            past ? "opacity-65" : ""
           )}
          >
           <span className={cn("h-8 w-1 shrink-0", CALENDAR_TYPE_STYLES[e.type].dot)} />
           <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-brick">
             {e.title}
            </p>
            <p className="truncate text-xs text-muted-foreground">{e.department}</p>
           </div>
           <span className={cn("agate shrink-0 border px-2 py-0.5 text-[0.7rem]", CALENDAR_TYPE_STYLES[e.type].badge)}>{humanizeKey(e.label)}</span>
          </Link>
         ))}
        </div>
       </div>
      )
     })}
    </div>
   </motion.div>

   {/* ---- Full-day dialog: guarantees every same-day item is viewable ---- */}
   <Dialog open={dialogDay !== null} onOpenChange={(open) => { if (!open) setDialogDay(null) }}>
    <DialogContent className="max-h-[85vh] overflow-y-auto">
     <DialogHeader>
      <DialogTitle className="font-display">
       {dialogDay ? formatDate(dialogDay) : ""}
       <span className="agate ml-2 text-sm font-normal text-muted-foreground">{dialogDay ? weekdayName(dialogDay) : ""}</span>
      </DialogTitle>
      <DialogDescription className="font-medium">
       {dialogEvents.length} event{dialogEvents.length === 1 ? "" : "s"} scheduled. Tap any item to open details.
      </DialogDescription>
     </DialogHeader>
     <div>
      {dialogEvents.map((e, idx) => (
       <Link
        key={`${e.date}-${idx}`}
        href={e.href}
        className="flex items-center gap-3 border-t border-rule py-3 transition-colors first:border-t-0 hover:text-brick"
       >
        <span className={cn("h-8 w-1 shrink-0", CALENDAR_TYPE_STYLES[e.type].dot)} />
        <span className="min-w-0 flex-1">
         <span className="block truncate text-sm font-semibold text-foreground">{e.title}</span>
         <span className="block truncate text-xs text-muted-foreground">{e.department}</span>
        </span>
        <span className={cn("agate shrink-0 border px-2 py-0.5 text-[0.7rem]", CALENDAR_TYPE_STYLES[e.type].badge)}>{humanizeKey(e.label)}</span>
       </Link>
      ))}
      {dialogEvents.length === 0 && (
       <p className="py-6 text-center text-sm font-medium text-muted-foreground">No events on this day.</p>
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
 )
}
