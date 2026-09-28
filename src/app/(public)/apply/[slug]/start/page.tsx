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
  const job = await prisma.job.findUnique({ where: { slug } })
  if (!job) return { title: "Apply | Chayan" }
  return {
    title: `Apply: ${job.title} | Chayan`,
    description: `Apply for ${job.title} on the original official website, opened inside Chayan.`,
    robots: { index: false, follow: true },
  }
}

/**
 * Government jobs — unified Application Mode.
 * URL resolution logic unchanged: applyLink first, then officialWebsite.
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
  const deadlineLabel = job.lastDate ? formatDate(job.lastDate) : null

  const infoRows: ApplicationInfoRow[] = [
    { label: "Department", value: job.department.name },
    ...(job.advertisementNo
      ? [{ label: "Advertisement No.", value: job.advertisementNo }]
      : []),
    ...(job.totalVacancies
      ? [{ label: "Total vacancies", value: job.totalVacancies.toLocaleString("en-IN") }]
      : []),
    ...(job.location ? [{ label: "Location", value: job.location }] : []),
    ...(job.applicationFee ? [{ label: "Application fee", value: job.applicationFee }] : []),
    { label: "Official source", value: hostname },
  ]

  return (
    <ApplicationShell
      type="government"
      jobId={job.id}
      slug={job.slug}
      title={job.title}
      organization={job.department.name}
      officialUrl={targetUrl}
      hostname={hostname}
      deadlineLabel={deadlineLabel}
      updatedLabel={job.updatedAt ? formatDate(job.updatedAt) : null}
      sourceLabel="Government Portal"
      backHref={`/apply/${job.slug}`}
      backLabel="Back"
      infoRows={infoRows}
    />
  )
}
