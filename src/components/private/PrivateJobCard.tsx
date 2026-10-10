"use client"

import { useState } from "react"
import {
  Calendar,
  MapPin,
  IndianRupee,
  Briefcase,
  Building2,
  Share2,
  Wifi,
} from "lucide-react"
import { BookmarkButton } from "@/components/layout/BookmarkButton"
import { PrivateTracker } from "@/components/private/PrivateTracker"
import { TrustBadge } from "@/components/private/TrustBadge"
import { cn, formatDate } from "@/lib/utils"
import { formatSalaryRange } from "@/lib/private-jobs-trust"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ContentCard } from "@/components/ui/content-card"

interface PrivateJobCardProps {
  id: string
  title: string
  slug: string
  company: string
  type: string
  typeLabel?: string
  location?: string | null
  remotePolicy?: string | null
  salary?: string | null
  salaryMin?: number | null
  salaryMax?: number | null
  experience?: string | null
  lastDate?: string | null
  trustScore?: number | null
  isFresherFriendly?: boolean
  isWalkIn?: boolean
  status?: string
  className?: string
}

export function PrivateJobCard({
  id,
  title,
  slug,
  company,
  typeLabel,
  location,
  remotePolicy,
  salary,
  salaryMin,
  salaryMax,
  experience,
  lastDate,
  trustScore,
  isFresherFriendly,
  isWalkIn,
  className,
}: PrivateJobCardProps) {
  const [isSharing, setIsSharing] = useState(false)

  const salaryText = formatSalaryRange(salaryMin, salaryMax, salary)
  const locationText =
    location && remotePolicy === "REMOTE"
      ? `${location} · Remote`
      : location || (remotePolicy === "REMOTE" ? "Remote" : null)

  const isLastDateUrgent = lastDate
    ? new Date(lastDate).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000 &&
      new Date(lastDate) > new Date()
    : false

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const url = `${window.location.origin}/private-jobs/${slug}`
    if (navigator.share) {
      try {
        setIsSharing(true)
        await navigator.share({ title, text: `Apply for ${title} - ${company}`, url })
      } catch {
        // dismissed
      } finally {
        setIsSharing(false)
      }
    } else {
      await navigator.clipboard.writeText(url)
    }
  }

  return (
    <div className={cn("h-full", className)}>
      <ContentCard
        icon={Building2}
        iconClassName="from-sky-600 to-blue-800"
        badge={
          <Badge
            variant="secondary"
            className="max-w-[55%] truncate bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700 hover:bg-sky-50"
          >
            {company}
          </Badge>
        }
        statusBadge={
          <span className="flex items-center gap-1">
            <Badge variant="secondary" className="px-1.5 py-0.5 text-[10px]">
              {typeLabel}
            </Badge>
            {(trustScore ?? 0) > 0 && <TrustBadge score={trustScore!} size="sm" />}
          </span>
        }
        title={title}
        meta={[
          ...(locationText ? [{ icon: remotePolicy === "REMOTE" && !location ? Wifi : MapPin, text: locationText }] : []),
          ...(salaryText ? [{ icon: IndianRupee, text: salaryText }] : []),
          ...(experience ? [{ icon: Briefcase, text: experience }] : []),
          ...(lastDate
            ? [{ icon: Calendar, text: formatDate(lastDate), highlight: isLastDateUrgent }]
            : []),
        ]}
        href={`/private-jobs/${slug}`}
        ctaLabel="View Details"
        footer={
          <div className="flex items-center gap-2">
            <PrivateTracker privateJobId={id} variant="full" className="h-8 px-2.5 text-[11px]" />
            <BookmarkButton
              privateJobId={id}
              className="h-8 w-8 border border-gray-200 bg-white text-gray-500 shadow-sm hover:border-sky-300 hover:bg-sky-50 hover:text-sky-600"
            />
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-gray-200 bg-white text-gray-500 shadow-sm hover:border-sky-300 hover:bg-sky-50 hover:text-sky-600"
              onClick={handleShare}
              disabled={isSharing}
              aria-label="Share"
            >
              <Share2 className="h-3.5 w-3.5" />
            </Button>
            <span className="ml-auto flex gap-1">
              {isFresherFriendly && (
                <Badge variant="outline" className="text-[10px] text-emerald-700">
                  Fresher
                </Badge>
              )}
              {isWalkIn && (
                <Badge variant="outline" className="text-[10px] text-amber-700">
                  Walk-in
                </Badge>
              )}
            </span>
          </div>
        }
      />
    </div>
  )
}
