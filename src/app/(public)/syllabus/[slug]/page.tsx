import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { getBaseUrl, safeJsonLd } from "@/lib/utils"
import { BreadcrumbNav } from "@/components/layout/BreadcrumbNav"
import { getJourney } from "@/lib/doc-journey"
import { DocumentDetail } from "@/components/documents/DocumentDetail"
import { DiscussionSection } from "@/components/discussion/DiscussionSection"
import { canViewContent, robotsFor } from "@/lib/public-visibility"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const syllabus = await prisma.syllabus.findUnique({
    where: { slug },
    include: { department: true },
  })

  if (!syllabus) return { title: "Syllabus Not Found" }

  const baseUrl = getBaseUrl()

  return {
    title: syllabus.title,
    description: `${syllabus.title} - ${syllabus.department.name}${syllabus.subjects ? ` | Subjects: ${syllabus.subjects}` : ""}${syllabus.description ? ` | ${syllabus.description}` : ""}`,
    alternates: { canonical: `${baseUrl}/syllabus/${syllabus.slug}` },
    robots: robotsFor(syllabus.moderation, false),
    twitter: { card: "summary_large_image", title: `${syllabus.title} | ChayanJobs`, description: `${syllabus.department.name} - ${syllabus.subjects ? `Subjects: ${syllabus.subjects}` : "Download syllabus"}` },
  }
}

export default async function SyllabusDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const syllabus = await prisma.syllabus.findUnique({
    where: { slug },
    include: { department: true, category: true, job: true },
  })

  if (!syllabus || !(await canViewContent(syllabus.moderation))) notFound()

  const relatedSyllabus = await prisma.syllabus.findMany({
    where: {
      departmentId: syllabus.departmentId,
      id: { not: syllabus.id },
    },
    take: 4,
    orderBy: { createdAt: "desc" },
    include: { department: true },
  })

  const journey = await getJourney(syllabus.jobId, "syllabus")

  const breadCrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: getBaseUrl() },
      { "@type": "ListItem", position: 2, name: "Syllabus", item: `${getBaseUrl()}/syllabus` },
      { "@type": "ListItem", position: 3, name: syllabus.title, item: `${getBaseUrl()}/syllabus/${syllabus.slug}` },
    ],
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadCrumbLd) }} />
      <BreadcrumbNav
        segments={[
          { label: "Syllabus", href: "/syllabus" },
          { label: syllabus.title, href: `/syllabus/${syllabus.slug}` },
        ]}
        className="mb-6"
      />
<DocumentDetail
        journey={journey}
        kind="syllabus"
        tracking={{ entityType: "SYLLABUS", entityId: syllabus.id }}
        title={syllabus.title}
        department={syllabus.department.name}
        category={syllabus.category.name}
        description={syllabus.description}
        rows={[
          { label: "Department", value: syllabus.department.name },
          { label: "Category", value: syllabus.category.name },
          { label: "Status", value: syllabus.status },
        ]}
        linkRows={syllabus.job ? [{ label: "Related Job", value: syllabus.job.title, href: `/apply/${syllabus.job.slug}` }] : []}
        list={syllabus.subjects
          ? { label: "Subjects / Topics", items: syllabus.subjects.split("\n").map((s) => s.trim()).filter(Boolean) }
          : null}
        downloadUrl={syllabus.pdfUrl}
        downloadLabel="Download Syllabus PDF"
        viewerHref={`/syllabus/${syllabus.slug}/view`}
        bookmarkSyllabusId={syllabus.id}
        publishedAt={syllabus.createdAt.toISOString()}
        relatedTitle="Related Syllabus"
        relatedItems={relatedSyllabus.map((rs) => ({
          href: `/syllabus/${rs.slug}`,
          title: rs.title,
          department: rs.department.name,
          meta: rs.subjects ? `${rs.subjects.split("\n")[0].slice(0, 80)}${rs.subjects.includes("\n") ? "â€¦" : ""}` : null,
        }))}
      />

      <DiscussionSection postType="SYLLABUS" postId={syllabus.id} path={`/syllabus/${syllabus.slug}`} />
</div>
  )
}
