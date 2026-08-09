"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight, ChevronDown, ChevronUp, MapPin, IndianRupee, Briefcase, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SectionHeader } from "@/components/ui/section-header"
import { ContentCard, ContentCardSkeleton } from "@/components/ui/content-card"
import { BookmarkButton } from "@/components/layout/BookmarkButton"

interface Company {
  id: string
  name: string
  slug: string
  logo?: string | null
}

interface PrivateJob {
  id: string
  title: string
  slug: string
  type: string
  category?: string | null
  description?: string | null
  location?: string | null
  salary?: string | null
  experience?: string | null
  status: string
  createdAt: string
  company: Company
}

export function LatestPrivateJobs({ className }: { className?: string }) {
  const [jobs, setJobs] = useState<PrivateJob[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    fetch("/api/private-jobs?limit=8&status=ACTIVE")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setJobs(data.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const displayed = showAll ? jobs : jobs.slice(0, 4)

  return (
    <section className={cn("py-16", className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          icon={Building2}
          iconClassName="from-sky-600 to-blue-800"
          title="Latest Private Jobs"
          subtitle="Top opportunities from leading companies"
          viewAllHref="/private-jobs"
        />

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <ContentCardSkeleton key={i} />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-500">No private jobs available right now.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {displayed.map((job) => (
              <ContentCard
                key={job.id}
                icon={Building2}
                iconClassName="from-sky-600 to-blue-800"
                badge={<span className="inline-flex items-center rounded-md bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700">{job.company.name}</span>}
                statusBadge={<Badge variant="secondary" className="px-1.5 py-0.5 text-[10px]">{job.type.replace("_", " ")}</Badge>}
                title={job.title}
                meta={[
                  ...(job.location ? [{ icon: MapPin, text: job.location }] : []),
                  ...(job.salary ? [{ icon: IndianRupee, text: job.salary }] : []),
                  ...(job.experience ? [{ icon: Briefcase, text: job.experience }] : []),
                ]}
                href={`/private-jobs/${job.slug}`}
                ctaLabel="Apply Now"
                footer={<BookmarkButton privateJobId={job.id} />}
              />
            ))}
          </div>
        )}

        {jobs.length > 4 && (
          <div className="mt-6 text-center">
            <Button variant="outline" onClick={() => setShowAll(!showAll)} className="gap-2">
              {showAll ? (
                <>Show Less <ChevronUp className="h-4 w-4" /></>
              ) : (
                <>Load More ({jobs.length - 4} more) <ChevronDown className="h-4 w-4" /></>
              )}
            </Button>
          </div>
        )}

        <div className="mt-6 text-center sm:hidden">
          <Link href="/private-jobs" className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
            View All Private Jobs
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}