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
  const admitCard = await prisma.admitCard.findUnique({ where: { slug } })
  if (!admitCard) return { title: "View Admit Card | Chayan" }
  return {
    title: `Admit Card: ${admitCard.title} | Chayan`,
    description: `View ${admitCard.title} in fullscreen on the original official document.`,
    robots: { index: false, follow: true },
  }
}

/**
 * Admit cards - fullscreen official-document viewer on the shared shell.
 * URL resolution unchanged: the stored official download URL.
 */
export default async function AdmitCardViewPage({ params }: Props) {
  const { slug } = await params
  const admitCard = await prisma.admitCard.findUnique({
    where: { slug },
    include: { department: true, category: true },
  })

  if (!admitCard) notFound()

  const targetUrl = normalizeExternalUrl(admitCard.downloadUrl)
  if (!targetUrl) notFound()

  const hostname = getExternalHostname(targetUrl)

  const infoRows: ApplicationInfoRow[] = [
    { label: "Department", value: admitCard.department.name },
    ...(admitCard.category ? [{ label: "Category", value: admitCard.category.name }] : []),
    ...(admitCard.examDate
      ? [{ label: "Exam date", value: formatDate(admitCard.examDate) }]
      : []),
    ...(admitCard.status ? [{ label: "Status", value: admitCard.status }] : []),
    { label: "Official source", value: hostname },
  ]

  return (
    <ApplicationShell
      type="admit-card"
      jobId={admitCard.id}
      slug={admitCard.slug}
      title={admitCard.title}
      organization={admitCard.department.name}
      officialUrl={targetUrl}
      hostname={hostname}
      updatedLabel={admitCard.createdAt ? formatDate(admitCard.createdAt) : null}
      sourceLabel="Official Document"
      backHref={`/admit-card/${admitCard.slug}`}
      backLabel="Back"
      infoRows={infoRows}
    />
  )
}
