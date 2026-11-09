import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { formatDate, getBaseUrl } from "@/lib/utils"
import { BreadcrumbNav } from "@/components/layout/BreadcrumbNav"
import { getJourney } from "@/lib/doc-journey"
import { DocumentDetail } from "@/components/documents/DocumentDetail"
import { DiscussionSection } from "@/components/discussion/DiscussionSection"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const result = await prisma.result.findUnique({
    where: { slug },
    include: { department: true },
  })

  if (!result) return { title: "Result Not Found" }

  const baseUrl = getBaseUrl()

  return {
    title: result.title,
    description: `${result.title} - ${result.department.name}${result.resultDate ? ` | Result Date: ${formatDate(result.resultDate)}` : ""}${result.description ? ` | ${result.description}` : ""}`,
    alternates: { canonical: `${baseUrl}/result/${result.slug}` },
    twitter: { card: "summary_large_image", title: `${result.title} | ChayanJobs`, description: `${result.department.name} - ${result.resultDate ? `Result: ${formatDate(result.resultDate)}` : ""}` },
  }
}

export default async function ResultDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const result = await prisma.result.findUnique({
    where: { slug },
    include: { department: true, category: true, job: true },
  })

  if (!result) notFound()

  const relatedResults = await prisma.result.findMany({
    where: {
      departmentId: result.departmentId,
      id: { not: result.id },
    },
    take: 4,
    orderBy: { createdAt: "desc" },
    include: { department: true },
  })

  const journey = await getJourney(result.jobId, "result")

  const breadCrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: getBaseUrl() },
      { "@type": "ListItem", position: 2, name: "Results", item: `${getBaseUrl()}/results` },
      { "@type": "ListItem", position: 3, name: result.title, item: `${getBaseUrl()}/result/${result.slug}` },
    ],
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: result.title,
    description: result.description || result.title,
    datePublished: result.createdAt,
    publisher: { "@type": "Organization", name: result.department.name },
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadCrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <BreadcrumbNav
        segments={[
          { label: "Results", href: "/results" },
          { label: result.title, href: `/result/${result.slug}` },
        ]}
        className="mb-6"
      />
<DocumentDetail
        journey={journey}
        kind="result"
        tracking={{ entityType: "RESULT", entityId: result.id }}
        title={result.title}
        department={result.department.name}
        category={result.category.name}
        description={result.description}
        rows={[
          { label: "Result Date", value: result.resultDate ? formatDate(result.resultDate) : null },
          { label: "Department", value: result.department.name },
          { label: "Category", value: result.category.name },
          { label: "Status", value: result.status },
        ]}
        linkRows={result.job ? [{ label: "Related Job", value: result.job.title, href: `/apply/${result.job.slug}` }] : []}
        downloadUrl={result.pdfUrl}
        downloadLabel="Download Result PDF"
        viewerHref={`/result/${result.slug}/view`}
        bookmarkId={{ type: "result", id: result.id }}
        followJob={result.job ? { jobId: result.job.id } : null}
        primaryDate={result.resultDate ? result.resultDate.toISOString() : null}
        primaryDateLabel="Result declared"
        primaryDateMode="since"
        publishedAt={result.createdAt.toISOString()}
        relatedTitle="Related Results"
        relatedItems={relatedResults.map((rr) => ({
          href: `/result/${rr.slug}`,
          title: rr.title,
          department: rr.department.name,
          meta: rr.resultDate ? `Result Date: ${formatDate(rr.resultDate)}` : null,
        }        ))}
      />

      <DiscussionSection postType="RESULT" postId={result.id} path={`/result/${result.slug}`} />
</div>
  )
}
