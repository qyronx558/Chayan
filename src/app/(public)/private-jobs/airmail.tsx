"use client"

import { useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import { BadgeCheck, ShieldAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import { handFont, typeFont } from "@/components/home/fonts"
import { BookmarkButton } from "@/components/layout/BookmarkButton"
import { CompanyLogo } from "@/components/private/CompanyLogo"
import { AppliedBadge } from "@/components/private/AppliedBadge"
import { countryName } from "@/lib/private-jobs/geo"
import { useAppliedJobs } from "@/lib/private-jobs/applied-store"
import {
  isFresh,
  JOB_TYPE_LABEL,
  postedAgo,
  salaryText,
  jobPlace,
  trustLabel,
  WORK_MODE_LABEL,
  type ListJob,
} from "@/components/private/job-list-utils"
import { Tape, paperShadow } from "@/components/desk/DeskKit"

/*
 * Private jobs reach people in every country, so this page borrows the one
 * piece of paper that looks the same everywhere: the airmail letter. Red and
 * blue chevrons, postage stamps, a postmark with a city on it. Every job is
 * a letter that might be the one that changes where you live, and the hero
 * says hello in the languages our readers actually speak.
 *
 * Purely presentational: the row keeps exactly the behaviour of the shared
 * PrivateJobRow (same link, same split-view select on plain left click, same
 * bookmark, applied badge, freshness and trust labels).
 */

export const AIRMAIL = "repeating-linear-gradient(135deg, oklch(55% 0.19 27) 0 10px, transparent 10px 15px, oklch(45% 0.13 255) 15px 25px, transparent 25px 30px)"

/* ───────────────────────── hero ───────────────────────── */

const HELLOS = ["Hello", "नमस्ते", "Hola", "مرحبا", "你好", "Jambo", "Olá", "Bonjour", "Kumusta", "Merhaba", "Xin chào", "வணக்கம்"]

export function RotatingHello() {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const t = window.setInterval(() => setI((v) => (v + 1) % HELLOS.length), 1800)
    return () => window.clearInterval(t)
  }, [])
  return (
    <span className="relative inline-block" aria-label="Hello">
      <span key={i} className={cn(handFont.className, "hs-fade-up inline-block text-[var(--color-brick)]")} aria-hidden>
        {HELLOS[i]},
      </span>
    </span>
  )
}

const HEADLINES: Record<string, { title: string; line: string }> = {
  remote: { title: "Work from wherever home is.", line: "Remote roles you can do from a small town, a big city, or a different time zone." },
  fresher: { title: "Every career starts with a first yes.", line: "Roles that welcome freshers: no experience needed, only the will to learn." },
  walkin: { title: "Bring your CV. Walk in.", line: "Walk-in interviews: a date, a time, an address. Dress well and go early." },
  all: {
    title: "Somewhere, someone is hiring you.",
    line: "Full-time, part-time, internship and contract roles from companies around the world, each with its pay in its own currency and a trust check before it reaches you.",
  },
}

/** A perforated postage stamp. */
export function Stamp({ children, tint, className, holes = "oklch(98% 0.008 90)" }: { children: ReactNode; tint: string; className?: string; holes?: string }) {
  /* perforations: a dotted border in the colour of the paper behind the stamp */
  return (
    <span
      className={cn("relative inline-flex p-[3px]", className)}
      style={{
        background: "oklch(99% 0.004 90)",
        backgroundClip: "border-box",
        border: `4px dotted ${holes}`,
        boxShadow: "0 2px 3px rgb(0 0 0 / .14)",
      }}
    >
      <span className="flex h-full w-full flex-col items-center justify-center px-1 py-1 text-center sm:px-2 sm:py-1.5" style={{ background: tint }}>
        {children}
      </span>
    </span>
  )
}

const STAMPS = [
  {
    href: "/private-jobs/remote",
    label: "Remote",
    note: "from anywhere",
    tint: "oklch(86% 0.06 230)",
    icon: (
      <svg viewBox="0 0 40 30" className="h-7 w-9" fill="none" stroke="oklch(30% 0.06 250)" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
        <rect x="6" y="4" width="28" height="17" rx="2" />
        <path d="M2 25 H 38" />
        <path d="M17 12 C 19 9, 23 9, 25 12" />
      </svg>
    ),
  },
  {
    href: "/private-jobs/freshers",
    label: "Freshers",
    note: "first job",
    tint: "oklch(88% 0.08 140)",
    icon: (
      <svg viewBox="0 0 40 30" className="h-7 w-9" fill="none" stroke="oklch(32% 0.08 150)" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
        <path d="M20 28 V 13" />
        <path d="M20 16 C 12 16, 9 10, 10 5 C 16 5, 20 9, 20 16" />
        <path d="M20 13 C 27 13, 31 8, 30 3 C 24 3, 20 7, 20 13" />
      </svg>
    ),
  },
  {
    href: "/private-jobs/walkins",
    label: "Walk-ins",
    note: "show up, talk",
    tint: "oklch(88% 0.08 70)",
    icon: (
      <svg viewBox="0 0 40 30" className="h-7 w-9" fill="none" stroke="oklch(35% 0.08 50)" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
        <rect x="11" y="3" width="16" height="25" rx="1" />
        <circle cx="23" cy="16" r="1.2" fill="oklch(35% 0.08 50)" />
        <path d="M30 28 H 36" />
      </svg>
    ),
  },
]

const WHO = ["the fresher", "the career-changer", "the parent going back to work", "the one moving abroad", "the night-shift learner", "the one starting over"]

export function AirmailHero({ total, mode = "all" }: { total: number; mode?: "all" | "remote" | "fresher" | "walkin" }) {
  const h = HEADLINES[mode]
  return (
    <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
      <div>
        <p className="text-[1.6rem] leading-none sm:text-[1.9rem]">
          <RotatingHello />
        </p>
        <h1 className="mt-2 font-display text-[2.3rem] font-black leading-[1.05] text-foreground sm:text-[3.1rem]">{h.title}</h1>
        <p className="mt-4 max-w-lg text-[16px] leading-relaxed text-muted-foreground">{h.line}</p>
        <p className={cn(handFont.className, "mt-3 text-[1.2rem] text-foreground/70")}>
          {total > 0 ? `${total.toLocaleString("en-IN")} letters waiting to be opened` : "new letters arriving soon"}
        </p>
      </div>

      {/* the envelope */}
      <div className="relative mx-auto w-full max-w-md">
        <div className="relative -rotate-[1.5deg] p-[9px]" style={{ background: AIRMAIL, boxShadow: "0 26px 44px -28px rgb(30 30 60 / .6)" }}>
          <div className="relative bg-[oklch(98%_0.008_90)] px-5 pb-5 pt-4 text-[oklch(25%_0.02_60)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className={cn(typeFont.className, "inline-block border-2 border-[oklch(45%_0.13_255)] px-2 py-0.5 text-[11px] font-bold text-[oklch(45%_0.13_255)]")}>
                  PAR AVION · BY AIR MAIL
                </span>
                {/* postmark */}
                <svg viewBox="0 0 120 60" className="mt-2 h-14 w-28 text-[oklch(35%_0.03_60)]/60" aria-hidden>
                  <circle cx="30" cy="30" r="24" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="30" cy="30" r="17" fill="none" stroke="currentColor" strokeWidth="1" />
                  <text x="30" y="28" textAnchor="middle" fontSize="7" fontWeight="700" fill="currentColor">WORLD</text>
                  <text x="30" y="37" textAnchor="middle" fontSize="6" fill="currentColor">WIDE</text>
                  {[0, 1, 2, 3].map((k) => (
                    <path key={k} d={`M58 ${16 + k * 9} C 72 ${12 + k * 9}, 86 ${20 + k * 9}, 100 ${16 + k * 9} S 112 ${12 + k * 9}, 118 ${16 + k * 9}`} fill="none" stroke="currentColor" strokeWidth="1.2" />
                  ))}
                </svg>
              </div>
              <div className="flex shrink-0 gap-1 sm:gap-1.5">
                {STAMPS.map((s, i) => (
                  <Link key={s.href} href={s.href} className={cn("group transition-transform hover:-translate-y-1", i === 0 ? "rotate-[4deg]" : i === 1 ? "-rotate-[3deg]" : "rotate-[2deg]")}>
                    <Stamp tint={s.tint} className="h-[70px] w-[52px] sm:h-[86px] sm:w-[68px]">
                      {s.icon}
                      <span className={cn(typeFont.className, "mt-0.5 block text-[9px] font-bold leading-tight text-[oklch(25%_0.02_60)]")}>{s.label.toUpperCase()}</span>
                      <span className={cn(handFont.className, "block text-[0.72rem] leading-tight text-[oklch(30%_0.03_60)]/80")}>{s.note}</span>
                    </Stamp>
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-4 pl-[22%] sm:pl-[38%]">
              <p className={cn(handFont.className, "text-[1.2rem] leading-tight text-[oklch(35%_0.09_250)] sm:text-[1.35rem]")}>To: whoever is looking,</p>
              <p className={cn(handFont.className, "mt-1 border-b border-dotted border-[oklch(60%_0.02_60)] text-[1.15rem] leading-snug text-[oklch(35%_0.09_250)]")}>wherever you are reading this</p>
              <p className={cn(handFont.className, "mt-1 border-b border-dotted border-[oklch(60%_0.02_60)] text-[1.15rem] leading-snug text-[oklch(35%_0.09_250)]")}>Earth</p>
            </div>
          </div>
        </div>
        <p className={cn(handFont.className, "mt-3 text-center text-[1rem] text-muted-foreground")}>the stamps open remote, freshers and walk-in jobs ↑</p>
      </div>

      {/* who this page is for */}
      <div className="lg:col-span-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
          <span className={cn(typeFont.className, "mr-1 text-[11px] font-bold text-muted-foreground")}>FOR</span>
          {WHO.map((w, i) => (
            <span
              key={w}
              className={cn(handFont.className, "rounded-full border border-dashed border-[var(--hs-border-strong)] bg-[var(--hs-surface)] px-3 py-0.5 text-[1rem] text-foreground/80", i % 2 ? "rotate-[1deg]" : "-rotate-[1deg]")}
            >
              {w}
            </span>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/private-jobs/refer" className="group inline-flex items-center gap-2 rounded-full border border-[var(--hs-border-strong)] bg-[var(--hs-surface)] px-4 py-2 text-sm font-semibold text-foreground hover:border-[var(--color-brick)]">
            <span className={cn(handFont.className, "text-[1.1rem] font-normal text-[var(--color-brick)]")}>+</span>
            Know an opening? Refer a job
          </Link>
          <MyLettersLink />
        </div>
      </div>
    </div>
  )
}

/** "My applications (3)", styled as the bundle of letters you've sent. */
function MyLettersLink() {
  const applied = useAppliedJobs()
  return (
    <Link href="/private-applications" className="inline-flex items-center gap-2 rounded-full border border-[var(--hs-border-strong)] bg-[var(--hs-surface)] px-4 py-2 text-sm font-semibold text-foreground hover:border-[var(--hs-trust)]">
      <svg viewBox="0 0 24 18" className="h-4 w-5 text-[var(--hs-trust)]" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
        <rect x="1.5" y="1.5" width="21" height="15" rx="1.5" />
        <path d="M2 2.5 L 12 10 L 22 2.5" />
      </svg>
      My applications{applied.size ? ` (${applied.size})` : ""}
    </Link>
  )
}

/* ───────────────────────── aside: three rules ───────────────────────── */

export function SafeLetter() {
  return (
    <div className="relative rotate-[0.6deg] p-[6px]" style={{ background: AIRMAIL, boxShadow: "0 16px 28px -18px rgb(30 30 60 / .5)" }}>
      <div className="relative bg-[oklch(98%_0.008_90)] px-5 pb-5 pt-5 text-[oklch(28%_0.03_60)]">
        <Tape className="-top-4 left-1/2 -translate-x-1/2 rotate-[2deg]" />
        <p className={cn(handFont.className, "text-[1.3rem] leading-tight")}>Three rules that hold in every country:</p>
        <ol className="mt-3 space-y-2.5 text-[13.5px] leading-snug">
          {[
            "A real employer never asks you to pay to get a job.",
            "Find the same opening on the company's own careers page.",
            "Don't send your passport, bank details or an OTP before a written offer.",
          ].map((t, i) => (
            <li key={i} className="flex gap-2.5">
              <span className={cn(handFont.className, "shrink-0 text-[1.2rem] leading-none text-[oklch(50%_0.18_28)]")}>{i + 1}.</span>
              <span>{t}</span>
            </li>
          ))}
        </ol>
        <p className={cn(handFont.className, "mt-3 text-right text-[1.05rem] text-[oklch(45%_0.13_255)]")}>stay hopeful, stay careful.</p>
      </div>
    </div>
  )
}

/* ───────────────────────── the letter (one job) ───────────────────────── */

export function AirmailJobRow({
  job,
  selected,
  onSelect,
  nowMs,
  index,
}: {
  job: ListJob
  selected?: boolean
  onSelect?: (job: ListJob) => boolean
  nowMs: number
  index: number
}) {
  const href = `/private-jobs/${job.slug}`
  const loc = jobPlace(job)
  const mode = job.remotePolicy ? WORK_MODE_LABEL[job.remotePolicy] : null
  const pay = salaryText(job)
  const trust = trustLabel(job.trustScore)
  const verified = job.company.verifiedStatus === "VERIFIED"
  const skills = job.skills ?? []
  const fresh = isFresh(job.createdAt, nowMs)
  const postmark = (job.remotePolicy === "REMOTE" ? "ANYWHERE" : job.city || countryName(job.country) || loc || "WORLDWIDE").toUpperCase()

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-[3px] border bg-[var(--hs-paper-slip)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5",
        index % 2 ? "rotate-[0.25deg]" : "-rotate-[0.2deg]",
        selected ? "border-[var(--hs-trust)] shadow-[0_0_0_2px_var(--hs-trust)]" : "border-[var(--hs-border)]"
      )}
      style={selected ? undefined : { boxShadow: paperShadow }}
    >
      {/* airmail edge */}
      <span className="absolute inset-y-0 left-0 w-[7px]" style={{ background: AIRMAIL }} aria-hidden />

      <div className="py-4 pl-6 pr-4">
        <div className="flex gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-[15.5px] font-bold leading-snug text-foreground">
              <Link
                href={href}
                aria-current={selected ? "true" : undefined}
                onClick={(e) => {
                  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
                  if (onSelect?.(job)) e.preventDefault()
                }}
                className="line-clamp-2 outline-none decoration-[var(--hs-trust)] decoration-2 underline-offset-[3px] after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-[var(--hs-trust)] group-hover:underline"
              >
                {job.title}
              </Link>
            </h3>
            <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
              <span className={cn(handFont.className, "shrink-0 text-[1rem] text-foreground/50")}>from</span>
              <span className="truncate font-medium text-foreground/80">{job.company.name}</span>
              {verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[var(--hs-trust)]" aria-label="Verified employer" />}
            </p>
          </div>

          {/* the company on a stamp, with the postmark rolled over its corner */}
          <div className="relative shrink-0">
            <Stamp tint="oklch(99% 0.004 90)" holes="var(--hs-paper-slip)" className="h-[66px] w-[58px] rotate-[3deg] [&>span]:p-0.5">
              <CompanyLogo name={job.company.name} logo={job.company.logo} size={38} className="rounded-[2px]" />
            </Stamp>
            <span
              className={cn(typeFont.className, "pointer-events-none absolute -bottom-2 -left-8 flex h-12 w-12 -rotate-[14deg] items-center justify-center rounded-full border-[1.5px] border-foreground/35 px-1 text-center text-[7px] font-bold leading-tight text-foreground/55")}
              aria-hidden
            >
              {postmark.length > 12 ? postmark.slice(0, 11) + "…" : postmark}
            </span>
          </div>
        </div>

        <dl className={cn(typeFont.className, "mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[11.5px] sm:gap-x-5")}>
          {(loc || mode) && (
            <>
              <dt className="text-muted-foreground">Where</dt>
              <dd className="text-foreground">{[loc, mode && mode !== "On-site" ? mode : null].filter(Boolean).join(" · ") || mode}</dd>
            </>
          )}
          <dt className="text-muted-foreground">Pay</dt>
          <dd className={cn("tabular-nums", pay ? "font-bold text-foreground" : "text-muted-foreground")}>{pay ?? "not disclosed"}</dd>
          {job.experience && (
            <>
              <dt className="text-muted-foreground">Experience</dt>
              <dd className="text-foreground">{job.experience}</dd>
            </>
          )}
        </dl>

        {skills.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Skills">
            {skills.slice(0, 3).map((s, i) => (
              <li key={s} className={cn("rounded-[2px] border border-[var(--hs-border-strong)] bg-[var(--hs-surface)] px-2 py-0.5 text-xs text-foreground/80", i % 2 ? "rotate-[1deg]" : "-rotate-[1deg]")}>
                {s}
              </li>
            ))}
            {skills.length > 3 && <li className={cn(handFont.className, "px-1 text-[0.95rem] text-muted-foreground")}>+{skills.length - 3} more</li>}
          </ul>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-dashed border-[var(--hs-border-strong)] pr-10 pt-2.5 text-xs text-muted-foreground">
          <AppliedBadge jobId={job.id} />
          {fresh && <span className={cn(handFont.className, "-rotate-[3deg] rounded-full border border-[var(--color-brick)] px-2 text-[0.95rem] leading-snug text-[var(--color-brick)]")}>new!</span>}
          <span>{postedAgo(job.createdAt, nowMs)}</span>
          <span aria-hidden>·</span>
          <span>{JOB_TYPE_LABEL[job.type] ?? job.type}</span>
          {job.isFresherFriendly && (
            <>
              <span aria-hidden>·</span>
              <span>Freshers</span>
            </>
          )}
          {job.isWalkIn && (
            <>
              <span aria-hidden>·</span>
              <span>Walk-in</span>
            </>
          )}
          {trust && trust.tone !== "warn" && (
            <>
              <span aria-hidden>·</span>
              <span className="font-semibold text-[var(--hs-trust)]">{trust.label}</span>
            </>
          )}
          {trust?.tone === "warn" && (
            <span className="flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400">
              <ShieldAlert className="h-3.5 w-3.5" /> {trust.label}
            </span>
          )}
        </div>
      </div>
      {/* Above the stretched link so it stays clickable. */}
      <div className="absolute bottom-2 right-2.5 z-10">
        <BookmarkButton privateJobId={job.id} size="icon" />
      </div>
    </article>
  )
}

export function AirmailRowSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-[3px] border border-[var(--hs-border)] bg-[var(--hs-paper-slip)] py-4 pl-6 pr-4" aria-hidden>
      <span className="absolute inset-y-0 left-0 w-[7px] opacity-40" style={{ background: AIRMAIL }} />
      <div className="flex gap-4">
        <div className="flex-1 space-y-2">
          <span className="hs-skel block h-4 w-3/4" />
          <span className="hs-skel block h-3 w-1/3" />
          <span className="hs-skel block h-3 w-2/3" />
        </div>
        <span className="hs-skel block h-[64px] w-[56px]" />
      </div>
    </div>
  )
}

/** The preview pane, framed as the opened letter. Content is the shared preview, untouched. */
export function OpenedLetter({ children }: { children: ReactNode }) {
  return (
    <div className="sticky top-24 p-[6px]" style={{ background: AIRMAIL, boxShadow: "0 20px 36px -24px rgb(30 30 60 / .55)" }}>
      <div className="bg-background [&>aside]:static [&>aside]:max-h-[calc(100vh-8rem)] [&>aside]:rounded-none [&>aside]:border-0">{children}</div>
    </div>
  )
}
