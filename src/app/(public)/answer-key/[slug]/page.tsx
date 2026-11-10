import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { getBaseUrl, safeJsonLd } from "@/lib/utils"
import { BreadcrumbNav } from "@/components/layout/BreadcrumbNav"
import { getJourney } from "@/lib/doc-journey"
import { DocumentDetail } from "@/components/documents/DocumentDetail"
import { DiscussionSection } from "@/components/discussion/DiscussionSection"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const answerKey = await prisma.answerKey.findUnique({
    where: { slug },
    include: { department: true },
  })

  if (!answerKey) return { title: "Answer Key Not Found" }

  const baseUrl = getBaseUrl()

  return {
    title: answerKey.title,
    description: `${answerKey.title} - ${answerKey.department.name}${answerKey.description ? ` | ${answerKey.description}` : ""}`,
    alternates: { canonical: `${baseUrl}/answer-key/${answerKey.slug}` },
    twitter: { card: "summary_large_image", title: `${answerKey.title} | ChayanJobs`, description: `${answerKey.department.name} - Download answer key` },
  }
}

export default async function AnswerKeyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const answerKey = await prisma.answerKey.findUnique({
    where: { slug },
    include: { department: true, category: true, job: true },
  })

  if (!answerKey) notFound()

  const relatedKeys = await prisma.answerKey.findMany({
    where: {
      departmentId: answerKey.departmentId,
      id: { not: answerKey.id },
    },
    take: 4,
    orderBy: { createdAt: "desc" },
    include: { department: true },
  })

  const journey = await getJourney(answerKey.jobId, "answer-key")

  const breadCrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: getBaseUrl() },
      { "@type": "ListItem", position: 2, name: "Answer Keys", item: `${getBaseUrl()}/answer-keys` },
      { "@type": "ListItem", position: 3, name: answerKey.title, item: `${getBaseUrl()}/answer-key/${answerKey.slug}` },
    ],
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadCrumbLd) }} />
      <BreadcrumbNav
        segments={[
          { label: "Answer Keys", href: "/answer-keys" },
          { label: answerKey.title, href: `/answer-key/${answerKey.slug}` },
        ]}
        className="mb-6"
      />
<DocumentDetail
        journey={journey}
        kind="answer-key"
        tracking={{ entityType: "ANSWER_KEY", entityId: answerKey.id }}
        title={answerKey.title}
        department={answerKey.department.name}
        category={answerKey.category.name}
        description={answerKey.description}
        rows={[
          { label: "Department", value: answerKey.department.name },
          { label: "Category", value: answerKey.category.name },
          { label: "Status", value: answerKey.status },
        ]}
        linkRows={answerKey.job ? [{ label: "Related Job", value: answerKey.job.title, href: `/apply/${answerKey.job.slug}` }] : []}
        downloadUrl={answerKey.pdfUrl}
        downloadLabel="Download Answer Key PDF"
        viewerHref={`/answer-key/${answerKey.slug}/view`}
        followJob={answerKey.job ? { jobId: answerKey.job.id } : null}
        publishedAt={answerKey.createdAt.toISOString()}
        relatedTitle="Related Answer Keys"
        relatedItems={relatedKeys.map((rk) => ({
          href: `/answer-key/${rk.slug}`,
          title: rk.title,
          department: rk.department.name,
          meta: rk.status || null,
        }))}
      />

      <DiscussionSection postType="ANSWER_KEY" postId={answerKey.id} path={`/answer-key/${answerKey.slug}`} />
</div>
  )
}
