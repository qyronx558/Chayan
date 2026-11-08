"use client"

import {
 MapPin,
 IndianRupee,
 Briefcase,
 Wifi,
} from "lucide-react"
import { BookmarkButton } from "@/components/layout/BookmarkButton"
import { PrivateTracker } from "@/components/private/PrivateTracker"
import { cn } from "@/lib/utils"
import { formatSalaryRange } from "@/lib/private-jobs-trust"
import { UniversalCard } from "@/components/ui/universal-card"
import { CardShareButton } from "@/components/ui/card-actions"
import { cleanTitle } from "@/lib/card-helpers"

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
 variant = "standard",
}: PrivateJobCardProps & { variant?: "compact" | "standard" | "wide" }) {
 const salaryText = formatSalaryRange(salaryMin, salaryMax, salary)
 const locationText =
  location && remotePolicy === "REMOTE"
   ? `${location} · Remote`
   : location || (remotePolicy === "REMOTE" ? "Remote" : null)

 const meta = [
  ...(locationText ? [{ icon: remotePolicy === "REMOTE" && !location ? Wifi : MapPin, text: locationText }] : []),
  ...(salaryText ? [{ icon: IndianRupee, text: salaryText }] : []),
  ...(experience ? [{ icon: Briefcase, text: experience }] : []),
 ].slice(0, 3)

 const statusText = [
  typeLabel,
  isFresherFriendly ? "Fresher" : null,
  isWalkIn ? "Walk-in" : null,
 ]
  .filter(Boolean)
  .join(" · ") || "Hiring"

 void trustScore
 void lastDate

 return (
  <div className={cn("h-full", className)}>
   <UniversalCard
    module="privateJob"
    variant={variant}
    title={cleanTitle(title)}
    organization={company}
    status={statusText}
    metadata={meta}
    primaryCtaLabel="Apply Now"
    primaryCtaUrl={`/private-jobs/${slug}`}
    track={<PrivateTracker privateJobId={id} />}
    save={<BookmarkButton privateJobId={id} />}
    share={<CardShareButton title={cleanTitle(title)} url={`/private-jobs/${slug}`} />}
   />
  </div>
 )
}
