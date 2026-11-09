import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface SectionHeaderProps {
  icon: LucideIcon
  title: string
  subtitle?: string
  /** Editorial index number rendered before the title (e.g. "02"). */
  index?: string
  /** Small label rendered above the title. */
  kicker?: string
  viewAllHref?: string
  viewAllLabel?: string
  iconClassName?: string
  className?: string
  /** Extra control rendered beside View All (e.g. Latest/Trending tabs). */
  action?: React.ReactNode
}

export function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  index,
  kicker,
  viewAllHref,
  viewAllLabel = "View all",
  iconClassName,
  className,
  action,
}: SectionHeaderProps) {
  return (
    <div className={cn("mb-6 min-w-0", className)}>
      <div className="flex min-w-0 flex-wrap items-end justify-between gap-3 border-b border-rule pb-2">
        <div className="flex min-w-0 flex-1 items-baseline gap-2.5">
          <Icon className={cn("h-4 w-4 shrink-0 self-center text-muted-foreground", iconClassName)} aria-hidden />
          {index ? (
            <span className="agate shrink-0 text-[11px] text-brick" aria-hidden>
              {index}
            </span>
          ) : null}
          <div className="min-w-0 flex-1">
            {kicker ? (
              <p className="agate mb-0.5 text-[10px] text-muted-foreground">{kicker}</p>
            ) : null}
            <h2 className="break-words text-[1.6rem] font-bold leading-tight text-foreground sm:text-[1.9rem]">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 line-clamp-2 break-words text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="hidden text-sm font-medium text-brick underline decoration-1 underline-offset-4 hover:decoration-2 sm:inline-flex"
            >
              {viewAllLabel}
            </Link>
          )}
          {action}
        </div>
      </div>
    </div>
  )
}
