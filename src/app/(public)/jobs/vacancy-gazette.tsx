"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { cn, formatDate } from "@/lib/utils"
import { cleanTitle } from "@/lib/card-helpers"
import { handFont, typeFont } from "@/components/home/fonts"
import { daysLeft } from "@/components/home/HomeJobRow"
import { statePagePath } from "@/lib/locations"
import { PenLoop, PinnedChecklist, RubberStamp, paperShadow, tilt } from "@/components/desk/DeskKit"

/*
 * Sunday morning in a lot of Indian homes: someone brings in the vacancy
 * newspaper, and the one preparing sits with a pen, circling posts, writing
 * "eligible?" in the margin, cutting out the ones worth applying to. So the
 * government jobs page is that newspaper, and each job is a clipping with
 * the number of posts circled in pen.
 */

const newsprint = "color-mix(in oklch, oklch(80% 0.04 85) 12%, var(--hs-paper-slip))"

/* ───────────────────────── masthead ───────────────────────── */

export function VacancyMasthead({
  total,
  heading,
  intro,
  popularStates,
}: {
  total: number
  heading?: string
  intro?: string
  popularStates?: { slug: string; name: string }[]
}) {
  const today = new Date()
  return (
    <div>
      <div className="relative px-1">
        <div className={cn(typeFont.className, "flex flex-wrap items-center justify-between gap-2 border-y-2 border-foreground py-1 text-[10.5px] font-bold text-foreground/80")}>
          <span>ALL-INDIA EDITION</span>
          <span className="hidden sm:inline">{formatDate(today, "EEEE, d MMMM yyyy").toUpperCase()}</span>
          <span>{total > 0 ? `${total.toLocaleString("en-IN")} OPENINGS IN THIS ISSUE` : "FRESH ISSUE"}</span>
        </div>
        <h1 className="py-3 text-center font-display text-[2.3rem] font-black leading-none text-foreground sm:py-4 sm:text-[4.4rem]">
          {heading ?? "The Vacancy Page"}
        </h1>
        <div className="border-y border-foreground/70 py-[3px]">
          <div className="border-t border-foreground/70" />
        </div>
        <p className="mx-auto mt-4 max-w-2xl text-center text-[15.5px] leading-relaxed text-muted-foreground">
          {intro ?? "Every government vacancy we can verify, from all-India posts to your own district. Read it like the Sunday paper: slowly, with a pen."}
        </p>
        <p className={cn(handFont.className, "mt-2 text-center text-[1.2rem] text-[var(--color-brick)]")}>
          circle the ones you&apos;re eligible for. apply before the last date, not on it.
        </p>
      </div>

      {popularStates && (
        <section
          aria-labelledby="browse-by-state"
          className="relative mt-10 grid gap-5 rounded-[3px] border border-[var(--hs-border)] px-5 py-5 sm:grid-cols-[1fr_auto] sm:items-center sm:px-7"
          style={{ background: newsprint, boxShadow: paperShadow }}
        >
          {/* a pinned "local news" box, the way papers run the district page */}
          <div className="min-w-0">
            <p className={cn(typeFont.className, "text-[10.5px] font-bold text-[var(--color-brick)]")}>STATE &amp; DISTRICT PAGES</p>
            <h2 id="browse-by-state" className="mt-1 font-display text-[1.45rem] font-bold leading-tight text-foreground">
              Find jobs in your state &amp; district
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              28 states, 8 union territories and 780+ districts: state jobs, local district vacancies and all-India jobs in one place.
            </p>
            <div className="mt-3 flex flex-wrap gap-x-1 gap-y-1.5">
              {popularStates.map((s, i) => (
                <Link
                  key={s.slug}
                  href={statePagePath(s.slug)}
                  className={cn(
                    "rounded-full border border-dashed border-[var(--hs-border-strong)] bg-[var(--hs-surface)] px-3 py-0.5 text-[13px] text-foreground transition-colors hover:border-solid hover:border-[var(--color-brick)] hover:text-[var(--color-brick)]",
                    i % 2 ? "rotate-[0.8deg]" : "-rotate-[0.8deg]"
                  )}
                >
                  {s.name}
                </Link>
              ))}
            </div>
          </div>
          <Link
            href="/jobs/states"
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-ink)] px-5 py-3 text-sm font-semibold text-[var(--color-paper)] transition-transform hover:-translate-y-0.5"
          >
            Browse jobs by state
            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        </section>
      )}
    </div>
  )
}

/* ───────────────────────── aside ───────────────────────── */

const BEFORE_APPLY = [
  { id: "age", label: "My age is inside the limit (with relaxation)" },
  { id: "qual", label: "My qualification matches, exactly" },
  { id: "cert", label: "Category certificate is valid and recent" },
  { id: "docs", label: "Photo & signature resized to the spec" },
  { id: "fee", label: "Fee ready: UPI / card / challan" },
  { id: "mail", label: "Using an email & phone I'll keep for years" },
]

export function BeforeApplyChecklist() {
  return (
    <div className="space-y-3">
      <PinnedChecklist storageKey="ChayanJobs_before_apply_v1" title="Before you click apply:" items={BEFORE_APPLY} doneText="good. now apply, calmly." paper="green" />
      <Link href="/tools" className={cn(handFont.className, "block text-center text-[1.05rem] text-[var(--hs-trust)] underline decoration-wavy decoration-1 underline-offset-4")}>
        resize photo &amp; signature free →
      </Link>
    </div>
  )
}

/* ───────────────────────── the clipping ───────────────────────── */

export interface ClippingData {
  id: string
  title: string
  slug: string
  department: { name: string }
  totalVacancies: number | null
  lastDate: string | null
  salary: string | null
  status: "ACTIVE" | "EXPIRED" | "UPCOMING"
}

const STAMPS = {
  ACTIVE: { label: "APPLY NOW", tone: "oklch(45% 0.1 160)" },
  UPCOMING: { label: "COMING SOON", tone: "oklch(48% 0.12 250)" },
  EXPIRED: { label: "CLOSED", tone: "oklch(50% 0.02 60)" },
} as const

/* scissor-cut edges: never perfectly straight */
const CUTS = [
  "polygon(0.6% 1.2%, 38% 0, 71% 1%, 99.4% 0.2%, 100% 46%, 99.2% 99%, 62% 100%, 27% 99.2%, 0 100%, 0.8% 51%)",
  "polygon(0 0.4%, 44% 1.1%, 100% 0, 99.3% 38%, 100% 99.4%, 55% 99%, 0.4% 100%, 0 60%)",
  "polygon(0.4% 0, 57% 0.8%, 99.6% 0.4%, 100% 63%, 99.5% 100%, 33% 99.3%, 0 99.6%, 0.6% 33%)",
]

export function JobClipping({
  item,
  index,
  location,
  track,
  save,
  share,
}: {
  item: ClippingData
  index: number
  location: string
  track: ReactNode
  save: ReactNode
  share: ReactNode
}) {
  const title = cleanTitle(item.title)
  const href = `/apply/${item.slug}`
  const left = daysLeft(item.lastDate)
  const urgent = left !== null && left >= 0 && left <= 7
  const stamp = STAMPS[item.status] ?? STAMPS.ACTIVE
  const salary = item.salary?.replace(/\s+/g, " ").trim()

  return (
    <div className={cn("h-full transition-transform duration-300 hover:-translate-y-1", tilt(index))} style={{ filter: "drop-shadow(0 10px 14px rgb(60 40 10 / .16))" }}>
      <article className="group relative flex h-full flex-col" style={{ background: newsprint, clipPath: CUTS[index % CUTS.length] }}>
        <div className="flex-1 px-5 pb-4 pt-4">
          <div className={cn(typeFont.className, "flex items-center justify-between gap-3 border-b border-foreground/50 pb-1.5 text-[10px] font-bold text-foreground/70")}>
            <span className="truncate uppercase">{location}</span>
            <span className="shrink-0">GOVT. JOBS</span>
          </div>

          <p className={cn(typeFont.className, "mt-3 line-clamp-1 text-[11px] font-bold uppercase text-muted-foreground")}>{item.department.name}</p>
          <h3 className="mt-1 line-clamp-3 font-display text-[1.2rem] font-bold leading-[1.2] text-foreground">
            <Link href={href} className="decoration-[var(--color-brick)] decoration-2 underline-offset-[3px] after:absolute after:inset-0 after:content-[''] hover:underline">
              {title}
            </Link>
          </h3>

          <div className="mt-4 flex items-end justify-between gap-3">
            {/* number of posts, circled in pen */}
            <div className="relative px-3 py-1">
              {item.totalVacancies != null ? (
                <>
                  <span className="block font-display text-[1.8rem] font-black leading-none text-foreground">{item.totalVacancies.toLocaleString("en-IN")}</span>
                  <span className={cn(typeFont.className, "block text-[10px] text-muted-foreground")}>{item.totalVacancies === 1 ? "POST" : "POSTS"}</span>
                  <PenLoop className="-inset-x-1 -inset-y-1 h-[calc(100%+0.5rem)] w-[calc(100%+0.5rem)]" color="var(--color-brick)" />
                </>
              ) : (
                <span className={cn(handFont.className, "text-[1.05rem] text-muted-foreground")}>posts: see notice</span>
              )}
            </div>
            <RubberStamp label={stamp.label} tone={stamp.tone} className="mb-1" />
          </div>

          <dl className={cn(typeFont.className, "mt-4 space-y-1.5 text-[11px]")}>
            <div className="flex gap-2">
              <dt className="w-16 shrink-0 text-muted-foreground">Last date</dt>
              <dd className={cn(urgent ? "font-bold text-[var(--color-brick)]" : "text-foreground")}>
                {item.lastDate ? formatDate(item.lastDate, "d MMM yyyy") : "see notice"}
                {left !== null && left >= 0 && (
                  <span className={cn(handFont.className, "ml-2 text-[0.98rem] font-normal", urgent ? "text-[var(--color-brick)]" : "text-muted-foreground")}>
                    {left === 0 ? "today!" : `${left} days left`}
                  </span>
                )}
              </dd>
            </div>
            {salary && (
              <div className="flex gap-2">
                <dt className="w-16 shrink-0 text-muted-foreground">Pay</dt>
                <dd className="line-clamp-1 text-foreground">{salary}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-dashed border-foreground/35 px-5 pb-4 pt-3">
          <Link href={href} className={cn(handFont.className, "text-[1.1rem] text-[var(--hs-trust)] underline decoration-wavy decoration-1 underline-offset-4")}>
            read &amp; apply →
          </Link>
          <span className="ml-auto flex items-center gap-1">
            {track}
            {save}
            {share}
          </span>
        </div>
      </article>
    </div>
  )
}
