"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import {
 Briefcase, Building2, CalendarClock, CalendarPlus, Check, ChevronDown, ExternalLink, FileText,
 GraduationCap, Banknote, Layers, MapPin, Navigation, Route, Sparkles, UserRound, Users, Wifi,
 type LucideIcon,
} from "lucide-react"
import { formatDate, cn } from "@/lib/utils"
import { handFont, typeFont } from "@/components/home/fonts"
import { PenLoop, paperShadow } from "@/components/desk/DeskKit"
import { AIRMAIL, RotatingHello, Stamp } from "@/app/(public)/private-jobs/airmail"
import { PrivateTracker } from "@/components/private/PrivateTracker"
import { BookmarkButton } from "@/components/layout/BookmarkButton"
import { PrivateApplyRail } from "@/components/private/PrivateApplyRail"
import { MatchScoreBar } from "@/components/private/MatchScoreBar"
import { PrepKit } from "@/components/private/PrepKit"
import { RichTextView } from "@/components/shared/RichTextView"
import { cleanJobDescription } from "@/lib/private-jobs/description"
import { countryName } from "@/lib/private-jobs/geo"
import { salaryInrHint } from "@/lib/private-jobs/salary"
import { SmartExternalLink } from "@/components/shared/SmartExternalLink"
import { useActiveSection } from "@/components/shared/useActiveSection"
import { Button } from "@/components/ui/button"
import { containsHtml } from "@/lib/blog-prose"
import { getDeadline, shortFact, stepify } from "@/lib/job-insights"
import { computeTrustScore, formatSalaryRange } from "@/lib/private-jobs-trust"

interface Company {
 id: string; name: string; slug?: string | null; logo?: string | null
 website?: string | null; description?: string | null; verifiedStatus?: string
 industry?: string | null; size?: string | null; hq?: string | null; responseRate?: number | null
}

interface PrivateJob {
 id: string; title: string; slug: string; type: string; category?: string | null
 description?: string | null; location?: string | null; country?: string | null; city?: string | null; salary?: string | null
 salaryMin?: number | null; salaryMax?: number | null; salaryCurrency?: string | null; salaryLocalMin?: number | null; salaryLocalMax?: number | null
 experience?: string | null; expMin?: number | null; expMax?: number | null
 qualification?: string | null; skills?: string[]; remotePolicy?: string | null
 vacancies?: number | null; views?: number | null; trustScore?: number | null
 isFresherFriendly?: boolean; isWalkIn?: boolean; walkInVenue?: string | null; walkInDate?: string | null
 proofUrl?: string | null
 applicationUrl?: string | null
 applicationEmail?: string | null; lastDate?: string | null; status: string
 company: Company; createdAt: string; updatedAt?: string | null
}

const typeLabels: Record<string, string> = {
 FULL_TIME: "Full-time", PART_TIME: "Part-time", INTERNSHIP: "Internship", CONTRACT: "Contract",
}
const remoteLabels: Record<string, string> = { REMOTE: "Remote", HYBRID: "Hybrid", ONSITE: "On-site" }

/** "Today" / "Yesterday" / "5 days ago" / "3 weeks ago" - calendar-day based. */
function postedAgo(iso: string, nowMs: number): string | null {
 const d = new Date(iso)
 if (isNaN(d.getTime())) return null
 const a = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
 const n = new Date(nowMs)
 const days = Math.round((Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()) - a) / 86400000)
 if (days <= 0) return "Posted today"
 if (days === 1) return "Posted yesterday"
 if (days < 14) return `Posted ${days} days ago`
 if (days < 60) return `Posted ${Math.floor(days / 7)} weeks ago`
 return `Posted ${formatDate(iso)}`
}

const BLUE = "oklch(45% 0.13 255)"
const RED = "oklch(52% 0.19 27)"

function Section({ id, n, icon: Icon, title, hint, children }: { id: string; n?: number; icon: LucideIcon; title: string; hint?: string; children: ReactNode }) {
 return (
  <section id={id} className="relative scroll-mt-32 rounded-[3px] border border-[var(--hs-border)] bg-[var(--hs-paper-slip)]" style={{ boxShadow: paperShadow }}>
   <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-5 pb-3 pt-5 sm:px-7">
    <span className={cn(typeFont.className, "text-[11px] font-bold")} style={{ color: BLUE }}>§ {String(n ?? 1).padStart(2, "0")}</span>
    <h2 className="flex items-center gap-2 font-display text-[1.35rem] font-black leading-tight text-foreground">
     {title}
     <Icon className="h-4 w-4 text-muted-foreground/70" aria-hidden />
    </h2>
    {hint ? <span className={cn(handFont.className, "ml-auto hidden text-[1rem] text-muted-foreground sm:block")}>{hint}</span> : null}
   </header>
   <div className="mx-5 border-t border-dashed border-[var(--hs-border-strong)] sm:mx-7" />
   <div className="px-5 pb-6 pt-5 sm:px-7">{children}</div>
  </section>
 )
}

/** Long employer text: readable first screen, one click for the rest. Nothing is dropped. */
function ClampedText({ children }: { children: ReactNode }) {
 const ref = useRef<HTMLDivElement>(null)
 const [open, setOpen] = useState(false)
 const [overflowing, setOverflowing] = useState(false)
 useEffect(() => {
  const el = ref.current
  if (el) setOverflowing(el.scrollHeight > 340)
 }, [children])
 return (
  <div>
   <div ref={ref} className={cn("relative overflow-hidden", !open && "max-h-[320px]")}>
    {children}
    {!open && overflowing ? <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-24" style={{ background: "linear-gradient(to top, var(--hs-paper-slip), transparent)" }} /> : null}
   </div>
   {overflowing ? (
    <button type="button" onClick={() => setOpen((v) => !v)} className={cn(handFont.className, "mt-3 inline-flex items-center gap-1.5 text-[1.1rem] text-[var(--hs-trust)] underline decoration-wavy decoration-1 underline-offset-4 hover:text-[var(--color-brick)] print:hidden")} aria-expanded={open}>
     {open ? "fold the letter back" : "read the whole letter"} <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
    </button>
   ) : null}
  </div>
 )
}

/** A round postmark: city on top, country below, the posting date across the middle. */
function Postmark({ top, bottom, date, className }: { top: string; bottom: string; date: string; className?: string }) {
 return (
  <svg viewBox="0 0 120 120" className={cn("h-[104px] w-[104px] -rotate-[12deg] opacity-80", className)} aria-hidden>
   <defs>
    <path id="pm-top" d="M 18 60 A 42 42 0 0 1 102 60" />
    <path id="pm-bot" d="M 14 60 A 46 46 0 0 0 106 60" />
   </defs>
   <circle cx="60" cy="60" r="55" fill="none" stroke={BLUE} strokeWidth="2.5" />
   <circle cx="60" cy="60" r="38" fill="none" stroke={BLUE} strokeWidth="1.2" />
   <text fontSize="10.5" fontWeight="700" letterSpacing="2" fill={BLUE} className={typeFont.className}>
    <textPath href="#pm-top" startOffset="50%" textAnchor="middle">{top.slice(0, 16)}</textPath>
   </text>
   <text fontSize="10.5" fontWeight="700" letterSpacing="2" fill={BLUE} className={typeFont.className}>
    <textPath href="#pm-bot" startOffset="50%" textAnchor="middle" dominantBaseline="hanging">{bottom.slice(0, 18)}</textPath>
   </text>
   <text x="60" y="64" fontSize="11" fontWeight="700" fill={BLUE} textAnchor="middle" className={typeFont.className}>{date}</text>
   {/* cancellation waves trailing off the stamp */}
   {[0, 1, 2].map((i) => (
    <path key={i} d={`M 108 ${48 + i * 12} C 116 ${42 + i * 12}, 124 ${54 + i * 12}, 132 ${48 + i * 12}`} fill="none" stroke={BLUE} strokeWidth="2" />
   ))}
  </svg>
 )
}

export function PrivateJobDetailContent({ job }: { job: PrivateJob }) {
 const { data: session } = useSession()
 const [now, setNow] = useState(() => Date.now())
 useEffect(() => {
  const t = setInterval(() => setNow(Date.now()), 60000)
  return () => clearInterval(t)
 }, [])

 const trackClick = (kind: "APPLY" | "EMAIL") => {
  fetch(`/api/private-jobs/${job.id}/click`, {
   method: "POST",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify({ kind }),
  }).catch(() => {})
 }

 const trust = computeTrustScore({
  applicationUrl: job.applicationUrl,
  applicationEmail: job.applicationEmail,
  proofUrl: job.proofUrl,
  companyWebsite: job.company.website,
  companyVerified: job.company.verifiedStatus === "VERIFIED",
  description: job.description,
 })
 const score = job.trustScore ?? trust.score
 const salary = formatSalaryRange(job.salaryMin, job.salaryMax, job.salary, job)
 const expRange = job.expMin !== null && job.expMin !== undefined ? `${job.expMin}–${job.expMax ?? job.expMin} yrs` : null
 const experience = job.experience || expRange

 const deadline = getDeadline(null, job.lastDate ?? null, job.status, now)
 const closed = deadline.state === "closed"
 const urgent = deadline.state === "urgent"
 const canApply = Boolean(job.applicationUrl || job.applicationEmail)
 const verified = job.company.verifiedStatus === "VERIFIED"
 const posted = postedAgo(job.createdAt, now)
 // Location text plus the country when it is abroad and the text does not already say so.
 const abroad = job.country && job.country !== "IN" ? countryName(job.country) : ""
 const baseLocation = job.location || [job.city, abroad].filter(Boolean).join(", ")
 const place = abroad && baseLocation && !baseLocation.toLowerCase().includes(abroad.toLowerCase()) ? `${baseLocation}, ${abroad}` : baseLocation
 const isNew = posted === "Posted today" || posted === "Posted yesterday"

 /* ── Short -> tile. Long -> requirements section. Never both. ── */
 const salaryTile = shortFact(salary, 30)
 const salaryHint = salaryInrHint(job)
 const expTile = shortFact(experience, 24)
 const facts = [
  salaryTile ? { icon: Banknote, label: salaryHint ? `Salary (${salaryHint})` : "Salary", value: salaryTile } : null,
  expTile ? { icon: Briefcase, label: "Experience", value: expTile } : null,
  job.remotePolicy ? { icon: Wifi, label: "Work mode", value: remoteLabels[job.remotePolicy] || job.remotePolicy } : null,
  { icon: Layers, label: "Job type", value: typeLabels[job.type] || job.type },
  job.vacancies ? { icon: Users, label: "Openings", value: job.vacancies.toLocaleString("en-IN") } : null,
  job.lastDate ? { icon: CalendarClock, label: "Last date", value: formatDate(job.lastDate), sub: deadline.label, hot: urgent } : null,
 ].filter((f): f is NonNullable<typeof f> => f !== null)

 const skills = job.skills ?? []
 const hasRequirements = Boolean(job.qualification || skills.length || (!expTile && experience) || (!salaryTile && salary) || job.isFresherFriendly)

 const howSteps = stepify(
  [
   job.applicationUrl ? "Open the application page and complete the form on the company's site." : null,
   job.applicationEmail ? `Or email your resume to ${job.applicationEmail} with "${job.title}" in the subject.` : null,
  ].filter(Boolean).join("\n"),
 )

 const sections = [
  { id: "overview", label: "Description", show: Boolean(job.description) },
  { id: "requirements", label: "Requirements", show: hasRequirements },
  { id: "how-to-apply", label: "How to apply", show: howSteps.length > 0 },
  { id: "company", label: "Company", show: true },
  { id: "prep", label: "Prep kit", show: true },
 ].filter((s) => s.show)
 const active = useActiveSection(sections.map((s) => s.id))
 const goTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })

 const walkInDay = job.walkInDate ? new Date(job.walkInDate) : null
 const calendarUrl = (() => {
  if (!walkInDay || isNaN(walkInDay.getTime())) return null
  const ymd = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "")
  const next = new Date(walkInDay.getTime() + 86400000)
  const q = new URLSearchParams({
   action: "TEMPLATE",
   text: `Walk-in: ${job.title} - ${job.company.name}`,
   dates: `${ymd(walkInDay)}/${ymd(next)}`,
   location: job.walkInVenue ?? "",
   details: `Carry resume copies and a photo ID.\n${typeof window !== "undefined" ? window.location.href : ""}`,
  })
  return `https://calendar.google.com/calendar/render?${q.toString()}`
 })()
 const mapsUrl = job.walkInVenue ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.walkInVenue)}` : null

 const pill =
  closed ? { text: "Closed", cls: "border-rule-2 text-muted-foreground" }
  : urgent ? { text: "Closing soon", cls: "border-brick bg-brick text-brick-ink" }
  : { text: "Hiring", cls: "border-ink text-foreground" }

 const num = (id: string) => sections.findIndex((s) => s.id === id) + 1
 const cityTop = (job.city || place.split(",")[0] || (job.remotePolicy === "REMOTE" ? "ANYWHERE" : "WORLDWIDE")).toUpperCase()
 const countryBottom = (abroad || (job.country === "IN" ? "India" : job.remotePolicy === "REMOTE" ? "Remote" : "")).toUpperCase() || "AIR MAIL"
 const statusTone = closed ? "oklch(50% 0.02 60)" : urgent ? RED : "oklch(45% 0.1 160)"

 return (
  <div className="home-saas grid items-start gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1fr)_340px]">
   <div className="min-w-0 space-y-8">
    {/* ── Hero: the letter, just out of its airmail envelope ── */}
    <header className="p-[6px]" style={{ background: AIRMAIL, boxShadow: "0 24px 40px -28px rgb(30 30 60 / .6)" }}>
     <div className="relative bg-[var(--hs-paper-slip)] px-5 pb-6 pt-5 sm:px-8 sm:pb-8 sm:pt-7">
      {/* letterhead + stamps */}
      <div className="flex items-start justify-between gap-4">
       <div className="flex min-w-0 items-center gap-3.5">
        {job.company.logo ? (
         // eslint-disable-next-line @next/next/no-img-element
         <img src={job.company.logo} alt="" className="h-14 w-14 shrink-0 rounded-[6px] border border-[var(--hs-border)] bg-white object-contain p-1" />
        ) : (
         <span aria-hidden className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[6px] font-display text-2xl font-black text-[oklch(98%_0.01_90)]" style={{ background: BLUE }}>
          {job.company.name.trim().charAt(0).toUpperCase()}
         </span>
        )}
        <div className="min-w-0">
         <p className="flex flex-wrap items-center gap-x-2 font-display text-[1.15rem] font-black leading-tight text-foreground">
          {job.company.slug ? (
           <Link href={`/companies/${job.company.slug}`} className="underline-offset-4 hover:underline">{job.company.name}</Link>
          ) : (
           <span>{job.company.name}</span>
          )}
          {verified ? <span className={cn(typeFont.className, "inline-flex items-center gap-0.5 rounded-full border border-[oklch(50%_0.1_160)] px-1.5 text-[10px] font-bold text-[oklch(45%_0.1_160)]")}><Check className="h-3 w-3" /> VERIFIED</span> : null}
         </p>
         <p className={cn(typeFont.className, "mt-0.5 text-[11px] uppercase text-muted-foreground")}>
          {[job.company.industry, job.company.hq].filter(Boolean).join(" · ") || "Letter from the employer"}
         </p>
        </div>
       </div>
       <div className="relative hidden shrink-0 items-start gap-2 pl-16 sm:flex" aria-hidden>
        {job.remotePolicy ? (
         <Stamp tint={job.remotePolicy === "REMOTE" ? "oklch(88% 0.07 230)" : job.remotePolicy === "HYBRID" ? "oklch(90% 0.08 140)" : "oklch(90% 0.07 60)"} holes="var(--hs-paper-slip)" className="rotate-[4deg]">
          <span className={cn(typeFont.className, "text-[9px] font-bold text-[oklch(30%_0.04_250)]")}>{(remoteLabels[job.remotePolicy] || job.remotePolicy).toUpperCase()}</span>
          <span className="text-[18px] leading-none">{job.remotePolicy === "REMOTE" ? "🌐" : job.remotePolicy === "HYBRID" ? "⇄" : "🏢"}</span>
         </Stamp>
        ) : null}
        <Stamp tint="oklch(90% 0.06 20)" holes="var(--hs-paper-slip)" className="-rotate-[3deg]">
         <span className={cn(typeFont.className, "text-[9px] font-bold text-[oklch(35%_0.08_25)]")}>{(typeLabels[job.type] || job.type).toUpperCase()}</span>
         <span className="font-display text-[15px] font-black leading-none text-[oklch(35%_0.08_25)]">{job.vacancies ? `×${job.vacancies}` : "1"}</span>
        </Stamp>
        <Postmark top={cityTop} bottom={countryBottom} date={formatDate(job.createdAt, "d MMM yy").toUpperCase()} className="absolute -top-4 right-[calc(100%-84px)]" />
       </div>
      </div>

      <div className="mt-5 border-t border-dashed border-[var(--hs-border-strong)] pt-5">
       <p className={cn(handFont.className, "text-[1.2rem] leading-tight text-foreground/80")}>
        <RotatingHello /> to you, wherever you are reading this from.
       </p>
       <h1 className="mt-3 font-display text-[1.9rem] font-black leading-[1.08] text-foreground sm:text-[2.6rem]">{job.title}</h1>

       <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
        <span className={cn(typeFont.className, "inline-flex items-center gap-1.5 rounded-[3px] border-2 px-2 py-0.5 text-[11px] font-bold uppercase")} style={{ color: statusTone, borderColor: statusTone }}>
         <span className={cn("h-1.5 w-1.5 rounded-full bg-current", urgent && "animate-pulse")} /> {pill.text}
        </span>
        {place ? <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{place}</span> : null}
        {posted ? <span className={cn(handFont.className, "text-[1.05rem]", isNew ? "text-[var(--color-brick)]" : "text-muted-foreground")}>{posted.toLowerCase()}{isNew && !closed ? ", early letters get read first" : ""}</span> : null}
       </p>

       {(job.isFresherFriendly || job.isWalkIn || job.category) ? (
        <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
         {job.isFresherFriendly ? <span className={cn(handFont.className, "text-[1.08rem] text-[oklch(45%_0.1_160)] underline decoration-wavy decoration-1 underline-offset-4")}>freshers welcome</span> : null}
         {job.isWalkIn ? <span className={cn(handFont.className, "text-[1.08rem] text-[var(--color-brick)] underline decoration-wavy decoration-1 underline-offset-4")}>walk-in interview</span> : null}
         {job.category ? <span className={cn(typeFont.className, "text-[11px] font-bold uppercase text-muted-foreground")}>{job.category}</span> : null}
        </p>
       ) : null}

       <div className="mt-5 flex items-center gap-2 lg:hidden print:hidden">
        <PrivateTracker privateJobId={job.id} variant="full" />
        <BookmarkButton privateJobId={job.id} size="icon" variant="outline" />
       </div>
      </div>
     </div>
    </header>

    {/* ── Key facts: the particulars, in any currency ── */}
    <div className="rounded-[4px] border border-[var(--hs-border-strong)] bg-[var(--hs-paper-slip)]" style={{ boxShadow: paperShadow }}>
     <p className={cn(typeFont.className, "flex items-center justify-between border-b border-dashed border-[var(--hs-border-strong)] px-5 py-2 text-[10.5px] font-bold tracking-[0.25em] text-muted-foreground")}>
      <span>THE PARTICULARS</span>
      <span className="h-1.5 w-16" style={{ background: AIRMAIL }} aria-hidden />
     </p>
     <dl className={cn("grid grid-cols-2", facts.length === 4 ? "sm:grid-cols-4" : facts.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3")}>
      {facts.map((f, i) => {
       const hot = "hot" in f && f.hot
       const isSalary = f.icon === Banknote
       return (
        <div key={f.label} className={cn("min-w-0 border-dashed border-[var(--hs-border-strong)] px-5 py-4", i > 0 && "border-l", i >= 2 && "max-sm:border-t", i % 2 === 0 && "max-sm:border-l-0", facts.length !== 4 && i >= 3 && "sm:border-t", facts.length !== 4 && i === 3 && "sm:border-l-0")}>
         <dt className={cn(typeFont.className, "flex items-center gap-1.5 text-[10.5px] font-bold uppercase text-muted-foreground")}><f.icon className="h-3.5 w-3.5" /> {isSalary ? "Salary" : f.label}</dt>
         <dd className={cn("mt-2 font-display text-[1.25rem] font-black leading-tight tabular-nums sm:text-[1.4rem]", hot ? "text-[var(--color-brick)]" : "text-foreground")}>{f.value}</dd>
         {isSalary && salaryHint ? <p className={cn(handFont.className, "mt-1 text-[1rem] leading-tight text-[var(--hs-trust)]")}>{salaryHint} in India</p> : null}
         {"sub" in f && f.sub ? <p className={cn(handFont.className, "mt-1 text-[1rem] leading-tight", hot ? "text-[var(--color-brick)]" : "text-muted-foreground")}>{f.sub}</p> : null}
        </div>
       )
      })}
     </dl>
    </div>

    {/* ── Walk-in: an appointment slip ── */}
    {job.isWalkIn && (job.walkInVenue || job.walkInDate) ? (
     <div className="relative -rotate-[0.4deg] rounded-[3px] px-5 py-5 text-[oklch(28%_0.03_60)] sm:px-7" style={{ background: "oklch(94% 0.05 85)", boxShadow: "0 1px 1px rgb(60 40 10 / .1), 0 18px 28px -20px rgb(60 40 10 / .55)" }}>
      <span className="absolute -top-2.5 left-10 h-6 w-20 rotate-[-3deg] bg-[oklch(92%_0.03_90/0.8)] shadow-[0_1px_2px_rgb(0_0_0/.12)]" aria-hidden />
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
       <div className="min-w-0 flex-1">
        <p className={cn(typeFont.className, "text-[10.5px] font-bold tracking-[0.25em] text-[oklch(48%_0.18_28)]")}>APPOINTMENT · WALK-IN INTERVIEW</p>
        <p className="mt-1.5 font-display text-[1.4rem] font-black">{job.walkInDate ? formatDate(job.walkInDate) : "Date to be confirmed"}</p>
        {job.walkInVenue ? <p className={cn(typeFont.className, "mt-1 text-[12.5px]")}>{job.walkInVenue}</p> : null}
        <p className={cn(handFont.className, "mt-2 text-[1.1rem]")}>Carry resume copies and a photo ID.</p>
       </div>
       <div className="flex flex-wrap gap-2 print:hidden">
        {mapsUrl ? (
         <Button variant="outline" size="sm" className="rounded-full border-[oklch(28%_0.03_60/0.4)] bg-transparent text-[oklch(28%_0.03_60)] hover:bg-[oklch(28%_0.03_60/0.06)]" asChild>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer"><Navigation className="mr-1.5 h-4 w-4" /> Directions</a>
         </Button>
        ) : null}
        {calendarUrl ? (
         <Button variant="outline" size="sm" className="rounded-full border-[oklch(28%_0.03_60/0.4)] bg-transparent text-[oklch(28%_0.03_60)] hover:bg-[oklch(28%_0.03_60/0.06)]" asChild>
          <a href={calendarUrl} target="_blank" rel="noopener noreferrer"><CalendarPlus className="mr-1.5 h-4 w-4" /> Add to calendar</a>
         </Button>
        ) : null}
       </div>
      </div>
     </div>
    ) : null}

    {/* Match against the user's resume (private-job specific, stays right under the facts) */}
    <MatchScoreBar privateJobId={job.id} />

    {sections.length > 2 ? (
     <nav aria-label="Job sections" className="sticky top-[65px] z-30 -mx-4 border-b border-[var(--hs-border-strong)] bg-background px-4 pt-2 print:hidden sm:mx-0 sm:px-0">
      <ul className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
       {sections.map((s, i) => (
        <li key={s.id} className="shrink-0">
         <button
          type="button"
          onClick={() => goTo(s.id)}
          className={cn(
           "relative -mb-px rounded-t-[8px] border border-b-0 px-3.5 pb-2 pt-1.5 text-[13px] transition-colors",
           active === s.id ? "border-[var(--hs-border-strong)] bg-[var(--hs-paper-slip)] font-semibold text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
          )}
         >
          <span className={cn(typeFont.className, "mr-1.5 text-[10px]")} style={{ color: active === s.id ? BLUE : undefined }}>{String(i + 1).padStart(2, "0")}</span>
          {s.label}
         </button>
        </li>
       ))}
      </ul>
     </nav>
    ) : null}

    {/* ── Description: the letter itself ── */}
    {job.description ? (
     <Section id="overview" n={num("overview")} icon={FileText} title="About the role" hint="read it like a letter, slowly">
      <p className={cn(handFont.className, "mb-3 text-[1.25rem] text-foreground/80")}>Dear applicant,</p>
      <ClampedText><RichTextView html={cleanJobDescription(job.description)} /></ClampedText>
     </Section>
    ) : null}

    {/* ── Requirements ── */}
    {hasRequirements ? (
     <Section id="requirements" n={num("requirements")} icon={GraduationCap} title="What they are looking for" hint="be honest with yourself here">
      <dl>
       {job.qualification ? (
        <div className="grid gap-1.5 border-b border-dashed border-[var(--hs-border)] py-4 first:pt-0 last:border-b-0 last:pb-0 sm:grid-cols-[10.5rem_minmax(0,1fr)] sm:gap-6">
         <dt className={cn(typeFont.className, "flex items-start gap-2 text-[11.5px] font-bold uppercase text-foreground/80")}><GraduationCap className="mt-px h-3.5 w-3.5" style={{ color: BLUE }} /> Qualification</dt>
         <dd className="min-w-0 text-sm"><RichTextView html={job.qualification} /></dd>
        </div>
       ) : null}
       {!expTile && experience ? (
        <div className="grid gap-1.5 border-b border-dashed border-[var(--hs-border)] py-4 first:pt-0 last:border-b-0 last:pb-0 sm:grid-cols-[10.5rem_minmax(0,1fr)] sm:gap-6">
         <dt className={cn(typeFont.className, "flex items-start gap-2 text-[11.5px] font-bold uppercase text-foreground/80")}><Briefcase className="mt-px h-3.5 w-3.5" style={{ color: BLUE }} /> Experience</dt>
         <dd className="min-w-0 text-sm"><RichTextView html={experience} /></dd>
        </div>
       ) : null}
       {!salaryTile && salary ? (
        <div className="grid gap-1.5 border-b border-dashed border-[var(--hs-border)] py-4 first:pt-0 last:border-b-0 last:pb-0 sm:grid-cols-[10.5rem_minmax(0,1fr)] sm:gap-6">
         <dt className={cn(typeFont.className, "flex items-start gap-2 text-[11.5px] font-bold uppercase text-foreground/80")}><Banknote className="mt-px h-3.5 w-3.5" style={{ color: BLUE }} /> Salary</dt>
         <dd className="min-w-0 text-sm"><RichTextView html={salary} /></dd>
        </div>
       ) : null}
       {job.isFresherFriendly ? (
        <div className="grid gap-1.5 border-b border-dashed border-[var(--hs-border)] py-4 first:pt-0 last:border-b-0 last:pb-0 sm:grid-cols-[10.5rem_minmax(0,1fr)] sm:gap-6">
         <dt className={cn(typeFont.className, "flex items-start gap-2 text-[11.5px] font-bold uppercase text-foreground/80")}><UserRound className="mt-px h-3.5 w-3.5" style={{ color: BLUE }} /> Freshers</dt>
         <dd className="text-sm text-foreground">Freshers can apply for this role. <span className={cn(handFont.className, "text-[1.05rem] text-[oklch(45%_0.1_160)]")}>everyone starts somewhere.</span></dd>
        </div>
       ) : null}
       {skills.length > 0 ? (
        <div className="grid gap-2 py-4 first:pt-0 last:pb-0 sm:grid-cols-[10.5rem_minmax(0,1fr)] sm:gap-6">
         <dt className={cn(typeFont.className, "flex items-start gap-2 text-[11.5px] font-bold uppercase text-foreground/80")}><Sparkles className="mt-px h-3.5 w-3.5" style={{ color: BLUE }} /> Skills</dt>
         <dd className="flex flex-wrap gap-2">
          {skills.map((s, i) => (
           <span
            key={s}
            className={cn(typeFont.className, "rounded-[4px] border-[1.5px] border-dashed px-2 py-0.5 text-[11.5px] font-bold uppercase", i % 3 === 0 ? "-rotate-[2deg]" : i % 3 === 1 ? "rotate-[1.5deg]" : "")}
            style={{ color: i % 2 ? RED : BLUE, borderColor: i % 2 ? RED : BLUE }}
           >
            {s}
           </span>
          ))}
         </dd>
        </div>
       ) : null}
      </dl>
     </Section>
    ) : null}

    {/* ── How to apply ── */}
    {howSteps.length > 0 ? (
     <Section id="how-to-apply" n={num("how-to-apply")} icon={Route} title="How to apply" hint="one tab, one form, no rush">
      <ol className="space-y-5">
       {howSteps.map((step, i) => (
        <li key={i} className="flex gap-4">
         <span className="relative flex h-8 w-8 shrink-0 items-center justify-center font-display text-[1rem] font-black" style={{ color: BLUE }}>
          {i + 1}
          <PenLoop className="inset-0 h-full w-full" color={BLUE} />
         </span>
         <p className="pt-1 text-[14.5px] leading-relaxed text-foreground">{step}</p>
        </li>
       ))}
      </ol>
     </Section>
    ) : null}

    {/* ── Company: their business card ── */}
    <Section id="company" n={num("company")} icon={Building2} title={`About ${job.company.name}`} hint="who is writing to you">
     <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
      <div className="relative w-full max-w-[19rem] shrink-0 rotate-[-1deg] rounded-[6px] bg-[oklch(98%_0.008_90)] px-5 py-4 text-[oklch(27%_0.03_60)]" style={{ boxShadow: "0 1px 2px rgb(0 0 0 / .12), 0 14px 22px -14px rgb(40 20 0 / .5)" }}>
       <span className="absolute left-0 top-0 h-full w-1.5 rounded-l-[6px]" style={{ background: BLUE }} aria-hidden />
       <p className="font-display text-[1.1rem] font-black leading-tight">{job.company.name}</p>
       {job.company.industry ? <p className={cn(typeFont.className, "text-[10.5px] uppercase opacity-70")}>{job.company.industry}</p> : null}
       <dl className={cn(typeFont.className, "mt-3 space-y-1 text-[11px]")}>
        {[
         job.company.size ? { l: "Size", v: job.company.size } : null,
         job.company.hq ? { l: "HQ", v: job.company.hq } : null,
         job.company.responseRate != null ? { l: "Replies to", v: `${job.company.responseRate}% applicants` } : null,
        ].filter((x): x is { l: string; v: string } => x !== null).map((x) => (
         <div key={x.l} className="flex gap-2"><dt className="w-16 shrink-0 opacity-60">{x.l}</dt><dd className="min-w-0 truncate font-bold" title={x.v}>{x.v}</dd></div>
        ))}
       </dl>
       {job.company.website ? (
        <SmartExternalLink href={job.company.website} linkTitle={`${job.company.name} - official website`} className={cn(typeFont.className, "mt-3 inline-flex items-center gap-1 text-[11px] font-bold underline underline-offset-2 hover:text-[oklch(48%_0.18_28)]")}>
         <ExternalLink className="h-3 w-3" /> Company website
        </SmartExternalLink>
       ) : null}
      </div>
      <div className="min-w-0 flex-1">
       {job.company.description ? (
        containsHtml(job.company.description) ? <RichTextView html={job.company.description} /> : <p className="text-[14.5px] leading-relaxed text-muted-foreground">{job.company.description}</p>
       ) : (
        <p className={cn(handFont.className, "text-[1.1rem] text-muted-foreground")}>The employer has not added a company profile yet.</p>
       )}
       {job.company.slug ? (
        <Link href={`/companies/${job.company.slug}`} className={cn(handFont.className, "mt-4 inline-block text-[1.1rem] text-[var(--hs-trust)] underline decoration-wavy decoration-1 underline-offset-4 hover:text-[var(--color-brick)]")}>all jobs at {job.company.name} →</Link>
       ) : null}
      </div>
     </div>
    </Section>

    {/* ── Prep kit ── */}
    <Section id="prep" n={num("prep")} icon={Sparkles} title="Get hired faster" hint="your carry-on for this role">
     <PrepKit
      title={job.title}
      company={job.company.name}
      description={job.description}
      skills={job.skills}
      category={job.category}
      experience={experience}
      applicationEmail={job.applicationEmail}
      applicantName={session?.user?.name}
     />
    </Section>
   </div>

   <PrivateApplyRail
    privateJobId={job.id}
    slug={job.slug}
    title={job.title}
    company={job.company.name}
    companyWebsite={job.company.website ?? null}
    applicationUrl={job.applicationUrl ?? null}
    applicationEmail={job.applicationEmail ?? null}
    proofUrl={job.proofUrl ?? null}
    trust={{ score, label: trust.label, reasons: trust.reasons }}
    deadline={deadline}
    postedLabel={posted}
    lastDate={job.lastDate ?? null}
    updatedAt={job.updatedAt ?? null}
    viewsTotal={job.views ?? null}
    onApplyClick={trackClick}
   />

   {/* ── Mobile apply bar ── */}
   <div className="sticky bottom-0 z-40 -mx-4 border-t border-[var(--hs-border-strong)] bg-background/95 backdrop-blur print:hidden lg:hidden lg:col-span-2">
    {deadline.progress !== null && !closed ? (
     <div className="h-1 w-full bg-[var(--hs-surface-2)]" role="progressbar" aria-valuenow={deadline.progress} aria-valuemin={0} aria-valuemax={100} aria-label="Application window elapsed">
      <div className="h-full" style={{ width: `${deadline.progress}%`, background: urgent ? RED : BLUE }} />
     </div>
    ) : null}
    <div className="flex items-center gap-3 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
     <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold text-foreground">{job.title}</p>
      <p className={cn(handFont.className, "truncate text-[1rem] leading-tight", closed || urgent ? "text-[var(--color-brick)]" : "text-muted-foreground")}>{job.company.name} · {deadline.label}</p>
     </div>
     {canApply && !closed ? (
      job.applicationUrl ? (
       <Button className="h-11 shrink-0 rounded-full px-6 font-semibold" asChild>
        <Link href={`/private-jobs/${job.slug}/apply`} target="_blank" rel="noopener noreferrer" onClick={() => trackClick("APPLY")}>Apply now <ExternalLink className="ml-1.5 h-4 w-4" /></Link>
       </Button>
      ) : (
       <Button className="h-11 shrink-0 rounded-full px-6 font-semibold" asChild>
        <a href={`mailto:${job.applicationEmail}`} onClick={() => trackClick("EMAIL")}>Apply by email</a>
       </Button>
      )
     ) : null}
    </div>
   </div>
  </div>
 )
}
