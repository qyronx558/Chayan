import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { auth, prismaMock, revalidatePath } = vi.hoisted(() => ({
  auth: vi.fn(),
  revalidatePath: vi.fn(),
  prismaMock: {
    state: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    district: { count: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    job: { groupBy: vi.fn(), count: vi.fn() },
  },
}))
vi.mock("@/lib/auth", () => ({ auth }))
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }))
vi.mock("next/cache", () => ({ revalidatePath }))
vi.mock("@/lib/moderation", () => ({ staffAudit: vi.fn() }))

import { GET, POST } from "@/app/api/states/route"
import { DELETE as DELETE_STATE, PUT as PUT_STATE } from "@/app/api/states/[slug]/route"
import { GET as GET_DISTRICTS, POST as POST_DISTRICT } from "@/app/api/states/[slug]/districts/route"
import { DELETE as DELETE_DISTRICT } from "@/app/api/districts/[id]/route"
import { INDIAN_STATES_28 } from "@/lib/states"

const req = (url: string, init?: { method?: string; body?: unknown }) =>
  new NextRequest(`https://example.com${url}`, {
    method: init?.method ?? "GET",
    headers: { "content-type": "application/json" },
    ...(init?.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
  })
const ctx = <T extends Record<string, string>>(p: T) => ({ params: Promise.resolve(p) })
const asRole = (role: string | null) => auth.mockResolvedValue(role ? { user: { id: "u1", email: "a@b.co", role } } : null)

beforeEach(() => {
  vi.clearAllMocks()
})

describe("GET /api/states", () => {
  it("lists seeded states/UTs with district counts", async () => {
    prismaMock.district.count.mockResolvedValue(781)
    prismaMock.state.findMany.mockResolvedValue([
      { id: "s1", name: "Bihar", slug: "bihar", type: "STATE", _count: { districts: 38 } },
    ])
    const res = await GET(req("/api/states"))
    expect(await res.json()).toEqual({
      success: true,
      data: [{ id: "s1", name: "Bihar", slug: "bihar", type: "STATE", districtCount: 38 }],
    })
    expect(prismaMock.state.findMany.mock.calls[0][0].where).toEqual({ districts: { some: {} } })
    expect(res.headers.get("cache-control")).toContain("s-maxage")
  })

  it("falls back to the 28 states before the location seed runs", async () => {
    prismaMock.district.count.mockResolvedValue(0)
    prismaMock.state.findMany.mockResolvedValue([])
    await GET(req("/api/states"))
    expect(prismaMock.state.findMany.mock.calls[0][0].where).toEqual({ name: { in: [...INDIAN_STATES_28] } })
  })

  it("adds live job counts on request", async () => {
    prismaMock.district.count.mockResolvedValue(1)
    prismaMock.state.findMany.mockResolvedValue([{ id: "s1", name: "Goa", slug: "goa", type: "STATE", _count: { districts: 2 } }])
    prismaMock.job.groupBy.mockResolvedValue([{ stateId: "s1", _count: { _all: 4 } }])
    const body = await (await GET(req("/api/states?withJobCounts=1"))).json()
    expect(body.data[0].activeJobCount).toBe(4)
  })

  it("only super admins may list every row (?all=1)", async () => {
    asRole("ADMIN")
    expect((await GET(req("/api/states?all=1"))).status).toBe(403)
    asRole("SUPER_ADMIN")
    prismaMock.state.findMany.mockResolvedValue([])
    expect((await GET(req("/api/states?all=1"))).status).toBe(200)
    expect(prismaMock.state.findMany.mock.calls[0][0].where).toEqual({})
  })

  it("returns 500 on database errors", async () => {
    prismaMock.district.count.mockRejectedValue(new Error("offline"))
    const res = await GET(req("/api/states"))
    expect(res.status).toBe(500)
    expect((await res.json()).success).toBe(false)
  })
})

describe("location writes are super-admin only", () => {
  it.each([
    ["POST /api/states", () => POST(req("/api/states", { method: "POST", body: { name: "Goa" } }))],
    ["PUT /api/states/goa", () => PUT_STATE(req("/api/states/goa", { method: "PUT", body: { name: "Goa" } }), ctx({ slug: "goa" }))],
    ["DELETE /api/states/goa", () => DELETE_STATE(req("/api/states/goa", { method: "DELETE" }), ctx({ slug: "goa" }))],
    ["POST district", () => POST_DISTRICT(req("/api/states/goa/districts", { method: "POST", body: { name: "North Goa" } }), ctx({ slug: "goa" }))],
    ["DELETE district", () => DELETE_DISTRICT(req("/api/districts/d1", { method: "DELETE" }), ctx({ id: "d1" }))],
  ])("%s → 403 for ADMIN, 401 when signed out", async (_name, call) => {
    asRole("ADMIN")
    expect((await call()).status).toBe(403)
    asRole(null)
    expect((await call()).status).toBe(401)
    expect(prismaMock.state.create).not.toHaveBeenCalled()
    expect(prismaMock.district.create).not.toHaveBeenCalled()
  })

  it("super admin creates a state with a generated slug", async () => {
    asRole("SUPER_ADMIN")
    prismaMock.state.create.mockImplementation(async ({ data }: { data: object }) => ({ id: "s9", ...data }))
    const res = await POST(req("/api/states", { method: "POST", body: { name: "Jammu & Kashmir", type: "UNION_TERRITORY" } }))
    expect(res.status).toBe(201)
    expect(prismaMock.state.create).toHaveBeenCalledWith({
      data: { name: "Jammu & Kashmir", slug: "jammu-and-kashmir", type: "UNION_TERRITORY" },
    })
    expect(revalidatePath).toHaveBeenCalledWith("/jobs/states")
  })

  it("duplicate names become a 409", async () => {
    asRole("SUPER_ADMIN")
    prismaMock.state.findFirst.mockResolvedValue({ id: "s1", name: "Goa", slug: "goa", type: "STATE" })
    prismaMock.district.create.mockRejectedValue(Object.assign(new Error("dup"), { code: "P2002", meta: { target: ["stateId", "name"] } }))
    const res = await POST_DISTRICT(req("/api/states/goa/districts", { method: "POST", body: { name: "North Goa" } }), ctx({ slug: "goa" }))
    expect(res.status).toBe(409)
    expect((await res.json()).error).toMatch(/already exists in this state/)
  })

  it("refuses to delete a state that still has districts or jobs", async () => {
    asRole("SUPER_ADMIN")
    prismaMock.state.findFirst.mockResolvedValue({ id: "s1", name: "Goa", slug: "goa", type: "STATE" })
    prismaMock.job.count.mockResolvedValue(2)
    prismaMock.district.count.mockResolvedValue(3)
    const res = await DELETE_STATE(req("/api/states/goa", { method: "DELETE" }), ctx({ slug: "goa" }))
    expect(res.status).toBe(409)
    expect(prismaMock.state.delete).not.toHaveBeenCalled()
  })

  it("refuses to delete a district used by jobs", async () => {
    asRole("SUPER_ADMIN")
    prismaMock.district.findUnique.mockResolvedValue({ id: "d1", name: "North Goa", state: { name: "Goa" } })
    prismaMock.job.count.mockResolvedValue(1)
    const res = await DELETE_DISTRICT(req("/api/districts/d1", { method: "DELETE" }), ctx({ id: "d1" }))
    expect(res.status).toBe(409)
    expect(prismaMock.district.delete).not.toHaveBeenCalled()
  })
})

describe("GET /api/states/[slug]/districts", () => {
  it("lists districts for a state by slug", async () => {
    prismaMock.state.findFirst.mockResolvedValue({ id: "s1", name: "Goa", slug: "goa", type: "STATE" })
    prismaMock.district.findMany.mockResolvedValue([{ id: "d1", name: "North Goa", slug: "north-goa", stateId: "s1" }])
    const res = await GET_DISTRICTS(req("/api/states/goa/districts"), ctx({ slug: "goa" }))
    const body = await res.json()
    expect(body.data).toEqual([{ id: "d1", name: "North Goa", slug: "north-goa", stateId: "s1" }])
    expect(prismaMock.state.findFirst.mock.calls[0][0].where).toEqual({ OR: [{ slug: "goa" }, { id: "goa" }] })
  })

  it("404s for an unknown state", async () => {
    prismaMock.state.findFirst.mockResolvedValue(null)
    const res = await GET_DISTRICTS(req("/api/states/atlantis/districts"), ctx({ slug: "atlantis" }))
    expect(res.status).toBe(404)
  })
})
