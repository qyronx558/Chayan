import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { ArrowRight, Inbox } from "lucide-react"
import { cn } from "@/lib/utils"
import { stripHtmlToText } from "@/lib/blog-prose"
import { moduleTheme, type UniversalModule } from "@/components/ui/module-theme"
import { getOrgAlias } from "@/lib/card-helpers"

export type { UniversalModule }

export interface UniversalMeta {
  icon: LucideIcon
  text: string
  highlight?: boolean
}

/** Legacy alias - prefer UniversalMeta */
export type ContentCardMeta = UniversalMeta

export interface UniversalCardProps {
  /** module drives status / CTA defaults + hover accent (icon-free cards) */
  module?: UniversalModule
  title: string
  /** org chip (aliased + truncated internally) */
  organization?: string | null
  /** overrides theme default status label */
  status?: string | null
  description?: string | null
  /** max 3 rendered */
  metadata?: UniversalMeta[]
  /** primary CTA - label defaults to theme */
  primaryCtaLabel?: string
  primaryCtaUrl?: string
  /** right-side actions */
  track?: React.ReactNode
  save?: React.ReactNode
  share?: React.ReactNode
  disabled?: boolean
  variant?: "compact" | "standard" | "wide"
  className?: string
  /** ── legacy ContentCard props (kept for compat; icon props are ignored) ── */
  /** @deprecated card icons removed - prop ignored */
  icon?: LucideIcon
  /** @deprecated card icons removed - prop ignored */
  iconClassName?: string
  badge?: React.ReactNode
  statusBadge?: React.ReactNode
  meta?: UniversalMeta[]
  href?: string
  ctaLabel?: string
  footer?: React.ReactNode
}

function resolveTheme(module?: UniversalModule) {
  return moduleTheme[module ?? "government"]
}

export function UniversalCard({
  module = "government",
  title,
  organization,
  status,
  description,
  metadata,
  primaryCtaLabel,
  primaryCtaUrl,
  track,
  save,
  share,
  disabled = false,
  variant = "standard",
  className,
  icon: _IconOverride,
  iconClassName: _iconClassName,
  badge,
  statusBadge,
  meta,
  href,
  ctaLabel,
  footer,
}: UniversalCardProps) {
  const theme = resolveTheme(module)
  void _IconOverride
  void _iconClassName

  const orgText = organization ? getOrgAlias(organization) : ""
  const statusText = status ?? theme.statusLabel
  const metaItems = (metadata ?? meta ?? []).filter(Boolean).slice(0, 3)
  const ctaHref = primaryCtaUrl ?? href ?? "#"
  const ctaText = primaryCtaLabel ?? ctaLabel ?? theme.ctaLabel
  const cleanDesc = stripHtmlToText(description).trim()

  const hasNewTop = Boolean(orgText || statusText)
  const hasLegacyTop = Boolean(badge || statusBadge)
  const rightActions = track || save || share ? (
    <div className="flex shrink-0 items-center gap-1.5">
      {track}
      {save}
      {share}
    </div>
  ) : (
    footer
  )

  return (
    <article
      aria-label={title}
      data-disabled={disabled || undefined}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-[18px] border border-slate-200 bg-white transition-all duration-300",
        "shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_16px_-6px_rgba(15,23,42,0.08)]",
        "hover:-translate-y-[3px] hover:shadow-[0_2px_4px_rgba(15,23,42,0.05),0_12px_28px_-8px_rgba(15,23,42,0.16)]",
        theme.hoverBorder,
        variant === "compact" && "rounded-[16px]",
        variant === "wide" && "rounded-[20px]",
        disabled && "pointer-events-none opacity-60",
        className
      )}
    >
      {/* Top row: [org] ... [status] (icon-free) */}
      <div
        className={cn(
          "flex items-center justify-between gap-3",
          variant === "compact" ? "mb-3 px-4 pt-4" : "mb-[16px] px-5 pt-5"
        )}
      >
        {hasNewTop ? (
          <>
            <div className="min-w-0 flex-1">
              {orgText ? (
                <span
                  title={orgText}
                  className="inline-flex max-w-full items-center truncate rounded-md border border-slate-200/70 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-600"
                >
                  <span className="truncate">{orgText}</span>
                </span>
              ) : null}
            </div>
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                theme.statusClasses
              )}
            >
              <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", theme.statusDot)} />
              {statusText}
            </span>
          </>
        ) : hasLegacyTop ? (
          <>
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              {badge}
              {statusBadge}
            </div>
          </>
        ) : (
          <div className="min-w-0 flex-1" />
        )}
      </div>

      {/* Main content */}
      <div className={cn("flex flex-1 flex-col", variant === "compact" ? "px-4" : "px-5")}>
        <Link href={ctaHref} aria-label={`${ctaText} - ${title}`} className="focus-visible:outline-none">
          <h3
            className={cn(
              "line-clamp-2 break-words font-bold leading-snug text-slate-900",
              variant === "compact" ? "mb-1.5 text-[15px]" : "mb-2 text-[16px]"
            )}
          >
            {title}
          </h3>
        </Link>
        {cleanDesc ? (
          <p
            className={cn(
              "line-clamp-2 break-words leading-relaxed text-slate-500",
              variant === "compact" ? "mb-3 text-[12px]" : "mb-4 text-[13px]"
            )}
          >
            {cleanDesc}
          </p>
        ) : null}

        {/* Metadata pushes near bottom */}
        {metaItems.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1.5">
            {metaItems.map((item, i) => (
              <span
                key={i}
                className={cn(
                  "inline-flex max-w-full items-center gap-1.5 truncate rounded-full border px-2.5 py-1 text-[11px] font-medium",
                  item.highlight
                    ? "border-red-100 bg-red-50 text-red-700"
                    : "border-slate-100 bg-slate-50 text-slate-600"
                )}
              >
                <item.icon className="h-3 w-3 shrink-0 text-slate-400" aria-hidden />
                <span className="truncate">{item.text}</span>
              </span>
            ))}
          </div>
        )}
        {metaItems.length === 0 && <div className="mt-auto" />}
      </div>

      {/* Bottom action bar - always bottom-aligned */}
      <div className={cn(variant === "compact" ? "px-4 pb-4" : "px-5 pb-5")}>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <Link
            href={ctaHref}
            aria-label={`${ctaText} - ${title}`}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
              theme.ctaClasses
            )}
          >
            {ctaText}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
          {rightActions}
        </div>
      </div>
    </article>
  )
}

/** Back-compat: existing imports keep working, now powered by UniversalCard */
export function ContentCard(props: UniversalCardProps) {
  return <UniversalCard {...props} />
}

export function UniversalCardSkeleton({ variant = "standard" }: { variant?: "compact" | "standard" | "wide" }) {
  return (
    <div
      aria-hidden
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-[18px] border border-slate-200 bg-white",
        variant === "compact" ? "p-4" : "p-5"
      )}
    >
      <div className="mb-[16px] flex items-center justify-between gap-3">
        <div className="h-6 w-24 animate-pulse rounded-md bg-slate-100" />
        <div className="h-6 w-16 animate-pulse rounded-full bg-slate-100" />
      </div>
      <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
      <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-slate-100" />
      <div className="mt-3 h-3 w-full animate-pulse rounded bg-slate-100" />
      <div className="mt-1.5 h-3 w-2/3 animate-pulse rounded bg-slate-100" />
      <div className="mt-auto flex gap-1.5 pt-4">
        <div className="h-6 w-20 animate-pulse rounded-full bg-slate-100" />
        <div className="h-6 w-24 animate-pulse rounded-full bg-slate-100" />
      </div>
      <div className="mt-4 border-t border-slate-100 pt-4">
        <div className="h-9 w-28 animate-pulse rounded-xl bg-slate-100" />
      </div>
    </div>
  )
}

export function ContentCardSkeleton() {
  return <UniversalCardSkeleton />
}

export function UniversalCardEmpty({
  title = "Nothing here yet",
  hint,
  action,
}: {
  title?: string
  hint?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center rounded-[18px] border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-slate-100 text-slate-400">
        <Inbox className="h-5 w-5" aria-hidden />
      </span>
      <h3 className="mt-4 text-[15px] font-bold text-slate-900">{title}</h3>
      {hint ? <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-slate-500">{hint}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
