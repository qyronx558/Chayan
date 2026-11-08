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
    fill: f.amount === 0 ? "var(--color-ink-2)" : f.amount === maxFee ? "var(--color-brick)" : "var(--color-rule-2)",
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
            "rounded-2xl border p-4 ",
            isUrgent
              ? "border-brick bg-paper-2"
              : "border-rule bg-background dark:border-ink dark:bg-ink",
          )}
        >
          <div className="mb-2 flex items-center gap-1.5 agate text-[11px] text-muted-foreground">
            <CalendarClock className="h-3.5 w-3.5" /> {p.primaryDateLabel}
          </div>
          <div className={cn("text-2xl font-bold tabular-nums", isUrgent ? "text-brick dark:text-brick" : "text-foreground dark:text-paper")}>
            {big}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground dark:text-muted-foreground">
            <span className="font-semibold">{formatDate(p.primaryDate!)}</span>
          </p>
          {progress !== null && !isPast ? (
            <div className="mt-3">
              <div className="h-2 overflow-hidden rounded-full bg-paper-3 dark:bg-ink" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Application window elapsed">
                <div className={cn("h-full rounded-full transition-all", progress > 85 ? "bg-brick" : "bg-ink")} style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground dark:text-muted-foreground">{progress}% of window elapsed</p>
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
        <div className="rounded-2xl border border-rule bg-background p-4  dark:border-ink dark:bg-ink">
          <div className="mb-2 flex items-center gap-1.5 agate text-[11px] text-muted-foreground">
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
              <p className="mt-1 text-[11px] text-muted-foreground dark:text-muted-foreground">{feeShort} · as listed in notice</p>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold text-foreground dark:text-paper">{feeShort}</div>
              <p className="mt-0.5 text-xs text-muted-foreground">Fee as per official notice.</p>
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
        <div className="rounded-2xl border border-rule bg-background p-4  dark:border-ink dark:bg-ink">
          <div className="mb-2 flex items-center gap-1.5 agate text-[11px] text-muted-foreground">
            <BadgeCheck className="h-3.5 w-3.5" /> Status
          </div>
          <div className="text-2xl font-bold leading-tight text-foreground dark:text-paper">{p.statusText}</div>
          {p.topicsCount ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              <span className="font-bold tabular-nums text-foreground dark:text-paper">{p.topicsCount}</span> topics listed
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-muted-foreground">As published by the department.</p>
          )}
        </div>
      ),
    })
  } else if (p.topicsCount) {
    cards.push({
      key: "topics",
      node: (
        <div className="rounded-2xl border border-rule bg-background p-4  dark:border-ink dark:bg-ink">
          <div className="mb-2 flex items-center gap-1.5 agate text-[11px] text-muted-foreground">
            <BadgeCheck className="h-3.5 w-3.5" /> Coverage
          </div>
          <div className="text-2xl font-bold tabular-nums text-foreground dark:text-paper">{p.topicsCount} topics</div>
          <p className="mt-0.5 text-xs text-muted-foreground">Full topic list below.</p>
        </div>
      ),
    })
  }

  cards.push({
    key: "file",
    node: (
      <div className={cn(
        "rounded-2xl border p-4 ",
        p.downloadUrl
          ? "border-rule bg-paper-2"
          : "border-rule bg-paper-2",
      )}>
        <div className="mb-2 flex items-center gap-1.5 agate text-[11px] text-muted-foreground">
          <FileDown className="h-3.5 w-3.5" /> Official file
        </div>
        <div className={cn("text-2xl font-bold", p.downloadUrl ? "text-foreground dark:text-foreground" : "text-brick dark:text-brick")}>
          {p.downloadUrl ? "Available" : "Coming soon"}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
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
