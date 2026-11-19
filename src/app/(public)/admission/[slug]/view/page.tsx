import { cache } from "react"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { ApplicationShell } from "@/components/apply/ApplicationShell"
import type { ApplicationInfoRow } from "@/components/apply/application-types"
import { formatDate } from "@/lib/utils"
import { normalizeExternalUrl, getExternalHostname } from "@/lib/apply-room"
import { isPubliclyVisible } from "@/lib/public-visibility"

interface Props {
  params: Promise<{ slug: string }>
}

export const revalidate = 86400

const getAdmission = cache((slug: string) => prisma.admission.findUnique({ where: { slug }, include: { department: true, category: true } }))

export function generateStaticParams(): { slug: string }[] {
  return []
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const admission = await getAdmission(slug)
  if (!admission || !isPubliclyVisible(admission.moderation)) return { title: "View Admission | ChayanJobs" }
  return {
    title: `Admission: ${admission.title} | ChayanJobs`,
    description: `View ${admission.title} in fullscreen on the original official document.`,
    robots: { index: false, follow: true },
  }
}

/**
 * Admissions - fullscreen official-document viewer on the shared shell.
 * URL resolution unchanged: the stored official PDF URL.
 */
export default async function AdmissionViewPage({ params }: Props) {
  const { slug } = await params
  const admission = await getAdmission(slug)

  if (!admission || !isPubliclyVisible(admission.moderation)) notFound()

  const targetUrl = normalizeExternalUrl(admission.pdfUrl)
  if (!targetUrl) notFound()

  const hostname = getExternalHostname(targetUrl)
  const deadlineLabel = admission.lastDate ? formatDate(admission.lastDate) : null

  const infoRows: ApplicationInfoRow[] = [
    { label: "Department", value: admission.department.name },
    ...(admission.category ? [{ label: "Category", value: admission.category.name }] : []),
    ...(admission.startDate
      ? [{ label: "Start date", value: formatDate(admission.startDate) }]
      : []),
    ...(admission.lastDate
      ? [{ label: "Last date", value: formatDate(admission.lastDate) }]
      : []),
    ...(admission.applicationFee
      ? [{ label: "Application fee", value: admission.applicationFee }]
      : []),
    ...(admission.status ? [{ label: "Status", value: admission.status }] : []),
    { label: "Official source", value: hostname },
  ]

  return (
    <ApplicationShell
      type="admission"
      jobId={admission.id}
      slug={admission.slug}
      title={admission.title}
      organization={admission.department.name}
      officialUrl={targetUrl}
      hostname={hostname}
      deadlineLabel={deadlineLabel}
      updatedLabel={admission.createdAt ? formatDate(admission.createdAt) : null}
      sourceLabel="Official Document"
      backHref={`/admission/${admission.slug}`}
      backLabel="Back"
      infoRows={infoRows}
    />
  )
}
