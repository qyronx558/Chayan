"use client"

import Image from "next/image"
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

  return (
    <div className="mx-auto grid min-h-[420px] max-w-7xl items-center gap-8 px-4 py-10 sm:min-h-[460px] sm:px-6 lg:grid-cols-[1fr_340px] lg:px-8">
      <div>
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
          {icon}
          {badge}
        </div>

        <h1 className="mb-3 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
          {item.title}
        </h1>

        {(item.organization || item.isPinned) && (
          <p className="mb-4 flex flex-wrap items-center gap-3 text-sm text-teal-300 sm:text-base">
            {item.organization && (
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <Building2 className="h-4 w-4" /> {item.organization}
              </span>
            )}
            {item.isPinned && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400">
                <Star className="h-3.5 w-3.5 fill-amber-400" /> Pinned
              </span>
            )}
          </p>
        )}

        {item.info && (
          <p className="mb-3 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">{item.info}</p>
        )}

        {item.dateText && (
          <p className="mb-6 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-white/85">
            <Calendar className="h-4 w-4 text-amber-400" /> {item.dateText}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={href}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            className="inline-flex items-center rounded-lg bg-amber-400 px-5 py-2.5 text-sm font-bold text-[#0a1628] shadow-lg shadow-amber-400/25 transition-all hover:bg-amber-300 hover:shadow-amber-400/40"
          >
            {item.ctaLabel}
          </Link>
          <Link
            href={href}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            className="inline-flex items-center rounded-lg border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/15"
          >
            View Details
          </Link>
        </div>
      </div>

      {item.image && (
        <div className="relative hidden aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/10 shadow-2xl lg:block">
          <Image src={item.image} alt={item.title} fill className="object-cover" sizes="340px" />
          <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
        </div>
      )}
    </div>
  )
}