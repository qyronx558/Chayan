import type { Metadata } from "next"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Sitemap",
  description: "Complete sitemap of ChayanJobs - Browse all pages, job listings, results, admit cards and more.",
}

export const dynamic = "force-dynamic"

export default async function SitemapPage() {
  const [jobs, results, admitCards, answerKeys, syllabus, admissions, categories] = await Promise.all([
    prisma.job.findMany({ select: { title: true, slug: true }, orderBy: { title: "asc" }, take: 100 }),
    prisma.result.findMany({ select: { title: true, slug: true }, orderBy: { title: "asc" }, take: 100 }),
    prisma.admitCard.findMany({ select: { title: true, slug: true }, orderBy: { title: "asc" }, take: 100 }),
    prisma.answerKey.findMany({ select: { title: true, slug: true }, orderBy: { title: "asc" }, take: 100 }),
    prisma.syllabus.findMany({ select: { title: true, slug: true }, orderBy: { title: "asc" }, take: 100 }),
    prisma.admission.findMany({ select: { title: true, slug: true }, orderBy: { title: "asc" }, take: 100 }),
    prisma.category.findMany({ select: { name: true, slug: true }, orderBy: { name: "asc" } }),
  ])

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-display text-[2.2rem] font-bold text-foreground">Sitemap</h1>
      <p className="mb-8 border-b-2 border-rule-2 pb-5 text-muted-foreground">Browse all pages and listings available on ChayanJobs.</p>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              <Link href="/jobs" className="text-brick">Jobs</Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              <li>
                <Link href="/jobs" className="text-sm text-muted-foreground hover:text-brick">All Jobs</Link>
              </li>
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <Link href={`/category/${cat.slug}`} className="text-sm text-muted-foreground hover:text-brick">
                    {cat.name} Jobs
                  </Link>
                </li>
              ))}
              <li className="mt-2 border-t border-rule pt-2">
                <p className="mb-1 agate text-xs text-muted-foreground">Recent Jobs</p>
              </li>
              {jobs.slice(0, 10).map((job) => (
                <li key={job.slug}>
                  <Link href={`/apply/${job.slug}`} className="text-sm text-muted-foreground hover:text-brick truncate block">
                    {job.title}
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              <Link href="/results" className="text-brick">Results</Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              <li>
                <Link href="/results" className="text-sm text-muted-foreground hover:text-brick">All Results</Link>
              </li>
              <li className="mt-2 border-t border-rule pt-2">
                <p className="mb-1 agate text-xs text-muted-foreground">Recent Results</p>
              </li>
              {results.slice(0, 10).map((result) => (
                <li key={result.slug}>
                  <Link href={`/result/${result.slug}`} className="text-sm text-muted-foreground hover:text-brick truncate block">
                    {result.title}
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              <Link href="/admit-cards" className="text-brick">Admit Cards</Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              <li>
                <Link href="/admit-cards" className="text-sm text-muted-foreground hover:text-brick">All Admit Cards</Link>
              </li>
              <li className="mt-2 border-t border-rule pt-2">
                <p className="mb-1 agate text-xs text-muted-foreground">Recent Admit Cards</p>
              </li>
              {admitCards.slice(0, 10).map((card) => (
                <li key={card.slug}>
                  <Link href={`/admit-card/${card.slug}`} className="text-sm text-muted-foreground hover:text-brick truncate block">
                    {card.title}
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              <Link href="/answer-keys" className="text-brick">Answer Keys</Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              <li>
                <Link href="/answer-keys" className="text-sm text-muted-foreground hover:text-brick">All Answer Keys</Link>
              </li>
              <li className="mt-2 border-t border-rule pt-2">
                <p className="mb-1 agate text-xs text-muted-foreground">Recent Answer Keys</p>
              </li>
              {answerKeys.slice(0, 10).map((key) => (
                <li key={key.slug}>
                  <Link href={`/answer-key/${key.slug}`} className="text-sm text-muted-foreground hover:text-brick truncate block">
                    {key.title}
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              <Link href="/syllabus" className="text-brick">Syllabus</Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              <li>
                <Link href="/syllabus" className="text-sm text-muted-foreground hover:text-brick">All Syllabus</Link>
              </li>
              <li className="mt-2 border-t border-rule pt-2">
                <p className="mb-1 agate text-xs text-muted-foreground">Recent Syllabus</p>
              </li>
              {syllabus.slice(0, 10).map((s) => (
                <li key={s.slug}>
                  <Link href={`/syllabus/${s.slug}`} className="text-sm text-muted-foreground hover:text-brick truncate block">
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              <Link href="/admissions" className="text-brick">Admissions</Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              <li>
                <Link href="/admissions" className="text-sm text-muted-foreground hover:text-brick">All Admissions</Link>
              </li>
              <li className="mt-2 border-t border-rule pt-2">
                <p className="mb-1 agate text-xs text-muted-foreground">Recent Admissions</p>
              </li>
              {admissions.slice(0, 10).map((admission) => (
                <li key={admission.slug}>
                  <Link href={`/admission/${admission.slug}`} className="text-sm text-muted-foreground hover:text-brick truncate block">
                    {admission.title}
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              <Link href="/exam-calendar" className="text-brick">Exam Calendar</Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              <li>
                <Link href="/exam-calendar" className="text-sm text-muted-foreground hover:text-brick">
                  Upcoming Deadlines &amp; Exams
                </Link>
              </li>
              <li>
                <Link href="/jobs" className="text-sm text-muted-foreground hover:text-brick">
                  Browse Active Jobs
                </Link>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              <Link href="/notifications" className="text-brick">Notifications</Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              <li>
                <Link href="/notifications" className="text-sm text-muted-foreground hover:text-brick">
                  All Official Notifications
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-sm text-muted-foreground hover:text-brick">
                  ChayanJobs Blog
                </Link>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              <Link href="/careers" className="text-brick">Company</Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              <li>
                <Link href="/about" className="text-sm text-muted-foreground hover:text-brick">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-sm text-muted-foreground hover:text-brick">
                  Careers - Join Our Team
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-muted-foreground hover:text-brick">
                  Contact Us
                </Link>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
