import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { auth, prismaMock } = vi.hoisted(() => ({
  auth: vi.fn(),
  prismaMock: {
    privateJob: { findMany: vi.fn() },
    privateApplication: { findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
  },
}))
vi.mock("@/lib/auth", () => ({ auth }))
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }))

import { POST } from "@/app/api/private-applications/applied/route"

const req = (body: unknown) =>
  new NextRequest("https://chayanjobs.test/api/private-applications/applied", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })

beforeEach(() => {
  vi.resetAllMocks()
  auth.mockResolvedValue({ user: { id: "u1" } })
  prismaMock.privateJob.findMany.mockResolvedValue([{ id: "j1" }, { id: "j2" }, { id: "j3" }])
  prismaMock.privateApplication.create.mockImplementation(async ({ data }) => ({ ...data, id: "a" }))
  prismaMock.privateApplication.update.mockImplementation(async ({ data }) => ({ status: "applied", appliedAt: data.appliedAt, ...data }))
})

describe("POST /api/private-applications/applied", () => {
  it("needs a signed-in candidate", async () => {
    auth.mockResolvedValue(null)
    expect((await POST(req({ items: [{ privateJobId: "j1" }] }))).status).toBe(401)
  })

  it("rejects an empty list", async () => {
    expect((await POST(req({ items: [] }))).status).toBe(400)
  })

  it("creates Applied records, promotes Saved, never moves later stages back", async () => {
    const earlier = new Date("2026-11-01T10:00:00Z")
    prismaMock.privateApplication.findMany.mockResolvedValue([
      { id: "a2", privateJobId: "j2", status: "saved", appliedAt: null, source: null },
      { id: "a3", privateJobId: "j3", status: "interview", appliedAt: earlier, source: "manual" },
    ])
    const res = await POST(req({ items: [{ privateJobId: "j1" }, { privateJobId: "j2" }, { privateJobId: "j3" }, { privateJobId: "gone" }] }))
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(prismaMock.privateApplication.create).toHaveBeenCalledTimes(1)
    expect(prismaMock.privateApplication.create.mock.calls[0][0].data).toMatchObject({ userId: "u1", privateJobId: "j1", status: "applied", source: "apply_click" })
    expect(prismaMock.privateApplication.update).toHaveBeenCalledTimes(1)
    expect(prismaMock.privateApplication.update.mock.calls[0][0]).toMatchObject({ where: { id: "a2" }, data: { status: "applied" } })
    const j3 = json.data.find((d: { privateJobId: string }) => d.privateJobId === "j3")
    expect(j3.status).toBe("interview")
    expect(json.data.some((d: { privateJobId: string }) => d.privateJobId === "gone")).toBe(false)
  })

  it("imports device history with its original time, clamping future clocks", async () => {
    prismaMock.privateApplication.findMany.mockResolvedValue([])
    await POST(req({ source: "import", items: [{ privateJobId: "j1", appliedAt: "2026-10-01T00:00:00Z" }, { privateJobId: "j2", appliedAt: "2999-01-01T00:00:00Z" }] }))
    const calls = prismaMock.privateApplication.create.mock.calls.map((c) => c[0].data)
    expect(calls[0]).toMatchObject({ privateJobId: "j1", source: "import", appliedAt: new Date("2026-10-01T00:00:00Z") })
    expect((calls[1].appliedAt as Date).getTime()).toBeLessThanOrEqual(Date.now())
  })
})
