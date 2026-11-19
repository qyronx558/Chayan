import { cache } from "react"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { ApplicationShell } from "@/components/apply/ApplicationShell"
import type { ApplicationInfoRow } from "@/components/apply/application-types"
import { formatDate } from "@/lib/utils"
import { normalizeExternalUrl, getExternalHostname } from "@/lib/apply-room"
import { inAppApplyUrl } from "@/lib/private-jobs/apply-url"
import { ApplyVisitTracker } from "@/components/private/AppliedBadge"
import { salaryDisplay } from "@/lib/private-jobs/salary"
import { isPubliclyVisible } from "@/lib/public-visibility"

interface Props {
  params: Promise<{ slug: string }>
}

export const revalidate = 86400

const getJob = cache((slug: string) =>
  prisma.privateJob.findUnique({
    where: { slug },
    include: { company: true, feed: { select: { provider: true, boardToken: true } } },
  })
)

export function generateStaticParams(): { slug: string }[] {
  return []
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const job = await getJob(slug)
  if (!job || !isPubliclyVisible(job.moderation)) return { title: "Apply | ChayanJobs" }
  return {
    title: `Apply: ${job.title} at ${job.company.name} | ChayanJobs`,
    description: `Apply for ${job.title} on the original application page, opened inside ChayanJobs.`,
    robots: { index: false, follow: true },
  }
}

/**
 * Private jobs - same unified Application Mode as government jobs.
 * URL resolution logic unchanged: the company's original application URL.
 */
export default async function PrivateJobApplyPage({ params }: Props) {
  const { slug } = await params
  const job = await getJob(slug)

  if (!job || !isPubliclyVisible(job.moderation)) notFound()

  const postingUrl = normalizeExternalUrl(job.applicationUrl)
  if (!postingUrl) notFound()
  // The board's embeddable application form where one exists, so the candidate
  // fills and submits it inside ChayanJobs.
  const targetUrl = normalizeExternalUrl(inAppApplyUrl(postingUrl, { feed: job.feed, externalId: job.externalId })) ?? postingUrl

  const hostname = getExternalHostname(targetUrl)
  const deadlineLabel = job.lastDate ? formatDate(job.lastDate) : null

  const infoRows: ApplicationInfoRow[] = [
    { label: "Company", value: job.company.name },
    ...(job.location ? [{ label: "Location", value: job.location }] : []),
    ...(job.experience ? [{ label: "Experience", value: job.experience }] : []),
    ...(job.type ? [{ label: "Employment type", value: job.type }] : []),
    ...(salaryDisplay(job) ? [{ label: "Salary", value: salaryDisplay(job) as string }] : []),
    { label: "Official source", value: hostname },
  ]

  return (
    <>
    {/* Opening the application saves it to the candidate's applied jobs. */}
    <ApplyVisitTracker job={{ id: job.id, title: job.title, company: job.company.name, slug: job.slug }} />
    <ApplicationShell
      type="private"
      jobId={job.id}
      slug={job.slug}
      title={job.title}
      organization={job.company.name}
      officialUrl={targetUrl}
      hostname={hostname}
      deadlineLabel={deadlineLabel}
      updatedLabel={job.updatedAt ? formatDate(job.updatedAt) : null}
      sourceLabel="Company Careers"
      backHref={`/private-jobs/${job.slug}`}
      backLabel="Back"
      infoRows={infoRows}
    />
    </>
  )
}
