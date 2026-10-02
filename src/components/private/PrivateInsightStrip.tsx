"use client"
import { useEffect, useState } from "react"
import { AlarmClock, IndianRupee, MapPin, Users, Wifi, Eye } from "lucide-react"
import { formatDate, cn } from "@/lib/utils"
import { formatSalaryRange } from "@/lib/private-jobs-trust"

interface Props {
  lastDate?: string | null
  salaryMin?: number | null
  salaryMax?: number | null
  salaryText?: string | null
  location?: string | null
  remotePolicy?: string | null
  vacancies?: number | null
  views?: number | null
  trustScore?: number | null
}

export function PrivateInsightStrip(p: Props) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(t)
  }, [])
  const lastMs = p.lastDate ? new Date(p.lastDate).getTime() : null
  const diff = lastMs && isFinite(lastMs) ? lastMs - now : null
  const daysLeft = diff !== null ? Math.floor(diff / 86400000) : null
  const isUrgent = diff !== null && diff > 0 && diff <= 7 * 86400000
  const isClosed = diff !== null && diff <= 0
  const salary = formatSalaryRange(p.salaryMin, p.salaryMax, p.salaryText)

  const cards = [
    {
      icon: AlarmClock,
      label: "Deadline",
      value: !lastMs ? "No deadline" : isClosed ? "Closed" : daysLeft !== null && daysLeft >= 0 ? `${daysLeft}d left` : "Open",
      sub: p.lastDate ? formatDate(p.lastDate) : "Apply anytime",
      hot: isUrgent || isClosed,
    },
    { icon: IndianRupee, label: "Salary", value: salary || "Not disclosed", sub: p.salaryMin && p.salaryMax ? "Monthly CTC range" : "As per company", hot: false },
    { icon: MapPin, label: "Work mode", value: p.remotePolicy === "REMOTE" ? "Remote" : p.remotePolicy === "HYBRID" ? "Hybrid" : p.remotePolicy === "ONSITE" ? "On-site" : p.location || "-", sub: p.location || "Location on JD", hot: false },
    { icon: Users, label: "Openings", value: p.vacancies ? `${p.vacancies}` : "-", sub: p.views ? `${p.views} views` : "Be an early applicant", hot: false },
  ]
  return (
    <section aria-label="Private job insights" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className={cn("rounded-2xl border p-4 shadow-sm", c.hot ? "border-red-200 bg-gradient-to-br from-red-50 to-orange-50 dark:border-red-900 dark:from-red-950/40" : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800")}>
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
            <c.icon className="h-3.5 w-3.5" /> {c.label}
          </div>
          <div className={cn("text-lg font-extrabold", c.hot ? "text-red-700" : "text-gray-900 dark:text-white")}>{c.value}</div>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500"><Eye className="hidden h-3 w-3" />{c.sub}</p>
        </div>
      ))}
      {p.remotePolicy === "REMOTE" && (
        <p className="flex items-center gap-1.5 text-xs font-semibold text-sky-700 sm:col-span-2 xl:col-span-4"><Wifi className="h-3.5 w-3.5" /> Remote-friendly - confirm timezone, equipment and probation terms before applying.</p>
      )}
    </section>
  )
}
