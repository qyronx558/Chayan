"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import { FileDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { cleanTitle } from "@/lib/card-helpers"
import { handFont, typeFont } from "@/components/home/fonts"
import { RubberStamp, paperShadow, seeded, tilt } from "@/components/desk/DeskKit"

/*
 * The evening after the exam. Question paper on one side, the official key
 * on the other, a red pen in hand, counting under your breath: right, right,
 * wrong, skipped... So the answer keys live on an OMR sheet, and there is a
 * rough-work box that does the counting for you.
 */

const OPTS = ["A", "B", "C", "D"]

function Bubble({ filled, letter, tone }: { filled: boolean; letter: string; tone?: string }) {
  return (
    <span
      className={cn(typeFont.className, "flex h-[18px] w-[18px] items-center justify-center rounded-full border text-[8.5px] font-bold")}
      style={{
        borderColor: filled ? "transparent" : "oklch(62% 0.12 15 / .55)",
        background: filled ? (tone ?? "oklch(28% 0.02 60)") : "transparent",
        color: filled ? "transparent" : "oklch(55% 0.12 15 / .8)",
      }}
    >
      {letter}
    </span>
  )
}

function Mark({ right }: { right: boolean }) {
  return right ? (
    <svg viewBox="0 0 28 24" className="h-4 w-5 text-[oklch(52%_0.2_28)]" fill="none" aria-hidden>
      <path d="M3 13.5 C 5.5 15, 8 18, 10 21 C 13 13, 18 7, 25 2.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 text-[oklch(52%_0.2_28)]" fill="none" aria-hidden>
      <path d="M3 3 L 17 16 M16 3 C 11 8, 7 12, 3 17" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

/* ───────────────────────── hero ───────────────────────── */

const HERO_ROWS = [1, 0, 2, 3, 1, 2]
const HERO_RIGHT = [true, true, false, true, true, false]

export function OmrHero({ total }: { total: number }) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
      <div>
        <p className={cn(handFont.className, "text-[1.25rem] text-[var(--color-brick)]")}>answer keys</p>
        <h1 className="mt-1 font-display text-[2.4rem] font-black leading-[1.05] text-foreground sm:text-[3.2rem]">
          Red pen. Question paper.
          <br />
          Count slowly.
        </h1>
        <p className="mt-4 max-w-md text-[16px] leading-relaxed text-muted-foreground">
          The official keys, as soon as the boards publish them. Match your answers, count your marks, and if a key looks
          wrong, the notice tells you how to raise an objection before the window shuts.
        </p>
        <p className={cn(handFont.className, "mt-3 text-[1.2rem] text-foreground/70")}>
          {total > 0 ? `${total.toLocaleString("en-IN")} keys out so far` : "keys coming out soon"}
        </p>
      </div>

      {/* a strip of OMR sheet, filled in and marked */}
      <div className="relative mx-auto w-full max-w-sm">
        <div
          className="relative -rotate-[2deg] rounded-[2px] px-5 pb-5 pt-4"
          style={{ background: "oklch(96% 0.025 15)", boxShadow: "0 24px 40px -26px rgb(80 20 20 / .6), 0 1px 2px rgb(0 0 0 / .08)" }}
        >
          {/* timing marks down the edge, like real OMR */}
          <div className="absolute inset-y-4 left-1.5 flex flex-col justify-between" aria-hidden>
            {Array.from({ length: 9 }).map((_, i) => (
              <span key={i} className="h-1.5 w-2.5 bg-[oklch(28%_0.02_60)]" />
            ))}
          </div>
          <div className="flex items-center justify-between border-b border-[oklch(62%_0.12_15/.5)] pb-2 pl-3">
            <span className={cn(typeFont.className, "text-[10px] font-bold text-[oklch(45%_0.13_15)]")}>OMR ANSWER SHEET</span>
            <span className={cn(handFont.className, "text-[1.15rem] leading-none text-[oklch(52%_0.2_28)]")}>4 / 6</span>
          </div>
          <div className="mt-3 space-y-2 pl-3">
            {HERO_ROWS.map((ans, q) => (
              <div key={q} className="flex items-center gap-2">
                <span className={cn(typeFont.className, "w-5 text-right text-[10px] font-bold text-[oklch(45%_0.13_15)]")}>{q + 1}</span>
                <span className="flex gap-1.5">
                  {OPTS.map((o, j) => (
                    <span key={o} className="hs-fade-up" style={{ animationDelay: `${q * 140}ms` }}>
                      <Bubble filled={j === ans} letter={o} />
                    </span>
                  ))}
                </span>
                <span className="ml-2 hs-fade-up" style={{ animationDelay: `${900 + q * 160}ms` }}>
                  <Mark right={HERO_RIGHT[q]} />
                </span>
              </div>
            ))}
          </div>
        </div>
        {/* the red pen */}
        <svg viewBox="0 0 200 20" className="absolute -bottom-4 -right-6 h-5 w-52 -rotate-[28deg] drop-shadow-[2px_4px_3px_rgb(0_0_0/.25)]" aria-hidden>
          <rect x="18" y="5" width="165" height="10" rx="5" fill="oklch(50% 0.2 28)" />
          <rect x="160" y="2" width="30" height="5" rx="2" fill="oklch(40% 0.18 28)" />
          <path d="M18 5 L 2 10 L 18 15 Z" fill="oklch(85% 0.02 80)" />
        </svg>
      </div>
    </div>
  )
}

/* ───────────────────────── aside: rough work ───────────────────────── */

function NumField({ label, value, onChange, step = 1 }: { label: string; value: string; onChange: (v: string) => void; step?: number }) {
  return (
    <label className="flex items-end justify-between gap-3">
      <span className="text-[13px] text-[var(--hs-chit-ink)]">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        min={0}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(handFont.className, "w-16 border-b-2 border-dotted border-[var(--hs-chit-ink)]/40 bg-transparent text-right text-[1.3rem] leading-none text-[oklch(42%_0.075_205)] outline-none focus:border-[oklch(42%_0.075_205)]")}
      />
    </label>
  )
}

export function RoughWork() {
  const [right, setRight] = useState("")
  const [wrong, setWrong] = useState("")
  const [plus, setPlus] = useState("2")
  const [minus, setMinus] = useState("0.5")
  const n = (v: string) => (Number.isFinite(parseFloat(v)) ? Math.max(0, parseFloat(v)) : 0)
  const score = n(right) * n(plus) - n(wrong) * n(minus)
  const touched = right !== "" || wrong !== ""

  return (
    <div
      className="relative rotate-[0.6deg] rounded-[3px] px-5 pb-5 pt-6"
      style={{
        background: "oklch(98% 0.008 90)",
        backgroundImage:
          "linear-gradient(color-mix(in oklch, oklch(62% 0.09 240) 16%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklch, oklch(62% 0.09 240) 16%, transparent) 1px, transparent 1px)",
        backgroundSize: "14px 14px",
        boxShadow: "0 1px 1px rgb(60 40 10 / .08), 0 16px 28px -18px rgb(60 40 10 / .5)",
      }}
    >
      <p className={cn(typeFont.className, "text-[10.5px] text-[var(--hs-chit-ink)]/60")}>ROUGH WORK</p>
      <p className={cn(handFont.className, "mt-0.5 text-[1.3rem] leading-tight text-[var(--hs-chit-ink)]")}>Count your marks</p>
      <div className="mt-4 space-y-3">
        <NumField label="Right answers" value={right} onChange={setRight} />
        <NumField label="Wrong answers" value={wrong} onChange={setWrong} />
        <div className="border-t border-dashed border-[var(--hs-chit-ink)]/30 pt-3" />
        <NumField label="Marks for each right" value={plus} onChange={setPlus} step={0.25} />
        <NumField label="Cut for each wrong" value={minus} onChange={setMinus} step={0.25} />
      </div>
      <div className="mt-4 flex items-end justify-between border-t-2 border-[var(--hs-chit-ink)]/60 pt-2">
        <span className={cn(handFont.className, "text-[1.1rem] text-[var(--hs-chit-ink)]")}>≈ score</span>
        <span className="relative px-2">
          <span className={cn(handFont.className, "text-[2rem] leading-none text-[oklch(52%_0.2_28)]")}>{touched ? +score.toFixed(2) : "—"}</span>
          {touched && (
            <svg viewBox="0 0 100 34" preserveAspectRatio="none" className="pointer-events-none absolute -inset-x-1 -inset-y-1 h-[calc(100%+0.5rem)] w-[calc(100%+0.5rem)] overflow-visible" aria-hidden>
              <path d="M54 3 C 82 2, 98 9, 96 18 C 94 28, 70 32, 48 31 C 22 31, 3 26, 3 17 C 3 8, 22 3, 44 3 C 56 3, 64 4, 70 6" fill="none" stroke="oklch(52% 0.2 28)" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
            </svg>
          )}
        </span>
      </div>
      <p className="mt-3 text-[11.5px] leading-snug text-[var(--hs-chit-ink)]/70">
        Skipped questions cost nothing. Check your exam&apos;s marking scheme in the notice; it differs from paper to paper.
      </p>
    </div>
  )
}

/* ───────────────────────── the OMR key card ───────────────────────── */

export interface AnswerKeySheetData {
  id: string
  title: string
  slug: string
  pdfUrl: string | null
  department: { id: string; name: string; slug: string }
}

export function OmrKeyCard({ item, index, share }: { item: AnswerKeySheetData; index: number; share: ReactNode }) {
  const title = cleanTitle(item.title)
  const href = `/answer-key/${item.slug}`
  const rows = [0, 1, 2, 3, 4].map((q) => ({ ans: Math.floor(seeded(item.id, q) * 4), right: seeded(item.id, q + 9) > 0.28 }))

  return (
    <article
      className={cn("group relative flex h-full flex-col rounded-[2px] border border-[oklch(62%_0.12_15/.35)] transition-transform duration-300 hover:-translate-y-1", tilt(index))}
      style={{ background: "color-mix(in oklch, oklch(62% 0.12 15) 7%, var(--hs-paper-slip))", boxShadow: paperShadow }}
    >
      <div className="absolute inset-y-4 left-1.5 flex flex-col justify-between" aria-hidden>
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} className="h-1.5 w-2 bg-foreground/50" />
        ))}
      </div>

      <div className="flex-1 py-4 pl-7 pr-5">
        <div className={cn(typeFont.className, "flex items-start justify-between gap-3 border-b border-[oklch(62%_0.12_15/.45)] pb-2 text-[10.5px] text-[oklch(48%_0.12_15)]")}>
          <span className="line-clamp-2 font-bold uppercase">{item.department.name}</span>
          <span className="shrink-0 font-bold">ANSWER KEY</span>
        </div>

        <h3 className="mt-3 line-clamp-3 text-[16px] font-bold leading-snug text-foreground">
          <Link href={href} className="decoration-[oklch(52%_0.2_28)] decoration-2 underline-offset-[3px] after:absolute after:inset-0 after:content-[''] hover:underline">
            {title}
          </Link>
        </h3>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div className="space-y-1.5" aria-hidden>
            {rows.map((r, q) => (
              <div key={q} className="flex items-center gap-1.5">
                <span className={cn(typeFont.className, "w-3 text-right text-[9px] font-bold text-[oklch(48%_0.12_15)]")}>{q + 1}</span>
                {OPTS.map((o, j) => (
                  <Bubble key={o} filled={j === r.ans} letter={o} tone="var(--foreground)" />
                ))}
                <span className="ml-1">
                  <Mark right={r.right} />
                </span>
              </div>
            ))}
          </div>
          <RubberStamp label={item.pdfUrl ? "KEY OUT" : "SEE NOTICE"} tone={item.pdfUrl ? "oklch(52% 0.2 28)" : "oklch(45% 0.03 60)"} className="mb-2" />
        </div>
      </div>

      <div className="relative z-10 flex flex-wrap items-center gap-x-4 gap-y-2 border-t-2 border-dashed border-[oklch(62%_0.12_15/.45)] py-3 pl-7 pr-5">
        <Link href={href} className={cn(handFont.className, "text-[1.1rem] text-[oklch(50%_0.19_28)] underline decoration-wavy decoration-1 underline-offset-4")}>
          match your answers →
        </Link>
        {item.pdfUrl && (
          <a href={item.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[12px] font-semibold text-muted-foreground hover:text-foreground">
            <FileDown className="h-3.5 w-3.5" />
            Key PDF
          </a>
        )}
        <span className="ml-auto flex items-center gap-1">{share}</span>
      </div>
    </article>
  )
}
