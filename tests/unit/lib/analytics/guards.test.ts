import { beforeEach, describe, expect, it, vi } from "vitest"

const auth = vi.hoisted(() => vi.fn())
vi.mock("@/lib/auth", () => ({ auth }))

import { cached, cacheHeaders, requireStaff, requireSuperAdmin } from "@/lib/analytics/guards"

beforeEach(() => {
  auth.mockReset()
})

describe("requireSuperAdmin", () => {
  it("rejects anonymous users with 401 and admins with 403", async () => {
    auth.mockResolvedValue(null)
    expect((await requireSuperAdmin()).error?.status).toBe(401)
    auth.mockResolvedValue({ user: { role: "ADMIN" } })
    expect((await requireSuperAdmin()).error?.status).toBe(403)
  })

  it("lets super admins through", async () => {
    const session = { user: { role: "SUPER_ADMIN" } }
    auth.mockResolvedValue(session)
    expect(await requireSuperAdmin()).toEqual({ error: null, session })
  })
})

describe("requireStaff", () => {
  it("allows admins and super admins only", async () => {
    auth.mockResolvedValue(null)
    expect((await requireStaff()).error?.status).toBe(401)
    auth.mockResolvedValue({ user: { role: "USER" } })
    expect((await requireStaff()).error?.status).toBe(403)
    auth.mockResolvedValue({ user: { role: "ADMIN" } })
    expect((await requireStaff()).error).toBeNull()
  })
})

describe("cached", () => {
  it("reuses a value within the ttl and rebuilds after it", async () => {
    vi.useFakeTimers()
    const build = vi.fn(async () => Math.random())
    const key = `k-${Math.random()}`
    const first = await cached(key, 1000, build)
    expect(await cached(key, 1000, build)).toBe(first)
    expect(build).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(1001)
    await cached(key, 1000, build)
    expect(build).toHaveBeenCalledTimes(2)
    vi.useRealTimers()
  })

  it("sends private cache headers", () => {
    expect(cacheHeaders()["Cache-Control"]).toMatch(/^private/)
  })
})
