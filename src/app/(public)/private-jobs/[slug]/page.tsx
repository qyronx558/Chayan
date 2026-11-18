import { cache } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { PrivateJobDetail } from "./private-job-detail"
import { EntityViewTracker } from "@/components/analytics/EntityViewTracker"
import { PrivateJobViewTracker } from "@/components/private/PrivateJobViewTracker"
import { DiscussionSection } from "@/components/discussion/DiscussionSection"
import { BreadcrumbNav } from "@/components/layout/BreadcrumbNav"
import { cn, formatDate, getBaseUrl, safeJsonLd } from "@/lib/utils"
import { handFont, typeFont } from "@/components/home/fonts"
import "@/app/home.css"
import { canViewContent, robotsFor } from "@/lib/public-visibility"
import { buildPrivateJobPostingLd } from "@/lib/private-jobs/seo"
import { cleanJobDescription } from "@/lib/private-jobs/description"

/* airmail chevrons; kept here because airmail.tsx is a client module */
const AIRMAIL = "repeating-linear-gradient(135deg, oklch(55% 0.19 27) 0 10px, transparent 10px 15px, oklch(45% 0.13 255) 15px 25px, transparent 25px 30px)"

interface Props {
  params: Promise<{ slug: string }>
}

/** One query per request, shared by generateMetadata and the page. */
const getJob = cache((slug: string) =>
  prisma.privateJob.findUnique({
    where: { slug },
    include: { company: true },
  })
)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const job = await getJob(slug)

  if (!job) return { title: "Not Found" }

  const baseUrl = getBaseUrl()

  return {
    title: `${job.title} - ${job.company.name}`,
    description: `Apply for ${job.title} at ${job.company.name}. ${job.location ? `Location: ${job.location}.` : ""} ${job.salary ? `Salary: ${job.salary}.` : ""}`,
    alternates: { canonical: `${baseUrl}/private-jobs/${job.slug}` },
    // Closed or unreviewed postings stay out of search indexes.
    robots: job.status === "ACTIVE" ? robotsFor(job.moderation) : { index: false, follow: true },
    twitter: { card: "summary_large_image", title: `${job.title} at ${job.company.name} | ChayanJobs`, description: `${job.company.name} - ${job.location || "India"} | ${job.salary || "As per company"}` },
    openGraph: {
      title: `${job.title} - ${job.company.name}`,
      description: `Company: ${job.company.name} | Location: ${job.location || "India"} | Salary: ${job.salary || "As per company"}`,
    },
  }
}

export const dynamic = "force-dynamic"

export default async function PrivateJobPage({ params }: Props) {
  const { slug } = await params
  const job = await getJob(slug)

  if (!job || !(await canViewContent(job.moderation))) notFound()

  const relatedJobs = await prisma.privateJob.findMany({
    where: {
      companyId: job.companyId,
      id: { not: job.id },
      status: "ACTIVE",
      moderation: "APPROVED",
    },
    take: 4,
    orderBy: { createdAt: "desc" },
    include: { company: true },
  })

  const fallbackRelated =
    relatedJobs.length > 0
      ? []
      : await prisma.privateJob.findMany({
          where: { id: { not: job.id }, status: "ACTIVE", moderation: "APPROVED" },
          take: 4,
          orderBy: { createdAt: "desc" },
          include: { company: true },
        })

  const related = relatedJobs.length > 0 ? relatedJobs : fallbackRelated
  // eslint-disable-next-line react-hooks/purity -- server component, runs once per request
  const nowMs = Date.now()

  const jsonLd = job.status === "ACTIVE" && job.moderation === "APPROVED" ? buildPrivateJobPostingLd(job, getBaseUrl()) : null

  return (
    <div className="home-saas container mx-auto max-w-6xl px-4 py-8">
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />}
      <BreadcrumbNav
        segments={[
          { label: "Private Jobs", href: "/private-jobs" },
          { label: job.title, href: `/private-jobs/${job.slug}` },
        ]}
        className="mb-6"
      />

      {/* Description cleaned on the server: pasted HTML source / <style> designs never reach the browser. */}
      <PrivateJobDetail job={JSON.parse(JSON.stringify({ ...job, description: cleanJobDescription(job.description) }))} />
      <PrivateJobViewTracker jobId={job.id} />
      <EntityViewTracker entityType="PRIVATE_JOB" entityId={job.id} />

      <DiscussionSection postType="PRIVATE_JOB" postId={job.id} path={`/private-jobs/${job.slug}`} />

      {related.length > 0 && (
        <section className="mt-14">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className={cn(typeFont.className, "text-[10.5px] font-bold tracking-[0.25em] text-muted-foreground")}>MORE LETTERS IN THE POST</p>
              <h2 className="mt-1 font-display text-[1.6rem] font-black leading-tight text-foreground">
                {relatedJobs.length > 0 ? `More openings at ${job.company.name}` : "More private openings"}
              </h2>
            </div>
            <Link href="/private-jobs" className={cn(handFont.className, "shrink-0 text-[1.1rem] text-[var(--hs-trust)] underline decoration-wavy decoration-1 underline-offset-4")}>
              view all private jobs →
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {related.map((rj, i) => {
              const rjLast = rj.lastDate ? new Date(rj.lastDate).getTime() : null
              const rjDays = rjLast ? Math.floor((rjLast - nowMs) / 86400000) : null
              const rjUrgent = rjDays !== null && rjDays >= 0 && rjDays <= 7
              return (
                <Link key={rj.id} href={`/private-jobs/${rj.slug}`} className={cn("group block transition-transform duration-300 hover:-translate-y-1", i % 2 ? "rotate-[0.5deg]" : "-rotate-[0.5deg]")}>
                  <article className="h-full p-[5px]" style={{ background: AIRMAIL, boxShadow: "0 16px 26px -20px rgb(30 30 60 / .55)" }}>
                    <div className="relative h-full bg-[var(--hs-paper-slip)] px-5 pb-4 pt-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className={cn(typeFont.className, "min-w-0 truncate text-[11px] font-bold uppercase text-muted-foreground")}>{rj.company.name}</p>
                        {rjDays !== null && rjDays >= 0 ? (
                          <span
                            className={cn(typeFont.className, "shrink-0 rotate-[6deg] rounded-[3px] border-2 px-1.5 text-[10px] font-bold")}
                            style={{ color: rjUrgent ? "oklch(52% 0.19 27)" : "oklch(45% 0.13 255)", borderColor: "currentColor" }}
                          >
                            {rjUrgent ? `ONLY ${rjDays}D LEFT` : `${rjDays}D LEFT`}
                          </span>
                        ) : null}
                      </div>
                      <h3 className="mt-2 font-display text-[1.12rem] font-bold leading-snug text-foreground decoration-[var(--color-brick)] decoration-2 underline-offset-[3px] group-hover:underline">{rj.title}</h3>
                      <div className={cn(typeFont.className, "mt-3 space-y-1 text-[11.5px] text-muted-foreground")}>
                        {rj.location && <p>To: <span className="text-foreground">{rj.location}</span></p>}
                        {rj.lastDate && <p>Last date: <span className={rjUrgent ? "font-bold text-[var(--color-brick)]" : "text-foreground"}>{formatDate(rj.lastDate)}</span></p>}
                        {rj.vacancies && <p>Openings: <span className="text-foreground">{rj.vacancies}</span></p>}
                      </div>
                      <p className={cn(handFont.className, "mt-3 text-[1.05rem] text-[var(--hs-trust)]")}>open the letter →</p>
                    </div>
                  </article>
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
