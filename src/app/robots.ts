import type { MetadataRoute } from "next"
import { isProduction } from "@/lib/app-env"
import { generateSitemaps as privateJobSitemaps } from "@/app/sitemaps/private-jobs/sitemap"

export const revalidate = 86400

const BLOCKED_BOTS = ["AhrefsBot", "SemrushBot", "MJ12bot", "DotBot", "Bytespider", "PetalBot", "DataForSeoBot"]

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "")

  // Local and dev copies tell every crawler to stay out.
  if (!isProduction()) return { rules: { userAgent: "*", disallow: "/" } }

  // Private jobs live in their own sharded sitemaps (they can number in the hundreds of thousands).
  const shards = await privateJobSitemaps()
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/profile/",
          "/bookmarks/",
          "/applications/",
          "/employer/",
          "/browse",
          "/search",
          "/*/view$",
          "/apply/*/start",
          "/private-jobs/*/apply",
        ],
      },
      { userAgent: BLOCKED_BOTS, disallow: "/" },
    ],
    sitemap: [
      `${baseUrl}/sitemap.xml`,
      ...shards.map(({ id }) => `${baseUrl}/sitemaps/private-jobs/sitemap/${id}.xml`),
    ],
  }
}
