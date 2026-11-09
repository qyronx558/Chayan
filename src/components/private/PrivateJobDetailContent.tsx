"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import {
 Briefcase, Building2, CalendarClock, CalendarPlus, Check, ChevronDown, ExternalLink, FileText,
 GraduationCap, IndianRupee, Layers, MapPin, Navigation, Route, Sparkles, UserRound, Users, Wifi,
 type LucideIcon,
} from "lucide-react"
import { formatDate, cn } from "@/lib/utils"
import { PrivateTracker } from "@/components/private/PrivateTracker"
import { BookmarkButton } from "@/components/layout/BookmarkButton"
import { PrivateApplyRail } from "@/components/private/PrivateApplyRail"
import { MatchScoreBar } from "@/components/private/MatchScoreBar"
import { PrepKit } from "@/components/private/PrepKit"
import { RichTextView } from "@/components/shared/RichTextView"
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
 description?: string | null; location?: string | null; salary?: string | null
 salaryMin?: number | null; salaryMax?: number | null
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

function Section({ id, icon: Icon, title, hint, children }: { id: string; icon: LucideIcon; title: string; hint?: string; children: ReactNode }) {
 return (
  <section id={id} className="scroll-mt-32 border border-rule bg-card">
   <header className="flex items-center gap-3 border-b border-rule px-4 py-3 sm:px-5">
    <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-ink text-paper"><Icon className="h-4 w-4" /></span>
    <h2 className="font-display text-lg font-bold leading-none text-foreground">{title}</h2>
    {hint ? <span className="agate ml-auto hidden text-[11px] text-muted-foreground sm:block">{hint}</span> : null}
   </header>
   <div className="p-4 sm:p-5">{children}</div>
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
    {!open && overflowing ? <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-card to-transparent" /> : null}
   </div>
   {overflowing ? (
    <button type="button" onClick={() => setOpen((v) => !v)} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground underline-offset-4 hover:text-brick hover:underline print:hidden" aria-expanded={open}>
     {open ? "Show less" : "Show full description"} <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
    </button>
   ) : null}
  </div>
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
 const salary = formatSalaryRange(job.salaryMin, job.salaryMax, job.salary)
 const expRange = job.expMin !== null && job.expMin !== undefined ? `${job.expMin}–${job.expMax ?? job.expMin} yrs` : null
 const experience = job.experience || expRange

 const deadline = getDeadline(null, job.lastDate ?? null, job.status, now)
 const closed = deadline.state === "closed"
 const urgent = deadline.state === "urgent"
 const canApply = Boolean(job.applicationUrl || job.applicationEmail)
 const verified = job.company.verifiedStatus === "VERIFIED"
 const posted = postedAgo(job.createdAt, now)
 const isNew = posted === "Posted today" || posted === "Posted yesterday"

 /* ── Short -> tile. Long -> requirements section. Never both. ── */
 const salaryTile = shortFact(salary, 30)
 const expTile = shortFact(experience, 24)
 const facts = [
  salaryTile ? { icon: IndianRupee, label: "Salary", value: salaryTile } : null,
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

 return (
  <div className="grid items-start gap-x-8 gap-y-6 lg:grid-cols-[minmax(0,1fr)_340px]">
   <div className="min-w-0 space-y-6">
    {/* ── Hero ── */}
    <header>
     <div className="flex items-start gap-4">
      {job.company.logo ? (
       // eslint-disable-next-line @next/next/no-img-element
       <img src={job.company.logo} alt="" className="h-14 w-14 shrink-0 border border-rule bg-card object-contain p-1" />
      ) : (
       <span aria-hidden className="flex h-14 w-14 shrink-0 items-center justify-center border border-rule bg-ink font-display text-xl font-bold text-paper">
        {job.company.name.trim().charAt(0).toUpperCase()}
       </span>
      )}
      <div className="min-w-0">
       <div className="flex flex-wrap items-center gap-1.5">
        <span className={cn("agate inline-flex items-center gap-1.5 border px-2 py-0.5 text-[11px] uppercase tracking-wider", pill.cls)}>
         <span className={cn("h-1.5 w-1.5 rounded-full bg-current", urgent && "animate-pulse")} /> {pill.text}
        </span>
        {job.isFresherFriendly ? <span className="agate border border-rule px-2 py-0.5 text-[11px] uppercase tracking-wider text-foreground">Fresher friendly</span> : null}
        {job.isWalkIn ? <span className="agate border border-brick px-2 py-0.5 text-[11px] uppercase tracking-wider text-brick">Walk-in</span> : null}
        {job.category ? <span className="agate border border-rule px-2 py-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">{job.category}</span> : null}
       </div>
       <h1 className="mt-3 font-display text-[1.75rem] font-bold leading-[1.1] text-foreground sm:text-[2.4rem]">{job.title}</h1>
      </div>
     </div>

     <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
       <Building2 className="h-4 w-4" />
       {job.company.slug ? (
        <Link href={`/companies/${job.company.slug}`} className="font-semibold text-foreground underline-offset-4 hover:text-brick hover:underline">{job.company.name}</Link>
       ) : (
        <span className="font-semibold text-foreground">{job.company.name}</span>
       )}
       {verified ? <span className="agate inline-flex items-center gap-0.5 text-[11px] text-foreground"><Check className="h-3 w-3" /> Verified</span> : null}
      </span>
      {job.location ? <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{job.location}</span> : null}
      {posted ? <span className={cn("agate text-xs", isNew && "font-semibold text-foreground")}>{posted}{isNew && !closed ? " · early applicants get noticed" : ""}</span> : null}
     </p>

     <div className="mt-4 flex items-center gap-2 lg:hidden print:hidden">
      <PrivateTracker privateJobId={job.id} variant="full" />
      <BookmarkButton privateJobId={job.id} size="icon" variant="outline" />
     </div>
    </header>

    {/* ── Key facts ── */}
    <dl className={cn("grid grid-cols-2 border-b border-r border-rule bg-card", facts.length === 4 ? "sm:grid-cols-2" : "sm:grid-cols-3")}>
     {facts.map((f) => (
      <div key={f.label} className="min-w-0 border-l border-t border-rule px-4 py-3.5">
       <dt className="agate flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground"><f.icon className="h-3.5 w-3.5" /> {f.label}</dt>
       <dd className={cn("mt-1.5 font-display text-xl font-bold leading-tight tabular-nums sm:text-2xl", "hot" in f && f.hot ? "text-brick" : "text-foreground")}>{f.value}</dd>
       {"sub" in f && f.sub ? <p className={cn("agate mt-0.5 text-xs", "hot" in f && f.hot ? "font-semibold text-brick" : "text-muted-foreground")}>{f.sub}</p> : null}
      </div>
     ))}
    </dl>

    {/* ── Walk-in: date, venue, directions, calendar - everything to show up prepared ── */}
    {job.isWalkIn && (job.walkInVenue || job.walkInDate) ? (
     <div className="border border-brick bg-card">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 p-4 sm:p-5">
       <div className="min-w-0 flex-1">
        <p className="agate text-[11px] uppercase tracking-wider text-brick">Walk-in interview</p>
        <p className="mt-1 font-display text-xl font-bold text-foreground">{job.walkInDate ? formatDate(job.walkInDate) : "Date to be confirmed"}</p>
        {job.walkInVenue ? <p className="mt-1 text-sm text-muted-foreground">{job.walkInVenue}</p> : null}
        <p className="mt-2 text-sm text-foreground">Carry resume copies and a photo ID.</p>
       </div>
       <div className="flex flex-wrap gap-2 print:hidden">
        {mapsUrl ? (
         <Button variant="outline" size="sm" asChild>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer"><Navigation className="mr-1.5 h-4 w-4" /> Directions</a>
         </Button>
        ) : null}
        {calendarUrl ? (
         <Button variant="outline" size="sm" asChild>
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
     <nav aria-label="Job sections" className="sticky top-[65px] z-30 -mx-4 border-b border-rule bg-background/95 px-4 backdrop-blur print:hidden sm:mx-0 sm:px-0">
      <ul className="flex gap-1 overflow-x-auto">
       {sections.map((s) => (
        <li key={s.id} className="shrink-0">
         <button type="button" onClick={() => goTo(s.id)} className={cn("relative px-3 py-3 text-[13px] font-medium transition-colors", active === s.id ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>
          {s.label}
          <span className={cn("absolute inset-x-3 -bottom-px h-0.5", active === s.id ? "bg-brick" : "bg-transparent")} />
         </button>
        </li>
       ))}
      </ul>
     </nav>
    ) : null}

    {/* ── Description: the main content of a private job ── */}
    {job.description ? (
     <Section id="overview" icon={FileText} title="About the role">
      <ClampedText><RichTextView html={job.description} /></ClampedText>
     </Section>
    ) : null}

    {/* ── Requirements ── */}
    {hasRequirements ? (
     <Section id="requirements" icon={GraduationCap} title="Requirements">
      <dl className="divide-y divide-rule">
       {job.qualification ? (
        <div className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
         <dt className="flex items-center gap-2 text-sm font-semibold text-foreground"><GraduationCap className="h-4 w-4 text-muted-foreground" /> Qualification</dt>
         <dd className="min-w-0 text-sm"><RichTextView html={job.qualification} /></dd>
        </div>
       ) : null}
       {!expTile && experience ? (
        <div className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
         <dt className="flex items-center gap-2 text-sm font-semibold text-foreground"><Briefcase className="h-4 w-4 text-muted-foreground" /> Experience</dt>
         <dd className="min-w-0 text-sm"><RichTextView html={experience} /></dd>
        </div>
       ) : null}
       {!salaryTile && salary ? (
        <div className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
         <dt className="flex items-center gap-2 text-sm font-semibold text-foreground"><IndianRupee className="h-4 w-4 text-muted-foreground" /> Salary</dt>
         <dd className="min-w-0 text-sm"><RichTextView html={salary} /></dd>
        </div>
       ) : null}
       {job.isFresherFriendly ? (
        <div className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
         <dt className="flex items-center gap-2 text-sm font-semibold text-foreground"><UserRound className="h-4 w-4 text-muted-foreground" /> Freshers</dt>
         <dd className="text-sm text-foreground">Freshers can apply for this role.</dd>
        </div>
       ) : null}
       {skills.length > 0 ? (
        <div className="grid gap-2 py-3 first:pt-0 last:pb-0 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
         <dt className="flex items-center gap-2 text-sm font-semibold text-foreground"><Sparkles className="h-4 w-4 text-muted-foreground" /> Skills</dt>
         <dd className="flex flex-wrap gap-1.5">
          {skills.map((s) => (
           <span key={s} className="agate border border-rule px-2 py-0.5 text-xs text-foreground">{s}</span>
          ))}
         </dd>
        </div>
       ) : null}
      </dl>
     </Section>
    ) : null}

    {/* ── How to apply ── */}
    {howSteps.length > 0 ? (
     <Section id="how-to-apply" icon={Route} title="How to apply">
      <ol className="space-y-4">
       {howSteps.map((step, i) => (
        <li key={i} className="flex gap-3.5">
         <span className="agate flex h-7 w-7 shrink-0 items-center justify-center bg-ink text-xs text-paper">{i + 1}</span>
         <p className="pt-0.5 text-sm leading-relaxed text-foreground">{step}</p>
        </li>
       ))}
      </ol>
     </Section>
    ) : null}

    {/* ── Company ── */}
    <Section id="company" icon={Building2} title={`About ${job.company.name}`}>
     {(job.company.industry || job.company.size || job.company.hq || job.company.responseRate != null) ? (
      <dl className="mb-4 grid grid-cols-2 border-b border-r border-rule sm:grid-cols-4">
       {[
        job.company.industry ? { l: "Industry", v: job.company.industry } : null,
        job.company.size ? { l: "Company size", v: job.company.size } : null,
        job.company.hq ? { l: "Headquarters", v: job.company.hq } : null,
        job.company.responseRate != null ? { l: "Replies to", v: `${job.company.responseRate}% applicants` } : null,
       ].filter((x): x is { l: string; v: string } => x !== null).map((x) => (
        <div key={x.l} className="min-w-0 border-l border-t border-rule px-3 py-2.5">
         <dt className="agate text-[11px] uppercase tracking-wider text-muted-foreground">{x.l}</dt>
         <dd className="mt-0.5 truncate text-sm font-semibold text-foreground" title={x.v}>{x.v}</dd>
        </div>
       ))}
      </dl>
     ) : null}
     {job.company.description ? (
      containsHtml(job.company.description) ? <RichTextView html={job.company.description} /> : <p className="text-sm leading-relaxed text-muted-foreground">{job.company.description}</p>
     ) : (
      <p className="text-sm text-muted-foreground">The employer has not added a company profile yet.</p>
     )}
     <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
      {job.company.website ? (
       <SmartExternalLink href={job.company.website} linkTitle={`${job.company.name} - official website`} className="inline-flex items-center gap-1.5 font-medium text-foreground underline underline-offset-4 hover:text-brick">
        <ExternalLink className="h-4 w-4" /> Company website
       </SmartExternalLink>
      ) : null}
      {job.company.slug ? (
       <Link href={`/companies/${job.company.slug}`} className="font-medium text-foreground underline underline-offset-4 hover:text-brick">All jobs at {job.company.name} →</Link>
      ) : null}
     </div>
    </Section>

    {/* ── Prep kit ── */}
    <Section id="prep" icon={Sparkles} title="Get hired faster" hint="Questions, checklist and an email template for this role">
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
   <div className="sticky bottom-0 z-40 -mx-4 border-t border-rule bg-background/95 backdrop-blur print:hidden lg:hidden lg:col-span-2">
    {deadline.progress !== null && !closed ? (
     <div className="h-1 w-full bg-paper-3" role="progressbar" aria-valuenow={deadline.progress} aria-valuemin={0} aria-valuemax={100} aria-label="Application window elapsed">
      <div className={cn("h-full", urgent ? "bg-brick" : "bg-ink")} style={{ width: `${deadline.progress}%` }} />
     </div>
    ) : null}
    <div className="flex items-center gap-3 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
     <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold text-foreground">{job.title}</p>
      <p className={cn("agate text-xs", closed || urgent ? "text-brick" : "text-muted-foreground")}>{job.company.name} · {deadline.label}</p>
     </div>
     {canApply && !closed ? (
      job.applicationUrl ? (
       <Button className="h-10 shrink-0 px-5 font-semibold" asChild>
        <Link href={`/private-jobs/${job.slug}/apply`} onClick={() => trackClick("APPLY")}>Apply now <ExternalLink className="ml-1.5 h-4 w-4" /></Link>
       </Button>
      ) : (
       <Button className="h-10 shrink-0 px-5 font-semibold" asChild>
        <a href={`mailto:${job.applicationEmail}`} onClick={() => trackClick("EMAIL")}>Apply by email</a>
       </Button>
      )
     ) : null}
    </div>
   </div>
  </div>
 )
}
