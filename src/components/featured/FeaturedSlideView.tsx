"use client"

import Link from "next/link"
import {
  Briefcase, Building2, Calendar, Star, FileText, IdCard, KeyRound, Bell, GraduationCap, CalendarDays,
} from "lucide-react"
import { FEATURED_TYPE_BADGES, FEATURED_TYPE_ICONS } from "@/lib/featured"

export interface FeaturedSlideItem {
  id: string
  title: string
  type: string
  badge: string | null
  organization: string | null
  info: string | null
  dateText: string | null
  image: string | null
  ctaLabel: string
  ctaUrl: string | null
  linkUrl: string
  isPinned: boolean
}

const typeIcons: Record<string, React.ReactNode> = {
  job: <Briefcase className="h-3.5 w-3.5" />,
  private: <Briefcase className="h-3.5 w-3.5" />,
  result: <FileText className="h-3.5 w-3.5" />,
  card: <IdCard className="h-3.5 w-3.5" />,
  key: <KeyRound className="h-3.5 w-3.5" />,
  bell: <Bell className="h-3.5 w-3.5" />,
  admission: <GraduationCap className="h-3.5 w-3.5" />,
  event: <CalendarDays className="h-3.5 w-3.5" />,
  star: <Star className="h-3.5 w-3.5" />,
}

export function FeaturedSlideView({ item }: { item: FeaturedSlideItem }) {
  const badge = item.badge || FEATURED_TYPE_BADGES[item.type] || "Featured Update"
  const icon = typeIcons[FEATURED_TYPE_ICONS[item.type]] || <Star className="h-3.5 w-3.5" />
  const href = item.linkUrl.startsWith("/") || item.linkUrl.startsWith("http") ? item.linkUrl : `https://${item.linkUrl}`
  const isExternal = href.startsWith("http")
  const ctaHref = item.ctaUrl
    ? item.ctaUrl.startsWith("/") || item.ctaUrl.startsWith("http") ? item.ctaUrl : `https://${item.ctaUrl}`
    : href
  const isCtaExternal = ctaHref.startsWith("http")

  return (
    <div className="mx-auto flex min-h-[420px] w-full max-w-7xl min-w-0 flex-col items-center justify-center gap-7 px-4 py-10 sm:min-h-[460px] sm:px-6 lg:flex-row lg:gap-10 lg:px-8">
      <div className="w-full min-w-0 lg:flex-1">
        {item.image && (
          <div className="relative mb-5 aspect-[16/10] w-full max-w-xl overflow-hidden border border-paper/20 sm:mx-auto sm:aspect-[4/3] lg:hidden">
            <img src={item.image} alt={item.title} className="h-full w-full object-cover object-center" loading="lazy" />
          </div>
        )}

        <h1 className="break-words font-display text-[2rem] font-bold leading-[1.05] text-paper sm:text-[2.6rem] lg:text-[3rem]">
          {item.title}
        </h1>

        <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm text-paper/70">
          {item.organization && (
            <span className="inline-flex items-center gap-1.5 font-medium text-paper/90">
              <Building2 className="h-4 w-4" /> {item.organization}
            </span>
          )}
          <span className="agate inline-flex items-center gap-1.5 text-xs text-paper/60">
            {icon}
            {badge}
          </span>
          {item.isPinned && (
            <span className="agate inline-flex items-center gap-1 text-xs text-brick">
              <Star className="h-3 w-3" /> Pinned
            </span>
          )}
        </div>

        {item.info && (
          <p className="mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-paper/80 sm:text-base">{item.info}</p>
        )}

        {item.dateText && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-paper/70">
            <Calendar className="h-4 w-4" /> {item.dateText}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href={ctaHref}
            target={isCtaExternal ? "_blank" : undefined}
            rel={isCtaExternal ? "noopener noreferrer" : undefined}
            className="inline-flex items-center bg-paper px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-paper-2"
          >
            {item.ctaLabel}
          </Link>
          <Link
            href={href}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            className="inline-flex items-center border border-paper/35 px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:border-paper/70"
          >
            View details
          </Link>
        </div>
      </div>

      {item.image && (
        <div className="relative hidden aspect-[4/3] w-72 shrink-0 overflow-hidden border border-paper/20 lg:block xl:w-80">
          <img src={item.image} alt={item.title} className="h-full w-full object-cover object-center" loading="lazy" />
        </div>
      )}
    </div>
  )
}