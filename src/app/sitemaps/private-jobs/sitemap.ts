import type { MetadataRoute } from "next"
import { prisma } from "@/lib/prisma"

/**
 * Live private-job pages, split into files of PER_SITEMAP URLs (Google's cap is
 * 50,000) so the catalogue can grow to hundreds of thousands of postings.
 * Served at /sitemaps/private-jobs/sitemap/<id>.xml and listed in robots.txt.
 */
const PER_SITEMAP = 40_000
export const revalidate = 86400

const LIVE = { status: "ACTIVE", moderation: "APPROVED" as const }

export async function generateSitemaps() {
  let total = 0
  try {
    total = await prisma.privateJob.count({ where: LIVE })
  } catch {
    // database unavailable during build
  }
  const shards = Math.max(1, Math.ceil(total / PER_SITEMAP))
  return Array.from({ length: shards }, (_, id) => ({ id }))
}

export default async function sitemap(props: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  const id = Number(await props.id) || 0
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "")
  try {
    const jobs = await prisma.privateJob.findMany({
      where: LIVE,
      select: { slug: true, updatedAt: true },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      skip: id * PER_SITEMAP,
      take: PER_SITEMAP,
    })
    return jobs.map((j) => ({
      url: `${baseUrl}/private-jobs/${j.slug}`,
      lastModified: j.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.7,
    }))
  } catch {
    return []
  }
}
