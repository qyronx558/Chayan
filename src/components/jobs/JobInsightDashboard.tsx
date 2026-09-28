"use client"

import { useEffect, useState } from "react"
import { AlarmClock, Users, Wallet, GraduationCap } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { formatDate, cn } from "@/lib/utils"
import { stripHtmlToText } from "@/lib/blog-prose"
import {
  parseFeeBars,
  parseSalaryRange,
  vacancyScale,
  windowProgress,
  formatRupees,
  feeKpi,
} from "@/lib/job-insights"

interface Props {
  totalVacancies: number | null
  salary: string | null
  applicationFee: string | null
  ageLimit: string | null
  education: string | null
  startDate: string | null
  lastDate: string | null
}

function cleanShort(value: string | null | undefined, max = 90): string {
  if (!value) return ""
  const t = stripHtmlToText(value).replace(/\s+/g, " ").trim()
  if (t.length <= max) return t
  return `${t.slice(0, max).trim()}…`
}

export function JobInsightDashboard(p: Props) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(t)
  }, [])
  const lastMs = p.lastDate ? new Date(p.lastDate).getTime() : null
  const validLast = lastMs && isFinite(lastMs) ? lastMs : null
  const diff = validLast ? validLast - now : null
  const daysLeft = diff !== null ? Math.floor(diff / 86400000) : null
  const isUrgent = diff !== null && diff > 0 && diff <= 7 * 86400000
  const isClosed = diff !== null && diff <= 0

  const progress = windowProgress(p.startDate, p.lastDate, now)
  const scale = vacancyScale(p.totalVacancies)
  const fees = parseFeeBars(p.applicationFee)
  const salaryRange = parseSalaryRange(p.salary)
  const feeShort = feeKpi(p.applicationFee)
  const eduShort = cleanShort(p.education, 92)
  const ageShort = cleanShort(p.ageLimit, 56)

  const maxFee = fees.length > 0 ? Math.max(...fees.map((f) => f.amount)) : 0
  const chartData = fees.map((f) => ({ ...f, fill: f.amount === 0 ? "#16a34a" : f.amount === maxFee ? "#ea580c" : "#38bdf8" }))

  return (
    <section aria-label="Job insights at a glance" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {/* ── 1. Time window ── */}
      <div
        className={cn(
          "rounded-2xl border p-4 shadow-sm",
          isClosed
            ? "border-red-200 bg-red-50/60 dark:border-red-900 dark:bg-red-950/30"
            : isUrgent
              ? "border-red-200 bg-gradient-to-br from-red-50 to-orange-50 dark:border-red-900 dark:from-red-950/50 dark:to-orange-950/30"
              : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800",
        )}
      >
        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          <AlarmClock className="h-3.5 w-3.5" /> Application window
        </div>
        {validLast ? (
          <>
            <div className={cn("text-2xl font-extrabold tabular-nums", isClosed || isUrgent ? "text-red-700 dark:text-red-300" : "text-gray-900 dark:text-white")}>
              {isClosed ? "Closed" : daysLeft !== null && daysLeft >= 0 ? `${daysLeft}d left` : "Open"}
            </div>
            <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-300">
              Last date: <span className="font-semibold">{formatDate(p.lastDate!)}</span>
              {p.startDate ? <> · Opened {formatDate(p.startDate)}</> : null}
            </p>
            {progress !== null && !isClosed ? (
              <div className="mt-3">
                <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Application window elapsed">
                  <div
                    className={cn("h-full rounded-full transition-all", progress > 85 ? "bg-red-500" : progress > 60 ? "bg-orange-500" : "bg-gradient-to-r from-[#FF9933] to-[#138808]")}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">{progress}% of window elapsed - source: official dates</p>
              </div>
            ) : (
              <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">Dates as per official notification.</p>
            )}
          </>
        ) : (
          <>
            <div className="text-lg font-bold text-gray-900 dark:text-white">Dates TBA</div>
            <p className="mt-0.5 text-xs text-gray-500">Check official notification for schedule.</p>
          </>
        )}
      </div>

      {/* ── 2. Vacancy scale ── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          <Users className="h-3.5 w-3.5" /> Vacancy scale
        </div>
        {p.totalVacancies ? (
          <>
            <div className="text-2xl font-extrabold tabular-nums text-gray-900 dark:text-white">
              {p.totalVacancies.toLocaleString("en-IN")}
              <span className="ml-1.5 align-middle text-[11px] font-bold uppercase tracking-wide text-orange-700 dark:text-orange-300">{scale?.label}</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700" role="img" aria-label={`Vacancy scale: ${scale?.label}, ${p.totalVacancies} posts`}>
              <div className="h-full rounded-full bg-gradient-to-r from-sky-500 via-orange-400 to-green-600" style={{ width: `${scale?.percent ?? 40}%` }} />
            </div>
            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">{scale?.hint} · {p.totalVacancies.toLocaleString("en-IN")} posts</p>
          </>
        ) : (
          <>
            <div className="text-lg font-bold text-gray-900 dark:text-white">As per notification</div>
            <p className="mt-0.5 text-xs text-gray-500">Vacancy count not published separately.</p>
          </>
        )}
        {salaryRange ? (
          <p className="mt-2 border-t border-dashed border-gray-200 pt-2 text-xs text-gray-600 dark:border-gray-700 dark:text-gray-300">
            Pay band <span className="font-bold tabular-nums">₹{salaryRange.min.toLocaleString("en-IN")} – ₹{salaryRange.max.toLocaleString("en-IN")}</span>
          </p>
        ) : p.salary ? (
          <p className="mt-2 truncate border-t border-dashed border-gray-200 pt-2 text-xs text-gray-600 dark:border-gray-700 dark:text-gray-300" title={stripHtmlToText(p.salary)}>
            <span className="font-semibold">{cleanShort(p.salary, 64)}</span>
          </p>
        ) : null}
      </div>

      {/* ── 3. Fee comparison chart ── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          <Wallet className="h-3.5 w-3.5" /> Fee comparison
        </div>
        {fees.length >= 2 ? (
          <>
            <div className="h-[118px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 4 }} barCategoryGap="28%">
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={0} />
                  <YAxis hide domain={[0, maxFee]} />
                  <Tooltip
                    formatter={(v) => [formatRupees(Number(v)), "Fee"]}
                    contentStyle={{ fontSize: 12, borderRadius: 10 }}
                  />
                  <Bar dataKey="amount" radius={[6, 6, 2, 2]}>
                    {chartData.map((d) => (
                      <Cell key={d.label} fill={d.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
              {feeShort} · <span className="font-medium">as listed in notification</span>
            </p>
          </>
        ) : feeShort ? (
          <>
            <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{feeShort}</div>
            <p className="mt-0.5 text-xs text-gray-500">Application fee as per official notification.</p>
          </>
        ) : (
          <>
            <div className="text-lg font-bold text-gray-900 dark:text-white">See notification</div>
            <p className="mt-0.5 text-xs text-gray-500">Fee details not listed separately.</p>
          </>
        )}
      </div>

      {/* ── 4. Eligibility snapshot ── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          <GraduationCap className="h-3.5 w-3.5" /> Who can apply
        </div>
        {eduShort ? (
          <p className="text-sm font-bold leading-snug text-gray-900 dark:text-white">{eduShort}</p>
        ) : (
          <p className="text-sm font-bold text-gray-900 dark:text-white">Check notification</p>
        )}
        {ageShort ? (
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
            Age: <span className="font-semibold">{ageShort}</span>
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <a href="/tools/eligibility-checker" className="rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-bold text-orange-800 transition hover:bg-orange-200 dark:bg-orange-950 dark:text-orange-200">
            Am I eligible? →
          </a>
          <a href="/tools/age-calculator" className="rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-bold text-green-800 transition hover:bg-green-200 dark:bg-green-950 dark:text-green-200">
            Check age →
          </a>
        </div>
        <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">Snapshot only - full criteria below.</p>
      </div>
    </section>
  )
}
