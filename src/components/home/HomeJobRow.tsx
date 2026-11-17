import Link from "next/link"
import { MapPin, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { cleanTitle, getOrgAlias } from "@/lib/card-helpers"
import { handFont } from "@/components/home/fonts"

export interface HomeJobRowProps {
  title: string
  slug: string
  department: string
  location?: string | null
  totalVacancies?: number | null
  lastDateToApply?: Date | string | null
}

export function daysLeft(date?: Date | string | null): number | null {
  if (!date) return null
  const diff = new Date(date).getTime() - Date.now()
  if (Number.isNaN(diff)) return null
  return Math.ceil(diff / 86400000)
}

export function DaysLeftBadge({ date }: { date?: Date | string | null }) {
  const d = daysLeft(date)
  if (d === null) return null
  const label = d < 0 ? "Closed" : d === 0 ? "Last day" : `${d}d left`
  return (
    <span
      className={cn(
        "hs-pill hs-tabular shrink-0 px-2 py-0.5 text-[11px] font-semibold",
        d < 0
          ? "bg-paper-3 text-muted-foreground"
          : d <= 3
            ? "bg-red-500/12 text-red-700 dark:text-red-300"
            : d <= 7
              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
              : "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
      )}
    >
      {label}
    </span>
  )
}

/* Days left, as a reader would mark it with a pen: urgent ones circled in
 * red, the rest noted in pencil, closed ones struck through. */
export function PenMark({ date }: { date?: Date | string | null }) {
  const d = daysLeft(date)
  if (d === null) return null
  const closed = d < 0
  const urgent = !closed && d <= 7
  const label = closed ? "closed" : d === 0 ? "today!" : `${d} days`
  return (
    <span
      className={cn(
        handFont.className,
        "relative inline-flex shrink-0 items-center justify-center px-2.5 py-1 text-[1rem] leading-none",
        closed ? "text-muted-foreground line-through" : urgent ? "text-[var(--color-brick)]" : "text-foreground/60"
      )}
    >
      {urgent && (
        <svg viewBox="0 0 80 34" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          <path
            d="M44 3 C 66 2, 79 9, 77 18 C 75 28, 56 32, 38 31 C 18 31, 3 26, 3 17 C 3 8, 18 3, 36 3 C 46 3, 52 4, 56 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}
      {label}
    </span>
  )
}

/** A government notice, set like an entry on the vacancies page. */
export function HomeJobRow({ title, slug, department, location, totalVacancies, lastDateToApply }: HomeJobRowProps) {
  const org = getOrgAlias(department)
  return (
    <Link href={`/apply/${slug}`} className="group flex items-center gap-3 border-b border-dotted border-[var(--hs-border-strong)] py-3 last:border-0">
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 font-display text-[16px] font-bold leading-snug text-foreground decoration-[var(--hs-trust)] decoration-2 underline-offset-[3px] group-hover:underline sm:line-clamp-1">
          {cleanTitle(title)}
        </span>
        <span className="mt-0.5 flex min-w-0 items-center gap-x-3 text-[12px] text-muted-foreground">
          <span className="truncate font-semibold">{org}</span>
          {totalVacancies != null && totalVacancies > 0 && (
            <span className="hidden shrink-0 items-center gap-1 sm:inline-flex">
              <Users className="h-3 w-3" />
              {totalVacancies.toLocaleString("en-IN")} posts
            </span>
          )}
          {location && (
            <span className="hidden min-w-0 items-center gap-1 md:inline-flex">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{location}</span>
            </span>
          )}
        </span>
      </span>
      <PenMark date={lastDateToApply} />
    </Link>
  )
}

export function HomeRowSkeleton() {
  return (
    <div className="space-y-2 border-b border-dotted border-[var(--hs-border-strong)] py-3.5">
      <span className="hs-skel block h-3.5 w-3/4" />
      <span className="hs-skel block h-3 w-1/2" />
    </div>
  )
}
