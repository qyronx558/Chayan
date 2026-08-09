"use client"

import { useState } from "react"
import {
  Calendar,
  MapPin,
  IndianRupee,
  Users,
  Share2,
  Clock3,
} from "lucide-react"
import { BookmarkButton } from "@/components/layout/BookmarkButton"
import { cn, formatDate, formatSalary, getStatusColor } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ContentCard } from "@/components/ui/content-card"

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
  const [isSharing, setIsSharing] = useState(false)
  const isLastDateUrgent = lastDateToApply
    ? new Date(lastDateToApply).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000 &&
      new Date(lastDateToApply) > new Date()
    : false

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (navigator.share) {
      try {
        setIsSharing(true)
        await navigator.share({
          title,
          text: `Apply for ${title} - ${department}`,
          url: `/jobs/${slug}`,
        })
      } catch {
      } finally {
        setIsSharing(false)
      }
    } else {
      await navigator.clipboard.writeText(`${window.location.origin}/apply/${slug}`)
    }
  }

  return (
    <div className={cn("h-full", className)}>
      <ContentCard
        badge={
          <Badge
            variant="secondary"
            className="max-w-[60%] truncate bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 hover:bg-blue-50"
          >
            {department}
          </Badge>
        }
        statusBadge={
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
              getStatusColor(status)
            )}
          >
            {status === "UPCOMING" && <Clock3 className="h-3 w-3" />}
            {statusLabel[status]}
          </span>
        }
        title={title}
        meta={[
          ...(location ? [{ icon: MapPin, text: location }] : []),
          ...(totalVacancies != null ? [{ icon: Users, text: `${totalVacancies} Vacanc${totalVacancies === 1 ? "y" : "ies"}` }] : []),
          ...(lastDateToApply
            ? [{ icon: Calendar, text: formatDate(lastDateToApply), highlight: isLastDateUrgent }]
            : []),
          { icon: IndianRupee, text: formatSalary(salary) },
        ]}
        href={`/apply/${slug}`}
        ctaLabel="Apply Now"
        footer={
          <div className="flex items-center gap-1">
            <BookmarkButton jobId={id} />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-300 hover:text-blue-500"
              onClick={handleShare}
              disabled={isSharing}
              aria-label="Share"
            >
              <Share2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        }
      />
    </div>
  )
}

export function JobCardSkeleton() {
  return (
    <Card className="overflow-hidden border-gray-200 bg-white">
      <CardContent className="p-0">
        <div className="flex items-center gap-1.5 p-5 pb-3">
          <div className="h-5 w-20 animate-pulse rounded-full bg-gray-100" />
          <div className="h-5 w-14 animate-pulse rounded-full bg-gray-100" />
        </div>
        <div className="px-5">
          <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
          <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-gray-100" />
        </div>
        <div className="flex gap-1.5 px-5 pt-4">
          <div className="h-6 w-20 animate-pulse rounded-md bg-gray-100" />
          <div className="h-6 w-24 animate-pulse rounded-md bg-gray-100" />
          <div className="h-6 w-24 animate-pulse rounded-md bg-gray-100" />
        </div>
        <div className="p-5">
          <div className="h-7 w-24 animate-pulse rounded-lg bg-gray-100" />
        </div>
      </CardContent>
    </Card>
  )
}