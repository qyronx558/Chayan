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
  ArrowRight,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
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
        {/* ---- Premium hero banner (peaceful light theme) ---- */}
        <header className="relative mb-8 overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-teal-50 shadow-sm dark:border-gray-700 dark:from-gray-900 dark:via-gray-900 dark:to-teal-950">
          {/* decorative glows + watermark */}
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-sky-200/50 blur-3xl dark:bg-teal-500/10" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-teal-200/40 blur-3xl dark:bg-teal-500/10" />
          <CalendarDays aria-hidden="true" className="pointer-events-none absolute -bottom-8 -right-4 h-44 w-44 rotate-12 text-sky-200/50 dark:text-white/5" />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-60 dark:opacity-20"
            style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgb(12 74 110 / 0.10) 1px, transparent 0)", backgroundSize: "22px 22px" }}
          />

          <div className="relative flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-teal-800 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-200">
                  <CalendarDays className="h-3 w-3" /> Exam Calendar
                </span>
                <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-bold text-sky-800 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200">
                  {monthLabel(month)}
                </span>
              </div>
              <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl dark:text-white">
                Never miss an <span className="text-teal-700 dark:text-teal-300">exam date</span>
              </h1>
              <p className="mt-2 max-w-xl text-sm font-medium text-slate-600 sm:text-base dark:text-gray-300">
                Application deadlines, exam dates, admit cards and results - all in one calm monthly view.
                Tap any day to see everything scheduled.
              </p>
            </div>

            <dl className="grid shrink-0 grid-cols-3 gap-2.5 sm:gap-3">
              {[
                { label: "Events", value: heroStats.events },
                { label: "Deadlines", value: heroStats.deadlines },
                { label: "Exams", value: heroStats.exams },
              ].map((s) => (
                <div
                  key={s.label}
                  className="min-w-[84px] rounded-xl border border-sky-100 bg-white/90 px-3 py-2.5 text-center shadow-sm sm:min-w-[96px] dark:border-gray-700 dark:bg-gray-800"
                >
                  <dt className="order-2 mt-0.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                    {s.label}
                  </dt>
                  <dd className="order-1 text-xl font-extrabold tabular-nums text-teal-800 sm:text-2xl dark:text-teal-300">
                    {loading ? "–" : s.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div aria-hidden="true" className="relative h-1 bg-gradient-to-r from-sky-300 via-teal-300 to-emerald-300 dark:from-sky-700 dark:via-teal-700 dark:to-emerald-700" />
        </header>

        {/* ---- Toolbar ---- */}
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Previous month" className="font-bold">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[160px] text-center text-lg font-extrabold tracking-tight text-gray-900 dark:text-white">
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
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              />
              <Button
                variant="ghost"
                size="sm"
                className="font-bold text-blue-700 dark:text-blue-300"
                disabled={isCurrentMonth && selectedDay === todayKey}
                onClick={() => {
                  setMonth(todayMonthKey)
                  selectDay(todayKey, true)
                }}
              >
                Today
              </Button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search exam, department…"
                aria-label="Search calendar events"
                className="bg-white pl-9 pr-8 font-medium dark:bg-gray-900"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label="Filter by event type">
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
                    "rounded-full border px-3 py-1 text-xs font-bold transition-colors",
                    active
                      ? "border-blue-700 bg-blue-700 text-white shadow-sm"
                      : "border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-blue-700 dark:hover:bg-gray-800"
                  )}
                >
                  {f.label}
                  <span className={cn("ml-1.5 rounded-full px-1.5 text-[10px]", active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400")}>
                    {count}
                  </span>
                </button>
              )
            })}
            {(query || type) && (
              <button
                type="button"
                onClick={() => { setQuery(""); setType("") }}
                className="ml-1 rounded-full px-3 py-1 text-xs font-bold text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-gray-800"
              >
                Clear filters
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300">
            {(Object.keys(CALENDAR_TYPE_STYLES) as CalendarEventType[])
              .filter((k) => k !== "admission_begin")
              .map((k) => (
                <span key={k} className="flex items-center gap-1.5">
                  <span className={cn("h-2.5 w-2.5 rounded-sm", CALENDAR_TYPE_STYLES[k].dot)} />
                  {CALENDAR_TYPE_STYLES[k].label}
                </span>
              ))}
            <span className="ml-auto hidden font-medium text-gray-400 sm:inline">
              {groupedDays.length} active day{groupedDays.length === 1 ? "" : "s"} • {filteredEvents.length} event{filteredEvents.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        {/* ---- Month grid ---- */}
        <Card className="mb-8 overflow-hidden border-2 border-gray-200 shadow-sm dark:border-gray-700">
          <CardContent className="p-0">
            <div className="grid grid-cols-7 border-b border-sky-100 bg-gradient-to-r from-sky-50 via-white to-teal-50 text-center text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:border-gray-700 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 dark:text-gray-300">
              {WEEKDAYS.map((d) => (
                <div key={d} className="py-2.5">{d}</div>
              ))}
            </div>

            {loading ? (
              <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="min-h-[76px] bg-white p-2 dark:bg-gray-900 sm:min-h-[128px]">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <Skeleton className="mt-2 h-6 w-full" />
                    <Skeleton className="mt-1 hidden h-6 w-full sm:block" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
                {weeks.flatMap((week, w) =>
                  week.map((day, c) => {
                    if (day === null) {
                      return <div key={`${w}-${c}`} className="min-h-[64px] bg-gray-50 dark:bg-gray-900/60 sm:min-h-[128px]" />
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
                        aria-pressed={isSelected}
                        aria-label={`${formatDate(dayKey)}: ${dayEvents.length} events`}
                        onClick={() => selectDay(dayKey)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectDay(dayKey) }
                        }}
                        className={cn(
                          "group flex min-h-[76px] cursor-pointer flex-col bg-white p-1 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600 dark:bg-gray-900 sm:min-h-[132px] sm:p-2",
                          weekend && "bg-slate-50 dark:bg-gray-900/70",
                          isSelected && "bg-blue-50/60 dark:bg-blue-950/30",
                          isSelected && "ring-2 ring-inset ring-blue-600"
                        )}
                      >
                        <span className="flex items-center justify-between gap-1">
                          <span
                            className={cn(
                              "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-extrabold sm:h-7 sm:min-w-7 sm:text-sm",
                              isToday
                                ? "bg-teal-600 text-white shadow-sm"
                                : "text-gray-900 dark:text-gray-100"
                            )}
                          >
                            {day}
                          </span>
                          {dayEvents.length > 0 && (
                            <span className="flex items-center gap-1">
                              <span className="hidden rounded-full bg-gray-900 px-1.5 text-[10px] font-bold text-white lg:inline dark:bg-white dark:text-gray-900">
                                {dayEvents.length}
                              </span>
                              <button
                                type="button"
                                title={`Open full view for ${formatDate(dayKey)}`}
                                aria-label={`Open full view for ${formatDate(dayKey)}`}
                                onClick={(e) => { e.stopPropagation(); setDialogDay(dayKey) }}
                                className="rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 focus-visible:opacity-100 group-hover:opacity-100 dark:hover:bg-gray-700 dark:hover:text-gray-200 sm:opacity-0"
                              >
                                <Maximize2 className="h-3 w-3" />
                              </button>
                            </span>
                          )}
                        </span>

                        {dayEvents.length === 0 ? (
                          <span className="mt-2 hidden text-[10px] font-medium text-gray-300 sm:block dark:text-gray-700">-</span>
                        ) : (
                          <>
                            {/* Mobile: bold color bars + count (space-efficient, tappable) */}
                            <span className="mt-1.5 flex flex-col gap-1 sm:hidden">
                              {dayEvents.slice(0, 2).map((e, idx) => (
                                <span key={`${e.date}-${idx}`} title={`${humanizeKey(e.label)}: ${e.title}`} className={cn("h-1.5 w-full rounded-full", CALENDAR_TYPE_STYLES[e.type].dot)} />
                              ))}
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setDialogDay(dayKey) }}
                                className="mt-0.5 rounded bg-teal-700 px-1 py-0.5 text-[10px] font-extrabold text-white active:scale-95 dark:bg-teal-600"
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
                                    "flex items-center truncate rounded-md border border-l-4 px-1.5 py-1 text-[11px] font-bold leading-tight",
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
                                  className="flex items-center justify-center gap-1 rounded-md bg-teal-700 px-1.5 py-1 text-[11px] font-extrabold text-white shadow-sm transition-transform hover:bg-teal-800 active:scale-95 dark:bg-teal-600 dark:hover:bg-teal-500"
                                >
                                  <Plus className="h-3 w-3" /> {hidden} more
                                </button>
                              )}
                              {isExpanded && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); toggleExpand(dayKey) }}
                                  aria-expanded={true}
                                  className="flex items-center justify-center gap-1 rounded-md border border-gray-300 bg-white px-1.5 py-1 text-[11px] font-extrabold text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
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
                                className="mt-1 rounded text-[10px] font-extrabold text-blue-700 sm:hidden dark:text-blue-300"
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
          <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border-2 border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
            <span className="flex items-center gap-2"><AlertCircle className="h-4 w-4 shrink-0" /> {error}</span>
            <Button size="sm" variant="outline" onClick={() => fetchEvents(month, type)} className="ml-auto font-bold">
              Retry
            </Button>
          </div>
        )}

        {!loading && !error && groupedDays.length === 0 && (
          <Card className="border-2 border-dashed">
            <CardContent className="py-12 text-center">
              <CalendarDays className="mx-auto mb-3 h-8 w-8 text-gray-300" />
              <p className="text-sm font-bold text-gray-700 dark:text-gray-200">No events for this view</p>
              <p className="mt-1 text-sm text-gray-500">Try another month or clear search and filters.</p>
              <Button size="sm" variant="outline" className="mt-4 font-bold" onClick={() => { setQuery(""); setType("") }}>
                Clear filters
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ---- Agenda: full same-day visibility ---- */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-extrabold tracking-tight text-gray-900 dark:text-white">
            Schedule - {monthLabel(month)}
          </h2>
          {selectedDay && (
            <button
              type="button"
              onClick={() => setSelectedDay(null)}
              className="text-xs font-bold text-blue-700 hover:underline dark:text-blue-300"
            >
              Clear selection
            </button>
          )}
        </div>
        <div className="space-y-6">
          {groupedDays.map(([dayKey, dayEvents]) => {
            const left = daysUntil(dayEvents[0].date)
            const urgent = left >= 0 && left <= 7
            const past = left < 0
            return (
              <div key={dayKey} id={`day-${dayKey}`} className={cn("scroll-mt-24 rounded-2xl", selectedDay === dayKey && "ring-2 ring-blue-600 ring-offset-2 dark:ring-offset-gray-950")}>
                <h3 className="mb-3 flex flex-wrap items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-gray-800 dark:text-gray-200">
                  <span className={cn(
                    "flex h-10 w-10 flex-col items-center justify-center rounded-xl leading-none",
                    dayKey === todayKey
                      ? "bg-teal-600 text-white shadow-sm"
                      : "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200"
                  )}>
                    <span className="text-base font-extrabold">{dayNumber(dayKey)}</span>
                  </span>
                  <span>
                    {formatDate(dayKey)}
                    <span className="ml-2 font-semibold normal-case text-gray-400">{weekdayName(dayKey)}</span>
                  </span>
                  <Badge className="border-gray-200 bg-gray-100 font-bold text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                    {dayEvents.length} event{dayEvents.length === 1 ? "" : "s"}
                  </Badge>
                  {urgent && (
                    <Badge className="border-amber-300 bg-amber-100 font-extrabold text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
                      {left === 0 ? "Today" : left === 1 ? "Tomorrow" : `In ${left} days`}
                    </Badge>
                  )}
                  {past && (
                    <Badge className="border-gray-200 bg-gray-50 font-bold text-gray-400 dark:border-gray-700 dark:bg-gray-900">
                      Passed
                    </Badge>
                  )}
                </h3>
                <div className="space-y-2">
                  {dayEvents.map((e, idx) => (
                    <Link
                      key={`${e.date}-${idx}`}
                      href={e.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl border-2 bg-white p-3.5 transition-all hover:shadow-md dark:bg-gray-900",
                        past
                          ? "border-gray-100 opacity-70 dark:border-gray-800"
                          : "border-gray-200 hover:border-blue-400 dark:border-gray-700 dark:hover:border-blue-600"
                      )}
                    >
                      <span className={cn("h-9 w-1.5 shrink-0 rounded-full", CALENDAR_TYPE_STYLES[e.type].dot)} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-gray-900 group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-300">
                          {e.title}
                        </p>
                        <p className="truncate text-xs font-medium text-gray-500 dark:text-gray-400">{e.department}</p>
                      </div>
                      <Badge className={cn("shrink-0 border font-bold", CALENDAR_TYPE_STYLES[e.type].badge)}>{humanizeKey(e.label)}</Badge>
                      <ArrowRight className="h-4 w-4 shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600" />
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
        <DialogContent className="max-h-[85vh] overflow-y-auto dark:border-gray-700 dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="font-extrabold">
              {dialogDay ? formatDate(dialogDay) : ""}
              <span className="ml-2 text-sm font-semibold text-gray-400">{dialogDay ? weekdayName(dialogDay) : ""}</span>
            </DialogTitle>
            <DialogDescription className="font-medium">
              {dialogEvents.length} event{dialogEvents.length === 1 ? "" : "s"} scheduled - tap any item to open details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {dialogEvents.map((e, idx) => (
              <Link
                key={`${e.date}-${idx}`}
                href={e.href}
                className="flex items-center gap-3 rounded-xl border-2 border-gray-200 bg-white p-3 transition-colors hover:border-blue-400 hover:bg-blue-50/50 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-blue-600"
              >
                <span className={cn("h-9 w-1.5 shrink-0 rounded-full", CALENDAR_TYPE_STYLES[e.type].dot)} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-gray-900 dark:text-white">{e.title}</span>
                  <span className="block truncate text-xs font-medium text-gray-500">{e.department}</span>
                </span>
                <Badge className={cn("shrink-0 border font-bold", CALENDAR_TYPE_STYLES[e.type].badge)}>{humanizeKey(e.label)}</Badge>
              </Link>
            ))}
            {dialogEvents.length === 0 && (
              <p className="py-6 text-center text-sm font-medium text-gray-500">No events on this day.</p>
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
