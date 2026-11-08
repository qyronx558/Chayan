import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { Inbox } from "lucide-react"
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
    "group relative flex h-full flex-col border-t-2 border-rule-2 bg-transparent pt-3.5 transition-colors duration-200",
    disabled && "pointer-events-none opacity-55",
    className
   )}
  >
   <div className={cn("flex flex-1 flex-col", variant === "compact" ? "px-0.5" : "px-0.5")}>
    <Link href={ctaHref} aria-label={`${ctaText} - ${title}`} className="focus-visible:outline-none">
     <h3
      className={cn(
       "line-clamp-2 break-words font-display font-bold leading-snug text-foreground transition-colors group-hover:text-brick",
       variant === "compact" ? "text-[1rem]" : "text-[1.075rem]"
      )}
     >
      {title}
     </h3>
    </Link>
    {cleanDesc ? (
     <p
      className={cn(
       "line-clamp-2 break-words leading-relaxed text-muted-foreground",
       variant === "compact" ? "mt-1 text-[0.8125rem]" : "mt-1.5 text-sm"
      )}
     >
      {cleanDesc}
     </p>
    ) : null}

    {(orgText || statusText) && (
     <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
      {orgText ? (
       <span title={orgText} className="min-w-0 max-w-full truncate">
        {orgText}
       </span>
      ) : null}
      {statusText ? <span className="font-medium text-foreground">{statusText}</span> : null}
      {hasLegacyTop ? (
       <span className="flex flex-wrap items-center gap-2">{badge}{statusBadge}</span>
      ) : null}
     </div>
    )}

    {metaItems.length > 0 && (
     <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1 border-t border-rule pt-2">
      {metaItems.map((item, i) => (
       <div key={i} className="flex min-w-0 items-baseline gap-1.5">
        <item.icon className="h-3 w-3 shrink-0 self-center text-muted-foreground" aria-hidden />
        <span
         className={cn(
          "agate truncate text-xs",
          item.highlight ? "font-semibold text-brick" : "text-foreground"
         )}
        >
         {item.text}
        </span>
       </div>
      ))}
     </div>
    )}
   </div>

   <div className={cn("mt-4 flex items-center justify-between gap-3 border-t border-rule pt-2.5")}>
    <Link
     href={ctaHref}
     aria-label={`${ctaText} - ${title}`}
     className="inline-flex shrink-0 items-center text-sm font-medium text-brick underline decoration-1 underline-offset-4 transition-colors hover:decoration-2 focus-visible:outline-none"
    >
     {ctaText}
    </Link>
    {rightActions}
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
    "flex h-full flex-col border-t-2 border-rule-2 pt-3.5",
    variant === "compact" ? "px-0.5" : "px-0.5"
   )}
  >
   <div className="h-4 w-3/4 animate-pulse rounded-none bg-paper-3" />
   <div className="mt-2 h-4 w-1/2 animate-pulse rounded-none bg-paper-3" />
   <div className="mt-3 h-3 w-full animate-pulse rounded-none bg-paper-2" />
   <div className="mt-1.5 h-3 w-2/3 animate-pulse rounded-none bg-paper-2" />
   <div className="mt-auto flex gap-2 pt-4">
    <div className="h-4 w-20 animate-pulse rounded-none bg-paper-2" />
    <div className="h-4 w-24 animate-pulse rounded-none bg-paper-2" />
   </div>
   <div className="mt-4 border-t border-rule pt-2.5">
    <div className="h-4 w-28 animate-pulse rounded-none bg-paper-3" />
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
  <div className="flex flex-col items-start border-y border-rule bg-paper-2 px-6 py-10">
   <Inbox className="h-5 w-5 text-muted-foreground" aria-hidden />
   <h3 className="mt-3 font-display text-lg font-bold text-foreground">{title}</h3>
   {hint ? <p className="mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">{hint}</p> : null}
   {action ? <div className="mt-4">{action}</div> : null}
  </div>
 )
}
