"use client"

import "@/app/home.css"
import { useSyncExternalStore, type CSSProperties, type ReactNode } from "react"
import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { handFont, typeFont } from "@/components/home/fonts"
import { ListingLayout } from "@/components/listing/ListingLayout"
import type { ListingFiltersProps } from "@/components/listing/types"
import { DeskFilters } from "@/components/desk/DeskFilters"

/*
 * Shared paper pieces for the listing pages (admissions, results, admit
 * cards, answer keys, syllabus, jobs). Each page brings its own object and
 * feeling; this file only holds the desk they all sit on. Nothing here
 * fetches or decides anything: every page keeps its own state and hooks.
 */

export const TICK_PATH = "M3 13.5 C 5.5 15, 8 18, 10 21 C 13 13, 18 7, 25 2.5"

export const paperShadow = "0 1px 2px rgb(60 40 10 / .08), 0 16px 28px -22px rgb(60 40 10 / .55)"

/** Small rotation so a grid of paper never lines up like a spreadsheet. */
export const tilt = (i: number) => (i % 3 === 1 ? "rotate-[0.5deg]" : i % 3 === 2 ? "-rotate-[0.4deg]" : "")

/** Stable 0..1 number from a string, for decorative variety that doesn't flicker. */
export function seeded(id: string, salt = 0) {
  let h = 2166136261 ^ salt
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619)
  return ((h >>> 0) % 10000) / 10000
}

export function HandTick({ className, draw = true }: { className?: string; draw?: boolean }) {
  return (
    <svg viewBox="0 0 28 24" className={className} fill="none" aria-hidden>
      <path
        className={draw ? "hs-draw" : undefined}
        style={draw ? ({ ["--len" as string]: 40, animationDuration: ".35s" } as CSSProperties) : undefined}
        d={TICK_PATH}
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** A loop drawn round something with a pen, never quite closed. */
export function PenLoop({ className, color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 100 34" preserveAspectRatio="none" className={cn("pointer-events-none absolute overflow-visible", className)} aria-hidden>
      <path
        d="M54 3 C 82 2, 98 9, 96 18 C 94 28, 70 32, 48 31 C 22 31, 3 26, 3 17 C 3 8, 22 3, 44 3 C 56 3, 64 4, 70 6"
        fill="none"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

/** Rubber stamp, pressed slightly crooked. */
export function RubberStamp({ label, tone, className }: { label: string; tone: string; className?: string }) {
  return (
    <span
      className={cn(
        typeFont.className,
        "pointer-events-none inline-block -rotate-[11deg] rounded-[4px] border-[2.5px] px-2 py-0.5 text-[12px] font-bold leading-tight opacity-85",
        className
      )}
      style={{ color: tone, borderColor: tone, background: "color-mix(in oklch, var(--hs-paper-slip) 55%, transparent)" }}
    >
      {label}
    </span>
  )
}

export function DrawingPin({ className, hue = 28 }: { className?: string; hue?: number }) {
  return (
    <span
      className={cn("absolute h-4 w-4 rounded-full", className)}
      style={{
        background: `radial-gradient(circle at 35% 30%, oklch(82% 0.1 ${hue}), oklch(55% 0.17 ${hue}) 55%, oklch(38% 0.13 ${hue}))`,
        boxShadow: "2px 3px 3px rgb(0 0 0 / .3)",
      }}
      aria-hidden
    />
  )
}

export function Tape({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <span
      className={cn("absolute h-6 w-20", className)}
      style={{ background: "color-mix(in oklch, var(--hs-surface) 62%, transparent)", boxShadow: "0 1px 2px rgb(0 0 0 / .1)", ...style }}
      aria-hidden
    />
  )
}

/* ───────── a pinned checklist that remembers your ticks on this device ───────── */

const listeners = new Set<() => void>()
const notify = () => listeners.forEach((fn) => fn())
const subscribe = (fn: () => void) => {
  listeners.add(fn)
  window.addEventListener("storage", fn)
  return () => {
    listeners.delete(fn)
    window.removeEventListener("storage", fn)
  }
}

export function PinnedChecklist({
  storageKey,
  title,
  items,
  doneText,
  paper = "marigold",
  className,
}: {
  storageKey: string
  title: string
  items: { id: string; label: string }[]
  doneText: string
  paper?: "marigold" | "blue" | "pink" | "green"
  className?: string
}) {
  const read = () => {
    try {
      return localStorage.getItem(storageKey) ?? ""
    } catch {
      return ""
    }
  }
  const raw = useSyncExternalStore(subscribe, read, () => "")
  const checked = new Set(raw ? raw.split(",") : [])
  const toggle = (id: string) => {
    const next = new Set(checked)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    try {
      localStorage.setItem(storageKey, [...next].join(","))
    } catch {}
    notify()
  }
  const done = items.filter((d) => checked.has(d.id)).length
  const tint = { marigold: "var(--hs-marigold)", blue: "oklch(80% 0.07 230)", pink: "oklch(84% 0.07 10)", green: "oklch(85% 0.08 140)" }[paper]

  return (
    <div
      className={cn("relative rotate-[0.8deg] rounded-[3px] px-5 pb-5 pt-7", className)}
      style={{ background: `color-mix(in oklch, ${tint} 26%, oklch(98% 0.008 90))`, boxShadow: "0 1px 1px rgb(60 40 10 / .08), 0 16px 28px -18px rgb(60 40 10 / .5)" }}
    >
      <DrawingPin className="left-1/2 top-2 -translate-x-1/2" />
      <p className={cn(handFont.className, "text-[1.3rem] leading-tight text-[var(--hs-chit-ink)]")}>{title}</p>
      <ul className="mt-3 space-y-1">
        {items.map((d) => {
          const on = checked.has(d.id)
          return (
            <li key={d.id}>
              <button type="button" onClick={() => toggle(d.id)} aria-pressed={on} className="group flex w-full items-center gap-2.5 py-1 text-left">
                <span className="relative h-[18px] w-[18px] shrink-0 rounded-[2px] border-[1.5px] border-[oklch(40%_0.03_60)]">
                  {on && <HandTick className="absolute -right-1.5 -top-2 h-6 w-7 text-[oklch(42%_0.075_205)]" />}
                </span>
                <span className={cn("text-[13.5px] text-[var(--hs-chit-ink)] transition-opacity", on && "line-through decoration-[oklch(42%_0.075_205)] decoration-2 opacity-60")}>
                  {d.label}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <p className={cn(handFont.className, "mt-3 text-right text-[1.1rem] text-[oklch(45%_0.17_28)]")}>
        {done === items.length ? doneText : `${done} of ${items.length} done`}
      </p>
    </div>
  )
}

/* ───────── clipboard for the filter rail (desktop) ───────── */

export function Clipboard({ children }: { children: ReactNode }) {
  return (
    <div className="relative lg:rounded-[6px] lg:border lg:border-[var(--hs-border)] lg:bg-[var(--hs-paper-slip)] lg:px-4 lg:pb-5 lg:pt-10 lg:shadow-[0_16px_30px_-22px_rgb(60_40_10/.5)]">
      <span
        className="absolute -top-3 left-1/2 hidden h-9 w-28 -translate-x-1/2 rounded-[6px] lg:block"
        style={{ background: "linear-gradient(180deg, oklch(80% 0.01 250), oklch(62% 0.015 250))", boxShadow: "inset 0 1px 0 rgb(255 255 255 / .6), 0 3px 5px rgb(0 0 0 / .25)" }}
        aria-hidden
      >
        <span className="absolute left-1/2 top-2 h-3 w-10 -translate-x-1/2 rounded-full bg-[oklch(45%_0.01_250)]" />
      </span>
      {children}
    </div>
  )
}

/* ───────── skeleton: a blank sheet ───────── */

export function PaperSkeleton() {
  return (
    <div className="rounded-[3px] border border-[var(--hs-border)] bg-[var(--hs-paper-slip)] p-5">
      <span className="hs-skel block h-3 w-2/3" />
      <div className="mt-4 flex gap-4">
        <span className="flex-1 space-y-2">
          <span className="hs-skel block h-4 w-11/12" />
          <span className="hs-skel block h-4 w-3/4" />
        </span>
        <span className="hs-skel block h-[72px] w-[60px]" />
      </div>
      <span className="hs-skel mt-5 block h-3 w-full" />
      <span className="hs-skel mt-3 block h-3 w-full" />
      <span className="hs-skel mt-3 block h-3 w-2/3" />
    </div>
  )
}

/* ───────── the page shell ───────── */

export const deskGrid = "grid gap-x-6 gap-y-9 md:grid-cols-2 2xl:grid-cols-3"

function PaperMessage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-6 flex flex-col items-center rounded-[3px] border border-dashed border-[var(--hs-border-strong)] bg-[var(--hs-paper-slip)] px-6 py-14 text-center">
      <p className={cn(handFont.className, "text-[1.5rem] text-foreground")}>{title}</p>
      {children}
    </div>
  )
}

export interface DeskListingProps {
  hero: ReactNode
  filters: ListingFiltersProps
  /** Paper under the filter rail on desktop; after the list on phones. */
  aside?: ReactNode
  toolbar: ReactNode
  loading: boolean
  error: string | null
  onRetry: () => void
  errorTitle?: string
  empty: boolean
  emptyTitle: string
  emptyHint: string
  loadingMore: boolean
  footer: ReactNode
  skeleton?: ReactNode
  gridClassName?: string
  children: ReactNode
}

export function DeskListing(p: DeskListingProps) {
  const skeleton = p.skeleton ?? <PaperSkeleton />
  const grid = p.gridClassName ?? deskGrid
  return (
    <div className="home-saas text-foreground">
      <div className="container mx-auto max-w-7xl px-4 pb-16 pt-8">
        {p.hero}
        <div className="mt-14">
          <ListingLayout
            filters={
              <div className="space-y-10">
                <Clipboard>
                  <DeskFilters {...p.filters} />
                </Clipboard>
                {p.aside ? <div className="hidden lg:block">{p.aside}</div> : null}
              </div>
            }
          >
            {p.toolbar}
            {p.loading ? (
              <div className={cn(grid, "mt-6")}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i}>{skeleton}</div>
                ))}
              </div>
            ) : p.error ? (
              <PaperMessage title={p.errorTitle ?? "Something slipped off the desk."}>
                <AlertCircle className="order-first mb-3 h-9 w-9 text-brick" />
                <p className="mb-5 mt-1 text-sm text-muted-foreground">{p.error}</p>
                <Button onClick={p.onRetry}>Try again</Button>
              </PaperMessage>
            ) : p.empty ? (
              <PaperMessage title={p.emptyTitle}>
                <p className="mb-5 mt-1 max-w-sm text-sm text-muted-foreground">{p.emptyHint}</p>
                {p.filters.hasActiveFilters && (
                  <Button variant="outline" onClick={p.filters.onClear}>
                    Clear filters
                  </Button>
                )}
              </PaperMessage>
            ) : (
              <>
                <div className={cn(grid, "mt-6")}>{p.children}</div>
                {p.loadingMore ? (
                  <div className={cn(grid, "mt-9")}>
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div key={i}>{skeleton}</div>
                    ))}
                  </div>
                ) : null}
                {p.footer}
              </>
            )}
          </ListingLayout>
        </div>
        {p.aside ? <div className="mx-auto mt-14 max-w-md lg:hidden">{p.aside}</div> : null}
      </div>
    </div>
  )
}

/** Each sheet fades up a little after the one before it. */
export function DeskItem({ index, children }: { index: number; children: ReactNode }) {
  return (
    <div className="hs-fade-up h-full" style={{ animationDelay: `${(index % 6) * 60}ms` }}>
      {children}
    </div>
  )
}
