import Link from "next/link"
import { ArrowRight, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { HandEyebrow, HandHeading, MarkedTitle, type MarkStyle } from "@/components/home/ui/HandTitle"

interface HomeSectionHeaderProps {
  eyebrow?: string
  icon?: LucideIcon
  title: string
  /** A word/phrase of the title to mark by hand. */
  mark?: string
  markStyle?: MarkStyle
  subtitle?: string
  viewAllHref?: string
  viewAllLabel?: string
  /** Extra control rendered on the right (e.g. Latest/Trending tabs). */
  action?: React.ReactNode
  align?: "left" | "center"
  className?: string
}

/** SaaS-style section heading used across the home page body only. */
export function HomeSectionHeader({
  eyebrow,
  title,
  mark,
  markStyle,
  subtitle,
  viewAllHref,
  viewAllLabel = "View all",
  action,
  align = "left",
  className,
}: HomeSectionHeaderProps) {
  const centered = align === "center"
  return (
    <div
      className={cn(
        "mb-7 flex min-w-0 flex-wrap items-end gap-4",
        centered ? "flex-col items-center text-center" : "justify-between",
        className
      )}
    >
      <HandHeading className={cn("min-w-0", centered ? "max-w-2xl" : "max-w-2xl flex-[1_1_20rem]")}>
        {eyebrow && <HandEyebrow className="mb-2">{eyebrow}</HandEyebrow>}
        <h2 className="text-[1.85rem] font-bold leading-[1.2] text-foreground sm:text-[2.35rem]">
          <MarkedTitle title={title} mark={mark} markStyle={markStyle} />
        </h2>
        {subtitle && <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">{subtitle}</p>}
      </HandHeading>
      {(action || viewAllHref) && (
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {action}
          {viewAllHref && (
            <Link href={viewAllHref} className="hs-btn hs-btn-ghost group px-4 py-2 text-[13px]">
              {viewAllLabel}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
