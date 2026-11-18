"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { handFont, typeFont } from "@/components/home/fonts"
import type { DocKind } from "@/lib/doc-state"

/*
 * Every document page is the real paper it stands for: the result list
 * pinned on the board, the hall ticket, the OMR sheet, the syllabus copied
 * into a notebook, the college prospectus. Only the look lives here; the
 * page keeps all of its own logic.
 *
 * The art always sits on fixed light paper (it is a printed thing), so its
 * ink is fixed too and stays readable in dark mode.
 */

const PAPER = "oklch(98% 0.008 90)"
const INK = "oklch(27% 0.03 60)"
const FAINT = "oklch(80% 0.015 70)"

export interface Skin {
  /** pen / stamp colour for this kind */
  accent: string
  /** what the page is, in the voice of the person holding it */
  kicker: string
  /** handwritten aside under the title */
  note: string
  /** the related list heading's handwritten line */
  relatedNote: string
  /** guide section look */
  guidePaper: string
}

export const SKINS: Record<DocKind, Skin> = {
  result: {
    accent: "oklch(48% 0.12 155)",
    kicker: "Result notice",
    note: "find your roll number, then breathe.",
    relatedNote: "other lists on the same board",
    guidePaper: "oklch(95% 0.045 150)",
  },
  "admit-card": {
    accent: "oklch(47% 0.13 255)",
    kicker: "Admit card / hall ticket",
    note: "print two copies. keep one in the bag tonight.",
    relatedNote: "more hall tickets",
    guidePaper: "oklch(95% 0.035 240)",
  },
  "answer-key": {
    accent: "oklch(52% 0.17 15)",
    kicker: "Answer key",
    note: "keep your response sheet open beside this.",
    relatedNote: "more keys to check",
    guidePaper: "oklch(95% 0.035 15)",
  },
  syllabus: {
    accent: "oklch(45% 0.13 262)",
    kicker: "Syllabus",
    note: "copy it once by hand. you will remember it better.",
    relatedNote: "more notebooks on the shelf",
    guidePaper: "oklch(95% 0.035 262)",
  },
  admission: {
    accent: "oklch(47% 0.14 35)",
    kicker: "Admission notice",
    note: "read the prospectus fully before you pay a rupee.",
    relatedNote: "more colleges taking forms",
    guidePaper: "oklch(95% 0.05 85)",
  },
}

const artShadow = "0 1px 2px rgb(60 40 10 / .12), 0 22px 34px -22px rgb(60 40 10 / .6)"

function Pin({ className, hue = 28 }: { className?: string; hue?: number }) {
  return (
    <span
      className={cn("absolute z-10 h-4 w-4 rounded-full", className)}
      style={{ background: `radial-gradient(circle at 35% 30%, oklch(78% 0.14 ${hue}), oklch(46% 0.15 ${hue}))`, boxShadow: "1px 2px 2px rgb(0 0 0 / .35)" }}
    />
  )
}

function Stamp({ children, color, className }: { children: ReactNode; color: string; className?: string }) {
  return (
    <span
      className={cn(typeFont.className, "absolute rounded-[4px] border-[2.5px] px-2 py-0.5 text-[12px] font-bold tracking-wider opacity-80", className)}
      style={{ color, borderColor: color }}
    >
      {children}
    </span>
  )
}

/* ───────── result: the list pinned on the board ───────── */

function ResultArt({ department, date, pill, accent }: ArtProps) {
  return (
    <div className="relative w-[250px] rotate-[1.5deg] px-5 pb-6 pt-6" style={{ background: PAPER, color: INK, boxShadow: artShadow }}>
      <Pin className="-top-2 left-6" hue={150} />
      <Pin className="-top-2 right-6" hue={28} />
      <p className={cn(typeFont.className, "text-center text-[10px] font-bold leading-tight")}>{department.toUpperCase().slice(0, 48)}</p>
      <p className={cn(typeFont.className, "mt-1 border-y border-current/40 py-0.5 text-center text-[11px] font-bold tracking-[0.3em]")}>RESULT</p>
      <div className={cn(typeFont.className, "mt-2 grid grid-cols-[2.2rem_1fr_2rem] gap-y-[7px] text-[8.5px]")}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="contents">
            <span className="opacity-60">{String(i + 1).padStart(3, "0")}</span>
            <span className="relative mr-3 mt-[3px] h-[3px] rounded-full" style={{ background: FAINT, width: `${62 + ((i * 37) % 34)}%` }}>
              {i === 4 && <span className="absolute -inset-x-1 -inset-y-[5px] rounded-[2px] opacity-70" style={{ background: "oklch(88% 0.16 95)" }} />}
            </span>
            <span className="opacity-50">{i % 3 === 2 ? "–" : "✓"}</span>
          </div>
        ))}
      </div>
      <span className={cn(handFont.className, "absolute -right-7 top-[118px] rotate-[-8deg] text-[14px]")} style={{ color: accent }}>
        ← is that you?
      </span>
      <Stamp color={accent} className="bottom-3 right-3 -rotate-[10deg]">{pill.toUpperCase().slice(0, 18)}</Stamp>
      {date ? <p className={cn(typeFont.className, "mt-4 text-[9px] opacity-70")}>Dated: {date}</p> : null}
    </div>
  )
}

/* ───────── admit card: the hall ticket ───────── */

function AdmitArt({ department, date, accent }: ArtProps) {
  return (
    <div className="relative w-[270px] -rotate-[1.5deg] overflow-hidden rounded-[3px]" style={{ background: PAPER, color: INK, boxShadow: artShadow }}>
      <div className={cn(typeFont.className, "px-4 py-1.5 text-[10px] font-bold tracking-[0.2em] text-[oklch(98%_0.01_90)]")} style={{ background: accent }}>
        ADMIT CARD
      </div>
      <div className="flex gap-3 px-4 pt-3">
        <div className="flex h-[74px] w-[60px] shrink-0 flex-col items-center justify-end overflow-hidden border border-dashed" style={{ borderColor: FAINT }}>
          <svg viewBox="0 0 40 46" className="h-[58px] w-[48px]" aria-hidden>
            <circle cx="20" cy="16" r="9" fill={FAINT} />
            <path d="M3 46 C 4 32, 12 28, 20 28 C 28 28, 36 32, 37 46 Z" fill={FAINT} />
          </svg>
        </div>
        <div className={cn(typeFont.className, "min-w-0 flex-1 space-y-[7px] text-[8.5px]")}>
          <p className="truncate font-bold">{department.slice(0, 40)}</p>
          {["Name", "Roll No.", "Centre"].map((l, i) => (
            <p key={l} className="flex items-end gap-1.5">
              <span className="opacity-60">{l}</span>
              <span className="relative h-[1px] flex-1 border-b border-dotted" style={{ borderColor: INK }}>
                {i === 0 && <span className={cn(handFont.className, "absolute -top-[13px] left-1 text-[12px]")} style={{ color: accent }}>you</span>}
              </span>
            </p>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3 border-t border-dashed px-4 pb-3 pt-2" style={{ borderColor: FAINT }}>
        <div>
          <p className={cn(typeFont.className, "text-[8px] opacity-60")}>EXAM DATE</p>
          <p className="font-display text-[1rem] font-black leading-tight">{date ?? "to be notified"}</p>
        </div>
        <div className="flex h-7 items-end gap-[1.5px]" aria-hidden>
          {Array.from({ length: 26 }).map((_, i) => (
            <span key={i} className="block" style={{ width: i % 3 === 0 ? 2.5 : 1, height: i % 5 === 0 ? "100%" : "82%", background: INK }} />
          ))}
        </div>
      </div>
      <p className={cn(typeFont.className, "border-t px-4 py-1.5 text-right text-[8px] opacity-60")} style={{ borderColor: FAINT }}>
        signature of candidate ______
      </p>
    </div>
  )
}

/* ───────── answer key: the OMR sheet ───────── */

const OMR_KEY = [1, 3, 0, 2, 1, 2]
const OMR_MARK = ["ok", "ok", "x", "ok", "ok", "skip"] as const

function KeyArt({ accent }: ArtProps) {
  return (
    <div className="relative w-[250px] rotate-[1.2deg] px-4 pb-4 pt-3" style={{ background: "oklch(97% 0.02 15)", color: INK, boxShadow: artShadow }}>
      <div className="mb-2 flex items-center justify-between">
        <p className={cn(typeFont.className, "text-[10px] font-bold tracking-[0.25em]")} style={{ color: accent }}>ANSWER KEY</p>
        <span className="flex gap-[3px]">
          {Array.from({ length: 6 }).map((_, i) => <span key={i} className="h-[6px] w-[3px]" style={{ background: INK }} />)}
        </span>
      </div>
      <div className={cn(typeFont.className, "space-y-[6px] text-[9px]")}>
        {OMR_KEY.map((k, q) => (
          <div key={q} className="flex items-center gap-2">
            <span className="w-4 text-right opacity-70">{q + 1}</span>
            {["A", "B", "C", "D"].map((o, i) => (
              <span
                key={o}
                className="flex h-[15px] w-[15px] items-center justify-center rounded-full border text-[7px]"
                style={i === k ? { background: INK, borderColor: INK, color: PAPER } : { borderColor: accent, color: accent }}
              >
                {o}
              </span>
            ))}
            <span className={cn(handFont.className, "ml-auto text-[13px] leading-none")} style={{ color: OMR_MARK[q] === "x" ? accent : OMR_MARK[q] === "ok" ? "oklch(45% 0.12 155)" : FAINT }}>
              {OMR_MARK[q] === "ok" ? "✓ +2" : OMR_MARK[q] === "x" ? "✗ −½" : "skip"}
            </span>
          </div>
        ))}
      </div>
      <p className={cn(handFont.className, "mt-3 border-t border-dashed pt-1.5 text-right text-[14px]")} style={{ borderColor: FAINT, color: accent }}>
        so far: 7½
      </p>
    </div>
  )
}

/* ───────── syllabus: a notebook page ───────── */

function SyllabusArt({ accent }: ArtProps) {
  const lines = ["Unit 1 · Quant", "Unit 2 · Reasoning", "Unit 3 · English", "Unit 4 · GK", "revise everything!"]
  return (
    <div className="relative w-[240px] -rotate-[1.4deg] pb-4 pl-10 pr-4 pt-7" style={{ background: PAPER, color: INK, boxShadow: artShadow, backgroundImage: `repeating-linear-gradient(180deg, transparent 0 21px, oklch(78% 0.05 240 / .55) 21px 22px)`, backgroundPosition: "0 26px" }}>
      {/* spiral */}
      <div className="absolute inset-x-3 -top-2 flex justify-between" aria-hidden>
        {Array.from({ length: 11 }).map((_, i) => (
          <span key={i} className="h-4 w-[7px] rounded-full border-2" style={{ borderColor: "oklch(55% 0.01 250)", background: "oklch(85% 0.005 250)" }} />
        ))}
      </div>
      <span className="absolute bottom-0 left-7 top-0 w-px" style={{ background: "oklch(62% 0.17 25 / .7)" }} aria-hidden />
      <p className={cn(handFont.className, "text-[17px] leading-[22px] underline decoration-1 underline-offset-2")} style={{ color: accent }}>Syllabus</p>
      {lines.map((l, i) => (
        <p key={l} className={cn(handFont.className, "flex items-center gap-1.5 text-[13px] leading-[22px]")} style={i === 4 ? { color: "oklch(50% 0.18 28)" } : undefined}>
          {i < 2 ? <span style={{ color: "oklch(45% 0.12 155)" }}>✓</span> : i < 4 ? <span className="opacity-40">○</span> : null}
          <span className={i < 2 ? "line-through decoration-1 opacity-60" : ""}>{l}</span>
        </p>
      ))}
      {/* pencil */}
      <svg viewBox="0 0 120 12" className="absolute -bottom-3 -right-6 w-[120px] rotate-[-28deg]" aria-hidden>
        <rect x="14" y="2" width="96" height="8" rx="1" fill="oklch(80% 0.15 85)" />
        <rect x="104" y="2" width="12" height="8" fill="oklch(75% 0.08 20)" />
        <path d="M14 2 L 2 6 L 14 10 Z" fill="oklch(85% 0.04 70)" />
      </svg>
    </div>
  )
}

/* ───────── admission: the prospectus ───────── */

function AdmissionArt({ department, pill, accent }: ArtProps) {
  return (
    <div className="relative h-[230px] w-[250px]">
      {/* the form behind it */}
      <div className="absolute right-0 top-3 h-[200px] w-[170px] rotate-[6deg] px-3 pt-4" style={{ background: PAPER, color: INK, boxShadow: artShadow }}>
        <p className={cn(typeFont.className, "text-[8px] font-bold tracking-[0.2em]")}>APPLICATION FORM</p>
        {Array.from({ length: 7 }).map((_, i) => (
          <span key={i} className="mt-3 block h-px border-b border-dotted" style={{ borderColor: FAINT }} />
        ))}
      </div>
      {/* the prospectus */}
      <div className="absolute left-0 top-0 flex h-[210px] w-[160px] -rotate-[4deg] flex-col items-center justify-center px-4 text-center" style={{ background: accent, color: "oklch(97% 0.02 85)", boxShadow: artShadow }}>
        <span className="absolute inset-2 border border-[oklch(85%_0.1_85/0.6)]" aria-hidden />
        <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden>
          <circle cx="20" cy="20" r="18" fill="none" stroke="oklch(85% 0.12 85)" strokeWidth="1.5" />
          <path d="M9 14 C 14 12, 18 13, 20 16 C 22 13, 26 12, 31 14 L 31 28 C 26 26, 22 27, 20 29 C 18 27, 14 26, 9 28 Z" fill="none" stroke="oklch(85% 0.12 85)" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M20 16 L 20 29" stroke="oklch(85% 0.12 85)" strokeWidth="1.2" />
        </svg>
        <p className={cn(typeFont.className, "mt-2 text-[10px] font-bold tracking-[0.25em]")}>PROSPECTUS</p>
        <p className="mt-2 line-clamp-3 font-display text-[12px] font-bold leading-tight">{department}</p>
      </div>
      {/* ribbon */}
      <span className={cn(typeFont.className, "absolute bottom-6 left-[-8px] rotate-[-4deg] px-3 py-1 text-[10px] font-bold tracking-wider")} style={{ background: "oklch(82% 0.15 85)", color: INK, clipPath: "polygon(0 0, 100% 0, 94% 50%, 100% 100%, 0 100%)", boxShadow: "0 3px 6px rgb(0 0 0 / .25)" }}>
        {pill.toUpperCase().slice(0, 22)}
      </span>
    </div>
  )
}

interface ArtProps {
  department: string
  date: string | null
  pill: string
  accent: string
}

export function DocArt({ kind, ...p }: ArtProps & { kind: DocKind }) {
  const A = { result: ResultArt, "admit-card": AdmitArt, "answer-key": KeyArt, syllabus: SyllabusArt, admission: AdmissionArt }[kind]
  return (
    <div className="hidden shrink-0 pr-6 pt-2 sm:block" aria-hidden>
      <A {...p} />
    </div>
  )
}
