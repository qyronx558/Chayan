import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { ArrowRight, ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ContentCardMeta {
  icon: LucideIcon
  text: string
  highlight?: boolean
}

interface ContentCardProps {
  icon?: LucideIcon
  iconClassName?: string
  badge?: React.ReactNode
  statusBadge?: React.ReactNode
  title: string
  description?: string | null
  meta?: ContentCardMeta[]
  href: string
  ctaLabel?: string
  footer?: React.ReactNode
  className?: string
}

export function ContentCard({
  icon: Icon,
  iconClassName,
  badge,
  statusBadge,
  title,
  description,
  meta = [],
  href,
  ctaLabel = "View Details",
  footer,
  className,
}: ContentCardProps) {
  return (
    <Card
      className={cn(
        "group relative flex h-full flex-col overflow-hidden border-gray-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-900/5",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] overflow-hidden">
        <div className="h-full w-full bg-gradient-to-r from-transparent via-blue-600 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>

      <CardContent className="flex h-full flex-col p-0">
        <div className="flex items-center gap-2 p-5 pb-4">
          {Icon && (
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm",
                iconClassName ?? "from-[#1e3a5f] via-blue-800 to-blue-700"
              )}
            >
              <Icon className="h-5 w-5" />
            </span>
          )}
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            {badge}
            {statusBadge}
          </div>
          {footer ? null : (
            <ChevronRight className="h-4 w-4 shrink-0 -translate-x-1 text-gray-300 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-hover:text-blue-500" />
          )}
        </div>

        <div className="flex-1 px-5">
          <Link href={href}>
            <h3 className="line-clamp-2 text-[15px] font-bold leading-relaxed text-gray-900 transition-colors group-hover:text-blue-700">
              {title}
            </h3>
          </Link>
          {description && (
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-gray-500">{description}</p>
          )}
        </div>

        {meta.length > 0 && (
          <div className="flex flex-wrap gap-2 px-5 pt-4">
            {meta.map((item, i) => (
              <span
                key={i}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-medium",
                  item.highlight
                    ? "border-red-100 bg-red-50 text-red-600"
                    : "border-gray-100 bg-gray-50 text-gray-600"
                )}
              >
                <item.icon className="h-3 w-3 text-gray-400" />
                {item.text}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 p-5 pt-4">
          <Link
            href={href}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 transition-all duration-300 hover:bg-gradient-to-r hover:from-[#1e3a5f] hover:to-blue-700 hover:text-white group-hover:bg-gradient-to-r group-hover:from-[#1e3a5f] group-hover:to-blue-700 group-hover:text-white"
          >
            {ctaLabel}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
          {footer}
        </div>
      </CardContent>
    </Card>
  )
}

export function ContentCardSkeleton() {
  return (
    <Card className="border-gray-200 bg-white">
      <CardContent className="p-0">
        <div className="flex items-center gap-2.5 p-5 pb-3">
          <div className="h-5 w-20 animate-pulse rounded-full bg-gray-100" />
          <div className="h-5 w-14 animate-pulse rounded-full bg-gray-100" />
        </div>
        <div className="px-5">
          <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
          <div className="mt-2.5 h-3 w-full animate-pulse rounded bg-gray-100" />
          <div className="mt-1.5 h-3 w-2/3 animate-pulse rounded bg-gray-100" />
        </div>
        <div className="flex gap-1.5 px-5 pt-4">
          <div className="h-6 w-16 animate-pulse rounded-md bg-gray-100" />
          <div className="h-6 w-24 animate-pulse rounded-md bg-gray-100" />
        </div>
        <div className="p-5">
          <div className="h-7 w-24 animate-pulse rounded-lg bg-gray-100" />
        </div>
      </CardContent>
    </Card>
  )
}