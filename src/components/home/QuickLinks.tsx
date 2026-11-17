"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import {
  Briefcase,
  Building2,
  FileText,
  Award,
  Key,
  BookOpen,
  GraduationCap,
  CalendarDays,
  Bell,
  type LucideIcon,
} from "lucide-react"
import { cn, formatCompact } from "@/lib/utils"
import { useSiteStats, type SiteStats } from "@/components/home/use-site-stats"
import { HomeSectionHeader } from "@/components/home/ui/HomeSectionHeader"
import { handFont } from "@/components/home/fonts"

interface Tile {
  title: string
  copy: string
  href: string
  icon: LucideIcon
  stat?: (s: SiteStats) => number
  className?: string
}

const featured: (Tile & { tone: "ink" | "trust"; tags: { label: string; href: string }[] })[] = [
  {
    title: "Government jobs",
    copy: "Central, state, PSU, railway, banking and defence notifications.",
    href: "/jobs",
    icon: Briefcase,
    stat: (s) => s.activeJobs,
    tone: "ink",
    tags: [
      { label: "By state", href: "/jobs/states" },
      { label: "Exam calendar", href: "/exam-calendar" },
    ],
  },
  {
    title: "Private jobs",
    copy: "Verified companies hiring now: remote roles, freshers, walk-ins.",
    href: "/private-jobs",
    icon: Building2,
    stat: (s) => s.totalPrivateJobs,
    tone: "trust",
    tags: [
      { label: "Remote", href: "/private-jobs/remote" },
      { label: "Freshers", href: "/private-jobs/freshers" },
      { label: "Walk-ins", href: "/private-jobs/walkins" },
    ],
  },
]

const tiles: Tile[] = [
  { title: "Admit cards", copy: "Hall tickets", href: "/admit-cards", icon: FileText, stat: (s) => s.totalAdmitCards },
  { title: "Results", copy: "Merit lists", href: "/results", icon: Award, stat: (s) => s.totalResults },
  { title: "Answer keys", copy: "Check scores", href: "/answer-keys", icon: Key, stat: (s) => s.totalAnswerKeys },
  { title: "Syllabus", copy: "Exam patterns", href: "/syllabus", icon: BookOpen, stat: (s) => s.totalSyllabus },
  { title: "Admissions", copy: "College forms", href: "/admissions", icon: GraduationCap, stat: (s) => s.totalAdmissions, className: "lg:col-span-2" },
  { title: "Exam calendar", copy: "Every key date", href: "/exam-calendar", icon: CalendarDays, className: "lg:col-span-2" },
  { title: "Notifications", copy: "Latest notices", href: "/notifications", icon: Bell, className: "max-lg:col-span-2 lg:col-span-2" },
]

/*
 * The section map as a post-office sorting rack: wooden pigeon-holes, each
 * with letters waiting in it and a brass name-plate. The two big holes hold
 * the jobs — an envelope already pulled half out, addressed to you.
 */
const WOOD = "linear-gradient(135deg, oklch(52% 0.075 58), oklch(42% 0.065 52) 55%, oklch(48% 0.07 56))"
const HOLE = "oklch(33% 0.035 52)"
const BRASS = "linear-gradient(180deg, oklch(84% 0.09 88), oklch(72% 0.1 80))"

function Letters({ count, tall }: { count: number; tall?: boolean }) {
  const n = Math.max(1, Math.min(count, 4))
  return (
    <span className="pointer-events-none absolute inset-x-3 bottom-0 block h-full" aria-hidden>
      {Array.from({ length: n }).map((_, i) => (
        <span
          key={i}
          className="absolute bottom-0 block rounded-[2px] border border-black/10 transition-transform duration-300 group-hover:-translate-y-1.5"
          style={{
            left: `${6 + i * 9}%`,
            right: `${16 - i * 4}%`,
            height: `${(tall ? 46 : 58) - i * 9}%`,
            transform: `rotate(${[-3, 2, -1.5, 3][i]}deg)`,
            transitionDelay: `${i * 40}ms`,
            background: ["oklch(96% 0.01 90)", "oklch(90% 0.035 80)", "oklch(93% 0.02 230)", "oklch(91% 0.04 60)"][i],
            boxShadow: "0 -1px 3px rgb(0 0 0 / .2)",
          }}
        />
      ))}
    </span>
  )
}

function Plate({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn("relative block rounded-[2px] px-3 py-1.5 text-center text-[oklch(25%_0.03_60)]", className)}
      style={{ background: BRASS, boxShadow: "inset 0 1px 0 rgb(255 255 255 / .5), 0 1px 2px rgb(0 0 0 / .35)" }}
    >
      <span className="absolute left-1 top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-[oklch(50%_0.05_70)]" aria-hidden />
      <span className="absolute right-1 top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-[oklch(50%_0.05_70)]" aria-hidden />
      {children}
    </span>
  )
}

export function QuickLinks({ className }: { className?: string }) {
  const stats = useSiteStats()

  return (
    <section className={cn("hs-section", className)} data-tour="quicklinks" aria-label="Explore every section">
      <div className="hs-container">
        <HomeSectionHeader
          eyebrow="first time here?"
          title="Where would you like to start?"
          mark="start"
          markStyle="circle"
          subtitle="Like the pigeon-holes behind a post-office counter, every kind of notice has its own slot. Each one is checked against the official notice and sorted through the day."
        />

        {/* the rack */}
        <div className="rounded-[6px] p-2.5 sm:p-3" style={{ background: WOOD, boxShadow: "inset 0 1px 0 rgb(255 255 255 / .2), 0 26px 46px -30px rgb(40 20 0 / .65)" }}>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-6 lg:grid-rows-[repeat(3,minmax(0,auto))]">
            {featured.map((t, i) => (
              <div
                key={t.href}
                className="group relative col-span-2 flex min-h-[250px] flex-col justify-end overflow-hidden rounded-[2px] px-3 pb-3 pt-6 lg:row-span-2 lg:min-h-[300px] lg:px-5"
                style={{ background: HOLE, boxShadow: "inset 0 10px 18px rgb(0 0 0 / .55), inset 0 -2px 0 rgb(255 255 255 / .06)" }}
              >
                <Letters count={3} tall />
                {/* the envelope pulled half out, addressed to you */}
                <div
                  className={cn(
                    "relative z-10 mb-3 rounded-[3px] bg-[var(--hs-paper-slip)] p-5 transition-transform duration-300 group-hover:-translate-y-2",
                    i ? "rotate-[1.2deg]" : "-rotate-[1deg]"
                  )}
                  style={{ boxShadow: "0 -2px 6px rgb(0 0 0 / .25), 0 8px 16px -8px rgb(0 0 0 / .4)" }}
                >
                  {/* envelope flap line and stamp */}
                  <svg className="pointer-events-none absolute inset-x-0 top-0 h-10 w-full" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden>
                    <path d="M0 0 L50 16 L100 0" fill="none" stroke="color-mix(in oklch, var(--color-ink) 18%, transparent)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                  </svg>
                  <span
                    className="absolute right-4 top-4 flex h-12 w-10 items-center justify-center border-2 border-dashed"
                    style={{ borderColor: t.tone === "ink" ? "var(--color-brick)" : "var(--hs-trust)", color: t.tone === "ink" ? "var(--color-brick)" : "var(--hs-trust)" }}
                    aria-hidden
                  >
                    <t.icon className="h-5 w-5" />
                  </span>

                  <p className={cn(handFont.className, "text-[1rem] text-foreground/55")}>To: you, the one preparing</p>
                  <p className="mt-2 font-display text-[2.6rem] font-bold leading-none text-foreground">
                    {stats && t.stat ? formatCompact(t.stat(stats)) : " "}
                    <span className={cn(handFont.className, "ml-2 align-middle text-[1.05rem] font-normal text-muted-foreground")}>open now</span>
                  </p>
                  <h3 className="mt-2 text-xl font-bold text-foreground">
                    <Link
                      href={t.href}
                      data-tour={i === 0 ? "quicklink-jobs" : undefined}
                      className="decoration-[var(--hs-trust)] decoration-2 underline-offset-4 after:absolute after:inset-0 after:content-[''] group-hover:underline"
                    >
                      {t.title}
                    </Link>
                  </h3>
                  <p className="mt-1 max-w-sm pr-12 text-sm text-muted-foreground">{t.copy}</p>
                  <div className="relative z-10 mt-3 flex flex-wrap gap-x-4 gap-y-1">
                    {t.tags.map((tag) => (
                      <Link
                        key={tag.href}
                        href={tag.href}
                        className={cn(handFont.className, "text-[1rem] text-[var(--hs-trust)] underline decoration-wavy decoration-1 underline-offset-4")}
                      >
                        {tag.label}
                      </Link>
                    ))}
                  </div>
                </div>
                <Plate className="relative z-10 mx-auto w-fit min-w-[60%] text-[12px] font-bold">{t.title.toUpperCase()}</Plate>
              </div>
            ))}

            {tiles.map((t) => {
              const n = stats && t.stat ? t.stat(stats) : null
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={cn("group relative flex min-h-[132px] min-w-0 flex-col justify-end overflow-hidden rounded-[2px] px-2.5 pb-2.5 pt-8", t.className)}
                  style={{ background: HOLE, boxShadow: "inset 0 10px 16px rgb(0 0 0 / .55), inset 0 -2px 0 rgb(255 255 255 / .06)" }}
                >
                  <Letters count={n === null ? 2 : n > 50 ? 4 : n > 10 ? 3 : 2} />
                  <Plate className="z-10 mt-auto">
                    <span className="flex items-center justify-center gap-1.5 truncate text-[12.5px] font-bold">
                      <t.icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span className="truncate">{t.title}</span>
                    </span>
                    <span className="block truncate text-[10.5px] opacity-75">{n !== null ? `${formatCompact(n)} · ${t.copy}` : t.copy}</span>
                  </Plate>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
