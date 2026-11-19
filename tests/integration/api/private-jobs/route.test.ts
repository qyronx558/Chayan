import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { auth, prismaMock, writeAuditLog, syncFeed } = vi.hoisted(() => ({
  auth: vi.fn(),
  prismaMock: {
    privateJob: { findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn(), groupBy: vi.fn(), updateMany: vi.fn() },
    privateJobFeed: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    company: { findMany: vi.fn(), upsert: vi.fn(), findUnique: vi.fn(), count: vi.fn().mockResolvedValue(0) },
    privateFeedCandidate: { findMany: vi.fn(), groupBy: vi.fn(), createMany: vi.fn(), updateMany: vi.fn(), update: vi.fn() },
    $queryRaw: vi.fn(),
  },
  writeAuditLog: vi.fn(),
  syncFeed: vi.fn(),
}))
vi.mock("@/lib/auth", () => ({ auth }))
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }))
vi.mock("@/lib/moderation", () => ({ writeAuditLog, defaultModerationForRole: () => "APPROVED" }))
vi.mock("@/lib/cache", () => ({
  publicApiResponse: (body: unknown) => Response.json(body),
  noStoreResponse: (body: unknown) => Response.json(body),
  revalidatePublicContent: vi.fn(),
}))
vi.mock("@/lib/private-jobs/logo", () => ({ scheduleLogoLookup: vi.fn(), fillMissingLogos: async () => ({ checked: 0, found: 0, results: [] }) }))
vi.mock("@/lib/private-jobs/feed-sync", async (orig) => ({
  ...(await orig<typeof import("@/lib/private-jobs/feed-sync")>()),
  syncFeed,
}))

import { GET as LIST } from "@/app/api/private-jobs/route"
import { GET as ONE } from "@/app/api/private-jobs/[id]/route"
import { GET as FILTERS } from "@/app/api/private-jobs/filters/route"
import { GET as FEEDS_GET, POST as FEEDS_POST } from "@/app/api/admin/private-feeds/route"
import { DELETE as FEED_DELETE, PATCH as FEED_PATCH, POST as FEED_RUN } from "@/app/api/admin/private-feeds/[id]/route"
import { GET as CRON } from "@/app/api/cron/private-feeds/route"
import { GET as HIGHLIGHTS } from "@/app/api/private-jobs/highlights/route"
import { GET as CITIES } from "@/app/api/private-jobs/cities/route"
import { GET as DISCOVER_GET, POST as DISCOVER_POST } from "@/app/api/admin/private-feeds/discover/route"

const req = (path: string, method = "GET", body?: unknown, headers: Record<string, string> = {}) =>
  new NextRequest(`https://chayanjobs.test${path}`, {
    method,
    headers: { "content-type": "application/json", ...headers },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
const params = (id: string) => ({ params: Promise.resolve({ id }) })
const superAdmin = { user: { id: "u1", role: "SUPER_ADMIN", email: "s@x.test" } }

beforeEach(() => {
  vi.resetAllMocks()
  prismaMock.privateJob.findMany.mockResolvedValue([])
  prismaMock.privateJob.count.mockResolvedValue(0)
  prismaMock.privateFeedCandidate.findMany.mockResolvedValue([])
})

describe("GET /api/private-jobs (public)", () => {
  it("shows only approved, live postings by default", async () => {
    await LIST(req("/api/private-jobs"))
    const where = prismaMock.privateJob.findMany.mock.calls[0][0].where
    expect(where).toMatchObject({ moderation: "APPROVED", status: "ACTIVE" })
  })

  it("honours an explicit status, and status=all lifts the filter", async () => {
    await LIST(req("/api/private-jobs?status=EXPIRED"))
    expect(prismaMock.privateJob.findMany.mock.calls[0][0].where.status).toBe("EXPIRED")
    await LIST(req("/api/private-jobs?status=all"))
    expect(prismaMock.privateJob.findMany.mock.calls[1][0].where.status).toBeUndefined()
  })

  it("adds the experience filter without dropping other AND conditions", async () => {
    await LIST(req("/api/private-jobs?exp=3"))
    const where = prismaMock.privateJob.findMany.mock.calls[0][0].where
    expect(where.AND).toEqual([{ OR: [{ expMax: null }, { expMax: { gte: 3 } }] }])
  })
})

describe("GET /api/private-jobs/[id]", () => {
  it("hides unreviewed postings from visitors but not from staff", async () => {
    prismaMock.privateJob.findUnique.mockResolvedValue({ id: "j1", moderation: "PENDING" })
    auth.mockResolvedValue(null)
    expect((await ONE(req("/api/private-jobs/j1"), params("j1"))).status).toBe(404)
    auth.mockResolvedValue(superAdmin)
    expect((await ONE(req("/api/private-jobs/j1"), params("j1"))).status).toBe(200)
  })
})

describe("GET /api/private-jobs/filters", () => {
  it("aggregates in the database and returns facet lists", async () => {
    prismaMock.company.findMany.mockResolvedValue([{ id: "c1", name: "Acme", verifiedStatus: "VERIFIED" }])
    prismaMock.$queryRaw
      .mockResolvedValueOnce([{ v: "Pune" }, { v: "Bengaluru" }])
      .mockResolvedValueOnce([{ v: "Engineering" }])
      .mockResolvedValueOnce([{ v: "React" }, { v: "SQL" }])
      .mockResolvedValueOnce([{ v: "US", n: BigInt(3) }, { v: "IN", n: BigInt(9) }])
    prismaMock.privateJob.groupBy
      .mockResolvedValueOnce([{ type: "FULL_TIME" }])
      .mockResolvedValueOnce([{ remotePolicy: "REMOTE" }])
    const json = await (await FILTERS()).json()
    expect(json.data).toEqual({
      companies: [{ id: "c1", name: "Acme", verifiedStatus: "VERIFIED" }],
      locations: ["Bengaluru", "Pune"],
      types: ["FULL_TIME"],
      remotes: ["REMOTE"],
      skills: ["React", "SQL"],
      categories: ["Engineering"],
      countries: [
        { code: "IN", name: "India", count: 9 },
        { code: "US", name: "United States", count: 3 },
      ],
    })
    expect(prismaMock.privateJob.findMany).not.toHaveBeenCalled()
  })
})

describe("admin job feeds", () => {
  it("are super-admin only", async () => {
    auth.mockResolvedValue({ user: { id: "a", role: "ADMIN" } })
    expect((await FEEDS_GET()).status).toBe(403)
    expect((await FEEDS_POST(req("/api/admin/private-feeds", "POST", {}))).status).toBe(403)
    expect((await FEED_RUN(req("/api/admin/private-feeds/f1", "POST"), params("f1"))).status).toBe(403)
    auth.mockResolvedValue(null)
    expect((await FEED_DELETE(req("/api/admin/private-feeds/f1", "DELETE"), params("f1"))).status).toBe(401)
  })

  it("lists feeds with live / closed counts", async () => {
    auth.mockResolvedValue(superAdmin)
    prismaMock.privateJobFeed.findMany.mockResolvedValue([
      { id: "f1", provider: "LEVER", boardToken: "acme", company: { id: "c1", name: "Acme" } },
    ])
    prismaMock.privateJob.groupBy.mockResolvedValue([
      { feedId: "f1", status: "ACTIVE", _count: { _all: 7 } },
      { feedId: "f1", status: "EXPIRED", _count: { _all: 2 } },
    ])
    const json = await (await FEEDS_GET()).json()
    expect(json.data[0]).toMatchObject({ boardUrl: "https://jobs.lever.co/acme", jobs: { active: 7, expired: 2 } })
  })

  it("checks the board live before saving it", async () => {
    auth.mockResolvedValue(superAdmin)
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json([
        { id: "p1", text: "Engineer", hostedUrl: "https://jobs.lever.co/acme/p1", categories: { location: "Pune" } },
        { id: "p2", text: "Engineer", hostedUrl: "https://jobs.lever.co/acme/p2", categories: { location: "Berlin" } },
      ])
    )
    prismaMock.privateJobFeed.findUnique.mockResolvedValue(null)
    prismaMock.company.findUnique.mockResolvedValue(null)
    prismaMock.company.upsert.mockResolvedValue({ id: "c1", name: "Acme" })
    prismaMock.privateJobFeed.create.mockResolvedValue({ id: "f1" })
    const res = await FEEDS_POST(req("/api/admin/private-feeds", "POST", { provider: "LEVER", board: "https://jobs.lever.co/acme", companyName: "Acme" }))
    expect(res.status).toBe(201)
    expect((await res.json()).preview).toMatchObject({ fetched: 2, inScope: 1, provider: "LEVER" })
    expect(fetchSpy.mock.calls[0][0]).toBe("https://api.lever.co/v0/postings/acme?mode=json")
    expect(prismaMock.privateJobFeed.create.mock.calls[0][0].data).toMatchObject({ provider: "LEVER", boardToken: "acme", companyId: "c1", indiaOnly: true, createdById: "u1" })

    fetchSpy.mockResolvedValue(new Response("", { status: 404 }))
    const bad = await FEEDS_POST(req("/api/admin/private-feeds", "POST", { provider: "LEVER", board: "nobody", companyName: "X" }))
    expect(bad.status).toBe(400)
    expect((await bad.json()).error).toMatch(/Board not found/)
    fetchSpy.mockRestore()
  })

  it("rejects board input that is not a token or a board URL", async () => {
    auth.mockResolvedValue(superAdmin)
    const res = await FEEDS_POST(req("/api/admin/private-feeds", "POST", { provider: "GREENHOUSE", board: "https://evil.test/x y", companyName: "Acme" }))
    expect(res.status).toBe(400)
  })

  it("runs a feed, passing force only when asked", async () => {
    auth.mockResolvedValue(superAdmin)
    syncFeed.mockResolvedValue({ feedId: "f1", status: "OK", message: null, stats: {} })
    await FEED_RUN(req("/api/admin/private-feeds/f1", "POST"), params("f1"))
    expect(syncFeed).toHaveBeenLastCalledWith("f1", { force: false })
    await FEED_RUN(req("/api/admin/private-feeds/f1?force=1", "POST"), params("f1"))
    expect(syncFeed).toHaveBeenLastCalledWith("f1", { force: true })
    expect(writeAuditLog).toHaveBeenCalledTimes(1)
  })

  it("toggles and deletes, closing live jobs only on request", async () => {
    auth.mockResolvedValue(superAdmin)
    prismaMock.privateJobFeed.update.mockResolvedValue({ id: "f1", enabled: false })
    expect((await FEED_PATCH(req("/api/admin/private-feeds/f1", "PATCH", { enabled: false }), params("f1"))).status).toBe(200)
    expect((await FEED_PATCH(req("/api/admin/private-feeds/f1", "PATCH", {}), params("f1"))).status).toBe(400)

    prismaMock.privateJobFeed.findUnique.mockResolvedValue({ id: "f1", provider: "LEVER", boardToken: "acme" })
    prismaMock.privateJob.updateMany.mockResolvedValue({ count: 5 })
    await FEED_DELETE(req("/api/admin/private-feeds/f1", "DELETE"), params("f1"))
    expect(prismaMock.privateJob.updateMany).not.toHaveBeenCalled()
    const json = await (await FEED_DELETE(req("/api/admin/private-feeds/f1?closeJobs=1", "DELETE"), params("f1"))).json()
    expect(json).toEqual({ success: true, closed: 5 })
    expect(prismaMock.privateJobFeed.delete).toHaveBeenCalledTimes(2)
  })
})

describe("GET /api/cron/private-feeds", () => {
  it("requires CRON_SECRET", async () => {
    // Independent of the developer's .env: unconfigured → 500, wrong / missing token → 401.
    vi.stubEnv("CRON_SECRET", "")
    expect((await CRON(req("/api/cron/private-feeds"))).status).toBe(500)
    vi.stubEnv("CRON_SECRET", "cron-secret")
    expect((await CRON(req("/api/cron/private-feeds"))).status).toBe(401)
    expect((await CRON(req("/api/cron/private-feeds", "GET", undefined, { authorization: "Bearer wrong" }))).status).toBe(401)
    expect(prismaMock.privateJobFeed.findMany).not.toHaveBeenCalled()
  })

  it("runs due feeds and reports totals", async () => {
    vi.stubEnv("CRON_SECRET", "cron-secret")
    prismaMock.privateJobFeed.findMany.mockResolvedValue([{ id: "f1" }, { id: "f2" }])
    // syncFeed is mocked at module level, but runDueFeeds calls the real one inside the module,
    // so feed lookups fail and are reported as errors without throwing.
    prismaMock.privateJobFeed.findUnique.mockResolvedValue(null)
    const json = await (await CRON(req("/api/cron/private-feeds", "GET", undefined, { authorization: "Bearer cron-secret" }))).json()
    expect(json).toMatchObject({ success: true, feeds: 2, remaining: 0, problems: 2 })
    expect(prismaMock.privateJobFeed.findMany.mock.calls[0][0].where.enabled).toBe(true)
  })
})

describe("private jobs highlights", () => {
  it("turns the aggregate rows into plain numbers for the Discover panel", async () => {
    prismaMock.$queryRaw
      .mockResolvedValueOnce([{ live: BigInt(120), today: BigInt(9), week: BigInt(40), companies: BigInt(15), remote: BigInt(22), fresher: BigInt(8), intern: BigInt(3), walkin: BigInt(0), high: BigInt(30) }])
      .mockResolvedValueOnce([{ id: "c1", name: "Acme", slug: "acme", logo: null, verifiedStatus: "VERIFIED", open: BigInt(12), fresh: BigInt(4) }])
      .mockResolvedValueOnce([{ v: "React", n: BigInt(18) }])
    const res = await HIGHLIGHTS()
    expect(res.status).toBe(200)
    const { data } = await res.json()
    expect(data.pulse).toEqual({ live: 120, today: 9, week: 40, companies: 15 })
    expect(data.tiles).toEqual({ remote: 22, fresher: 8, internship: 3, walkin: 0, highSalary: 30 })
    expect(data.companies[0]).toMatchObject({ name: "Acme", open: 12, fresh: 4 })
    expect(data.skills).toEqual([{ name: "React", count: 18 }])
  })
})

describe("international jobs", () => {
  it("filters the list by country and city", async () => {
    await LIST(req("/api/private-jobs?country=DE&city=Berlin"))
    expect(prismaMock.privateJob.findMany.mock.calls[0][0].where).toMatchObject({ country: "DE", city: "Berlin" })
  })

  it("lists the cities of one country", async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([{ v: "Berlin", n: BigInt(4) }, { v: "Munich", n: BigInt(2) }])
    const json = await (await CITIES(req("/api/private-jobs/cities?country=DE"))).json()
    expect(json.data).toEqual([
      { name: "Berlin", count: 4 },
      { name: "Munich", count: 2 },
    ])
    expect((await CITIES(req("/api/private-jobs/cities"))).status).toBe(400)
  })

  it("keeps job-board discovery super-admin only", async () => {
    auth.mockResolvedValue({ user: { id: "a", role: "ADMIN" } })
    expect((await DISCOVER_GET()).status).toBe(403)
    expect((await DISCOVER_POST(req("/api/admin/private-feeds/discover", "POST", { names: "Acme" }))).status).toBe(403)
  })

  it("queues pasted company names for discovery", async () => {
    auth.mockResolvedValue(superAdmin)
    prismaMock.privateFeedCandidate.createMany.mockResolvedValue({ count: 2 })
    const res = await DISCOVER_POST(req("/api/admin/private-feeds/discover", "POST", { names: "Acme\nGlobex | globex.com\nacme" }))
    const json = await res.json()
    expect(json).toMatchObject({ success: true, queued: 2, skipped: 0 })
    const rows = prismaMock.privateFeedCandidate.createMany.mock.calls[0][0].data
    expect(rows).toEqual([
      expect.objectContaining({ name: "Acme", website: null, indiaOnly: false }),
      expect.objectContaining({ name: "Globex", website: "globex.com" }),
    ])
  })
})
