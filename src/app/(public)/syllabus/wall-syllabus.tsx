"use client"

import type { CSSProperties, ReactNode } from "react"
import Link from "next/link"
import { FileDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { cleanTitle } from "@/lib/card-helpers"
import { handFont, typeFont } from "@/components/home/fonts"
import { Tape, paperShadow, tilt } from "@/components/desk/DeskKit"

/*
 * The syllabus is the map of the next few months. Every aspirant has the
 * same ritual: print it, tape it to the wall above the desk, and slowly
 * highlight and cross off topics until the page is more ink than paper.
 * So each syllabus here is a spiral-notebook page with its subjects written
 * as a to-do list, and the hero is that wall.
 */

/* ───────────────────────── hero: the wall above the desk ───────────────────────── */

const WALL_TOPICS = [
  { t: "Number system", done: true },
  { t: "Percentage & ratio", done: true },
  { t: "Indian polity: basics", done: true },
  { t: "Modern history", hl: true },
  { t: "Reasoning: puzzles" },
  { t: "Current affairs (daily)" },
]

export function SyllabusWall({ total }: { total: number }) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-[1fr_0.95fr]">
      <div>
        <p className={cn(handFont.className, "text-[1.25rem] text-[var(--color-brick)]")}>syllabus</p>
        <h1 className="mt-1 font-display text-[2.4rem] font-black leading-[1.05] text-foreground sm:text-[3.2rem]">
          Print it. Tape it up.
          <br />
          Cross it off.
        </h1>
        <p className="mt-4 max-w-md text-[16px] leading-relaxed text-muted-foreground">
          Every topper started with the same printout you can get here. Subject by subject, the official syllabus for each
          exam, so you study what is asked, and stop worrying about what isn&apos;t.
        </p>
        <p className={cn(handFont.className, "mt-3 text-[1.2rem] text-foreground/70")}>
          {total > 0 ? `${total.toLocaleString("en-IN")} ${total === 1 ? "syllabus" : "syllabi"} on the wall` : "pages going up soon"}
        </p>
      </div>

      {/* the printout, taped to a plain wall */}
      <div className="relative mx-auto w-full max-w-sm py-4">
        <div
          className="relative rotate-[1.5deg] px-6 pb-6 pt-7"
          style={{
            background: "oklch(98% 0.006 90)",
            backgroundImage:
              "linear-gradient(oklch(62% 0.09 240 / .14) 1px, transparent 1px), linear-gradient(90deg, oklch(62% 0.09 240 / .14) 1px, transparent 1px)",
            backgroundSize: "16px 16px",
            boxShadow: "0 24px 40px -26px rgb(40 30 10 / .6), 0 1px 2px rgb(0 0 0 / .08)",
            color: "oklch(25% 0.02 60)",
          }}
        >
          <Tape className="-left-4 -top-2 -rotate-[30deg]" />
          <Tape className="-right-4 -top-2 rotate-[32deg]" />
          <p className={cn(typeFont.className, "text-[10px] font-bold")}>SCHEME OF EXAMINATION · SYLLABUS</p>
          <p className={cn(handFont.className, "mt-1 text-[1.4rem] leading-none text-[oklch(35%_0.09_250)]")}>my plan: 4 months</p>
          <ul className="mt-4 space-y-2">
            {WALL_TOPICS.map((w, i) => (
              <li key={w.t} className="relative flex items-center gap-2.5 text-[13.5px]">
                <span className="relative h-[15px] w-[15px] shrink-0 border-[1.5px] border-[oklch(40%_0.03_60)]">
                  {w.done && (
                    <svg viewBox="0 0 28 24" className="absolute -right-1.5 -top-2 h-5 w-6 text-[oklch(42%_0.075_205)]" fill="none" aria-hidden>
                      <path className="hs-draw" style={{ ["--len" as string]: 40, animationDelay: `${i * 0.25}s`, animationDuration: ".35s" } as CSSProperties} d="M3 13.5 C 5.5 15, 8 18, 10 21 C 13 13, 18 7, 25 2.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
                    </svg>
                  )}
                </span>
                <span className={cn("relative", w.done && "text-[oklch(25%_0.02_60)]/55 line-through decoration-[oklch(42%_0.075_205)] decoration-2")}>
                  {w.hl && <span className="absolute -inset-x-1 inset-y-0 -rotate-[0.8deg] bg-[oklch(88%_0.17_95)]/80" aria-hidden />}
                  <span className="relative">{w.t}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className={cn(handFont.className, "mt-4 text-right text-[1.1rem] text-[oklch(50%_0.18_28)]")}>half done. keep going →</p>
        </div>
        {/* highlighter lying on the desk below */}
        <svg viewBox="0 0 160 26" className="absolute -bottom-3 -left-4 h-6 w-40 rotate-[-8deg] drop-shadow-[2px_4px_3px_rgb(0_0_0/.25)]" aria-hidden>
          <rect x="22" y="3" width="118" height="20" rx="4" fill="oklch(86% 0.17 100)" />
          <rect x="128" y="1" width="30" height="24" rx="5" fill="oklch(35% 0.02 60)" />
          <path d="M22 6 L 6 10 L 6 16 L 22 20 Z" fill="oklch(78% 0.17 100)" />
        </svg>
      </div>
    </div>
  )
}

/* ───────────────────────── aside: how to read a syllabus ───────────────────────── */

const TIPS = [
  "Print it. A syllabus on paper gets finished; a PDF in Downloads doesn't.",
  "Mark the topics last 3 years' papers asked most. Start there.",
  "Split it into weeks, not days. Leave Sundays for revision.",
  "Cross off, never erase. The ink is proof you were here.",
]

export function SyllabusTips() {
  return (
    <div
      className="relative -rotate-[0.8deg] px-5 pb-5 pt-7"
      style={{ background: "color-mix(in oklch, oklch(85% 0.08 140) 26%, oklch(98% 0.008 90))", boxShadow: "0 1px 1px rgb(60 40 10 / .08), 0 16px 28px -18px rgb(60 40 10 / .5)" }}
    >
      <Tape className="-top-3 left-1/2 -translate-x-1/2 rotate-[2deg]" />
      <p className={cn(handFont.className, "text-[1.3rem] leading-tight text-[var(--hs-chit-ink)]")}>How seniors use a syllabus:</p>
      <ol className="mt-3 space-y-2.5">
        {TIPS.map((t, i) => (
          <li key={i} className="flex gap-2.5 text-[13.5px] leading-snug text-[var(--hs-chit-ink)]">
            <span className={cn(handFont.className, "shrink-0 text-[1.2rem] leading-none text-[oklch(45%_0.17_28)]")}>{i + 1}.</span>
            <span>{t}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

/* ───────────────────────── the notebook page ───────────────────────── */

export interface SyllabusPageData {
  id: string
  title: string
  slug: string
  pdfUrl: string | null
  department: { id: string; name: string; slug: string }
}

export function SyllabusPageCard({ item, index, subjects, save, share }: { item: SyllabusPageData; index: number; subjects: string[]; save: ReactNode; share: ReactNode }) {
  const title = cleanTitle(item.title)
  const href = `/syllabus/${item.slug}`

  return (
    <article
      className={cn("group relative flex h-full flex-col rounded-b-[3px] bg-[var(--hs-paper-slip)] pt-6 transition-transform duration-300 hover:-translate-y-1", tilt(index))}
      style={{
        boxShadow: paperShadow,
        backgroundImage:
          "linear-gradient(90deg, transparent 2.6rem, color-mix(in oklch, var(--color-brick) 40%, transparent) 2.6rem, color-mix(in oklch, var(--color-brick) 40%, transparent) calc(2.6rem + 1px), transparent calc(2.6rem + 1px)), repeating-linear-gradient(180deg, transparent 0 27px, color-mix(in oklch, oklch(62% 0.09 240) 22%, transparent) 27px 28px)",
        backgroundPosition: "0 0, 0 4.2rem",
      }}
    >
      {/* spiral binding */}
      <div className="absolute inset-x-4 -top-2.5 flex justify-between" aria-hidden>
        {Array.from({ length: 11 }).map((_, i) => (
          <span key={i} className="h-5 w-2.5 rounded-full border-2 border-[oklch(55%_0.01_250)]" style={{ background: "linear-gradient(180deg, oklch(85% 0.005 250), oklch(65% 0.01 250))" }} />
        ))}
      </div>

      <div className="flex-1 pb-4 pl-14 pr-5">
        <p className={cn(typeFont.className, "line-clamp-1 text-[10.5px] font-bold uppercase text-muted-foreground")}>{item.department.name}</p>
        <h3 className="mt-1.5 line-clamp-2 text-[16px] font-bold leading-[28px] text-foreground">
          <Link href={href} className="decoration-[var(--hs-trust)] decoration-2 underline-offset-[3px] after:absolute after:inset-0 after:content-[''] hover:underline">
            {title}
          </Link>
        </h3>

        {subjects.length > 0 ? (
          <ul className="mt-1">
            {subjects.map((s, i) => (
              <li key={s + i} className={cn(handFont.className, "relative flex h-[28px] items-center gap-2 text-[1.08rem] text-foreground/85")}>
                <span className="absolute -left-9 text-[0.9rem] text-[var(--color-brick)]/80">{i + 1}.</span>
                <span className="relative truncate">
                  {i === 0 && <span className="absolute -inset-x-1 inset-y-[3px] -rotate-[0.6deg] bg-[oklch(88%_0.17_95)]/55 mix-blend-multiply dark:bg-[oklch(70%_0.15_95)]/25 dark:mix-blend-screen" aria-hidden />}
                  <span className="relative">{s}</span>
                </span>
              </li>
            ))}
            <li className={cn(handFont.className, "flex h-[28px] items-center text-[1rem] text-muted-foreground")}>+ the rest in the full syllabus</li>
          </ul>
        ) : (
          <p className={cn(handFont.className, "mt-1 flex h-[28px] items-center text-[1.05rem] text-muted-foreground")}>subjects listed inside →</p>
        )}
      </div>

      <div className="relative z-10 flex flex-wrap items-center gap-x-4 gap-y-2 border-t-2 border-dashed border-[var(--hs-border-strong)] bg-[var(--hs-paper-slip)] py-3 pl-14 pr-5">
        <Link href={href} className={cn(handFont.className, "text-[1.1rem] text-[var(--hs-trust)] underline decoration-wavy decoration-1 underline-offset-4")}>
          open the full syllabus →
        </Link>
        {item.pdfUrl && (
          <a href={item.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[12px] font-semibold text-muted-foreground hover:text-foreground">
            <FileDown className="h-3.5 w-3.5" />
            PDF
          </a>
        )}
        <span className="ml-auto flex items-center gap-1">
          {save}
          {share}
        </span>
      </div>
    </article>
  )
}
