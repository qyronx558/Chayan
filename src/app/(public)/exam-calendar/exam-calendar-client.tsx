"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { CalendarDays, ChevronLeft, ChevronRight, AlertCircle, Loader2 } from "lucide-react"
import { SectionHero } from "@/components/layout/SectionHero"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { monthLabel, toMonthKey } from "@/lib/dates"
import { cn } from "@/lib/utils"

interface CalendarEvent {
  date: string
  type: "last_date" | "exam" | "admit_card" | "result" | "admission_begin" | "admission_last"
  label: string
  title: string
  department: string
  href: string
}

const FILTERS = [
  { label: "All", value: "" },
  { label: "Last Date", value: "last_date" },
  { label: "Exam Date", value: "exam" },
  { label: "Admit Card", value: "admit_card" },
  { label: "Result", value: "result" },
  { label: "Admission", value: "admission" },
] as const

const TYPE_STYLES: Record<CalendarEvent["type"], { dot: string; badge: string }> = {
  last_date: { dot: "bg-red-500", badge: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" },
  exam: { dot: "bg-blue-500", badge: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  admit_card: { dot: "bg-amber-500", badge: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  result: { dot: "bg-green-500", badge: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" },
  admission_begin: { dot: "bg-purple-500", badge: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300" },
  admission_last: { dot: "bg-purple-500", badge: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300" },
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map((v) => parseInt(v, 10))
  const d = new Date(Date.UTC(y, m - 1 + delta, 1))
  return toMonthKey(d)
}

export function ExamCalendarClient() {
  const [month, setMonth] = useState(() => toMonthKey(new Date()))
  const [type, setType] = useState("")
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

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

  const { cells, eventsByDay } = useMemo(() => {
    const [y, m] = month.split("-").map((v) => parseInt(v, 10))
    const first = new Date(y, m - 1, 1)
    const daysInMonth = new Date(y, m, 0).getDate()
    const offset = first.getDay()
    const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7

    const byDay = new Map<number, CalendarEvent[]>()
    for (const e of events) {
      const day = new Date(e.date).getDate()
      const list = byDay.get(day) || []
      list.push(e)
      byDay.set(day, list)
    }
    return { cells: Array.from({ length: totalCells }), eventsByDay: byDay }
  }, [month, events])

  const today = new Date()
  const todayKey = toMonthKey(today)
  const isCurrentMonth = month === todayKey

  const groupedDays = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const e of events) {
      const d = new Date(e.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      const list = map.get(key) || []
      list.push(e)
      map.set(key, list)
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [events])

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <SectionHero
          icon={CalendarDays}
          badge="Exam Calendar"
          title="Exam Calendar"
          subtitle="Application deadlines, exam dates, admit card releases and results - all in one monthly view."
          count={events.length}
        />

        <div className="mb-6 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Previous month">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[150px] text-center text-lg font-bold text-gray-900 dark:text-white">{monthLabel(month)}</span>
              <Button variant="outline" size="sm" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Next month">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-600 dark:text-blue-400"
                disabled={isCurrentMonth}
                onClick={() => { setMonth(todayKey); setType("") }}
              >
                Today
              </Button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setType(f.value)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    type === f.value
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
            {Object.entries(TYPE_STYLES).filter(([k]) => k !== "admission_begin").map(([k, s]) => (
              <span key={k} className="flex items-center gap-1.5">
                <span className={cn("h-2 w-2 rounded-full", s.dot)} />
                {k === "admission_last" ? "Admission" : k.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ")}
              </span>
            ))}
          </div>
        </div>

        <Card className="mb-8 overflow-hidden">
          <CardContent className="p-0">
            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50 text-center text-xs font-semibold text-gray-500 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-400">
              {WEEKDAYS.map((d) => (
                <div key={d} className="py-2">{d}</div>
              ))}
            </div>

            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="grid grid-cols-7">
                {cells.map((_, i) => {
                  const day = i - offsetFor(month) + 1
                  const inMonth = day >= 1 && day <= new Date(parseInt(month.split("-")[0], 10), parseInt(month.split("-")[1], 10), 0).getDate()
                  const dayEvents = inMonth ? (eventsByDay.get(day) || []) : []
                  const isToday = inMonth && month === todayKey && day === today.getDate()
                  return (
                    <div
                      key={i}
                      className={cn(
                        "min-h-16 border-b border-r border-gray-100 p-1.5 last:border-r-0 dark:border-gray-800",
                        !inMonth && "bg-gray-50/60 dark:bg-gray-900/40"
                      )}
                    >
                      {inMonth && (
                        <>
                          <span className={cn(
                            "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                            isToday ? "bg-blue-600 text-white" : "text-gray-700 dark:text-gray-300"
                          )}>
                            {day}
                          </span>
                          <div className="mt-1 flex flex-col gap-1">
                            {dayEvents.slice(0, 3).map((e, idx) => (
                              <Link
                                key={`${e.date}-${idx}`}
                                href={e.href}
                                title={`${e.title} (${e.label})`}
                                className="flex items-center gap-1 truncate rounded px-1 py-0.5 text-[10px] text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                              >
                                <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", TYPE_STYLES[e.type].dot)} />
                                <span className="truncate">{e.title}</span>
                              </Link>
                            ))}
                            {dayEvents.length > 3 && (
                              <span className="px-1 text-[10px] font-medium text-gray-400">
                                +{dayEvents.length - 3} more
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {!loading && !error && groupedDays.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-sm text-gray-500">
              No events for this month. Try another month or clear the filter.
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {groupedDays.map(([dayKey, dayEvents]) => (
            <div key={dayKey}>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  {formatDate(dayKey).slice(0, 2)}
                </span>
                {formatDate(dayKey)}
              </h2>
              <div className="space-y-2">
                {dayEvents.map((e, idx) => (
                  <Link
                    key={`${e.date}-${idx}`}
                    href={e.href}
                    className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3.5 transition-colors hover:border-blue-300 hover:bg-blue-50/50 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-blue-700 dark:hover:bg-gray-800"
                  >
                    <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", TYPE_STYLES[e.type].dot)} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900 group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-300">
                        {e.title}
                      </p>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">{e.department}</p>
                    </div>
                    <Badge className={cn("shrink-0", TYPE_STYLES[e.type].badge)}>{e.label}</Badge>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

function offsetFor(month: string): number {
  const [y, m] = month.split("-").map((v) => parseInt(v, 10))
  return new Date(y, m - 1, 1).getDay()
}