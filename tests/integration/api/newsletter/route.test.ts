/**
 * Integration: newsletter route + real rate limiter (lib/rate-limit) with the
 * database and email provider faked.
 */
import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { prismaMock, sendNewsletterWelcome } = vi.hoisted(() => ({
  prismaMock: {
    newsletter: { findUnique: vi.fn(), create: vi.fn() },
    $queryRaw: vi.fn(),
  },
  sendNewsletterWelcome: vi.fn(),
}))
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }))
vi.mock("@/lib/email", () => ({ sendNewsletterWelcome }))

import { POST } from "@/app/api/newsletter/route"

const subscribe = (body: unknown, headers: Record<string, string> = {}) =>
  new NextRequest("https://example.com/api/newsletter", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  })

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv("CONTACT_IP_HEADER", "x-real-ip")
  prismaMock.$queryRaw.mockResolvedValue([{ count: 1, expiresAt: new Date(Date.now() + 3_600_000) }])
})

describe("POST /api/newsletter", () => {
  it.each([
    [{}, "Email is required"],
    [{ email: 42 }, "Email is required"],
    [{ email: "not-an-email" }, "Invalid email address"],
    [{ email: `${"a".repeat(250)}@x.co` }, "Invalid email address"],
  ])("rejects %j", async (body, error) => {
    const res = await POST(subscribe(body))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe(error)
    expect(prismaMock.newsletter.create).not.toHaveBeenCalled()
  })

  it("rate limits by trusted client ip", async () => {
    prismaMock.$queryRaw.mockResolvedValue([{ count: 11, expiresAt: new Date(Date.now() + 60_000) }])
    const res = await POST(subscribe({ email: "a@b.co" }, { "x-real-ip": "203.0.113.5" }))
    expect(res.status).toBe(429)
  })

  it("does not resubscribe an existing email", async () => {
    prismaMock.newsletter.findUnique.mockResolvedValue({ id: "n1" })
    const res = await POST(subscribe({ email: "a@b.co" }, { "x-real-ip": "203.0.113.5" }))
    expect(await res.json()).toEqual({ success: true, message: "You're already subscribed!" })
    expect(sendNewsletterWelcome).not.toHaveBeenCalled()
  })

  it("stores the subscriber and sends a welcome email", async () => {
    prismaMock.newsletter.findUnique.mockResolvedValue(null)
    const res = await POST(subscribe({ email: "new@b.co" }))
    expect(await res.json()).toEqual({ success: true, message: "Subscribed successfully!" })
    expect(prismaMock.newsletter.create).toHaveBeenCalledWith({ data: { email: "new@b.co" } })
    expect(sendNewsletterWelcome).toHaveBeenCalledWith("new@b.co")
  })

  it("returns 500 for malformed json", async () => {
    expect((await POST(subscribe("{"))).status).toBe(500)
  })
})
