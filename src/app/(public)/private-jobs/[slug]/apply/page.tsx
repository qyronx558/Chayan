import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { BreadcrumbNav } from "@/components/layout/BreadcrumbNav"
import { ApplyRoomClient } from "@/components/jobs/ApplyRoomClient"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { normalizeExternalUrl, getExternalHostname } from "@/lib/apply-room"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const job = await prisma.privateJob.findUnique({
    where: { slug },
    include: { company: true },
  })
  if (!job) return { title: "Apply | Chayan" }
  return {
    title: `Apply: ${job.title} at ${job.company.name} | Chayan`,
    description: `Apply for ${job.title} on the original application page, opened inside Chayan.`,
    robots: { index: false, follow: true },
  }
}

export const dynamic = "force-dynamic"

/**
 * Focused Apply Room for private jobs.
 * Minimal info on purpose: title and the original application site in full space.
 */
export default async function PrivateJobApplyPage({ params }: Props) {
  const { slug } = await params
  const job = await prisma.privateJob.findUnique({
    where: { slug },
    include: { company: true },
  })

  if (!job) notFound()

  const targetUrl = normalizeExternalUrl(job.applicationUrl)
  if (!targetUrl) notFound()

  const hostname = getExternalHostname(targetUrl)

  return (
    <div className="mx-auto w-full max-w-7xl px-2 py-4 sm:px-4 sm:py-6">
      <BreadcrumbNav
        segments={[
          { label: "Private Jobs", href: "/private-jobs" },
          { label: job.title, href: `/private-jobs/${job.slug}` },
          { label: "Apply", href: `/private-jobs/${job.slug}/apply` },
        ]}
        className="mb-3 px-1"
      />

      <div className="mb-3 flex flex-wrap items-center gap-2 px-1">
        <h1 className="min-w-0 flex-1 truncate text-lg font-semibold tracking-tight text-gray-900 sm:text-xl dark:text-white">
          {job.title} <span className="font-medium text-gray-500">at {job.company.name}</span>
        </h1>
        {job.lastDate ? (
          <Badge variant="outline" className="shrink-0 text-gray-600 dark:text-gray-300">
            Last date: {formatDate(job.lastDate)}
          </Badge>
        ) : null}
      </div>

      <ApplyRoomClient
        targetUrl={targetUrl}
        hostname={hostname}
        title={`${job.title} at ${job.company.name}`}
        subtitle={job.location ? `${job.company.name} | ${job.location}` : job.company.name}
        backHref={`/private-jobs/${job.slug}`}
        backLabel="Job details"
      />
    </div>
  )
}
