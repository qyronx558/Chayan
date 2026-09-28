"use client"

import { useEffect, useState } from "react"
import { CalendarClock, Wallet, BadgeCheck, FileDown } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { formatDate, cn } from "@/lib/utils"
import { parseFeeBars, formatRupees, feeKpi, windowProgress } from "@/lib/job-insights"

export type PrimaryDateMode = "countdown" | "since" | "date"

interface Props {
  primaryDate: string | null
  primaryDateLabel: string
  primaryDateMode: PrimaryDateMode
  windowStart?: string | null
  feeText?: string | null
  statusText?: string | null
  topicsCount?: number | null
  downloadUrl?: string | null
  publishedAt?: string | null
}

/**
 * Data-first snapshot strip for result / admit-card / answer-key /
 * syllabus / admission pages. Every card renders only from stored
 * fields - nothing is invented, sparse data simply hides cards.
 */
export function DocumentInsightStrip(p: Props) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(t)
  }, [])

  const dateMs = p.primaryDate ? new Date(p.primaryDate).getTime() : null
  const validDate = dateMs !== null && isFinite(dateMs) ? dateMs : null
  const diff = validDate !== null ? validDate - now : null
  const daysLeft = diff !== null ? Math.floor(diff / 86400000) : null
  const daysSince = diff !== null ? Math.floor(-diff / 86400000) : null
  const isUrgent = diff !== null && diff > 0 && diff <= 7 * 86400000
  const isPast = diff !== null && diff <= 0
  const progress = p.primaryDateMode === "countdown" ? windowProgress(p.windowStart ?? null, p.primaryDate, now) : null

  const fees = parseFeeBars(p.feeText)
  const feeShort = feeKpi(p.feeText)
  const maxFee = fees.length > 0 ? Math.max(...fees.map((f) => f.amount)) : 0
  const chartData = fees.map((f) => ({
    ...f,
    fill: f.amount === 0 ? "#16a34a" : f.amount === maxFee ? "#ea580c" : "#38bdf8",
  }))

  const cards: { key: string; node: React.ReactNode }[] = []

  if (validDate !== null) {
    const big =
      p.primaryDateMode === "countdown"
        ? isPast
          ? "Date passed"
          : daysLeft !== null && daysLeft >= 0
            ? `${daysLeft}d left`
            : "Open"
        : p.primaryDateMode === "since"
          ? diff !== null && diff > 0
            ? `In ${daysLeft}d`
            : daysSince === 0
              ? "Today"
              : daysSince === 1
                ? "Yesterday"
                : daysSince !== null && daysSince < 30
                  ? `${daysSince}d ago`
                  : formatDate(p.primaryDate!)
          : formatDate(p.primaryDate!);
    cards.push({
      key: "date",
      node: (
        <div
          className={cn(
            "rounded-2xl border p-4 shadow-sm",
            isUrgent
              ? "border-red-200 bg-gradient-to-br from-red-50 to-orange-50 dark:border-red-900 dark:from-red-950/50 dark:to-orange-950/30"
              : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800",
          )}
        >
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            <CalendarClock className="h-3.5 w-3.5" /> {p.primaryDateLabel}
          </div>
          <div className={cn("text-2xl font-extrabold tabular-nums", isUrgent ? "text-red-700 dark:text-red-300" : "text-gray-900 dark:text-white")}>
            {big}
          </div>
          <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-300">
            <span className="font-semibold">{formatDate(p.primaryDate!)}</span>
          </p>
          {progress !== null && !isPast ? (
            <div className="mt-3">
              <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Application window elapsed">
                <div className={cn("h-full rounded-full transition-all", progress > 85 ? "bg-red-500" : "bg-gradient-to-r from-[#FF9933] to-[#138808]")} style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">{progress}% of window elapsed</p>
            </div>
          ) : null}
        </div>
      ),
    })
  }

  if (feeShort) {
    cards.push({
      key: "fee",
      node: (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            <Wallet className="h-3.5 w-3.5" /> Application fee
          </div>
          {fees.length >= 2 ? (
            <>
              <div className="h-[118px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 4 }} barCategoryGap="28%">
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={0} />
                    <YAxis hide domain={[0, maxFee]} />
                    <Tooltip formatter={(v) => [formatRupees(Number(v)), "Fee"]} contentStyle={{ fontSize: 12, borderRadius: 10 }} />
                    <Bar dataKey="amount" radius={[6, 6, 2, 2]}>
                      {chartData.map((d) => (
                        <Cell key={d.label} fill={d.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">{feeShort} · as listed in notice</p>
            </>
          ) : (
            <>
              <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{feeShort}</div>
              <p className="mt-0.5 text-xs text-gray-500">Fee as per official notice.</p>
            </>
          )}
        </div>
      ),
    })
  }

  if (p.statusText) {
    cards.push({
      key: "status",
      node: (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            <BadgeCheck className="h-3.5 w-3.5" /> Status
          </div>
          <div className="text-2xl font-extrabold leading-tight text-gray-900 dark:text-white">{p.statusText}</div>
          {p.topicsCount ? (
            <p className="mt-0.5 text-xs text-gray-500">
              <span className="font-bold tabular-nums text-gray-800 dark:text-gray-100">{p.topicsCount}</span> topics listed
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-gray-500">As published by the department.</p>
          )}
        </div>
      ),
    })
  } else if (p.topicsCount) {
    cards.push({
      key: "topics",
      node: (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            <BadgeCheck className="h-3.5 w-3.5" /> Coverage
          </div>
          <div className="text-2xl font-extrabold tabular-nums text-gray-900 dark:text-white">{p.topicsCount} topics</div>
          <p className="mt-0.5 text-xs text-gray-500">Full topic list below.</p>
        </div>
      ),
    })
  }

  cards.push({
    key: "file",
    node: (
      <div className={cn(
        "rounded-2xl border p-4 shadow-sm",
        p.downloadUrl
          ? "border-green-200 bg-gradient-to-br from-green-50 to-white dark:border-green-900 dark:from-green-950/40 dark:to-gray-800"
          : "border-amber-200 bg-gradient-to-br from-amber-50 to-white dark:border-amber-900 dark:from-amber-950/40 dark:to-gray-800",
      )}>
        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          <FileDown className="h-3.5 w-3.5" /> Official file
        </div>
        <div className={cn("text-2xl font-extrabold", p.downloadUrl ? "text-green-700 dark:text-green-300" : "text-amber-700 dark:text-amber-300")}>
          {p.downloadUrl ? "Available" : "Coming soon"}
        </div>
        <p className="mt-0.5 text-xs text-gray-500">
          {p.publishedAt ? <>Published <span className="font-semibold tabular-nums">{formatDate(p.publishedAt)}</span></> : "Check back after official release."}
        </p>
      </div>
    ),
  })

  if (cards.length < 2) return null

  return (
    <section aria-label="Document insights at a glance" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.slice(0, 4).map((c) => (
        <div key={c.key}>{c.node}</div>
      ))}
    </section>
  )
}
