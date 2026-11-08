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
 * same calm visual language - only the rows are private-specific.
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
        <span className="ml-2 inline-flex items-center rounded-full bg-paper-2 px-2 py-0.5 text-[11px] font-medium text-brick ring-1 ring-inset ring-rule dark:bg-paper-2 dark:text-brick ring-rule">
         Only {daysLeft}d left
        </span>
       ) : daysLeft !== null && daysLeft > 7 ? (
        <span className="ml-2 inline-flex items-center rounded-full bg-paper-3 px-2 py-0.5 text-[11px] font-medium text-foreground ring-1 ring-inset ring-rule dark:bg-paper-3 dark:text-foreground ring-rule">
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
   className="overflow-hidden rounded-2xl border border-rule bg-background dark:border-ink dark:bg-ink"
  >
   <div className="flex items-center gap-3 border-b border-rule px-5 py-4 dark:border-ink">
    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-paper-3 text-muted-foreground dark:bg-ink dark:text-muted-foreground">
     <Timer className="h-4 w-4" />
    </span>
    <div className="min-w-0">
     <h2 className="text-[15px] font-semibold leading-tight text-foreground dark:text-paper">
      2-minute summary
     </h2>
     <p className="truncate text-xs text-muted-foreground dark:text-muted-foreground">
      Key points for {p.company}
     </p>
    </div>
    <span className="ml-auto hidden shrink-0 items-center gap-1 rounded-full bg-paper-2 px-2.5 py-1 text-[11px] font-medium text-muted-foreground ring-1 ring-inset ring-rule200 sm:inline-flex dark:bg-ink dark:text-muted-foreground dark:ring-rule700">
     <BadgeCheck className="h-3 w-3" /> Private role
    </span>
   </div>

   <ul className="divide-y divide-rule100 px-5 dark:divide-rule800">
    {rows.map((row) => (
     <li key={row.label} className="flex items-start gap-3 py-3">
      <row.icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground dark:text-muted-foreground" />
      <div className="min-w-0">
       <p className="text-[11px] font-medium text-muted-foreground dark:text-muted-foreground">
        {row.label}
       </p>
       <p className="mt-0.5 text-sm leading-relaxed text-foreground dark:text-muted-foreground">
        {row.value}
        {"extra" in row ? row.extra : null}
       </p>
      </div>
     </li>
    ))}
   </ul>

   <div className="flex flex-wrap items-center gap-2 border-t border-rule px-5 py-3 dark:border-ink">
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground dark:text-muted-foreground">
     <Share2 className="h-3.5 w-3.5" /> Share
    </span>
    <div className="ml-auto flex flex-wrap gap-2">
     <a
      href={`https://wa.me/?text=${waText}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Share on WhatsApp"
      className="inline-flex items-center gap-1.5 rounded-full border border-rule px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-brick hover:text-brick dark:border-ink dark:text-muted-foreground"
     >
      WhatsApp
     </a>
     <a
      href={telegramUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Share on Telegram"
      className="inline-flex items-center gap-1.5 rounded-full border border-rule px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-brick hover:text-brick dark:border-ink dark:text-muted-foreground"
     >
      Telegram
     </a>
     <button
      type="button"
      onClick={copyLink}
      className="inline-flex items-center gap-1.5 rounded-full border border-rule px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-paper-2 dark:border-ink dark:text-muted-foreground"
     >
      {copied ? <Check className="h-3.5 w-3.5 text-foreground" /> : null}
      {copied ? "Copied!" : "Copy link"}
     </button>
    </div>
   </div>
  </section>
 )
}
