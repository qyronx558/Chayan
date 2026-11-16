"use client"

import { useEffect, useState } from "react"
import { BadgeCheck, Clock, GraduationCap, IndianRupee, MapPinned, Sparkles, TrendingUp, Wifi } from "lucide-react"
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

/**
 * "Discover" panel above the private-jobs results: a live market pulse,
 * one-tap explore tiles with real counts, the companies hiring most this week
 * and trending skills. Every control toggles a listing filter.
 */
export function PrivateJobsDiscover({ active, onPick }: { active: DiscoverActive; onPick: (p: DiscoverPick) => void }) {
  const [data, setData] = useState<Highlights | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    fetch("/api/private-jobs/highlights")
      .then((r) => r.json())
      .then((json) => {
        if (!alive) return
        if (json.success) setData(json.data)
        else setFailed(true)
      })
      .catch(() => alive && setFailed(true))
    return () => {
      alive = false
    }
  }, [])

  if (failed) return null
  if (!data) return <DiscoverSkeleton />
  if (data.pulse.live === 0) return null

  const tiles = [
    { key: "today" as const, label: "Posted today", count: data.pulse.today, icon: Clock, on: active.today },
    { key: "remote" as const, label: "Remote", count: data.tiles.remote, icon: Wifi, on: active.remote },
    { key: "fresher" as const, label: "Freshers", count: data.tiles.fresher, icon: Sparkles, on: active.fresher },
    { key: "internship" as const, label: "Internships", count: data.tiles.internship, icon: GraduationCap, on: active.internship },
    { key: "highSalary" as const, label: "₹10 LPA+", count: data.tiles.highSalary, icon: IndianRupee, on: active.highSalary },
    { key: "walkin" as const, label: "Walk-ins", count: data.tiles.walkin, icon: MapPinned, on: active.walkin },
  ].filter((t) => t.count > 0 || t.on)

  return (
    <section aria-label="Discover private jobs" className="relative overflow-hidden rounded-2xl border border-rule bg-background">
      {/* Soft, brand-neutral glow; purely decorative. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-60 blur-3xl"
        style={{ background: "radial-gradient(circle, hsl(152 60% 85% / .55), transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(circle, hsl(210 70% 88% / .5), transparent 70%)" }}
      />

      <div className="relative p-5 sm:p-6">
        {/* Market pulse */}
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60 motion-reduce:hidden" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Live hiring pulse
            </p>
            <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              <span className="tabular-nums">{fmt(data.pulse.live)}</span> open roles at{" "}
              <span className="tabular-nums">{fmt(data.pulse.companies)}</span> companies
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Synced from official company career boards. Closed openings disappear on their own.
            </p>
          </div>
          <dl className="flex gap-6">
            <div>
              <dt className="text-xs text-muted-foreground">New today</dt>
              <dd className="text-lg font-semibold tabular-nums text-foreground">+{fmt(data.pulse.today)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">This week</dt>
              <dd className="text-lg font-semibold tabular-nums text-foreground">+{fmt(data.pulse.week)}</dd>
            </div>
          </dl>
        </div>

        {/* Quick explore */}
        {tiles.length > 0 && (
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
            {tiles.map(({ key, label, count, icon: Icon, on }) => (
              <button
                key={key}
                type="button"
                aria-pressed={on}
                onClick={() => onPick({ kind: key })}
                className={cn(
                  "group flex min-h-11 items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors duration-150",
                  on ? "border-foreground bg-foreground text-background" : "border-rule bg-background/70 backdrop-blur hover:border-foreground/40"
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    on ? "bg-background/15" : "bg-muted text-foreground/70 group-hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{label}</span>
                  <span className={cn("block text-xs tabular-nums", on ? "text-background/70" : "text-muted-foreground")}>{fmt(count)} jobs</span>
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Top companies hiring */}
        {data.companies.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <TrendingUp className="h-4 w-4 text-muted-foreground" /> Hiring most this week
              </h3>
              {active.companyId && (
                <button type="button" className="text-xs font-medium text-muted-foreground hover:text-foreground" onClick={() => onPick({ kind: "company", id: active.companyId })}>
                  Show all companies
                </button>
              )}
            </div>
            <ul className="-mx-1 mt-2.5 flex snap-x gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
              {data.companies.map((c) => {
                const on = active.companyId === c.id
                return (
                  <li key={c.id} className="snap-start">
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => onPick({ kind: "company", id: c.id })}
                      className={cn(
                        "flex w-44 items-center gap-2.5 rounded-xl border p-2.5 text-left transition-colors duration-150",
                        on ? "border-foreground ring-1 ring-foreground" : "border-rule bg-background/70 backdrop-blur hover:border-foreground/40"
                      )}
                    >
                      <CompanyLogo name={c.name} logo={c.logo} size={36} />
                      <span className="min-w-0">
                        <span className="flex items-center gap-1 text-sm font-medium text-foreground">
                          <span className="truncate">{c.name}</span>
                          {c.verifiedStatus === "VERIFIED" && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-sky-600" aria-label="Verified" />}
                        </span>
                        <span className="block text-xs tabular-nums text-muted-foreground">
                          {fmt(c.open)} open{c.fresh ? ` · ${fmt(c.fresh)} new` : ""}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {/* Trending skills */}
        {data.skills.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs font-medium text-muted-foreground">Trending skills</span>
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
                    on ? "border-foreground bg-foreground text-background" : "border-rule bg-background/70 text-foreground/80 hover:border-foreground/40"
                  )}
                >
                  {s.name} <span className={cn("tabular-nums", on ? "text-background/70" : "text-muted-foreground")}>{fmt(s.count)}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

function DiscoverSkeleton() {
  return (
    <div className="rounded-2xl border border-rule p-5 sm:p-6" aria-hidden>
      <div className="h-3 w-32 animate-pulse rounded bg-muted" />
      <div className="mt-3 h-6 w-2/3 animate-pulse rounded bg-muted" />
      <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-muted" />
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="mt-6 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 w-44 shrink-0 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  )
}
