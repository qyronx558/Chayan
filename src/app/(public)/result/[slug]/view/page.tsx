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

const getResult = cache((slug: string) => prisma.result.findUnique({ where: { slug }, include: { department: true, category: true } }))

export function generateStaticParams(): { slug: string }[] {
  return []
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const result = await getResult(slug)
  if (!result || !isPubliclyVisible(result.moderation)) return { title: "View Result | ChayanJobs" }
  return {
    title: `Result: ${result.title} | ChayanJobs`,
    description: `View ${result.title} in fullscreen on the original official document.`,
    robots: { index: false, follow: true },
  }
}

/**
 * Results - fullscreen official-document viewer on the shared shell.
 * URL resolution unchanged: the stored official PDF URL.
 */
export default async function ResultViewPage({ params }: Props) {
  const { slug } = await params
  const result = await getResult(slug)

  if (!result || !isPubliclyVisible(result.moderation)) notFound()

  const targetUrl = normalizeExternalUrl(result.pdfUrl)
  if (!targetUrl) notFound()

  const hostname = getExternalHostname(targetUrl)

  const infoRows: ApplicationInfoRow[] = [
    { label: "Department", value: result.department.name },
    ...(result.category ? [{ label: "Category", value: result.category.name }] : []),
    ...(result.resultDate
      ? [{ label: "Result date", value: formatDate(result.resultDate) }]
      : []),
    ...(result.status ? [{ label: "Status", value: result.status }] : []),
    { label: "Official source", value: hostname },
  ]

  return (
    <ApplicationShell
      type="result"
      jobId={result.id}
      slug={result.slug}
      title={result.title}
      organization={result.department.name}
      officialUrl={targetUrl}
      hostname={hostname}
      updatedLabel={result.createdAt ? formatDate(result.createdAt) : null}
      sourceLabel="Official Document"
      backHref={`/result/${result.slug}`}
      backLabel="Back"
      infoRows={infoRows}
    />
  )
}
