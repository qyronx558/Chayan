import { describe, expect, it, vi } from "vitest"

// next-auth's auth(handler) wraps the handler; for the test we call it directly.
vi.mock("@/lib/auth", () => ({ auth: (handler: unknown) => handler }))

import middleware, { config } from "../../middleware"

type Handler = (req: unknown) => Response
const run = (pathname: string, role?: string) =>
  (middleware as unknown as Handler)({
    nextUrl: { pathname },
    url: `https://example.com${pathname}`,
    auth: role ? { user: { role } } : null,
  })

const redirect = (res: Response) => res.headers.get("location")

describe("middleware", () => {
  it("sends anonymous visitors of admin pages to login", () => {
    expect(redirect(run("/admin/jobs"))).toBe("https://example.com/login")
  })

  it("sends non-admin users away from admin pages", () => {
    expect(redirect(run("/admin", "USER"))).toBe("https://example.com/")
  })

  it("lets admins into admin pages", () => {
    expect(redirect(run("/admin", "ADMIN"))).toBeNull()
    expect(redirect(run("/admin", "SUPER_ADMIN"))).toBeNull()
  })

  it("protects user pages", () => {
    for (const path of ["/profile", "/bookmarks", "/applications/1"]) {
      expect(redirect(run(path))).toBe("https://example.com/login")
      expect(redirect(run(path, "USER"))).toBeNull()
    }
  })

  it("sends signed-in users away from login and register", () => {
    expect(redirect(run("/login", "USER"))).toBe("https://example.com/")
    expect(redirect(run("/register", "USER"))).toBe("https://example.com/")
    expect(redirect(run("/login"))).toBeNull()
  })

  it("only runs on the protected routes", () => {
    expect(config.matcher).toContain("/admin/:path*")
    expect(config.matcher).toContain("/login")
  })
})
