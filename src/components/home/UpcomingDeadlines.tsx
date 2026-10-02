"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { CalendarDays, ArrowRight, AlarmClock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { SectionHeader } from "@/components/ui/section-header"
import { formatDate } from "@/lib/utils"

interface CalendarEvent {
  date: string
  type: "last_date" | "exam" | "admit_card" | "result" | "admission_begin" | "admission_last"
  label: string
  title: string
  department: string
  href: string
}

const TYPE_STYLES: Record<CalendarEvent["type"], { dot: string; badge: string }> = {
  last_date: { dot: "bg-red-500", badge: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" },
  exam: { dot: "bg-blue-500", badge: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  admit_card: { dot: "bg-amber-500", badge: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  result: { dot: "bg-green-500", badge: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" },
  admission_begin: { dot: "bg-purple-500", badge: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300" },
  admission_last: { dot: "bg-purple-500", badge: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300" },
}

export function UpcomingDeadlines({ className }: { className?: string }) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/exam-calendar?upcoming=1&limit=6")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setEvents(data.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className={cn("py-16", className)} data-tour="deadlines-teaser">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          icon={CalendarDays}
          iconClassName="from-[#1e3a5f] via-blue-800 to-blue-700"
          title="Upcoming Deadlines"
          subtitle="Application deadlines, exam dates and results coming up next"
          viewAllHref="/exam-calendar"
        />

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
        ) : events.length === 0 ? null : (
          <div className="grid gap-3 sm:grid-cols-2">
            {events.map((e, i) => (
              <Link
                key={`${e.date}-${i}`}
                href={e.href}
                className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3.5 transition-colors hover:border-blue-300 hover:bg-blue-50/50 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-blue-700 dark:hover:bg-gray-800"
              >
                <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-gray-50 text-center dark:bg-gray-800">
                  <span className="text-sm font-bold leading-none text-gray-900 dark:text-white">
                    {formatDate(e.date).split(" ")[0]}
                  </span>
                  <span className="text-[9px] font-medium uppercase leading-tight text-gray-500">
                    {formatDate(e.date).split(" ")[1]}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900 group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-300">
                    {e.title}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-500 dark:text-gray-400">
                    <AlarmClock className="h-3 w-3 shrink-0" />
                    {e.department}
                  </p>
                </div>
                <Badge className={cn("shrink-0", TYPE_STYLES[e.type].badge)}>{e.label}</Badge>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/exam-calendar"
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            View Full Calendar
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}