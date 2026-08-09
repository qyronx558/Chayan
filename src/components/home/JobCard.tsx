"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Calendar,
  MapPin,
  IndianRupee,
  Users,
  Share2,
  ArrowRight,
  Clock3,
} from "lucide-react"
import { BookmarkButton } from "@/components/layout/BookmarkButton"
import { cn, formatDate, formatSalary, getStatusColor } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

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
      <Card className="group relative flex h-full flex-col overflow-hidden border-gray-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-900/5">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] overflow-hidden">
          <div className="h-full w-full bg-gradient-to-r from-transparent via-blue-600 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>

        <CardContent className="flex h-full flex-col p-0">
          <div className="flex flex-wrap items-center gap-1.5 p-5 pb-3">
            <Badge
              variant="secondary"
              className="max-w-[60%] truncate bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 hover:bg-blue-50"
            >
              {department}
            </Badge>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                getStatusColor(status)
              )}
            >
              {status === "UPCOMING" && <Clock3 className="h-3 w-3" />}
              {statusLabel[status]}
            </span>
          </div>

          <div className="flex-1 px-5">
            <Link href={`/apply/${slug}`}>
              <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-gray-900 transition-colors group-hover:text-blue-700">
                {title}
              </h3>
            </Link>
          </div>

          <div className="flex flex-wrap gap-1.5 px-5 pt-3.5">
            {location && (
              <span className="inline-flex items-center gap-1 rounded-md border border-gray-100 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-600">
                <MapPin className="h-3 w-3 text-gray-400" />
                {location}
              </span>
            )}
            {totalVacancies != null && (
              <span className="inline-flex items-center gap-1 rounded-md border border-gray-100 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-600">
                <Users className="h-3 w-3 text-gray-400" />
                {totalVacancies} Vacanc{totalVacancies === 1 ? "y" : "ies"}
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-md border border-gray-100 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-600">
              <IndianRupee className="h-3 w-3 text-gray-400" />
              {formatSalary(salary)}
            </span>
            {lastDateToApply && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium",
                  isLastDateUrgent
                    ? "border-red-100 bg-red-50 text-red-600"
                    : "border-gray-100 bg-gray-50 text-gray-600"
                )}
              >
                <Calendar className="h-3 w-3 text-gray-400" />
                {formatDate(lastDateToApply)}
              </span>
            )}
          </div>

          <div className="mt-auto flex items-center justify-between gap-2 p-5">
            <Link
              href={`/apply/${slug}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-all duration-300 group-hover:bg-gradient-to-r group-hover:from-[#1e3a5f] group-hover:to-blue-700 group-hover:text-white"
            >
              Apply Now
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
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
          </div>
        </CardContent>
      </Card>
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