import { describe, expect, it, vi } from "vitest"
import robots from "@/app/robots"

describe("robots.txt", () => {
  it("blocks every crawler on local and dev", () => {
    for (const env of ["local", "dev"]) {
      vi.stubEnv("NEXT_PUBLIC_APP_ENV", env)
      expect(robots()).toEqual({ rules: { userAgent: "*", disallow: "/" } })
    }
  })

  it("allows indexing on production, except private areas", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "production")
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://site.test/")
    const r = robots()
    expect(r.rules).toMatchObject({ userAgent: "*", allow: "/" })
    expect(r.sitemap).toBe("https://site.test/sitemap.xml")
  })
})
