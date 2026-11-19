import { NextRequest, NextResponse } from "next/server"
import { cacheControl } from "@/lib/cache"
import { prisma } from "@/lib/prisma"
import { parseFlexibleDate, monthRange, toMonthKey, humanizeKey } from "@/lib/dates"



export interface CalendarEvent {
  date: string
  type: "last_date" | "exam" | "admit_card" | "result" | "admission_begin" | "admission_last"
  label: string
  title: string
  department: string
  href: string
}

const TYPE_LABELS: Record<CalendarEvent["type"], string> = {
  last_date: "Last Date",
  exam: "Exam Date",
  admit_card: "Admit Card",
  result: "Result",
  admission_begin: "Admission Begin",
  admission_last: "Admission Last Date",
}

export const EXAM_CALENDAR_TYPES = TYPE_LABELS

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const requested = searchParams.get("month") || ""
    const month = /^\d{4}-\d{2}$/.test(requested) ? requested : toMonthKey(new Date())
    const typeFilter = searchParams.get("type") || ""
    // "Upcoming" means the next 60 days from now, not just what's left of this
    // calendar month (which is empty near month-end).
    const upcomingMode = searchParams.get("upcoming") === "1"
    const { start, end } = upcomingMode
      ? { start: new Date(), end: new Date(Date.now() + 60 * 86400000) }
      : monthRange(month)

    const inMonth = { gte: start, lt: end }

    const events: CalendarEvent[] = []

    // Public calendar: only approved content, matching every other public list —
    // pending/rejected items have no public detail page and would 404.
    const [jobs, admitCards, results, admissions] = await Promise.all([
      prisma.job.findMany({
        where: { status: "ACTIVE", lastDate: inMonth, moderation: "APPROVED" },
        select: { id: true, title: true, slug: true, lastDate: true, importantDates: true, department: { select: { name: true } } },
        take: 500,
      }),
      prisma.admitCard.findMany({
        where: { examDate: inMonth, moderation: "APPROVED" },
        select: { id: true, title: true, slug: true, examDate: true, department: { select: { name: true } } },
        take: 200,
      }),
      prisma.result.findMany({
        where: { resultDate: inMonth, moderation: "APPROVED" },
        select: { id: true, title: true, slug: true, resultDate: true, department: { select: { name: true } } },
        take: 200,
      }),
      prisma.admission.findMany({
        where: { OR: [{ startDate: inMonth }, { lastDate: inMonth }], moderation: "APPROVED" },
        select: { id: true, title: true, slug: true, startDate: true, lastDate: true, department: { select: { name: true } } },
        take: 400,
      }),
    ])

    for (const job of jobs) {
      if (job.lastDate) {
        events.push({
          date: job.lastDate.toISOString(),
          type: "last_date",
          label: "Last Date",
          title: job.title,
          department: job.department.name,
          href: `/apply/${job.slug}`,
        })
      }
      if (job.importantDates && typeof job.importantDates === "object") {
        for (const [key, raw] of Object.entries(job.importantDates as Record<string, string>)) {
          const parsed = parseFlexibleDate(raw)
          if (!parsed || parsed < start || parsed >= end) continue
          let type: CalendarEvent["type"] | null = null
          if (/exam date/i.test(key)) type = "exam"
          else if (/admit/i.test(key)) type = "admit_card"
          else if (/result date/i.test(key)) type = "result"
          if (!type) continue
          events.push({
            date: parsed.toISOString(),
            type,
            label: humanizeKey(key),
            title: job.title,
            department: job.department.name,
            href: `/apply/${job.slug}`,
          })
        }
      }
    }

    for (const ac of admitCards) {
      if (ac.examDate) {
        events.push({
          date: ac.examDate.toISOString(),
          type: "exam",
          label: "Exam Date",
          title: ac.title,
          department: ac.department.name,
          href: `/admit-card/${ac.slug}`,
        })
      }
    }

    for (const r of results) {
      if (r.resultDate) {
        events.push({
          date: r.resultDate.toISOString(),
          type: "result",
          label: "Result",
          title: r.title,
          department: r.department.name,
          href: `/result/${r.slug}`,
        })
      }
    }

    for (const ad of admissions) {
      if (ad.startDate) {
        events.push({
          date: ad.startDate.toISOString(),
          type: "admission_begin",
          label: "Admission Begin",
          title: ad.title,
          department: ad.department.name,
          href: `/admission/${ad.slug}`,
        })
      }
      if (ad.lastDate) {
        events.push({
          date: ad.lastDate.toISOString(),
          type: "admission_last",
          label: "Admission Last Date",
          title: ad.title,
          department: ad.department.name,
          href: `/admission/${ad.slug}`,
        })
      }
    }

    const filtered = typeFilter
      ? events.filter((e) => (typeFilter === "admission" ? e.type.startsWith("admission") : e.type === typeFilter))
      : events

    filtered.sort((a, b) => a.date.localeCompare(b.date))

    if (searchParams.get("upcoming") === "1") {
      const now = new Date()
      const upcoming = filtered.filter((e) => new Date(e.date) >= now)
      const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "6", 10)))
      return NextResponse.json(
        { success: true, month, type: typeFilter, data: upcoming.slice(0, limit) },
        { headers: { "Cache-Control": cacheControl("gov") } }
      )
    }

    return NextResponse.json(
      { success: true, month, type: typeFilter, data: filtered },
      { headers: { "Cache-Control": cacheControl("gov") } }
    )
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch exam calendar" },
      { status: 500 }
    )
  }
}