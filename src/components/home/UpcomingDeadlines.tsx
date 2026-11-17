"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { handFont } from "@/components/home/fonts"
import { daysLeft } from "@/components/home/HomeJobRow"

interface CalendarEvent {
  date: string
  type: "last_date" | "exam" | "admit_card" | "result" | "admission_begin" | "admission_last"
  label: string
  title: string
  department: string
  href: string
}

const MONTH = new Intl.DateTimeFormat("en-IN", { month: "short" })
const MONTH_LONG = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" })
const WEEKDAY = new Intl.DateTimeFormat("en-IN", { weekday: "long" })

/*
 * Upcoming deadlines as the tear-off date calendar every Indian home has
 * hanging on a nail: a red header, a big date for the nearest deadline, a
 * torn stub of yesterday's page, and the next dates pencilled in below.
 */
const TORN = "polygon(0 0, 100% 0, 100% calc(100% - 6px), 96% 100%, 91% calc(100% - 5px), 85% 100%, 79% calc(100% - 4px), 72% 100%, 66% calc(100% - 6px), 59% 100%, 53% calc(100% - 4px), 46% 100%, 40% calc(100% - 6px), 33% 100%, 27% calc(100% - 4px), 20% 100%, 14% calc(100% - 5px), 7% 100%, 0 calc(100% - 4px))"

/** Vertical deadline timeline for the home sidebar. */
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

  const [first, ...rest] = events
  const firstDate = first ? new Date(first.date) : null
  const firstLeft = first ? (daysLeft(first.date) ?? 0) : 0

  return (
    <div className={cn("group relative pt-6", className)} data-tour="deadlines-teaser">
      {/* nail and string */}
      <svg className="pointer-events-none absolute left-1/2 top-0 h-10 w-40 -translate-x-1/2" viewBox="0 0 160 40" aria-hidden>
        <path d="M30 40 L80 6 L130 40" fill="none" stroke="oklch(45% 0.03 60)" strokeWidth="1.2" />
        <circle cx="80" cy="6" r="4.5" fill="oklch(55% 0.02 70)" />
        <circle cx="79" cy="5" r="1.6" fill="oklch(85% 0.01 80)" />
      </svg>

      <div className="relative origin-top transition-transform duration-700 group-hover:rotate-[1deg]">
        <div
          className="relative overflow-hidden rounded-[4px] bg-[var(--hs-paper-slip)]"
          style={{ boxShadow: "0 1px 2px rgb(60 40 10 / .1), 0 22px 40px -26px rgb(60 40 10 / .55)" }}
        >
          {/* red header with binding rings */}
          <div className="relative bg-[var(--color-brick)] px-5 pb-2.5 pt-4 text-center text-[var(--color-brick-ink)]">
            <span className="absolute left-8 top-1.5 h-3 w-3 rounded-full bg-[var(--color-paper)] shadow-[inset_0_1px_2px_rgb(0_0_0/.4)]" aria-hidden />
            <span className="absolute right-8 top-1.5 h-3 w-3 rounded-full bg-[var(--color-paper)] shadow-[inset_0_1px_2px_rgb(0_0_0/.4)]" aria-hidden />
            <h3 className="text-[15px] font-bold">Upcoming deadlines</h3>
            <p className="text-[11px] opacity-80">{firstDate ? MONTH_LONG.format(firstDate) : "Last dates, exams and results"}</p>
          </div>
          {/* stubs of pages already torn off */}
          <div className="h-2 bg-[var(--hs-paper-slip)]" style={{ clipPath: TORN, filter: "brightness(.94)" }} aria-hidden />

          {loading ? (
            <div className="space-y-3 p-5">
              <span className="hs-skel mx-auto block h-20 w-24" />
              <span className="hs-skel block h-3 w-4/5" />
              <span className="hs-skel block h-3 w-1/2" />
            </div>
          ) : !first || !firstDate ? (
            <p className={cn(handFont.className, "px-5 py-10 text-center text-[1.05rem] text-foreground/60")}>
              Nothing due in the next few weeks. Enjoy the quiet, and keep revising.
            </p>
          ) : (
            <>
              {/* today's page: the nearest deadline */}
              <Link href={first.href} className="block px-5 pb-5 pt-3 text-center">
                <span className="block text-[11px] font-semibold text-[var(--hs-trust)]">{first.label}</span>
                <span
                  className={cn(
                    "block font-display text-[4.2rem] font-bold leading-none",
                    firstLeft <= 3 ? "text-[var(--color-brick)]" : "text-foreground"
                  )}
                >
                  {firstDate.getDate()}
                </span>
                <span className="block text-[12px] text-muted-foreground">{WEEKDAY.format(firstDate)}</span>
                <span className="mt-3 line-clamp-2 block text-[14px] font-semibold leading-snug text-foreground hover:text-[var(--hs-trust)]">
                  {first.title}
                </span>
                <span className="block truncate text-[11px] text-muted-foreground">{first.department}</span>
                <span className={cn(handFont.className, "mt-2 inline-block -rotate-[2deg] text-[1.1rem] text-[var(--color-brick)]")}>
                  {firstLeft <= 0 ? "it's today!" : firstLeft === 1 ? "tomorrow, don't miss it" : `${firstLeft} days to go`}
                </span>
              </Link>

              {/* next pages, pencilled in */}
              {rest.length > 0 && (
                <ol className="border-t-2 border-dashed border-[var(--hs-border-strong)] px-4 py-3">
                  <li className={cn(handFont.className, "px-1 pb-1 text-[0.95rem] text-foreground/55")} aria-hidden>
                    coming up next…
                  </li>
                  {rest.map((e, i) => {
                    const d = new Date(e.date)
                    const left = daysLeft(e.date) ?? 0
                    return (
                      <li key={`${e.date}-${i}`}>
                        <Link href={e.href} className="hs-row group/row flex items-center gap-3 px-1 py-1.5">
                          <span className={cn(handFont.className, "relative flex h-10 w-10 shrink-0 flex-col items-center justify-center leading-none text-foreground")}>
                            {/* date circled in pencil */}
                            <svg viewBox="0 0 40 40" className="absolute inset-0 h-full w-full" aria-hidden>
                              <path
                                d={i % 2 ? "M21 3 C 32 3, 38 11, 37 21 C 36 32, 27 37, 19 37 C 9 36, 3 29, 3 19 C 4 9, 12 3, 24 5" : "M19 3 C 8 4, 3 11, 3 21 C 4 31, 12 37, 21 37 C 31 36, 37 28, 37 19 C 36 10, 28 3, 16 5"}
                                fill="none"
                                stroke={left <= 3 ? "var(--color-brick)" : "color-mix(in oklch, var(--color-ink) 45%, transparent)"}
                                strokeWidth="1.5"
                                strokeLinecap="round"
                              />
                            </svg>
                            <span className="text-[1.05rem]">{d.getDate()}</span>
                            <span className="text-[0.62rem]">{MONTH.format(d)}</span>
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[10px] font-semibold text-[var(--hs-trust)]">
                              {e.label} · {left <= 0 ? "today" : `in ${left}d`}
                            </span>
                            <span className="line-clamp-1 text-[13px] font-semibold text-foreground group-hover/row:text-[var(--hs-trust)]">{e.title}</span>
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                </ol>
              )}
            </>
          )}

          <Link
            href="/exam-calendar"
            className={cn(handFont.className, "block border-t border-[var(--hs-border)] px-5 py-3 text-center text-[1.05rem] text-[var(--hs-trust)] hover:underline")}
          >
            open the whole calendar →
          </Link>
        </div>
      </div>
    </div>
  )
}
