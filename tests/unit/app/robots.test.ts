import { describe, expect, it, vi } from "vitest"

const { count } = vi.hoisted(() => ({ count: vi.fn() }))
vi.mock("@/lib/prisma", () => ({ prisma: { privateJob: { count } } }))

import robots from "@/app/robots"

describe("robots.txt", () => {
  it("blocks every crawler on local and dev", async () => {
    for (const env of ["local", "dev"]) {
      vi.stubEnv("NEXT_PUBLIC_APP_ENV", env)
      expect(await robots()).toEqual({ rules: { userAgent: "*", disallow: "/" } })
    }
    expect(count).not.toHaveBeenCalled()
  })

  it("allows indexing on production, except private areas, and lists the private-job sitemaps", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "production")
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://site.test/")
    count.mockResolvedValue(85_000)
    const r = await robots()
    expect(r.rules).toEqual([
      expect.objectContaining({ userAgent: "*", allow: "/", disallow: expect.arrayContaining(["/api/", "/browse", "/search"]) }),
      expect.objectContaining({ userAgent: expect.arrayContaining(["AhrefsBot", "SemrushBot"]), disallow: "/" }),
    ])
    expect(r.sitemap).toEqual([
      "https://site.test/sitemap.xml",
      "https://site.test/sitemaps/private-jobs/sitemap/0.xml",
      "https://site.test/sitemaps/private-jobs/sitemap/1.xml",
      "https://site.test/sitemaps/private-jobs/sitemap/2.xml",
    ])
  })

  it("still lists one private-job sitemap when the database is unreachable", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "production")
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://site.test")
    count.mockRejectedValue(new Error("db down"))
    const r = await robots()
    expect(r.sitemap).toEqual(["https://site.test/sitemap.xml", "https://site.test/sitemaps/private-jobs/sitemap/0.xml"])
  })
})
