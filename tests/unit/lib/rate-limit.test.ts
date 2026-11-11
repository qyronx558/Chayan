import { beforeEach, describe, expect, it, vi } from "vitest"

const prismaMock = vi.hoisted(() => ({ $queryRaw: vi.fn() }))
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }))

import { clientIp, ipRules, loginRules, rateLimit, TOO_MANY_ATTEMPTS } from "@/lib/rate-limit"

const req = (headers: Record<string, string>) => ({ headers: new Headers(headers) })

beforeEach(() => {
  prismaMock.$queryRaw.mockReset()
})

describe("clientIp", () => {
  it("ignores forwarded headers unless one is trusted", () => {
    vi.stubEnv("CONTACT_IP_HEADER", "")
    vi.stubEnv("VERCEL", "")
    expect(clientIp(req({ "x-forwarded-for": "1.2.3.4" }))).toBeNull()
    expect(clientIp(null)).toBeNull()
  })

  it("reads the configured header and validates the address", () => {
    vi.stubEnv("CONTACT_IP_HEADER", "x-real-ip")
    expect(clientIp(req({ "x-real-ip": "203.0.113.9, 10.0.0.1" }))).toBe("203.0.113.9")
    expect(clientIp(req({ "x-real-ip": "2001:DB8::1" }))).toBe("2001:db8::1")
    expect(clientIp(req({ "x-real-ip": "999.1.1.1" }))).toBeNull()
    expect(clientIp(req({ "x-real-ip": "<script>" }))).toBeNull()
    expect(clientIp(req({}))).toBeNull()
  })

  it("trusts the Vercel header on Vercel", () => {
    vi.stubEnv("CONTACT_IP_HEADER", "")
    vi.stubEnv("VERCEL", "1")
    expect(clientIp(req({ "x-vercel-forwarded-for": "198.51.100.2" }))).toBe("198.51.100.2")
  })
})

describe("rules", () => {
  it("builds login rules with and without an ip", () => {
    expect(loginRules("login", " A@B.com ", null)).toEqual([{ key: "login:email:a@b.com", max: 20, windowSec: 900 }])
    const rules = loginRules("login", "a@b.com", "1.1.1.1")
    expect(rules.map((r) => r.key)).toEqual(["login:pair:a@b.com:1.1.1.1", "login:email:a@b.com", "login:ip:1.1.1.1"])
  })
  it("skips ip rules without an ip", () => {
    expect(ipRules("otp", null, 5, 60)).toEqual([])
    expect(ipRules("otp", "1.1.1.1", 5, 60)).toEqual([{ key: "otp:ip:1.1.1.1", max: 5, windowSec: 60 }])
  })
  it("exposes a friendly message", () => {
    expect(TOO_MANY_ATTEMPTS).toMatch(/Too many attempts/)
  })
})

describe("rateLimit", () => {
  it("allows requests under the cap (database counter)", async () => {
    prismaMock.$queryRaw.mockResolvedValue([{ count: 2, expiresAt: new Date(Date.now() + 60_000) }])
    expect(await rateLimit([{ key: "k", max: 5, windowSec: 60 }])).toEqual({ ok: true, retryAfter: 0 })
  })

  it("blocks over the cap and reports the longest wait", async () => {
    prismaMock.$queryRaw
      .mockResolvedValueOnce([{ count: 6, expiresAt: new Date(Date.now() + 30_000) }])
      .mockResolvedValueOnce([{ count: 99, expiresAt: new Date(Date.now() + 90_000) }])
    const result = await rateLimit([
      { key: "a", max: 5, windowSec: 60 },
      { key: "b", max: 5, windowSec: 120 },
    ])
    expect(result.ok).toBe(false)
    expect(result.retryAfter).toBeGreaterThanOrEqual(89)
    expect(result.retryAfter).toBeLessThanOrEqual(90)
  })

  it("falls back to an in-memory counter when the database is down", async () => {
    prismaMock.$queryRaw.mockImplementation(async () => { throw new Error("db down") })
    const rule = { key: `memory-${Math.random()}`, max: 2, windowSec: 60 }
    expect((await rateLimit([rule])).ok).toBe(true)
    expect((await rateLimit([rule])).ok).toBe(true)
    const third = await rateLimit([rule])
    expect(third.ok).toBe(false)
    expect(third.retryAfter).toBeGreaterThan(0)
  })
})
