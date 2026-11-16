import { prisma } from "@/lib/prisma"
import { DOCS_UPDATED, allDocs } from "@/components/docs/registry"
import { districtPagePath, statePagePath } from "@/lib/locations"
import { isThinJob } from "@/lib/ingest/quality"

export default async function sitemap() {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "")

  let jobs: { slug: string; updatedAt: Date }[] = []
  let results: { slug: string; createdAt: Date }[] = []
  let admitCards: { slug: string; createdAt: Date }[] = []
  let answerKeys: { slug: string; createdAt: Date }[] = []
  let admissions: { slug: string; createdAt: Date }[] = []
  let syllabi: { slug: string; createdAt: Date }[] = []
  let blogPosts: { slug: string; updatedAt: Date }[] = []
  let categories: { slug: string }[] = []
  let states: { slug: string; updatedAt: Date; districts: { slug: string; updatedAt: Date }[] }[] = []

  try {
    const data = await Promise.all([
      prisma.job.findMany({
        where: { moderation: "APPROVED" },
        select: {
          slug: true, updatedAt: true, summary: true, totalVacancies: true, education: true, ageLimit: true,
          applicationFee: true, selectionProcess: true, salary: true, howToApply: true, importantDates: true, lastDate: true,
        },
      }),
      prisma.result.findMany({ where: { moderation: "APPROVED" }, select: { slug: true, createdAt: true } }),
      prisma.admitCard.findMany({ where: { moderation: "APPROVED" }, select: { slug: true, createdAt: true } }),
      prisma.answerKey.findMany({ where: { moderation: "APPROVED" }, select: { slug: true, createdAt: true } }),
      prisma.admission.findMany({ where: { moderation: "APPROVED" }, select: { slug: true, createdAt: true } }),
      prisma.syllabus.findMany({ where: { moderation: "APPROVED" }, select: { slug: true, createdAt: true } }),
      prisma.blogPost.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
      prisma.category.findMany({ select: { slug: true } }),
      prisma.state.findMany({
        where: { districts: { some: {} } },
        select: { slug: true, updatedAt: true, districts: { select: { slug: true, updatedAt: true } } },
      }),
    ])
    // Thin pages stay out of the sitemap (and carry noindex) - see isThinJob.
    jobs = data[0].filter((j) => !isThinJob(j)).map(({ slug, updatedAt }) => ({ slug, updatedAt }))
    results = data[1]
    admitCards = data[2]
    answerKeys = data[3]
    admissions = data[4]
    syllabi = data[5]
    blogPosts = data[6]
    categories = data[7]
    states = data[8]
  } catch {
    // Database unavailable during build, return static pages only
  }

  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "hourly" as const, priority: 1 },
    { url: `${baseUrl}/tools`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.9 },
    { url: `${baseUrl}/tools/age-calculator`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.9 },
    { url: `${baseUrl}/tools/salary-calculator`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.9 },
    { url: `${baseUrl}/tools/photo-resizer`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.9 },
    { url: `${baseUrl}/tools/eligibility-checker`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.9 },
    { url: `${baseUrl}/jobs`, lastModified: new Date(), changeFrequency: "hourly" as const, priority: 0.9 },
    { url: `${baseUrl}/jobs/states`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.8 },
    // Private-job detail pages are in the sharded /sitemaps/private-jobs/sitemap/<id>.xml files.
    ...["/private-jobs", "/private-jobs/remote", "/private-jobs/freshers", "/private-jobs/walkins"].map((path) => ({
      url: `${baseUrl}${path}`,
      lastModified: new Date(),
      changeFrequency: "hourly" as const,
      priority: path === "/private-jobs" ? 0.9 : 0.8,
    })),
    { url: `${baseUrl}/notifications`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.8 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.8 },
    { url: `${baseUrl}/sitemap`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.3 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${baseUrl}/careers`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 },
    { url: `${baseUrl}/docs`, lastModified: new Date(DOCS_UPDATED), changeFrequency: "monthly" as const, priority: 0.6 },
    ...allDocs().map((d) => ({
      url: `${baseUrl}/docs/${d.meta.slug}`,
      lastModified: new Date(DOCS_UPDATED),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ]

  const jobPages = jobs.map((job) => ({
    url: `${baseUrl}/apply/${job.slug}`,
    lastModified: job.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }))

  const resultPages = results.map((result) => ({
    url: `${baseUrl}/result/${result.slug}`,
    lastModified: result.createdAt,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))

  const admitCardPages = admitCards.map((card) => ({
    url: `${baseUrl}/admit-card/${card.slug}`,
    lastModified: card.createdAt,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))

  const answerKeyPages = answerKeys.map((key) => ({
    url: `${baseUrl}/answer-key/${key.slug}`,
    lastModified: key.createdAt,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }))

  const admissionPages = admissions.map((admission) => ({
    url: `${baseUrl}/admission/${admission.slug}`,
    lastModified: admission.createdAt,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }))

  const syllabusPages = syllabi.map((syllabus) => ({
    url: `${baseUrl}/syllabus/${syllabus.slug}`,
    lastModified: syllabus.createdAt,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }))

  const blogPages = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))

  const categoryPages = categories.map((cat) => ({
    url: `${baseUrl}/category/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }))

  // State + district landing pages (~820 URLs) for local "government jobs in X" searches.
  const locationPages = states.flatMap((state) => [
    {
      url: `${baseUrl}${statePagePath(state.slug)}`,
      lastModified: state.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
    ...state.districts.map((district) => ({
      url: `${baseUrl}${districtPagePath(state.slug, district.slug)}`,
      lastModified: district.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
  ])

  return [
    ...staticPages,
    ...locationPages,
    ...jobPages,
    ...resultPages,
    ...admitCardPages,
    ...answerKeyPages,
    ...admissionPages,
    ...syllabusPages,
    ...blogPages,
    ...categoryPages,
  ]
}
