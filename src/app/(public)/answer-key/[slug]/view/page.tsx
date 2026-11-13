import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { ApplicationShell } from "@/components/apply/ApplicationShell"
import type { ApplicationInfoRow } from "@/components/apply/application-types"
import { formatDate } from "@/lib/utils"
import { normalizeExternalUrl, getExternalHostname } from "@/lib/apply-room"
import { canViewContent } from "@/lib/public-visibility"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const answerKey = await prisma.answerKey.findUnique({ where: { slug } })
  if (!answerKey) return { title: "View Answer Key | ChayanJobs" }
  return {
    title: `Answer Key: ${answerKey.title} | ChayanJobs`,
    description: `View ${answerKey.title} in fullscreen on the original official document.`,
    robots: { index: false, follow: true },
  }
}

/**
 * Answer keys - fullscreen official-document viewer on the shared shell.
 * URL resolution unchanged: the stored official PDF URL.
 */
export default async function AnswerKeyViewPage({ params }: Props) {
  const { slug } = await params
  const answerKey = await prisma.answerKey.findUnique({
    where: { slug },
    include: { department: true, category: true },
  })

  if (!answerKey || !(await canViewContent(answerKey.moderation))) notFound()

  const targetUrl = normalizeExternalUrl(answerKey.pdfUrl)
  if (!targetUrl) notFound()

  const hostname = getExternalHostname(targetUrl)

  const infoRows: ApplicationInfoRow[] = [
    { label: "Department", value: answerKey.department.name },
    ...(answerKey.category ? [{ label: "Category", value: answerKey.category.name }] : []),
    ...(answerKey.status ? [{ label: "Status", value: answerKey.status }] : []),
    { label: "Official source", value: hostname },
  ]

  return (
    <ApplicationShell
      type="answer-key"
      jobId={answerKey.id}
      slug={answerKey.slug}
      title={answerKey.title}
      organization={answerKey.department.name}
      officialUrl={targetUrl}
      hostname={hostname}
      updatedLabel={answerKey.createdAt ? formatDate(answerKey.createdAt) : null}
      sourceLabel="Official Document"
      backHref={`/answer-key/${answerKey.slug}`}
      backLabel="Back"
      infoRows={infoRows}
    />
  )
}
