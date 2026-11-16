"use client"

import { useEffect, useState } from "react"
import { BadgeCheck, Banknote, Clock, GraduationCap, MapPinned, Sparkles, TrendingUp, Wifi } from "lucide-react"
import { cn } from "@/lib/utils"
import { CompanyLogo } from "@/components/private/CompanyLogo"

interface Highlights {
  pulse: { live: number; today: number; week: number; companies: number }
  tiles: { remote: number; fresher: number; internship: number; walkin: number; highSalary: number }
  companies: { id: string; name: string; slug: string; logo: string | null; verifiedStatus: string; open: number; fresh: number }[]
  skills: { name: string; count: number }[]
}

export type DiscoverPick =
  | { kind: "remote" }
  | { kind: "fresher" }
  | { kind: "internship" }
  | { kind: "walkin" }
  | { kind: "highSalary" }
  | { kind: "today" }
  | { kind: "company"; id: string }
  | { kind: "skill"; name: string }

export interface DiscoverActive {
  remote: boolean
  fresher: boolean
  internship: boolean
  walkin: boolean
  highSalary: boolean
  today: boolean
  companyId: string
  skill: string
}

const fmt = (n: number) => n.toLocaleString("en-IN")

// Both rail sections share one request.
let pending: Promise<Highlights | null> | null = null
function loadHighlights(): Promise<Highlights | null> {
  pending ??= fetch("/api/private-jobs/highlights")
    .then((r) => r.json())
    .then((json) => (json.success ? (json.data as Highlights) : null))
    .catch(() => null)
    .finally(() => setTimeout(() => (pending = null), 60_000))
  return pending
}

function useHighlights() {
  const [state, setState] = useState<{ data: Highlights | null; done: boolean }>({ data: null, done: false })
  useEffect(() => {
    let alive = true
    loadHighlights().then((data) => alive && setState({ data, done: true }))
    return () => {
      alive = false
    }
  }, [])
  return state
}

type Props = { active: DiscoverActive; onPick: (p: DiscoverPick) => void }

/**
 * Top of the left filter rail: live market pulse and one-tap explore picks
 * with real counts. Each pick toggles a listing filter.
 */
export function PrivateJobsPulse({ active, onPick }: Props) {
  const { data, done } = useHighlights()
  if (!done) return <PulseSkeleton />
  if (!data || data.pulse.live === 0) return null

  const tiles = [
    { key: "today" as const, label: "Posted today", count: data.pulse.today, icon: Clock, on: active.today },
    { key: "remote" as const, label: "Remote", count: data.tiles.remote, icon: Wifi, on: active.remote },
    { key: "fresher" as const, label: "Freshers", count: data.tiles.fresher, icon: Sparkles, on: active.fresher },
    { key: "internship" as const, label: "Internships", count: data.tiles.internship, icon: GraduationCap, on: active.internship },
    { key: "highSalary" as const, label: "₹10 LPA+", count: data.tiles.highSalary, icon: Banknote, on: active.highSalary },
    { key: "walkin" as const, label: "Walk-ins", count: data.tiles.walkin, icon: MapPinned, on: active.walkin },
  ].filter((t) => t.count > 0 || t.on)

  return (
    <section aria-label="Live hiring pulse">
      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60 motion-reduce:hidden" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        Live hiring pulse
      </p>
      <p className="mt-1.5 text-lg font-semibold leading-tight tracking-tight text-foreground">
        <span className="tabular-nums">{fmt(data.pulse.live)}</span> open roles
      </p>
      <p className="text-xs text-muted-foreground">
        at <span className="tabular-nums">{fmt(data.pulse.companies)}</span> companies, synced from official career boards
      </p>
      <dl className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-muted/60 px-2.5 py-1.5">
          <dt className="text-muted-foreground">New today</dt>
          <dd className="text-sm font-semibold tabular-nums text-foreground">+{fmt(data.pulse.today)}</dd>
        </div>
        <div className="rounded-lg bg-muted/60 px-2.5 py-1.5">
          <dt className="text-muted-foreground">This week</dt>
          <dd className="text-sm font-semibold tabular-nums text-foreground">+{fmt(data.pulse.week)}</dd>
        </div>
      </dl>

      {tiles.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-1.5">
          {tiles.map(({ key, label, count, icon: Icon, on }) => (
            <button
              key={key}
              type="button"
              aria-pressed={on}
              onClick={() => onPick({ kind: key })}
              className={cn(
                "flex min-h-11 items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition-colors duration-150",
                on ? "border-foreground bg-foreground text-background" : "border-rule hover:border-foreground/40"
              )}
            >
              <Icon className={cn("h-3.5 w-3.5 shrink-0", on ? "text-background/80" : "text-muted-foreground")} />
              <span className="min-w-0">
                <span className="block truncate text-xs font-medium">{label}</span>
                <span className={cn("block text-[11px] tabular-nums", on ? "text-background/70" : "text-muted-foreground")}>{fmt(count)}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

/** Bottom of the left rail: companies hiring most this week and trending skills. */
export function PrivateJobsTrending({ active, onPick }: Props) {
  const { data } = useHighlights()
  if (!data || data.pulse.live === 0 || (!data.companies.length && !data.skills.length)) return null

  return (
    <div className="space-y-5">
      {data.companies.length > 0 && (
        <section aria-label="Hiring most this week">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <TrendingUp className="h-4 w-4 text-muted-foreground" /> Hiring most this week
            </h3>
            {active.companyId && (
              <button type="button" className="text-xs font-medium text-muted-foreground hover:text-foreground" onClick={() => onPick({ kind: "company", id: active.companyId })}>
                Clear
              </button>
            )}
          </div>
          <ul className="mt-2 space-y-1">
            {data.companies.slice(0, 8).map((c) => {
              const on = active.companyId === c.id
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => onPick({ kind: "company", id: c.id })}
                    className={cn(
                      "flex min-h-11 w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors duration-150",
                      on ? "bg-foreground text-background" : "hover:bg-muted"
                    )}
                  >
                    <CompanyLogo name={c.name} logo={c.logo} size={28} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1 text-sm font-medium">
                        <span className="truncate">{c.name}</span>
                        {c.verifiedStatus === "VERIFIED" && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-sky-600" aria-label="Verified" />}
                      </span>
                      <span className={cn("block text-[11px] tabular-nums", on ? "text-background/70" : "text-muted-foreground")}>
                        {fmt(c.open)} open{c.fresh ? ` · ${fmt(c.fresh)} new` : ""}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {data.skills.length > 0 && (
        <section aria-label="Trending skills">
          <h3 className="text-sm font-semibold text-foreground">Trending skills</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {data.skills.map((s) => {
              const on = active.skill === s.name
              return (
                <button
                  key={s.name}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onPick({ kind: "skill", name: s.name })}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs transition-colors duration-150",
                    on ? "border-foreground bg-foreground text-background" : "border-rule text-foreground/80 hover:border-foreground/40"
                  )}
                >
                  {s.name} <span className={cn("tabular-nums", on ? "text-background/70" : "text-muted-foreground")}>{fmt(s.count)}</span>
                </button>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

function PulseSkeleton() {
  return (
    <div aria-hidden>
      <div className="h-3 w-28 animate-pulse rounded bg-muted" />
      <div className="mt-2 h-5 w-36 animate-pulse rounded bg-muted" />
      <div className="mt-1.5 h-3 w-full animate-pulse rounded bg-muted" />
      <div className="mt-3 grid grid-cols-2 gap-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-11 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  )
}
