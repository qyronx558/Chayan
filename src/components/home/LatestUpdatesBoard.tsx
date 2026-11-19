"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Newspaper,
  FileCheck2,
  IdCard,
  KeyRound,
  GraduationCap,
  type LucideIcon,
} from "lucide-react"
import { HomeSectionHeader } from "@/components/home/ui/HomeSectionHeader"
import { cleanTitle, filterValidItems } from "@/lib/card-helpers"
import { cn, formatDate } from "@/lib/utils"
import { handFont, typeFont } from "@/components/home/fonts"
import { useDataVersion, withDataVersion } from "@/components/providers/DataVersion"

/*
 * "Recently published" as the notice board outside a college office: a
 * wooden frame, cork, and typed notices pinned up — the board people crowd
 * around to find their roll number. Each notice hangs at its own angle and
 * has its own pin colour, the way real boards end up looking.
 */

const PINS = ["oklch(55% 0.17 28)", "oklch(58% 0.12 240)", "oklch(72% 0.14 85)", "oklch(55% 0.12 150)"]
const TILT = ["lg:-rotate-[1.2deg]", "lg:rotate-[0.9deg]", "lg:rotate-[1.4deg]", "lg:-rotate-[0.8deg]"]

function Pin({ color }: { color: string }) {
  return (
    <span className="absolute -top-2 left-1/2 z-10 -translate-x-1/2" aria-hidden>
      <span
        className="block h-[18px] w-[18px] rounded-full"
        style={{
          background: `radial-gradient(circle at 35% 30%, color-mix(in oklch, ${color} 40%, white) 0%, ${color} 45%, color-mix(in oklch, ${color} 70%, black) 100%)`,
          boxShadow: "2px 3px 3px rgb(0 0 0 / .3)",
        }}
      />
    </span>
  )
}

type Raw = Record<string, unknown>

interface IndexItem {
  id: string
  title: string
  organization: string
  date: string | null
  href: string
}

interface ColumnConfig {
  key: string
  title: string
  href: string
  icon: LucideIcon
  endpoint: string
  map: (raw: Raw) => IndexItem
}

const COLUMNS: ColumnConfig[] = [
  {
    key: "results",
    title: "Results",
    href: "/results",
    icon: FileCheck2,
    endpoint: "/api/results?limit=6",
    map: (raw) => ({
      id: raw.id as string,
      title: raw.title as string,
      organization: (raw.department as { name?: string })?.name ?? "",
      date: (raw.resultDate as string) || (raw.createdAt as string) || null,
      href: `/result/${raw.slug as string}`,
    }),
  },
  {
    key: "admit-cards",
    title: "Admit cards",
    href: "/admit-cards",
    icon: IdCard,
    endpoint: "/api/admit-cards?limit=6",
    map: (raw) => ({
      id: raw.id as string,
      title: raw.title as string,
      organization: (raw.department as { name?: string })?.name ?? "",
      date: (raw.examDate as string) || null,
      href: `/admit-card/${raw.slug as string}`,
    }),
  },
  {
    key: "answer-keys",
    title: "Answer keys",
    href: "/answer-keys",
    icon: KeyRound,
    endpoint: "/api/answer-keys?limit=6",
    map: (raw) => ({
      id: raw.id as string,
      title: raw.title as string,
      organization: (raw.department as { name?: string })?.name ?? "",
      date: (raw.createdAt as string) || null,
      href: `/answer-key/${raw.slug as string}`,
    }),
  },
  {
    key: "admissions",
    title: "Admissions",
    href: "/admissions",
    icon: GraduationCap,
    endpoint: "/api/admissions?limit=6",
    map: (raw) => ({
      id: raw.id as string,
      title: raw.title as string,
      organization: (raw.department as { name?: string })?.name ?? "",
      date: (raw.lastDate as string) || null,
      href: `/admission/${raw.slug as string}`,
    }),
  },
]

function IndexColumn({ config, index }: { config: ColumnConfig; index: number }) {
  const dataVersion = useDataVersion()
  const [items, setItems] = useState<IndexItem[] | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(withDataVersion(config.endpoint, dataVersion))
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return
        const mapped = json.success
          ? filterValidItems((json.data as Raw[]).map(config.map))
          : []
        setItems(mapped.slice(0, 6))
      })
      .catch(() => {
        if (!cancelled) setItems([])
      })
    return () => {
      cancelled = true
    }
  }, [config, dataVersion])

  const Icon = config.icon

  return (
    <div
      className={cn(
        "relative flex min-w-0 flex-col bg-[var(--hs-paper-slip)] px-4 pb-4 pt-6 sm:px-5",
        TILT[index % TILT.length]
      )}
      style={{ boxShadow: "0 1px 1px rgb(0 0 0 / .1), 3px 8px 14px -6px rgb(30 15 0 / .45)" }}
    >
      <Pin color={PINS[index % PINS.length]} />

      {/* typed notice heading */}
      <div className={cn(typeFont.className, "text-center")}>
        <p className="text-[10px] text-muted-foreground">NOTICE No. {String(index + 1).padStart(2, "0")}</p>
        <h3 className="mt-0.5 flex items-center justify-center gap-2 font-[family-name:inherit] text-[17px] font-bold text-foreground">
          <Icon className="h-4 w-4 text-[var(--hs-trust)]" aria-hidden />
          {config.title.toUpperCase()}
        </h3>
        <span className="mx-auto mt-1.5 block h-px w-24 bg-[var(--hs-border-strong)]" aria-hidden />
      </div>

      {items === null ? (
        <ul aria-hidden className="mt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="flex gap-3">
              <span className="hs-skel h-3 w-12 shrink-0" />
              <span className="hs-skel h-3 flex-1" />
            </li>
          ))}
        </ul>
      ) : items.length === 0 ? (
        <p className={cn(handFont.className, "my-auto py-8 text-center text-[1.05rem] text-foreground/55")}>
          Nothing pinned here yet. Check back soon.
        </p>
      ) : (
        <ol className={cn(typeFont.className, "mt-3")}>
          {items.slice(0, 4).map((item, i) => (
            <li key={item.id} className={cn("border-b border-dotted border-[var(--hs-border-strong)] last:border-0", i >= 3 && "max-sm:hidden")}>
              <Link href={item.href} className="group flex items-baseline gap-3 py-2">
                <span className="w-[3.4rem] shrink-0 text-[11.5px] text-muted-foreground">
                  {item.date ? formatDate(item.date, "dd.MM.yy") : "--.--.--"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 break-words text-[13.5px] font-bold leading-snug text-foreground decoration-[var(--hs-trust)] decoration-2 underline-offset-2 group-hover:underline">
                    {cleanTitle(item.title)}
                  </span>
                  {item.organization && (
                    <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{item.organization}</span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}

      <Link
        href={config.href}
        className={cn(handFont.className, "mt-auto self-end pt-3 text-[1.05rem] text-[var(--hs-trust)] hover:underline")}
      >
        see all {config.title.toLowerCase()} →
      </Link>
    </div>
  )
}

export function LatestUpdatesBoard({ className }: { className?: string }) {
  return (
    <div className={className}>
      <HomeSectionHeader
        eyebrow="after you apply"
        icon={Newspaper}
        title="Recently published"
        mark="published"
        subtitle="Remember crowding around the college notice board, looking for your roll number? This is that board, minus the crowd."
      />

      {/* the board: wooden frame around cork */}
      <div
        className="relative rounded-[6px] p-2.5 sm:p-3"
        style={{
          background: "linear-gradient(135deg, oklch(48% 0.07 55), oklch(38% 0.06 50) 50%, oklch(45% 0.07 55))",
          boxShadow: "inset 0 1px 0 rgb(255 255 255 / .18), 0 22px 40px -26px rgb(40 20 0 / .6)",
        }}
      >
        <div
          className="relative grid min-w-0 gap-x-6 gap-y-8 rounded-[2px] px-4 pb-6 pt-8 sm:grid-cols-2 sm:px-6"
          style={{
            backgroundColor: "var(--hs-cork)",
            backgroundImage:
              "radial-gradient(circle at 20% 30%, rgb(90 50 10 / .22) 1px, transparent 1.6px), radial-gradient(circle at 70% 80%, rgb(255 230 190 / .25) 1px, transparent 1.6px), radial-gradient(circle at 45% 60%, rgb(70 35 5 / .18) 1.2px, transparent 2px)",
            backgroundSize: "7px 7px, 11px 11px, 13px 13px",
            boxShadow: "inset 0 2px 6px rgb(0 0 0 / .35)",
          }}
        >
          {COLUMNS.map((column, i) => (
            <IndexColumn key={column.key} config={column} index={i} />
          ))}

          {/* a stray chit someone pinned at the corner */}
          <span
            className={cn(
              handFont.className,
              "absolute -bottom-3 right-6 hidden rotate-[4deg] bg-[color-mix(in_oklch,var(--hs-marigold)_55%,white)] px-3 py-1.5 text-[0.95rem] text-[var(--hs-chit-ink)] shadow-[2px_4px_8px_-3px_rgb(0_0_0/.4)] sm:block"
            )}
            aria-hidden
          >
            all the best, everyone!
          </span>
        </div>
      </div>

      <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-muted-foreground">
        <span className={cn(handFont.className, "text-[1.05rem]")}>also on the board:</span>
        {[
          { label: "Syllabus", href: "/syllabus" },
          { label: "Exam calendar", href: "/exam-calendar" },
          { label: "Notifications", href: "/notifications" },
          { label: "Jobs by state", href: "/jobs/states" },
        ].map((l) => (
          <Link key={l.href} href={l.href} className="font-medium text-foreground underline decoration-[var(--hs-border-strong)] underline-offset-4 hover:decoration-[var(--hs-trust)] max-sm:py-1">
            {l.label}
          </Link>
        ))}
      </p>
    </div>
  )
}
