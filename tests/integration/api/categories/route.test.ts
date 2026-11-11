import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { auth, prismaMock } = vi.hoisted(() => ({
  auth: vi.fn(),
  prismaMock: { category: { findMany: vi.fn(), create: vi.fn() } },
}))
vi.mock("@/lib/auth", () => ({ auth }))
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }))

import { GET, POST } from "@/app/api/categories/route"

const post = (body: unknown) =>
  new NextRequest("https://example.com/api/categories", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })

beforeEach(() => {
  vi.clearAllMocks()
})

describe("GET /api/categories", () => {
  it("lists categories sorted by name", async () => {
    prismaMock.category.findMany.mockResolvedValue([{ id: "c1", name: "Banking" }])
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true, data: [{ id: "c1", name: "Banking" }] })
    expect(prismaMock.category.findMany.mock.calls[0][0].orderBy).toEqual({ name: "asc" })
  })

  it("returns 500 when the database fails", async () => {
    prismaMock.category.findMany.mockImplementation(async () => {
      throw new Error("db down")
    })
    const res = await GET()
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ success: false, error: "db down" })
  })
})

describe("POST /api/categories", () => {
  it("requires a signed-in admin", async () => {
    auth.mockResolvedValue(null)
    expect((await POST(post({}))).status).toBe(401)
    auth.mockResolvedValue({ user: { role: "USER" } })
    expect((await POST(post({}))).status).toBe(403)
    expect(prismaMock.category.create).not.toHaveBeenCalled()
  })

  it("validates the body", async () => {
    auth.mockResolvedValue({ user: { role: "ADMIN" } })
    const res = await POST(post({ name: "", slug: "x" }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe("Name is required")
  })

  it("creates a category", async () => {
    auth.mockResolvedValue({ user: { role: "SUPER_ADMIN" } })
    prismaMock.category.create.mockImplementation(async ({ data }) => ({ id: "new", ...data }))
    const res = await POST(post({ name: "Railway", slug: "railway" }))
    expect(res.status).toBe(201)
    expect((await res.json()).data).toMatchObject({ id: "new", name: "Railway", slug: "railway" })
  })
})
