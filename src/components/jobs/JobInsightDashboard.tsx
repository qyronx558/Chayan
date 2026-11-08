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
 const chartData = fees.map((f) => ({ ...f, fill: f.amount === 0 ? "var(--color-rule-2)" : f.amount === maxFee ? "var(--color-brick)" : "var(--color-ink-2)" }))

 return (
  <section aria-label="Job insights at a glance" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
   {/* ── 1. Time window ── */}
   <div
    className={cn(
     "border p-4",
     isClosed
      ? "border-brick bg-paper-2"
      : isUrgent
       ? "border-brick bg-paper-2"
       : "border-rule",
    )}
   >
    <div className="mb-2 flex items-center gap-1.5 agate text-[11px] text-muted-foreground">
     <AlarmClock className="h-3.5 w-3.5" /> Application window
    </div>
    {validLast ? (
     <>
      <div className={cn("text-2xl font-bold tabular-nums", isClosed || isUrgent ? "text-brick" : "text-foreground")}>
       {isClosed ? "Closed" : daysLeft !== null && daysLeft >= 0 ? `${daysLeft}d left` : "Open"}
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">
       Last date: <span className="font-semibold">{formatDate(p.lastDate!)}</span>
       {p.startDate ? <> · Opened {formatDate(p.startDate)}</> : null}
      </p>
      {progress !== null && !isClosed ? (
       <div className="mt-3">
        <div className="h-2 Overflow-hidden bg-paper-3" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Application window elapsed">
         <div
          className={cn("h-full transition-all", progress > 85 ? "bg-brick" : progress > 60 ? "bg-ink-2" : "bg-ink")}
          style={{ width: `${progress}%` }}
         />
        </div>
        <p className="mt-1 agate text-[11px] text-muted-foreground">{progress}% of window elapsed - source: official dates</p>
       </div>
      ) : (
       <p className="mt-2 agate text-[11px] text-muted-foreground">Dates as per official Notification.</p>
      )}
     </>
    ) : (
     <>
      <div className="font-display text-lg font-bold text-foreground">Dates TBA</div>
      <p className="mt-0.5 text-xs text-muted-foreground">Check official Notification for schedule.</p>
     </>
    )}
   </div>

   {/* ── 2. Vacancy scale ── */}
   <div className="border border-rule p-4">
    <div className="mb-2 flex items-center gap-1.5 agate text-[11px] text-muted-foreground">
     <Users className="h-3.5 w-3.5" /> Vacancy scale
    </div>
    {p.totalVacancies ? (
     <>
      <div className="text-2xl font-bold tabular-nums text-foreground">
       {p.totalVacancies.toLocaleString("en-IN")}
       <span className="agate ml-1.5 align-middle text-[11px] text-brick">{scale?.label}</span>
      </div>
      <div className="mt-3 h-2 Overflow-hidden bg-paper-3" role="img" aria-label={`Vacancy scale: ${scale?.label}, ${p.totalVacancies} posts`}>
       <div className="h-full bg-ink" style={{ width: `${scale?.percent ?? 40}%` }} />
      </div>
      <p className="mt-1 agate text-[11px] text-muted-foreground">{scale?.hint} · {p.totalVacancies.toLocaleString("en-IN")} posts</p>
     </>
    ) : (
     <>
      <div className="font-display text-lg font-bold text-foreground">As per Notification</div>
      <p className="mt-0.5 text-xs text-muted-foreground">Vacancy count not published separately.</p>
     </>
    )}
    {salaryRange ? (
     <p className="mt-2 border-t border-rule pt-2 text-xs text-muted-foreground">
      Pay band <span className="font-bold tabular-nums">₹{salaryRange.min.toLocaleString("en-IN")} – ₹{salaryRange.max.toLocaleString("en-IN")}</span>
     </p>
    ) : p.salary ? (
     <p className="mt-2 truncate border-t border-rule pt-2 text-xs text-muted-foreground" title={stripHtmlToText(p.salary)}>
      <span className="font-semibold">{cleanShort(p.salary, 64)}</span>
     </p>
    ) : null}
   </div>

   {/* ── 3. Fee comparison chart ── */}
   <div className="border border-rule p-4">
    <div className="mb-2 flex items-center gap-1.5 agate text-[11px] text-muted-foreground">
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
          contentStyle={{ fontSize: 12, borderRadius: 0 }}
         />
         <Bar dataKey="amount" radius={0}>
          {chartData.map((d) => (
           <Cell key={d.label} fill={d.fill} />
          ))}
         </Bar>
        </BarChart>
       </ResponsiveContainer>
      </div>
      <p className="mt-1 agate text-[11px] text-muted-foreground">
       {feeShort} · <span className="font-medium">as listed in Notification</span>
      </p>
     </>
    ) : feeShort ? (
     <>
      <div className="text-2xl font-bold text-foreground">{feeShort}</div>
      <p className="mt-0.5 text-xs text-muted-foreground">Application fee as per official Notification.</p>
     </>
    ) : (
     <>
      <div className="font-display text-lg font-bold text-foreground">See Notification</div>
      <p className="mt-0.5 text-xs text-muted-foreground">Fee details not listed separately.</p>
     </>
    )}
   </div>

   {/* ── 4. Eligibility snapshot ── */}
   <div className="border border-rule p-4">
    <div className="mb-2 flex items-center gap-1.5 agate text-[11px] text-muted-foreground">
     <GraduationCap className="h-3.5 w-3.5" /> Who can apply
    </div>
    {eduShort ? (
     <p className="text-sm font-semibold leading-snug text-foreground">{eduShort}</p>
    ) : (
     <p className="text-sm font-semibold text-foreground">Check Notification</p>
    )}
    {ageShort ? (
     <p className="mt-1 text-xs text-muted-foreground">
      Age: <span className="font-semibold">{ageShort}</span>
     </p>
    ) : null}
    <div className="mt-3 flex flex-wrap gap-1.5">
     <a href="/tools/eligibility-checker" className="border border-rule px-2.5 py-1 text-[11px] font-medium text-brick transition-colors hover:border-brick">
      Am I eligible? →
     </a>
     <a href="/tools/age-calculator" className="border border-rule px-2.5 py-1 text-[11px] font-medium text-brick transition-colors hover:border-brick">
      Check age →
     </a>
    </div>
    <p className="mt-2 agate text-[11px] text-muted-foreground">Snapshot only - full criteria below.</p>
   </div>
  </section>
 )
}
