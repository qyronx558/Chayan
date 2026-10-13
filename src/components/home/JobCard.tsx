"use client"

import {
  Calendar,
  MapPin,
  Users,
} from "lucide-react"
import { BookmarkButton } from "@/components/layout/BookmarkButton"
import { ApplicationTracker } from "@/components/jobs/ApplicationTracker"
import { cn, formatDate } from "@/lib/utils"
import { UniversalCard, UniversalCardSkeleton } from "@/components/ui/universal-card"
import { CardShareButton } from "@/components/ui/card-actions"
import { cleanTitle } from "@/lib/card-helpers"

interface JobCardProps {
  id: string
  title: string
  department: string
  departmentSlug?: string
  location?: string | null
  totalVacancies?: number | null
  lastDateToApply?: Date | string | null
  salary?: string | null
  status: "ACTIVE" | "EXPIRED" | "UPCOMING"
  slug: string
  className?: string
}

const statusLabel: Record<string, string> = {
  ACTIVE: "Active",
  EXPIRED: "Expired",
  UPCOMING: "Upcoming",
}

export function JobCard({
  id,
  title,
  department,
  location,
  totalVacancies,
  lastDateToApply,
  salary,
  status,
  slug,
  className,
}: JobCardProps) {
  const isLastDateUrgent = lastDateToApply
    ? new Date(lastDateToApply).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000 &&
      new Date(lastDateToApply) > new Date()
    : false

  const meta = [
    ...(totalVacancies != null
      ? [{ icon: Users, text: `${totalVacancies} ${totalVacancies === 1 ? "Vacancy" : "Vacancies"}` }]
      : []),
    ...(lastDateToApply
      ? [{ icon: Calendar, text: formatDate(lastDateToApply), highlight: isLastDateUrgent }]
      : []),
    ...(location
      ? [{ icon: MapPin, text: location }]
      : salary
        ? [{ icon: MapPin, text: salary }]
        : []),
  ].slice(0, 3)

  return (
    <div className={cn("h-full", className)}>
      <UniversalCard
        module="government"
        title={cleanTitle(title)}
        organization={department}
        status={statusLabel[status]}
        metadata={meta}
        primaryCtaUrl={`/apply/${slug}`}
        track={<ApplicationTracker jobId={id} />}
        save={<BookmarkButton jobId={id} />}
        share={<CardShareButton title={cleanTitle(title)} url={`/apply/${slug}`} text={`Apply for ${cleanTitle(title)} - ${department}`} />}
      />
    </div>
  )
}

export function JobCardSkeleton() {
  return <UniversalCardSkeleton />
}