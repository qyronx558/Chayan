import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { BreadcrumbNav } from "@/components/layout/BreadcrumbNav"
import { JobDetailContent } from "@/components/jobs/JobDetailContent"
import { DiscussionSection } from "@/components/discussion/DiscussionSection"
import { JobViewTracker } from "@/components/jobs/JobViewTracker"
import { EntityViewTracker } from "@/components/analytics/EntityViewTracker"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate, getBaseUrl, safeJsonLd } from "@/lib/utils"
import { stripHtmlToText } from "@/lib/blog-prose"
import { getJourney } from "@/lib/doc-journey"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const job = await prisma.job.findUnique({
    where: { slug },
    include: { department: true, category: true },
  })

  if (!job) return { title: "Job Not Found" }

  const baseUrl = getBaseUrl()

  return {
    title: job.title,
    description: `${job.title} - ${job.department.name} | ${job.totalVacancies ? `${job.totalVacancies} vacancies` : ""} | Apply before ${job.lastDate ? formatDate(job.lastDate) : "N/A"}`,
    alternates: { canonical: `${baseUrl}/apply/${job.slug}` },
    twitter: { card: "summary_large_image", title: `${job.title} | ChayanJobs`, description: `${job.department.name} - ${job.location || "All India"} | ${job.salary || "As per norms"}` },
    openGraph: {
      title: job.title,
      description: `Department: ${job.department.name} | Location: ${job.location || "All India"} | Salary: ${job.salary || "As per norms"}`,
    },
  }
}

export default async function ApplyJobPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const job = await prisma.job.findUnique({
    where: { slug },
    include: { department: true, category: true, state: true },
  })

  if (!job) notFound()

  const relatedJobs = await prisma.job.findMany({
    where: {
      departmentId: job.departmentId,
      id: { not: job.id },
      status: "ACTIVE",
    },
    take: 4,
    orderBy: { createdAt: "desc" },
    include: { department: true },
  })

  const viewsAgg = await prisma.jobView.aggregate({
    where: { jobId: job.id },
    _sum: { views: true },
  })
  const viewsTotal = viewsAgg._sum.views ?? 0
  const journey = await getJourney(job.id, "notification")
  // Single timestamp per request for stable related-job badges (server render).
  // eslint-disable-next-line react-hooks/purity -- server component, runs once per request
  const nowMs = Date.now()

  const breadCrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: getBaseUrl() },
      { "@type": "ListItem", position: 2, name: "Jobs", item: `${getBaseUrl()}/jobs` },
      { "@type": "ListItem", position: 3, name: job.title, item: `${getBaseUrl()}/apply/${job.slug}` },
    ],
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: `${job.title} - ${job.department.name}. ${stripHtmlToText(job.education).slice(0, 500)}`,
    datePosted: job.startDate || job.createdAt,
    validThrough: job.lastDate || undefined,
    hiringOrganization: {
      "@type": "Organization",
      name: job.department.name,
    },
    jobLocation: job.location
      ? {
          "@type": "Place",
          address: { "@type": "PostalAddress", addressLocality: job.location },
        }
      : undefined,
    ...(job.totalVacancies ? { numberOfPositions: job.totalVacancies } : {}),
    ...(job.salary ? { baseSalary: { "@type": "MonetaryAmount", value: job.salary } } : {}),
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadCrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      <BreadcrumbNav
        segments={[
          { label: "Jobs", href: "/jobs" },
          { label: job.title, href: `/apply/${job.slug}` },
        ]}
        className="mb-6"
      />
<JobDetailContent
        jobId={job.id}
        title={job.title}
        department={job.department.name}
        departmentId={job.department.id}
        category={{ id: job.category.id, name: job.category.name }}
        state={job.state ? { id: job.state.id, name: job.state.name } : null}
        status={job.status}
        advertisementNo={job.advertisementNo}
        totalVacancies={job.totalVacancies}
        salary={job.salary}
        location={job.location}
        ageLimit={job.ageLimit}
        ageRelaxation={job.ageRelaxation}
        education={job.education}
        selectionProcess={job.selectionProcess}
        applicationFee={job.applicationFee}
        importantDates={job.importantDates as Record<string, string> | null}
        documentsRequired={job.documentsRequired}
        howToApply={job.howToApply}
        officialNotification={job.officialNotification}
        officialWebsite={job.officialWebsite}
        applyLink={job.applyLink}
        experience={job.experience}
        startDate={job.startDate?.toISOString() || null}
        lastDate={job.lastDate?.toISOString() || null}
        slug={job.slug}
        updatedAt={job.updatedAt?.toISOString() || null}
        viewsTotal={viewsTotal}
        journey={journey}
      />
<JobViewTracker jobId={job.id} />
      <EntityViewTracker entityType="JOB" entityId={job.id} />

      <div className="mt-12">
        <DiscussionSection postType="JOB" postId={job.id} path={`/apply/${job.slug}`} />
      </div>
      {relatedJobs.length > 0 && (
        <section className="mt-12">
          <div className="mb-6 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-foreground dark:text-paper">Related Jobs</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">More openings from {job.department.name}</p>
            </div>
            <Link href="/jobs" className="shrink-0 text-sm font-semibold text-brick hover:underline dark:text-brick">
              View all jobs →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {relatedJobs.map((rj) => {
              const rjLast = rj.lastDate ? new Date(rj.lastDate).getTime() : null
              const rjDays = rjLast ? Math.floor((rjLast - nowMs) / 86400000) : null
              const rjUrgent = rjDays !== null && rjDays >= 0 && rjDays <= 7
              return (
              <Link key={rj.id} href={`/apply/${rj.slug}`}>
                <Card className="group h-full border-rule transition-all hover:-translate-y-0.5 hover:border-rule dark:border-ink">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-1.5">
                          <Badge variant="secondary" className="bg-paper-3 text-xs text-brick dark:bg-paper-3 dark:text-brick">{rj.department.name}</Badge>
                          {rjDays !== null && rjDays >= 0 && rjDays <= 7 ? (
                            <Badge className="bg-paper-2 text-[11px] text-brick dark:bg-paper-2 dark:text-brick">Only {rjDays}d left</Badge>
                          ) : rjDays !== null && rjDays > 7 ? (
                            <Badge variant="outline" className="text-[11px]">{rjDays}d left</Badge>
                          ) : null}
                          {rjUrgent ? null : rj.totalVacancies ? (
                            <Badge variant="outline" className="text-[11px]">{rj.totalVacancies.toLocaleString("en-IN")} posts</Badge>
                          ) : null}
                        </div>
                        <CardTitle className="text-base leading-snug group-hover:text-brick dark:group-hover:text-brick">{rj.title}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 text-sm text-muted-foreground dark:text-muted-foreground">
                      {rj.location && <p>📍 {rj.location}</p>}
                      {rj.lastDate && <p>🗓 Last Date: <span className={rjUrgent ? "font-bold text-brick" : "font-medium"}>{formatDate(rj.lastDate)}</span></p>}
                      {rj.totalVacancies && <p>👥 Vacancies: {rj.totalVacancies.toLocaleString("en-IN")}</p>}
                    </div>
                  </CardContent>
                </Card>
              </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
