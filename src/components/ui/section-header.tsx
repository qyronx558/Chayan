import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface SectionHeaderProps {
  icon: LucideIcon
  title: string
  subtitle?: string
  viewAllHref?: string
  viewAllLabel?: string
  iconClassName?: string
  className?: string
}

export function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  viewAllHref,
  viewAllLabel = "View All",
  iconClassName,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("mb-6 flex min-w-0 flex-wrap items-center justify-between gap-3", className)}>
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm",
            iconClassName ?? "from-[#1e3a5f] via-blue-800 to-blue-700"
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="line-clamp-2 break-words text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">{title}</h2>
          {subtitle && <p className="mt-0.5 line-clamp-2 break-words text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="group hidden items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-blue-400 hover:text-blue-700 sm:inline-flex"
        >
          {viewAllLabel}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  )
}