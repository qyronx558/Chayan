import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { BreadcrumbNav } from "@/components/layout/BreadcrumbNav"
import { ApplyRoomClient } from "@/components/jobs/ApplyRoomClient"
import { ApplicationTracker } from "@/components/jobs/ApplicationTracker"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { normalizeExternalUrl, getExternalHostname } from "@/lib/apply-room"
import { CalendarClock } from "lucide-react"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const job = await prisma.job.findUnique({ where: { slug } })
  if (!job) return { title: "Apply | Chayan" }
  return {
    title: `Apply: ${job.title} | Chayan`,
    description: `Apply for ${job.title} on the original official website, opened inside Chayan.`,
    robots: { index: false, follow: true },
  }
}

/**
 * Focused Apply Room for gov jobs.
 * Minimal info on purpose: title, key meta and the official site in full space.
 */
export default async function ApplyStartPage({ params }: Props) {
  const { slug } = await params
  const job = await prisma.job.findUnique({
    where: { slug },
    include: { department: true },
  })

  if (!job) notFound()

  const targetUrl = normalizeExternalUrl(job.applyLink || job.officialWebsite)
  if (!targetUrl) notFound()

  const hostname = getExternalHostname(targetUrl)

  return (
    <div className="mx-auto w-full max-w-7xl px-2 py-4 sm:px-4 sm:py-6">
      <BreadcrumbNav
        segments={[
          { label: "Jobs", href: "/jobs" },
          { label: job.title, href: `/apply/${job.slug}` },
          { label: "Apply", href: `/apply/${job.slug}/start` },
        ]}
        className="mb-3 px-1"
      />

      <div className="mb-3 flex flex-wrap items-center gap-2 px-1">
        <h1 className="min-w-0 flex-1 truncate text-lg font-semibold tracking-tight text-gray-900 sm:text-xl dark:text-white">
          {job.title}
        </h1>
        {job.lastDate ? (
          <Badge variant="outline" className="shrink-0 gap-1 text-gray-600 dark:text-gray-300">
            <CalendarClock className="h-3 w-3" /> Last date: {formatDate(job.lastDate)}
          </Badge>
        ) : null}
      </div>

      <ApplyRoomClient
        targetUrl={targetUrl}
        hostname={hostname}
        title={job.title}
        subtitle={`${job.department.name}${job.location ? ` | ${job.location}` : ""}`}
        backHref={`/apply/${job.slug}`}
        backLabel="Job details"
        headerAction={<ApplicationTracker jobId={job.id} variant="full" />}
      />
    </div>
  )
}
