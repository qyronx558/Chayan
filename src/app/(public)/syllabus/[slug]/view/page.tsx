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
  const syllabus = await prisma.syllabus.findUnique({ where: { slug } })
  if (!syllabus) return { title: "View Syllabus | ChayanJobs" }
  return {
    title: `Syllabus: ${syllabus.title} | ChayanJobs`,
    description: `View ${syllabus.title} in fullscreen on the original official document.`,
    robots: { index: false, follow: true },
  }
}

/**
 * Syllabus - fullscreen official-document viewer on the shared shell.
 * URL resolution unchanged: the stored official PDF URL.
 */
export default async function SyllabusViewPage({ params }: Props) {
  const { slug } = await params
  const syllabus = await prisma.syllabus.findUnique({
    where: { slug },
    include: { department: true, category: true },
  })

  if (!syllabus) notFound()

  const targetUrl = normalizeExternalUrl(syllabus.pdfUrl)
  if (!targetUrl) notFound()

  const hostname = getExternalHostname(targetUrl)

  const infoRows: ApplicationInfoRow[] = [
    { label: "Department", value: syllabus.department.name },
    ...(syllabus.category ? [{ label: "Category", value: syllabus.category.name }] : []),
    ...(syllabus.status ? [{ label: "Status", value: syllabus.status }] : []),
    { label: "Official source", value: hostname },
  ]

  return (
    <ApplicationShell
      type="syllabus"
      jobId={syllabus.id}
      slug={syllabus.slug}
      title={syllabus.title}
      organization={syllabus.department.name}
      officialUrl={targetUrl}
      hostname={hostname}
      updatedLabel={syllabus.createdAt ? formatDate(syllabus.createdAt) : null}
      sourceLabel="Official Document"
      backHref={`/syllabus/${syllabus.slug}`}
      backLabel="Back"
      infoRows={infoRows}
    />
  )
}
