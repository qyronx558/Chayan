"use client"

import { useSyncExternalStore, type ReactNode } from "react"
import Link from "next/link"
import { FileDown } from "lucide-react"
import { cn, formatDate } from "@/lib/utils"
import { cleanTitle } from "@/lib/card-helpers"
import { handFont, typeFont } from "@/components/home/fonts"
import { daysLeft } from "@/components/home/HomeJobRow"
import { DrawingPin, RubberStamp, Tape, paperShadow, seeded, tilt } from "@/components/desk/DeskKit"

/*
 * Results day. Everyone knows the feeling: the list goes up on the green
 * notice board, people crowd round, and your finger runs down the roll
 * numbers while your heart does something strange. So every result here is
 * a typed merit-list sheet pinned to that board, and you can write your own
 * roll number on a chit once, so each sheet tells you what to look for.
 */

/* ── your roll number, remembered on this device ── */
const ROLL_KEY = "ChayanJobs_roll_no_v1"
const rollListeners = new Set<() => void>()
const readRoll = () => {
  try {
    return localStorage.getItem(ROLL_KEY) ?? ""
  } catch {
    return ""
  }
}
const subscribeRoll = (fn: () => void) => {
  rollListeners.add(fn)
  window.addEventListener("storage", fn)
  return () => {
    rollListeners.delete(fn)
    window.removeEventListener("storage", fn)
  }
}
function useRollNumber() {
  const roll = useSyncExternalStore(subscribeRoll, readRoll, () => "")
  const setRoll = (v: string) => {
    try {
      if (v) localStorage.setItem(ROLL_KEY, v)
      else localStorage.removeItem(ROLL_KEY)
    } catch {}
    rollListeners.forEach((fn) => fn())
  }
  return [roll, setRoll] as const
}

/* ───────────────────────── hero: the notice board ───────────────────────── */

export function ResultsBoard({ total }: { total: number }) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.15fr]">
      <div className="order-2 lg:order-1">
        <p className={cn(handFont.className, "text-[1.25rem] text-[var(--color-brick)]")}>results</p>
        <h1 className="mt-1 font-display text-[2.4rem] font-black leading-[1.05] text-foreground sm:text-[3.2rem]">
          The list is up.
          <br />
          Find your name.
        </h1>
        <p className="mt-4 max-w-md text-[16px] leading-relaxed text-muted-foreground">
          Every result we know about is pinned here, with the date it came out and the PDF from the official site. Take a
          breath before you open it. Whatever it says, it is one list, not the last one.
        </p>
      </div>

      {/* the green baize board in its wooden frame */}
      <div className="order-1 lg:order-2">
        <div
          className="relative rounded-[6px] p-3 sm:p-4"
          style={{
            background: "linear-gradient(135deg, oklch(48% 0.07 55), oklch(38% 0.06 50))",
            boxShadow: "inset 0 1px 0 rgb(255 255 255 / .2), 0 24px 40px -24px rgb(40 20 0 / .7)",
          }}
        >
          <div
            className="relative grid min-h-[16rem] grid-cols-6 gap-3 overflow-hidden rounded-[2px] p-4 sm:p-6"
            style={{
              background: "oklch(40% 0.06 160)",
              backgroundImage: "radial-gradient(circle, rgb(255 255 255 / .05) 1px, transparent 1.5px)",
              backgroundSize: "6px 6px",
              boxShadow: "inset 0 3px 10px rgb(0 0 0 / .45)",
            }}
          >
            {/* the typed notice */}
            <div className="relative col-span-4 -rotate-[1.2deg] bg-[oklch(97%_0.01_90)] px-4 pb-4 pt-5 text-[oklch(25%_0.02_60)] shadow-[0_6px_12px_rgb(0_0_0/.35)]">
              <DrawingPin className="left-1/2 top-1.5 -translate-x-1/2" hue={250} />
              <p className={cn(typeFont.className, "text-center text-[10px] font-bold")}>OFFICE OF THE CONTROLLER OF EXAMINATIONS</p>
              <p className={cn(typeFont.className, "mt-2 text-center text-[17px] font-bold underline underline-offset-4 sm:text-[20px]")}>RESULT DECLARED</p>
              <div className={cn(typeFont.className, "mt-3 space-y-1 text-[10px]")}>
                {[0, 1, 2, 3, 4].map((r) => (
                  <div key={r} className="relative flex gap-3">
                    <span className="w-5 text-right">{r + 1}.</span>
                    <span className="h-[7px] flex-1 translate-y-[3px] rounded-full bg-[oklch(25%_0.02_60)]/20" style={{ maxWidth: `${70 + ((r * 37) % 30)}%` }} />
                    {r === 2 && (
                      <span className="absolute -inset-x-1 -inset-y-0.5 -rotate-[0.6deg] rounded-[2px] bg-[oklch(88%_0.17_95)]/70 mix-blend-multiply" aria-hidden />
                    )}
                  </div>
                ))}
              </div>
            </div>
            {/* chits pinned beside it */}
            <div className="col-span-2 flex flex-col gap-4">
              <div className="relative rotate-[3deg] bg-[oklch(90%_0.09_95)] px-3 pb-3 pt-4 shadow-[0_6px_10px_rgb(0_0_0/.3)]">
                <DrawingPin className="left-3 top-1" />
                <p className={cn(handFont.className, "text-[1.05rem] leading-tight text-[oklch(28%_0.04_60)] sm:text-[1.2rem]")}>
                  {total > 0 ? `${total.toLocaleString("en-IN")} lists on the board` : "lists going up soon"}
                </p>
              </div>
              <div className="relative -rotate-[2deg] bg-[oklch(92%_0.04_10)] px-3 pb-3 pt-4 shadow-[0_6px_10px_rgb(0_0_0/.3)]">
                <Tape className="-top-3 left-1/2 h-5 w-12 -translate-x-1/2 rotate-[4deg]" />
                <p className={cn(handFont.className, "text-[0.98rem] leading-tight text-[oklch(30%_0.05_20)] sm:text-[1.1rem]")}>
                  breathe first. then Ctrl+F.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────── aside: the roll-number chit ───────────────────────── */

export function RollNumberChit() {
  const [roll, setRoll] = useRollNumber()
  return (
    <div
      className="relative -rotate-[0.8deg] rounded-[3px] px-5 pb-5 pt-7"
      style={{ background: "color-mix(in oklch, oklch(84% 0.07 10) 28%, oklch(98% 0.008 90))", boxShadow: "0 1px 1px rgb(60 40 10 / .08), 0 16px 28px -18px rgb(60 40 10 / .5)" }}
    >
      <Tape className="-top-3 left-1/2 -translate-x-1/2 -rotate-[3deg]" />
      <p className={cn(handFont.className, "text-[1.3rem] leading-tight text-[var(--hs-chit-ink)]")}>
        Write your roll number here, once.
      </p>
      <p className="mt-1 text-[12.5px] leading-snug text-[var(--hs-chit-ink)]/75">
        So you don&apos;t dig out the admit card every time. Every sheet will remind you what to look for. It stays on this
        device only.
      </p>
      <label className="mt-4 block">
        <span className={cn(typeFont.className, "text-[10.5px] text-[var(--hs-chit-ink)]/70")}>ROLL No.</span>
        <input
          value={roll}
          onChange={(e) => setRoll(e.target.value.replace(/[^\w/-]/g, "").slice(0, 20))}
          placeholder="e.g. 2401106532"
          inputMode="text"
          autoComplete="off"
          className={cn(
            handFont.className,
            "mt-0.5 block w-full border-b-2 border-dotted border-[var(--hs-chit-ink)]/40 bg-transparent pb-1 text-[1.5rem] tracking-[0.06em] text-[oklch(42%_0.075_205)] outline-none placeholder:text-[var(--hs-chit-ink)]/30 focus:border-[oklch(42%_0.075_205)]"
          )}
        />
      </label>
      <p className={cn(handFont.className, "mt-3 text-[1.02rem] text-[oklch(45%_0.17_28)]")}>
        {roll ? "open the PDF, press Ctrl+F, type it. all the best." : "nobody else sees this."}
      </p>
    </div>
  )
}

/* ───────────────────────── the merit-list sheet ───────────────────────── */

export interface ResultSheetData {
  id: string
  title: string
  slug: string
  pdfUrl: string | null
  resultDate: string | null
  department: { id: string; name: string; slug: string }
  category: { id: string; name: string; slug: string }
}

function stampFor(r: ResultSheetData) {
  const d = daysLeft(r.resultDate)
  if (d === null) return { label: "SEE NOTICE", tone: "oklch(45% 0.03 60)" }
  if (d > 0) return { label: "AWAITED", tone: "oklch(48% 0.12 250)" }
  return { label: "DECLARED", tone: "oklch(45% 0.1 160)" }
}

export function ResultSheetCard({ item, index, save, share }: { item: ResultSheetData; index: number; save: ReactNode; share: ReactNode }) {
  const [roll] = useRollNumber()
  const title = cleanTitle(item.title)
  const href = `/result/${item.slug}`
  const stamp = stampFor(item)
  const mark = 1 + Math.floor(seeded(item.id) * 3)

  return (
    <article
      className={cn("group relative flex h-full flex-col rounded-[2px] bg-[var(--hs-paper-slip)] pt-5 transition-transform duration-300 hover:-translate-y-1", tilt(index))}
      style={{ boxShadow: paperShadow }}
    >
      <DrawingPin className="left-1/2 top-1.5 -translate-x-1/2" hue={index % 2 ? 250 : 28} />

      <div className="flex-1 px-5 pb-4">
        <p className={cn(typeFont.className, "line-clamp-2 text-center text-[10.5px] font-bold uppercase text-muted-foreground")}>{item.department.name}</p>
        <p className={cn(typeFont.className, "mt-1 text-center text-[11px] font-bold text-foreground/70 underline underline-offset-2")}>NOTICE</p>

        <h3 className="mt-3 line-clamp-3 text-[16px] font-bold leading-snug text-foreground">
          <Link href={href} className="decoration-[var(--hs-trust)] decoration-2 underline-offset-[3px] after:absolute after:inset-0 after:content-[''] hover:underline">
            {title}
          </Link>
        </h3>

        <div className="mt-2 flex items-center justify-between gap-3">
          <span className={cn(handFont.className, "text-[1.05rem] text-foreground/80")}>
            {item.resultDate ? `out on ${formatDate(item.resultDate, "d MMM yyyy")}` : "date as per notice"}
          </span>
          <RubberStamp label={stamp.label} tone={stamp.tone} />
        </div>

        {/* the list itself: blank rows, one swiped with a highlighter */}
        <div className={cn(typeFont.className, "mt-4 border border-[var(--hs-border-strong)] text-[10px] text-muted-foreground")} aria-hidden>
          <div className="grid grid-cols-[2.2rem_1fr_3.6rem] border-b border-[var(--hs-border-strong)] bg-[var(--hs-surface-2)] font-bold">
            <span className="border-r border-[var(--hs-border-strong)] px-1.5 py-1">S.No</span>
            <span className="border-r border-[var(--hs-border-strong)] px-1.5 py-1">Roll No.</span>
            <span className="px-1.5 py-1">Status</span>
          </div>
          {[0, 1, 2, 3].map((r) => (
            <div key={r} className="relative grid grid-cols-[2.2rem_1fr_3.6rem] border-b border-dotted border-[var(--hs-border)] last:border-b-0">
              <span className="border-r border-[var(--hs-border-strong)] px-1.5 py-1">{r + 1}</span>
              <span className="flex items-center border-r border-[var(--hs-border-strong)] px-1.5 py-1">
                {r === mark && roll ? (
                  <span className={cn(handFont.className, "text-[0.95rem] leading-none text-[oklch(42%_0.075_205)]")}>{roll}?</span>
                ) : (
                  <span className="h-[6px] rounded-full bg-foreground/15" style={{ width: `${55 + seeded(item.id, r) * 40}%` }} />
                )}
              </span>
              <span className="flex items-center px-1.5 py-1">
                <span className="h-[6px] w-8 rounded-full bg-foreground/10" />
              </span>
              {r === mark && <span className="absolute -inset-x-0.5 inset-y-0 -rotate-[0.5deg] bg-[oklch(88%_0.17_95)]/55 mix-blend-multiply dark:bg-[oklch(70%_0.15_95)]/30 dark:mix-blend-screen" />}
            </div>
          ))}
        </div>
        <p className={cn(handFont.className, "mt-1.5 text-right text-[0.95rem] text-[var(--color-brick)]/85")}>
          {roll ? `look for ${roll}` : "is your name on it?"}
        </p>
      </div>

      <div className="relative z-10 flex flex-wrap items-center gap-x-4 gap-y-2 border-t-2 border-dashed border-[var(--hs-border-strong)] px-5 py-3">
        <Link href={href} className={cn(handFont.className, "text-[1.1rem] text-[var(--hs-trust)] underline decoration-wavy decoration-1 underline-offset-4")}>
          check the result →
        </Link>
        {item.pdfUrl && (
          <a href={item.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[12px] font-semibold text-muted-foreground hover:text-foreground">
            <FileDown className="h-3.5 w-3.5" />
            Result PDF
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
