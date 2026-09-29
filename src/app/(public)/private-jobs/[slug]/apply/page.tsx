import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { ApplicationShell } from "@/components/apply/ApplicationShell"
import type { ApplicationInfoRow } from "@/components/apply/application-types"
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
 * Private jobs - same unified Application Mode as government jobs.
 * URL resolution logic unchanged: the company's original application URL.
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
  const deadlineLabel = job.lastDate ? formatDate(job.lastDate) : null

  const infoRows: ApplicationInfoRow[] = [
    { label: "Company", value: job.company.name },
    ...(job.location ? [{ label: "Location", value: job.location }] : []),
    ...(job.experience ? [{ label: "Experience", value: job.experience }] : []),
    ...(job.type ? [{ label: "Employment type", value: job.type }] : []),
    ...(job.salary ? [{ label: "Salary", value: job.salary }] : []),
    { label: "Official source", value: hostname },
  ]

  return (
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
  )
}
