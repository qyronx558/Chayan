import type { MetadataRoute } from "next"
import { isProduction } from "@/lib/app-env"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "")

  // Local and dev copies tell every crawler to stay out.
  if (!isProduction()) return { rules: { userAgent: "*", disallow: "/" } }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/", "/profile/", "/bookmarks/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
