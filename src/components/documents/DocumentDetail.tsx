"use client"

import { useEffect, useState, type CSSProperties, type ReactNode } from "react"
import Link from "next/link"
import {
 BookOpen, Building2, CalendarCheck, CalendarClock, CalendarDays, CalendarPlus, ExternalLink,
 FileCheck2, FileText, GraduationCap, KeyRound, ListChecks, Ticket, Wallet, Info, Tag,
 type LucideIcon,
} from "lucide-react"
import { formatDate, cn } from "@/lib/utils"
import { handFont, typeFont } from "@/components/home/fonts"
import { HandTick, paperShadow } from "@/components/desk/DeskKit"
import { DocArt, SKINS } from "@/components/documents/doc-skins"
import { BookmarkButton } from "@/components/layout/BookmarkButton"
import { EntityViewTracker, type TrackedEntityType } from "@/components/analytics/EntityViewTracker"
import { ApplicationTracker } from "@/components/jobs/ApplicationTracker"
import { JobFollowBell } from "@/components/jobs/JobFollowBell"
import { DocumentSideRail } from "@/components/documents/DocumentSideRail"
import { DocumentJourney } from "@/components/documents/DocumentJourney"
import { TopicChecklist } from "@/components/documents/TopicChecklist"
import { Button } from "@/components/ui/button"
import { RichTextView } from "@/components/shared/RichTextView"
import { useActiveSection } from "@/components/shared/useActiveSection"
import { shortFact } from "@/lib/job-insights"
import { getDocState, type DocKind, type PrimaryDateMode } from "@/lib/doc-state"
import type { JourneyStage } from "@/lib/doc-journey"

interface DetailRow {
 label: string
 value: string | null
}

interface LinkRow {
 label: string
 value: string
 href: string
}

interface RelatedItem {
 href: string
 title: string
 department: string
 meta: string | null
}

interface DocumentDetailProps {
 kind: DocKind
 title: string
 department: string
 category?: string | null
 description?: string | null
 rows: DetailRow[]
 linkRows?: LinkRow[]
 list?: { label: string; items: string[] } | null
 downloadUrl?: string | null
 downloadLabel: string
 /** Fullscreen viewer route (e.g. `/result/[slug]/view`). Used only when a download URL exists. */
 viewerHref?: string | null
 countdownDate?: string | null
 countdownLabel?: string
 bookmarkId?: { type: "result" | "admit-card"; id: string } | null
 bookmarkSyllabusId?: string | null
 application?: { type: "admission"; id: string } | null
 followJob?: { jobId: string } | null
 relatedTitle: string
 relatedItems: RelatedItem[]
 primaryDate?: string | null
 primaryDateLabel?: string
 primaryDateMode?: PrimaryDateMode
 windowStart?: string | null
 publishedAt?: string | null
 tracking?: { entityType: TrackedEntityType; entityId: string } | null
 /** Notification -> syllabus -> admit card -> answer key -> result, built from the linked job. */
 journey?: JourneyStage[] | null
}

const KIND_CONFIG: Record<DocKind, { badge: string; icon: LucideIcon; listHref: string; listLabel: string }> = {
 result: { badge: "Result", icon: FileCheck2, listHref: "/results", listLabel: "All results" },
 "admit-card": { badge: "Admit card", icon: Ticket, listHref: "/admit-cards", listLabel: "All admit cards" },
 "answer-key": { badge: "Answer key", icon: KeyRound, listHref: "/answer-keys", listLabel: "All answer keys" },
 syllabus: { badge: "Syllabus", icon: BookOpen, listHref: "/syllabus", listLabel: "All syllabus" },
 admission: { badge: "Admission", icon: GraduationCap, listHref: "/admissions", listLabel: "All admissions" },
}

/** General, kind-level guidance only - never presented as notice-specific facts. */
const GUIDE: Partial<Record<DocKind, { title: string; items: string[] }>> = {
 "admit-card": {
  title: "Exam-day checklist",
  items: [
   "Printed admit card - check name, roll number, centre and reporting time.",
   "Original photo ID of the type named in the notice.",
   "Passport-size photographs, if the notice asks for them.",
   "Reach the centre early; gates usually close before the exam starts.",
  ],
 },
 result: {
  title: "After the result",
  items: [
   "Search your roll number or name inside the official PDF.",
   "Note the cut-off and merit details if they are published.",
   "Watch the official site for document verification or next-stage dates.",
   "Save the PDF - you may need it later.",
  ],
 },
 "answer-key": {
  title: "Using this answer key",
  items: [
   "Match your marked responses against the key.",
   "Work out your score using the marking scheme in the notice.",
   "If objections are allowed, raise them on the official site within the window.",
   "A provisional key can change - watch for the final key.",
  ],
 },
 admission: {
  title: "Before you apply",
  items: [
   "Read eligibility and fee details in the official notification.",
   "Keep scanned documents and a recent photograph ready.",
   "Apply well before the last date - servers get slow near the deadline.",
  ],
 },
}

const tileIcon = (label: string): LucideIcon => {
 if (/result/i.test(label)) return CalendarCheck
 if (/exam/i.test(label)) return CalendarDays
 if (/start|begin|open/i.test(label)) return CalendarPlus
 if (/last|clos/i.test(label)) return CalendarClock
 if (/fee/i.test(label)) return Wallet
 if (/status/i.test(label)) return FileCheck2
 return Tag
}

function Section({ id, n, accent, notebook, icon: Icon, title, hint, children }: { id: string; n?: number; accent?: string; notebook?: boolean; icon: LucideIcon; title: string; hint?: string; children: ReactNode }) {
 return (
  <section
   id={id}
   className="relative scroll-mt-32 overflow-hidden rounded-[3px] border border-[var(--hs-border)] bg-[var(--hs-paper-slip)]"
   style={{ boxShadow: paperShadow }}
  >
   {notebook ? <span className="pointer-events-none absolute bottom-0 left-[2.1rem] top-0 w-px bg-[oklch(62%_0.17_25/0.45)] sm:left-[2.6rem]" aria-hidden /> : null}
   <header className={cn("flex flex-wrap items-baseline gap-x-3 gap-y-1 pb-3 pr-5 pt-5 sm:pr-7", notebook ? "pl-12 sm:pl-14" : "pl-5 sm:pl-7")}>
    <span className={cn(typeFont.className, "text-[11px] font-bold")} style={{ color: accent }}>§ {String(n ?? 1).padStart(2, "0")}</span>
    <h2 className="flex items-center gap-2 font-display text-[1.35rem] font-black leading-tight text-foreground">
     {title}
     <Icon className="h-4 w-4 text-muted-foreground/70" aria-hidden />
    </h2>
    {hint ? <span className={cn(handFont.className, "ml-auto hidden text-[1rem] text-muted-foreground sm:block")}>{hint}</span> : null}
   </header>
   <div className={cn("border-t border-dashed border-[var(--hs-border-strong)]", notebook ? "ml-12 mr-5 sm:ml-14 sm:mr-7" : "mx-5 sm:mx-7")} />
   <div className={cn("pb-6 pr-5 pt-5 sm:pr-7", notebook ? "pl-12 sm:pl-14" : "pl-5 sm:pl-7")}>{children}</div>
  </section>
 )
}

export function DocumentDetail({
 kind, title, department, category, description, rows, linkRows = [], list, downloadUrl, downloadLabel,
 viewerHref = null, countdownDate, bookmarkId, bookmarkSyllabusId, application, followJob,
 relatedTitle, relatedItems, primaryDate = null, primaryDateMode = "date", windowStart = null,
 publishedAt = null, tracking = null, journey = null,
}: DocumentDetailProps) {
 const config = KIND_CONFIG[kind]
 const [now, setNow] = useState(() => Date.now())
 useEffect(() => {
  const t = setInterval(() => setNow(Date.now()), 60000)
  return () => clearInterval(t)
 }, [])

 const hasFile = Boolean(downloadUrl)
 /* One comma-separated line is really a list of topics. */
 const topics = (() => {
  const items = list?.items ?? []
  return items.length === 1 && /[,;]/.test(items[0]) ? items[0].split(/[,;]s*/).map((t) => t.trim()).filter(Boolean) : items
 })()
 const dateForState = kind === "admission" ? (countdownDate ?? primaryDate) : primaryDate
 const state = getDocState({ kind, hasFile, hasContent: hasFile || topics.length > 0, primaryDate: dateForState ?? null, primaryDateMode, windowStart, nowMs: now })
 const viewerActive = Boolean(viewerHref && downloadUrl)

 /* Department + category already live in the hero - the rest become tiles (short) or sections (long). */
 /* A status that only says "published/available" repeats the status pill - keep informative ones (Provisional, Final...). */
 const GENERIC_STATUS = /^(published|available|active|out|declared|released|live|open)$/i
 const dataRows = rows.filter((r) => r.value && !/^(department|category)$/i.test(r.label) && !(/status/i.test(r.label) && GENERIC_STATUS.test(r.value.trim())))
 const primaryFormatted = dateForState ? formatDate(dateForState) : null
 const tiles = dataRows
  .map((r) => ({ ...r, short: shortFact(r.value, 44) }))
  .filter((r) => r.short)
  .map((r) => ({
   label: r.label,
   value: r.short as string,
   icon: tileIcon(r.label),
   sub: r.value !== primaryFormatted ? null
    : primaryDateMode === "since" ? (state.sub?.split(" · ")[0] ?? null)
    : primaryDateMode === "countdown" ? state.headline
    : null,
   hot: r.value === primaryFormatted && state.tone === "hot",
  }))
 const longRows = dataRows.filter((r) => !shortFact(r.value, 44))

 /* Post-release guidance only makes sense once the document is out; admit-card/admission prep is useful beforehand. */
 const guideShown = Boolean(GUIDE[kind]) && (kind === "admit-card" || kind === "admission" || state.tone === "ok")
 const guide = guideShown ? GUIDE[kind] : undefined
 const sections = [
  { id: "journey", label: "Journey", show: Boolean(journey) },
  { id: "topics", label: list?.label || "Topics", show: topics.length > 0 },
  ...longRows.map((r, i) => ({ id: `row-${i}`, label: r.label, show: true })),
  { id: "about", label: "About", show: Boolean(description) },
  { id: "guide", label: GUIDE[kind]?.title ?? "", show: Boolean(guideShown) },
 ].filter((s) => s.show)
 const active = useActiveSection(sections.map((s) => s.id))
 const goTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })

 const actionNodes = (
  <>
   {application && <ApplicationTracker jobId={application.id} type="admission" variant="full" />}
   {followJob && <JobFollowBell jobId={followJob.jobId} />}
   {bookmarkSyllabusId && <BookmarkButton syllabusId={bookmarkSyllabusId} size="default" variant="outline" />}
   {bookmarkId && (
    <BookmarkButton
     resultId={bookmarkId.type === "result" ? bookmarkId.id : undefined}
     admitCardId={bookmarkId.type === "admit-card" ? bookmarkId.id : undefined}
     size="default"
     variant="outline"
    />
   )}
  </>
 )

 const skin = SKINS[kind]
 const accent = skin.accent
 const num = (id: string) => sections.findIndex((s) => s.id === id) + 1
 const stampTone = state.tone === "hot" ? "var(--color-brick)" : state.tone === "ok" ? accent : "oklch(50% 0.02 60)"

 return (
  <div className="home-saas" style={{ ["--doc-accent" as string]: accent } as CSSProperties}>
  {/* Rail + content only: the sticky rail must never share a grid with anything below it. */}
  <div className="grid items-start gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1fr)_340px]">
   {tracking ? <EntityViewTracker entityType={tracking.entityType} entityId={tracking.entityId} /> : null}

   <div className="min-w-0 space-y-8">
    {/* ── Hero: the paper itself ── */}
    <header>
     <div className={cn(typeFont.className, "flex flex-wrap items-center gap-x-4 gap-y-1 border-y-2 border-double border-[var(--hs-border-strong)] py-1.5 text-[11px] font-bold uppercase text-foreground/70")}>
      <span className="inline-flex items-center gap-1.5" style={{ color: accent }}><config.icon className="h-3.5 w-3.5" /> {skin.kicker}</span>
      {category ? <span>{category}</span> : null}
      <span className="ml-auto inline-flex items-center gap-1.5">
       <span className={cn("h-1.5 w-1.5 rounded-full", state.tone === "hot" && "animate-pulse")} style={{ background: stampTone }} />
       {state.pill}
      </span>
     </div>

     <div className="mt-6 flex items-start justify-between gap-6">
      <div className="min-w-0 flex-1">
       <p className={cn(typeFont.className, "inline-flex items-center gap-1.5 text-[12.5px] font-bold uppercase text-muted-foreground")}>
        <Building2 className="h-3.5 w-3.5" />{department}
       </p>
       <h1 className="mt-2 font-display text-[2rem] font-black leading-[1.08] text-foreground sm:text-[2.6rem]">{title}</h1>
       <p className={cn(handFont.className, "mt-3 text-[1.15rem] leading-snug")} style={{ color: accent }}>{skin.note}</p>
       {linkRows.length > 0 ? (
        <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
         {linkRows.map((l) => (
          <Link key={l.label} href={l.href} className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-dashed border-[var(--hs-border-strong)] px-3 py-1 transition-colors hover:border-solid hover:text-foreground" style={{ ["--tw-ring-color" as string]: accent }} title={l.value}>
           <ExternalLink className="h-3.5 w-3.5 shrink-0" /> <span className="truncate"><b className="font-semibold text-foreground">{l.label}:</b> {l.value}</span>
          </Link>
         ))}
        </p>
       ) : null}
       {/* Mobile/tablet: desktop gets these in the rail */}
       <div className="mt-5 flex flex-wrap items-center gap-2 lg:hidden print:hidden">{actionNodes}</div>
      </div>
      <DocArt kind={kind} department={department} date={primaryFormatted} pill={state.pill} accent={accent} />
     </div>
    </header>

    {/* ── Key facts: one ticket strip ── */}
    {tiles.length > 0 ? (
     <div className="rounded-[4px] border border-[var(--hs-border-strong)] bg-[var(--hs-paper-slip)]" style={{ boxShadow: paperShadow }}>
      <p className={cn(typeFont.className, "border-b border-dashed border-[var(--hs-border-strong)] px-5 py-2 text-[10.5px] font-bold tracking-[0.25em] text-muted-foreground")}>AT A GLANCE</p>
      <dl className={cn("grid", tiles.length === 1 ? "grid-cols-1" : "grid-cols-2", tiles.length === 2 ? "sm:grid-cols-2" : tiles.length === 4 ? "sm:grid-cols-4" : tiles.length >= 3 ? "sm:grid-cols-3" : "")}>
       {tiles.map((t, i) => (
        <div key={t.label} className={cn("min-w-0 border-dashed border-[var(--hs-border-strong)] px-5 py-4", i > 0 && "border-l", i >= 2 && "max-sm:border-t", i % 2 === 0 && "max-sm:border-l-0", tiles.length !== 4 && i >= 3 && "sm:border-t", tiles.length !== 4 && i === 3 && "sm:border-l-0")}>
         <dt className={cn(typeFont.className, "flex items-center gap-1.5 text-[10.5px] font-bold uppercase text-muted-foreground")}><t.icon className="h-3.5 w-3.5" /> {t.label}</dt>
         <dd className={cn("mt-2 font-display text-[1.3rem] font-black leading-tight tabular-nums sm:text-[1.5rem]", t.hot ? "text-[var(--color-brick)]" : "text-foreground")}>
          {t.sub || t.hot ? (
           <span className="relative inline-block">
            {t.value}
            <svg viewBox="0 0 120 8" preserveAspectRatio="none" className="absolute -bottom-1.5 left-0 h-2 w-full" aria-hidden>
             <path d="M2 5 C 30 2, 60 7, 118 3" stroke={t.hot ? "var(--color-brick)" : accent} strokeWidth="2" fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            </svg>
           </span>
          ) : t.value}
         </dd>
         {t.sub ? <p className={cn(handFont.className, "mt-1.5 text-[1rem] leading-tight", t.hot ? "text-[var(--color-brick)]" : "text-muted-foreground")}>{t.sub}</p> : null}
        </div>
       ))}
      </dl>
     </div>
    ) : null}

    {sections.length > 2 ? (
     <nav aria-label="Sections" className="sticky top-[65px] z-30 -mx-4 border-b border-[var(--hs-border-strong)] bg-background/95 px-4 pt-2 backdrop-blur print:hidden sm:mx-0 sm:px-0">
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
          <span className={cn(typeFont.className, "mr-1.5 text-[10px]")} style={{ color: active === s.id ? accent : undefined }}>{String(i + 1).padStart(2, "0")}</span>
          {s.label}
         </button>
        </li>
       ))}
      </ul>
     </nav>
    ) : null}

    {journey ? <div id="journey" className="scroll-mt-32"><DocumentJourney stages={journey} /></div> : null}

    {topics.length > 0 ? (
     <Section id="topics" n={num("topics")} accent={accent} icon={BookOpen} title={list?.label || "Topics"} hint="tick as you study · saved on this device" notebook={kind === "syllabus"}>
      <TopicChecklist storageKey={tracking?.entityId ?? title} items={topics} />
     </Section>
    ) : null}

    {longRows.map((r, i) => (
     <Section key={r.label} id={`row-${i}`} n={num(`row-${i}`)} accent={accent} icon={r.label.match(/fee/i) ? Wallet : ListChecks} title={r.label}>
      <RichTextView html={r.value} />
     </Section>
    ))}

    {description ? (
     <Section id="about" n={num("about")} accent={accent} icon={FileText} title={`About this ${config.badge.toLowerCase()}`}>
      <RichTextView html={description} />
     </Section>
    ) : null}

    {guide ? (
     <section id="guide" className="relative mx-auto max-w-xl scroll-mt-32 -rotate-[0.6deg] px-6 pb-6 pt-7 text-[oklch(28%_0.03_60)]" style={{ background: skin.guidePaper, boxShadow: "0 1px 1px rgb(60 40 10 / .1), 0 18px 28px -20px rgb(60 40 10 / .55)" }}>
      <span className="absolute -top-2.5 left-1/2 h-6 w-24 -translate-x-1/2 rotate-[-2deg] bg-[oklch(92%_0.04_90/0.75)] shadow-[0_1px_2px_rgb(0_0_0/.12)]" aria-hidden />
      <h2 className={cn(handFont.className, "text-[1.5rem] leading-tight")}>{guide.title}</h2>
      <ul className="mt-3 space-y-2.5">
       {guide.items.map((g) => (
        <li key={g} className="flex items-start gap-3 text-[14.5px] leading-snug">
         <HandTick className="mt-0.5 h-4 w-5 shrink-0" draw={false} />
         {g}
        </li>
       ))}
      </ul>
      <p className={cn(handFont.className, "mt-4 text-[0.98rem] opacity-70")}>general guidance. your official notice always wins.</p>
     </section>
    ) : null}

    {tiles.length === 0 && sections.length === 0 && !hasFile ? (
     <div className="flex items-start gap-3 rounded-[3px] border border-dashed border-[var(--hs-border-strong)] bg-[var(--hs-paper-slip)] p-5 text-sm text-muted-foreground">
      <Info className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
       <p className={cn(handFont.className, "text-[1.2rem] text-foreground")}>Nothing printed on this sheet yet.</p>
       <p className="mt-1">Details for this {config.badge.toLowerCase()} are not published yet. Check back soon or follow the linked job for updates.</p>
      </div>
     </div>
    ) : null}
   </div>

   <DocumentSideRail
    title={title}
    department={department}
    downloadUrl={downloadUrl}
    downloadLabel={downloadLabel}
    viewerHref={viewerActive ? viewerHref : null}
    publishedAt={publishedAt}
    state={state}
    actions={actionNodes}
    accent={accent}
   />

  </div>

   {/* ── Related (full width, below) ── */}
   {relatedItems.length > 0 ? (
    <section className="mt-16">
     <div className="mb-7 flex flex-wrap items-end justify-between gap-3 border-b border-dashed border-[var(--hs-border-strong)] pb-3">
      <div>
       <p className={cn(handFont.className, "text-[1.15rem]")} style={{ color: accent }}>{skin.relatedNote}</p>
       <h2 className="font-display text-[1.6rem] font-black leading-tight text-foreground">{relatedTitle}</h2>
      </div>
      <Link href={config.listHref} className={cn(handFont.className, "shrink-0 text-[1.1rem] text-[var(--hs-trust)] underline decoration-wavy decoration-1 underline-offset-4 hover:text-[var(--color-brick)]")}>{config.listLabel.toLowerCase()} →</Link>
     </div>
     <div className="grid gap-6 sm:grid-cols-2">
      {relatedItems.map((item, i) => (
       <Link
        key={item.href}
        href={item.href}
        className={cn("group relative block rounded-[3px] border border-[var(--hs-border)] bg-[var(--hs-paper-slip)] px-5 pb-4 pt-5 transition-transform duration-300 hover:-translate-y-1", i % 3 === 1 ? "rotate-[0.5deg]" : i % 3 === 2 ? "-rotate-[0.4deg]" : "")}
        style={{ boxShadow: paperShadow }}
       >
        <span className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full shadow-[1px_2px_2px_rgb(0_0_0/.3)]" style={{ background: `radial-gradient(circle at 35% 30%, color-mix(in oklch, ${accent} 55%, white), ${accent})` }} aria-hidden />
        <span className={cn(typeFont.className, "line-clamp-1 text-[10.5px] font-bold uppercase text-muted-foreground")}>{item.department}</span>
        <h3 className="mt-1.5 line-clamp-2 font-display text-[1.08rem] font-bold leading-snug text-foreground group-hover:underline group-hover:underline-offset-2" style={{ textDecorationColor: accent }}>{item.title}</h3>
        {item.meta ? <p className={cn(typeFont.className, "mt-2 line-clamp-2 text-[11.5px] text-muted-foreground")}>{item.meta}</p> : null}
       </Link>
      ))}
     </div>
    </section>
   ) : null}

   {/* ── Mobile bar ── */}
   <div className="sticky bottom-0 z-40 -mx-4 border-t border-[var(--hs-border-strong)] bg-background/95 backdrop-blur print:hidden lg:hidden">
    {state.progress !== null ? (
     <div className="h-1 w-full bg-[var(--hs-surface-2)]" role="progressbar" aria-valuenow={state.progress} aria-valuemin={0} aria-valuemax={100} aria-label="Application window elapsed">
      <div className="h-full" style={{ width: `${state.progress}%`, background: state.tone === "hot" ? "var(--color-brick)" : accent }} />
     </div>
    ) : null}
    <div className="flex items-center gap-3 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
     <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold text-foreground">{title}</p>
      <p className={cn(handFont.className, "text-[1rem] leading-tight", state.tone === "hot" ? "text-[var(--color-brick)]" : "text-muted-foreground")}>{state.headline}</p>
     </div>
     {downloadUrl ? (
      <Button className="h-11 shrink-0 rounded-full px-6 font-semibold" asChild>
       {viewerActive ? (
        <Link href={viewerHref as string} target="_blank" rel="noopener noreferrer"><FileText className="mr-1.5 h-4 w-4" /> Open</Link>
       ) : (
        <a href={downloadUrl} target="_blank" rel="noopener noreferrer"><FileText className="mr-1.5 h-4 w-4" /> Open</a>
       )}
      </Button>
     ) : null}
    </div>
   </div>
  </div>
 )
}
