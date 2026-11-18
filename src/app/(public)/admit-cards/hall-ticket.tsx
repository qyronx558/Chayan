"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { Download } from "lucide-react"
import { cn, formatDate } from "@/lib/utils"
import { cleanTitle } from "@/lib/card-helpers"
import { handFont, typeFont } from "@/components/home/fonts"
import { daysLeft } from "@/components/home/HomeJobRow"
import { PinnedChecklist, RubberStamp, paperShadow, seeded, tilt } from "@/components/desk/DeskKit"

/*
 * The admit card is the moment the exam stops being "someday". You print it
 * at the cyber café, check the centre address twice, slide it into a plastic
 * folder with two pens and a photo ID, and set three alarms. So each admit
 * card here is a hall ticket: photo box, roll-number line, barcode, the exam
 * date torn off a calendar, and a perforated stub to download it.
 */

/** A barcode that is the same every time for the same id. Pure decoration. */
function Barcode({ id, className }: { id: string; className?: string }) {
  const bars: { x: number; w: number }[] = []
  let x = 0
  for (let i = 0; x < 118; i++) {
    const w = 1 + Math.floor(seeded(id, i) * 3)
    if (i % 2 === 0) bars.push({ x, w })
    x += w + (i % 2 ? 0 : 1)
  }
  return (
    <svg viewBox="0 0 120 28" preserveAspectRatio="none" className={className} aria-hidden>
      {bars.map((b) => (
        <rect key={b.x} x={b.x} y={0} width={b.w} height={28} fill="currentColor" />
      ))}
    </svg>
  )
}

/* ───────────────────────── hero ───────────────────────── */

export function HallTicketHero({ total }: { total: number }) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-[1fr_1fr]">
      <div>
        <p className={cn(handFont.className, "text-[1.25rem] text-[var(--color-brick)]")}>admit cards</p>
        <h1 className="mt-1 font-display text-[2.4rem] font-black leading-[1.05] text-foreground sm:text-[3.2rem]">
          The exam is real now.
        </h1>
        <p className="mt-4 max-w-md text-[16px] leading-relaxed text-muted-foreground">
          Hall tickets for every exam we track, with the exam date and the official download link. Print two copies.
          Keep one in your bag tonight, and one in the drawer, just in case.
        </p>
        <p className={cn(handFont.className, "mt-3 text-[1.2rem] text-foreground/70")}>
          {total > 0 ? `${total.toLocaleString("en-IN")} hall tickets on the table` : "hall tickets arriving soon"}
        </p>
      </div>

      {/* a hall ticket in a clear plastic folder, a pen clipped on */}
      <div className="relative mx-auto w-full max-w-md">
        <div
          className="relative rotate-[2deg] rounded-[10px] p-3"
          style={{
            background: "linear-gradient(160deg, rgb(255 255 255 / .55), rgb(200 220 235 / .25))",
            border: "1px solid rgb(150 180 200 / .55)",
            boxShadow: "inset 0 1px 0 rgb(255 255 255 / .8), 0 24px 40px -24px rgb(20 40 60 / .55)",
          }}
        >
          {/* folder snap */}
          <span className="absolute -top-2 right-8 h-5 w-10 rounded-[4px] bg-[oklch(70%_0.03_230)]/70 shadow-[0_2px_4px_rgb(0_0_0/.2)]" aria-hidden />
          <div className="rounded-[2px] bg-[oklch(98%_0.005_90)] text-[oklch(25%_0.02_60)]">
            <div className="flex items-center justify-between bg-[oklch(45%_0.15_28)] px-4 py-2 text-[oklch(97%_0.01_90)]">
              <span className={cn(typeFont.className, "text-[11px] font-bold")}>ADMIT CARD · HALL TICKET</span>
              <span className={cn(typeFont.className, "text-[10px]")}>2026</span>
            </div>
            <div className="flex gap-4 p-4">
              <div className={cn(typeFont.className, "min-w-0 flex-1 space-y-2.5 text-[10.5px]")}>
                {[
                  ["Name", "you"],
                  ["Roll No.", "on your card"],
                  ["Centre", "check it twice"],
                  ["Reporting", "1 hour early"],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-end gap-2">
                    <span className="w-16 shrink-0 text-[oklch(45%_0.02_60)]">{k}</span>
                    <span className={cn(handFont.className, "flex-1 border-b border-dotted border-[oklch(60%_0.02_60)] text-[1.05rem] leading-none text-[oklch(35%_0.09_250)]")}>{v}</span>
                  </div>
                ))}
              </div>
              <div className="flex h-[92px] w-[74px] shrink-0 flex-col items-center justify-center border border-[oklch(60%_0.02_60)] bg-[oklch(94%_0.01_90)]">
                <svg viewBox="0 0 40 44" className="h-12 w-11 text-[oklch(70%_0.02_60)]" aria-hidden>
                  <circle cx="20" cy="15" r="9" fill="currentColor" />
                  <path d="M3 44 C 4 30, 12 26, 20 26 C 28 26, 36 30, 37 44 Z" fill="currentColor" />
                </svg>
              </div>
            </div>
            <div className="flex items-end justify-between gap-4 border-t border-dashed border-[oklch(70%_0.02_60)] px-4 py-3">
              <Barcode id="chayanjobs-hall-ticket" className="h-7 w-32 text-[oklch(25%_0.02_60)]" />
              <span className={cn(handFont.className, "-rotate-[3deg] text-[1.2rem] leading-none text-[oklch(35%_0.09_250)]")}>your sign</span>
            </div>
          </div>
        </div>
        {/* the ballpoint, clipped on */}
        <svg viewBox="0 0 200 20" className="absolute -right-3 top-10 h-5 w-48 rotate-[62deg] drop-shadow-[2px_4px_3px_rgb(0_0_0/.25)]" aria-hidden>
          <rect x="18" y="5" width="160" height="10" rx="5" fill="oklch(30% 0.05 250)" />
          <rect x="150" y="2" width="40" height="5" rx="2" fill="oklch(75% 0.02 250)" />
          <path d="M18 5 L 2 10 L 18 15 Z" fill="oklch(80% 0.02 80)" />
          <path d="M2 10 L 0 10" stroke="oklch(25% 0.02 60)" strokeWidth="2" />
        </svg>
      </div>
    </div>
  )
}

/* ───────────────────────── aside ───────────────────────── */

const NIGHT_BEFORE = [
  { id: "print", label: "Admit card printed (two copies)" },
  { id: "id", label: "Original photo ID: Aadhaar / PAN / voter ID" },
  { id: "photos", label: "Two passport photos, same as the form" },
  { id: "pens", label: "Two black ballpoint pens" },
  { id: "centre", label: "Centre found on the map, travel time known" },
  { id: "rules", label: "Read the instructions page on the card" },
  { id: "alarm", label: "Alarm set, then one more" },
  { id: "sleep", label: "Sleep. Really." },
]

export function NightBeforeChecklist() {
  return (
    <PinnedChecklist storageKey="ChayanJobs_exam_bag_v1" title="The night before, in the bag:" items={NIGHT_BEFORE} doneText="bag packed. go sleep." paper="blue" />
  )
}

/* ───────────────────────── the hall ticket card ───────────────────────── */

export interface HallTicketData {
  id: string
  title: string
  slug: string
  examDate: string | null
  downloadUrl: string | null
  department: { id: string; name: string; slug: string }
}

function countdown(d: number | null) {
  if (d === null) return "date on the notice"
  if (d < 0) return "exam done. well done for sitting it."
  if (d === 0) return "today. all the best!"
  if (d === 1) return "tomorrow. pack the bag tonight."
  return `in ${d} days`
}

export function HallTicketCard({ item, index, save, share }: { item: HallTicketData; index: number; save: ReactNode; share: ReactNode }) {
  const title = cleanTitle(item.title)
  const href = `/admit-card/${item.slug}`
  const d = daysLeft(item.examDate)
  const exam = item.examDate ? new Date(item.examDate) : null
  const soon = d !== null && d >= 0 && d <= 7

  return (
    <article
      className={cn("group relative flex h-full flex-col overflow-hidden rounded-[3px] border border-[var(--hs-border)] bg-[var(--hs-paper-slip)] transition-transform duration-300 hover:-translate-y-1", tilt(index))}
      style={{ boxShadow: paperShadow }}
    >
      <div className="flex items-center justify-between gap-3 bg-[color-mix(in_oklch,var(--color-brick)_88%,black)] px-4 py-1.5 text-[oklch(97%_0.01_90)]">
        <span className={cn(typeFont.className, "text-[10.5px] font-bold")}>ADMIT CARD</span>
        <span className={cn(typeFont.className, "truncate text-[10px] opacity-85")}>{item.department.name}</span>
      </div>

      <div className="flex-1 p-4">
        <div className="flex gap-4">
          {/* exam date, torn off a desk calendar */}
          <div className="w-[68px] shrink-0 overflow-hidden rounded-[3px] border border-[var(--hs-border-strong)] bg-[var(--hs-surface)] text-center shadow-[0_2px_0_var(--hs-border)]">
            <div className="flex justify-center gap-3 bg-[var(--hs-surface-2)] py-1" aria-hidden>
              <span className="h-1.5 w-1.5 rounded-full bg-foreground/40" />
              <span className="h-1.5 w-1.5 rounded-full bg-foreground/40" />
            </div>
            {exam ? (
              <>
                <span className={cn(typeFont.className, "block text-[10px] font-bold text-[var(--color-brick)]")}>{formatDate(exam, "MMM").toUpperCase()}</span>
                <span className="block font-display text-[1.9rem] font-black leading-none text-foreground">{formatDate(exam, "d")}</span>
                <span className={cn(typeFont.className, "block pb-1.5 text-[9.5px] text-muted-foreground")}>{formatDate(exam, "EEE yyyy")}</span>
              </>
            ) : (
              <span className={cn(handFont.className, "block px-1 py-3 text-[0.95rem] leading-tight text-muted-foreground")}>date soon</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-3 text-[16px] font-bold leading-snug text-foreground">
              <Link href={href} className="decoration-[var(--hs-trust)] decoration-2 underline-offset-[3px] after:absolute after:inset-0 after:content-[''] hover:underline">
                {title}
              </Link>
            </h3>
            <p className={cn(handFont.className, "mt-1.5 text-[1.05rem] leading-tight", soon ? "text-[var(--color-brick)]" : "text-foreground/70")}>{countdown(d)}</p>
          </div>
        </div>

        <div className={cn(typeFont.className, "mt-4 space-y-2 text-[10.5px] text-muted-foreground")}>
          <div className="flex items-end gap-2">
            <span className="w-14 shrink-0">Roll No.</span>
            <span className="flex-1 border-b border-dotted border-[var(--hs-border-strong)]" />
          </div>
          <div className="flex items-end gap-2">
            <span className="w-14 shrink-0">Centre</span>
            <span className="flex-1 border-b border-dotted border-[var(--hs-border-strong)]" />
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <Barcode id={item.id} className="h-6 w-28 text-foreground/70" />
          <RubberStamp label={item.downloadUrl ? "READY" : "RELEASING SOON"} tone={item.downloadUrl ? "oklch(45% 0.1 160)" : "oklch(48% 0.12 250)"} />
        </div>
      </div>

      {/* perforated stub */}
      <div className="relative z-10 flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3" style={{ backgroundImage: "radial-gradient(circle, var(--hs-border-strong) 1.2px, transparent 1.6px)", backgroundSize: "8px 4px", backgroundRepeat: "repeat-x", backgroundPosition: "top" }}>
        {item.downloadUrl ? (
          <a href={item.downloadUrl} target="_blank" rel="noopener noreferrer" className={cn(handFont.className, "inline-flex items-center gap-1 text-[1.1rem] text-[var(--hs-trust)] underline decoration-wavy decoration-1 underline-offset-4")}>
            <Download className="h-4 w-4" />
            download hall ticket
          </a>
        ) : null}
        <Link href={href} className={cn(item.downloadUrl ? "text-[12px] font-semibold text-muted-foreground hover:text-foreground" : cn(handFont.className, "text-[1.1rem] text-[var(--hs-trust)] underline decoration-wavy decoration-1 underline-offset-4"))}>
          {item.downloadUrl ? "details" : "read the notice →"}
        </Link>
        <span className="ml-auto flex items-center gap-1">
          {save}
          {share}
        </span>
      </div>
    </article>
  )
}
