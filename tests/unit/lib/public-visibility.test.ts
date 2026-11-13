import { beforeEach, describe, expect, it, vi } from "vitest"

const { auth } = vi.hoisted(() => ({ auth: vi.fn() }))
vi.mock("@/lib/auth", () => ({ auth }))

import { canViewContent, robotsFor } from "@/lib/public-visibility"

beforeEach(() => vi.clearAllMocks())

describe("canViewContent", () => {
  it("shows approved content to everyone without touching the session", async () => {
    expect(await canViewContent("APPROVED")).toBe(true)
    expect(auth).not.toHaveBeenCalled()
  })
  it("hides pending / rejected content from visitors and crawlers", async () => {
    auth.mockResolvedValue(null)
    expect(await canViewContent("PENDING")).toBe(false)
    auth.mockResolvedValue({ user: { role: "USER" } })
    expect(await canViewContent("REJECTED")).toBe(false)
  })
  it("lets staff preview before approving", async () => {
    auth.mockResolvedValue({ user: { role: "ADMIN" } })
    expect(await canViewContent("PENDING")).toBe(true)
  })
  it("fails closed if the session lookup throws", async () => {
    auth.mockRejectedValue(new Error("db down"))
    expect(await canViewContent("PENDING")).toBe(false)
  })
})

describe("robotsFor", () => {
  it("indexes only approved, non-thin pages", () => {
    expect(robotsFor("APPROVED")).toBeUndefined()
    expect(robotsFor("APPROVED", true)).toEqual({ index: false, follow: true })
    expect(robotsFor("PENDING")).toEqual({ index: false, follow: true })
  })
})
