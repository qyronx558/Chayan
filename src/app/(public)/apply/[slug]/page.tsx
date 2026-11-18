import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { BreadcrumbNav } from "@/components/layout/BreadcrumbNav"
import { JobDetailContent } from "@/components/jobs/JobDetailContent"
import { DiscussionSection } from "@/components/discussion/DiscussionSection"
import { JobViewTracker } from "@/components/jobs/JobViewTracker"
import { EntityViewTracker } from "@/components/analytics/EntityViewTracker"
import { cn, formatDate, getBaseUrl, safeJsonLd } from "@/lib/utils"
import { handFont, typeFont } from "@/components/home/fonts"
import "@/app/home.css"
import { stripHtmlToText } from "@/lib/blog-prose"
import { getJourney } from "@/lib/doc-journey"
import { canViewContent, robotsFor } from "@/lib/public-visibility"
import { isThinJob } from "@/lib/ingest/quality"

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
    // A unique, human-readable description per page beats a templated one (and avoids duplicate meta).
    description: job.summary
      ? job.summary.length > 160 ? `${job.summary.slice(0, 157).replace(/\s+\S*$/, "")}...` : job.summary
      : `${job.title} - ${job.department.name} | ${job.totalVacancies ? `${job.totalVacancies} vacancies` : ""} | Apply before ${job.lastDate ? formatDate(job.lastDate) : "N/A"}`,
    alternates: { canonical: `${baseUrl}/apply/${job.slug}` },
    robots: robotsFor(job.moderation, isThinJob(job)),
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
    include: { department: true, category: true, state: true, district: true },
  })

  if (!job || !(await canViewContent(job.moderation))) notFound()

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
    <div className="home-saas container mx-auto max-w-6xl px-4 pb-8 pt-6">
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
        jobLevel={job.jobLevel}
        state={job.state ? { id: job.state.id, name: job.state.name, slug: job.state.slug } : null}
        district={job.district ? { id: job.district.id, name: job.district.name, slug: job.district.slug } : null}
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
        summary={job.summary}
      />
<JobViewTracker jobId={job.id} />
      <EntityViewTracker entityType="JOB" entityId={job.id} />

      <div className="mt-12">
        <DiscussionSection postType="JOB" postId={job.id} path={`/apply/${job.slug}`} />
      </div>
      {relatedJobs.length > 0 && (
        <section className="mt-16">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-3 border-b border-dashed border-[var(--hs-border-strong)] pb-3">
            <div>
              <p className={cn(handFont.className, "text-[1.15rem] text-[var(--color-brick)]")}>while you&apos;re here</p>
              <h2 className="font-display text-[1.6rem] font-black leading-tight text-foreground">More from {job.department.name}</h2>
            </div>
            <Link href="/jobs" className={cn(handFont.className, "shrink-0 text-[1.1rem] text-[var(--hs-trust)] underline decoration-wavy decoration-1 underline-offset-4 hover:text-[var(--color-brick)]")}>
              see every job →
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {relatedJobs.map((rj, i) => {
              const rjLast = rj.lastDate ? new Date(rj.lastDate).getTime() : null
              const rjDays = rjLast ? Math.floor((rjLast - nowMs) / 86400000) : null
              const rjUrgent = rjDays !== null && rjDays >= 0 && rjDays <= 7
              return (
              <Link
                key={rj.id}
                href={`/apply/${rj.slug}`}
                className={cn(
                  "group relative block rounded-[3px] border border-[var(--hs-border)] bg-[var(--hs-paper-slip)] px-5 pb-4 pt-5 transition-transform duration-300 hover:-translate-y-1",
                  i % 3 === 1 ? "rotate-[0.5deg]" : i % 3 === 2 ? "-rotate-[0.4deg]" : ""
                )}
                style={{ boxShadow: "0 1px 2px rgb(60 40 10 / .08), 0 16px 28px -22px rgb(60 40 10 / .55)" }}
              >
                <span className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full shadow-[1px_2px_2px_rgb(0_0_0/.3)]" style={{ background: `radial-gradient(circle at 35% 30%, oklch(75% 0.15 ${[28, 250, 155, 70][i % 4]}), oklch(48% 0.15 ${[28, 250, 155, 70][i % 4]}))` }} aria-hidden />
                <p className={cn(typeFont.className, "line-clamp-1 text-[10.5px] font-bold uppercase text-muted-foreground")}>{rj.department.name}</p>
                <h3 className="mt-1.5 line-clamp-2 font-display text-[1.1rem] font-bold leading-snug text-foreground group-hover:underline group-hover:decoration-[var(--color-brick)] group-hover:underline-offset-2">{rj.title}</h3>
                <dl className={cn(typeFont.className, "mt-3 space-y-1 text-[11.5px]")}>
                  {rj.location && (
                    <div className="flex gap-2"><dt className="w-20 shrink-0 text-muted-foreground">Location</dt><dd className="line-clamp-1 text-foreground">{rj.location}</dd></div>
                  )}
                  {rj.lastDate && (
                    <div className="flex gap-2">
                      <dt className="w-20 shrink-0 text-muted-foreground">Last date</dt>
                      <dd className={rjUrgent ? "font-bold text-[var(--color-brick)]" : "text-foreground"}>
                        {formatDate(rj.lastDate)}
                        {rjDays !== null && rjDays >= 0 ? (
                          <span className={cn(handFont.className, "ml-2 text-[0.98rem] font-normal", rjUrgent ? "text-[var(--color-brick)]" : "text-muted-foreground")}>
                            {rjUrgent ? `only ${rjDays}d left` : `${rjDays}d left`}
                          </span>
                        ) : null}
                      </dd>
                    </div>
                  )}
                  {rj.totalVacancies ? (
                    <div className="flex gap-2"><dt className="w-20 shrink-0 text-muted-foreground">Vacancies</dt><dd className="font-bold text-foreground">{rj.totalVacancies.toLocaleString("en-IN")}</dd></div>
                  ) : null}
                </dl>
              </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
