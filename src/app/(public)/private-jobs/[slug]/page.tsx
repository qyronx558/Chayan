import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { PrivateJobDetail } from "./private-job-detail"
import { DiscussionSection } from "@/components/discussion/DiscussionSection"
import { BreadcrumbNav } from "@/components/layout/BreadcrumbNav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate, getBaseUrl } from "@/lib/utils"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const job = await prisma.privateJob.findUnique({
    where: { slug },
    include: { company: true },
  })

  if (!job) return { title: "Not Found" }

  const baseUrl = getBaseUrl()

  return {
    title: `${job.title} - ${job.company.name}`,
    description: `Apply for ${job.title} at ${job.company.name}. ${job.location ? `Location: ${job.location}.` : ""} ${job.salary ? `Salary: ${job.salary}.` : ""}`,
    alternates: { canonical: `${baseUrl}/private-jobs/${job.slug}` },
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
  const job = await prisma.privateJob.findUnique({
    where: { slug },
    include: { company: true },
  })

  if (!job) notFound()

  const relatedJobs = await prisma.privateJob.findMany({
    where: {
      companyId: job.companyId,
      id: { not: job.id },
      status: "ACTIVE",
    },
    take: 4,
    orderBy: { createdAt: "desc" },
    include: { company: true },
  })

  const fallbackRelated =
    relatedJobs.length > 0
      ? []
      : await prisma.privateJob.findMany({
          where: { id: { not: job.id }, status: "ACTIVE" },
          take: 4,
          orderBy: { createdAt: "desc" },
          include: { company: true },
        })

  const related = relatedJobs.length > 0 ? relatedJobs : fallbackRelated
  // eslint-disable-next-line react-hooks/purity -- server component, runs once per request
  const nowMs = Date.now()

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <BreadcrumbNav
        segments={[
          { label: "Private Jobs", href: "/private-jobs" },
          { label: job.title, href: `/private-jobs/${job.slug}` },
        ]}
        className="mb-6"
      />

      <PrivateJobDetail job={JSON.parse(JSON.stringify(job))} />

      <DiscussionSection postType="PRIVATE_JOB" postId={job.id} path={`/private-jobs/${job.slug}`} />

      {related.length > 0 && (
        <section className="mt-12">
          <div className="mb-6 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Related Jobs</h2>
              <p className="mt-0.5 text-sm text-gray-500">
                {relatedJobs.length > 0 ? `More openings at ${job.company.name}` : "More private openings"}
              </p>
            </div>
            <Link href="/private-jobs" className="shrink-0 text-sm font-semibold text-sky-700 hover:underline dark:text-sky-300">
              View all private jobs →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {related.map((rj) => {
              const rjLast = rj.lastDate ? new Date(rj.lastDate).getTime() : null
              const rjDays = rjLast ? Math.floor((rjLast - nowMs) / 86400000) : null
              const rjUrgent = rjDays !== null && rjDays >= 0 && rjDays <= 7
              return (
                <Link key={rj.id} href={`/private-jobs/${rj.slug}`}>
                  <Card className="group h-full border-gray-200 transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md dark:border-gray-700">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="mb-2 flex flex-wrap items-center gap-1.5">
                            <Badge variant="secondary" className="bg-sky-50 text-xs text-sky-700 dark:bg-sky-900 dark:text-sky-300">{rj.company.name}</Badge>
                            {rjDays !== null && rjDays >= 0 && rjDays <= 7 ? (
                              <Badge className="bg-red-100 text-[11px] text-red-700 dark:bg-red-950 dark:text-red-300">Only {rjDays}d left</Badge>
                            ) : rjDays !== null && rjDays > 7 ? (
                              <Badge variant="outline" className="text-[11px]">{rjDays}d left</Badge>
                            ) : null}
                            {rjUrgent ? null : rj.vacancies ? (
                              <Badge variant="outline" className="text-[11px]">{rj.vacancies} openings</Badge>
                            ) : null}
                          </div>
                          <CardTitle className="text-base leading-snug group-hover:text-sky-700 dark:group-hover:text-sky-300">{rj.title}</CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                        {rj.location && <p>📍 {rj.location}</p>}
                        {rj.lastDate && <p>🗓 Last Date: <span className={rjUrgent ? "font-bold text-red-600" : "font-medium"}>{formatDate(rj.lastDate)}</span></p>}
                        {rj.vacancies && <p>👥 Openings: {rj.vacancies}</p>}
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
