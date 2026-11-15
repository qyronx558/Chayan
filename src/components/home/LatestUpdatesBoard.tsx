"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Newspaper,
  FileCheck2,
  IdCard,
  KeyRound,
  GraduationCap,
  Calendar,
  MapPin,
  Bell,
  BookOpen,
  type LucideIcon,
} from "lucide-react"
import { SectionHeader } from "@/components/ui/section-header"
import { cleanTitle, filterValidItems } from "@/lib/card-helpers"
import { formatDate } from "@/lib/utils"

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

function IndexColumn({ config }: { config: ColumnConfig }) {
  const [items, setItems] = useState<IndexItem[] | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(config.endpoint)
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
  }, [config])

  const Icon = config.icon

  return (
    <div className="min-w-0 border-t-2 border-rule-2 pt-3">
      <div className="flex items-baseline justify-between gap-2 border-b border-rule pb-2">
        <h3 className="flex min-w-0 items-center gap-1.5 font-display text-base font-bold text-foreground">
          <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="truncate">{config.title}</span>
        </h3>
        <Link
          href={config.href}
          className="agate shrink-0 text-[10px] text-brick underline decoration-1 underline-offset-4 hover:decoration-2 max-sm:py-2 max-sm:text-xs"
        >
          View all
        </Link>
      </div>

      {items === null ? (
        <ul aria-hidden>
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="border-b border-rule py-3 last:border-b-0">
              <div className="h-3 w-2/3 animate-pulse bg-paper-3" />
              <div className="mt-2 h-2.5 w-1/2 animate-pulse bg-paper-2" />
            </li>
          ))}
        </ul>
      ) : items.length === 0 ? (
        <p className="py-6 text-xs leading-relaxed text-muted-foreground">
          Nothing published here yet. New entries appear as soon as they are verified.
        </p>
      ) : (
        <ul>
          {items.map((item) => {
            const parts = item.date ? formatDate(item.date).split(" ") : []
            return (
              <li key={item.id} className="border-b border-rule last:border-b-0">
                <Link href={item.href} className="group flex items-start gap-3 py-2.5">
                  <span className="agate w-9 shrink-0 pt-0.5 text-[10px] text-muted-foreground">
                    <span className="block text-sm font-semibold leading-none text-foreground">
                      {parts[0] || "-"}
                    </span>
                    {parts[1] || ""}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block line-clamp-2 break-words font-display text-[0.95rem] font-bold leading-snug text-foreground transition-colors group-hover:text-brick">
                      {cleanTitle(item.title)}
                    </span>
                    {item.organization && (
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {item.organization}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

const moreLinks = [
  { label: "Syllabus", href: "/syllabus", icon: BookOpen },
  { label: "Exam calendar", href: "/exam-calendar", icon: Calendar },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Jobs by state", href: "/jobs", icon: MapPin },
]

export function LatestUpdatesBoard({ className }: { className?: string }) {
  return (
    <section className={className}>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <SectionHeader
          icon={Newspaper}
          index="02"
          title="Latest updates"
          subtitle="Results, admit cards, answer keys and admissions in one scannable index"
        />

        <div className="grid min-w-0 gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {COLUMNS.map((column) => (
            <IndexColumn key={column.key} config={column} />
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-rule pt-3">
          <span className="agate text-[10px] text-muted-foreground">More on the desk:</span>
          {moreLinks.map((link) => (
            <Link
              key={link.href + link.label}
              href={link.href}
              className="agate inline-flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors hover:text-brick max-sm:min-h-9 max-sm:text-[13px]"
            >
              <link.icon className="h-3.5 w-3.5" aria-hidden />
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
