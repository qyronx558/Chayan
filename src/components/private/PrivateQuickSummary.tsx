"use client"

import { useEffect, useState } from "react"
import {
  Timer,
  Users,
  CalendarClock,
  IndianRupee,
  Briefcase,
  GraduationCap,
  Share2,
  BadgeCheck,
  Check,
} from "lucide-react"
import { formatDate } from "@/lib/utils"
import { formatSalaryRange } from "@/lib/private-jobs-trust"

interface Props {
  title: string
  company: string
  vacancies: number | null
  lastDate: string | null
  salaryMin: number | null
  salaryMax: number | null
  salaryText: string | null
  experience: string | null
  qualification: string | null
  skills: string[]
}

/**
 * Private equivalent of gov JobQuickSummary.
 * Same position in the detail layout (right after nav pills, before tables),
 * same calm visual language — only the rows are private-specific.
 */
export function PrivateQuickSummary(p: Props) {
  const [pageUrl, setPageUrl] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") setPageUrl(window.location.href)
  }, [])

  const lastDateObj = p.lastDate ? new Date(p.lastDate) : null
  const validDate = lastDateObj && !isNaN(lastDateObj.getTime()) ? lastDateObj : null
  const daysLeft = validDate ? Math.ceil((validDate.getTime() - Date.now()) / 86400000) : null
  const formattedLastDate = validDate ? formatDate(validDate) : ""
  const salary = formatSalaryRange(p.salaryMin, p.salaryMax, p.salaryText)

  const waText = encodeURIComponent(
    `Hiring: ${p.title} at ${p.company}${p.vacancies ? `\n${p.vacancies} opening(s)` : ""}${formattedLastDate ? `\nApply by: ${formattedLastDate}` : ""}\nDetails:\n${pageUrl}`,
  )
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(`${p.title} at ${p.company}`)}`

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable
    }
  }

  const rows = [
    ...(p.vacancies
      ? [{ icon: Users, label: "Openings", value: `${p.vacancies} opening${p.vacancies === 1 ? "" : "s"}` }]
      : []),
    ...(formattedLastDate
      ? [
          {
            icon: CalendarClock,
            label: "Last date to apply",
            value: formattedLastDate,
            extra:
              daysLeft !== null && daysLeft >= 0 && daysLeft <= 7 ? (
                <span className="ml-2 inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:ring-rose-900">
                  Only {daysLeft}d left
                </span>
              ) : daysLeft !== null && daysLeft > 7 ? (
                <span className="ml-2 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-900">
                  {daysLeft}d left
                </span>
              ) : null,
          },
        ]
      : []),
    ...(salary ? [{ icon: IndianRupee, label: "Salary", value: salary }] : []),
    ...(p.experience ? [{ icon: Briefcase, label: "Experience", value: p.experience }] : []),
    ...(p.qualification
      ? [{ icon: GraduationCap, label: "Qualification", value: p.qualification }]
      : []),
    ...(p.skills.length > 0
      ? [{ icon: BadgeCheck, label: "Key skills", value: p.skills.slice(0, 6).join(" · ") }]
      : []),
  ]

  if (rows.length === 0) return null

  return (
    <section
      aria-label="Quick summary"
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <Timer className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold leading-tight text-slate-900 dark:text-slate-100">
            2-minute summary
          </h2>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            Key points for {p.company}
          </p>
        </div>
        <span className="ml-auto hidden shrink-0 items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-500 ring-1 ring-inset ring-slate-200 sm:inline-flex dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700">
          <BadgeCheck className="h-3 w-3" /> Private role
        </span>
      </div>

      <ul className="divide-y divide-slate-100 px-5 dark:divide-slate-800">
        {rows.map((row) => (
          <li key={row.label} className="flex items-start gap-3 py-3">
            <row.icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                {row.label}
              </p>
              <p className="mt-0.5 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                {row.value}
                {"extra" in row ? row.extra : null}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-5 py-3 dark:border-slate-800">
        <span className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
          <Share2 className="h-3.5 w-3.5" /> Share
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <a
            href={`https://wa.me/?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Share on WhatsApp"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-[#1faa55]/40 hover:bg-[#1faa55]/5 hover:text-[#147a3e] dark:border-slate-700 dark:text-slate-300"
          >
            WhatsApp
          </a>
          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Share on Telegram"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-[#229ED9]/40 hover:bg-[#229ED9]/5 hover:text-[#0e6ea8] dark:border-slate-700 dark:text-slate-300"
          >
            Telegram
          </a>
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : null}
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
      </div>
    </section>
  )
}
