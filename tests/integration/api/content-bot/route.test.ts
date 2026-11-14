import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { auth, prismaMock, writeAuditLog } = vi.hoisted(() => ({
  auth: vi.fn(),
  prismaMock: {
    ingestSettings: { findUnique: vi.fn(), upsert: vi.fn() },
    ingestSource: { findMany: vi.fn(), create: vi.fn(), upsert: vi.fn(), update: vi.fn(), delete: vi.fn() },
    ingestItem: { groupBy: vi.fn(), count: vi.fn(), findMany: vi.fn() },
    crawlerRun: { findMany: vi.fn() },
    state: { findUnique: vi.fn() },
    district: { findFirst: vi.fn() },
    $transaction: vi.fn(),
  },
  writeAuditLog: vi.fn(),
}))
vi.mock("@/lib/auth", () => ({ auth }))
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }))
vi.mock("@/lib/moderation", () => ({ writeAuditLog }))
vi.mock("@/lib/ingest/catalog", () => ({
  FILE_SOURCES: [
    { id: "bpsc", name: "Bihar PSC", level: "STATE", adapter: "html-links", url: "https://bpsc.bihar.gov.in/", state: "Bihar" },
    { id: "nic:bihar/patna", name: "District Patna", level: "DISTRICT", adapter: "nic-s3waas", url: "https://patna.nic.in/r/", state: "Bihar", district: "Patna" },
  ],
}))

import { GET as SETTINGS_GET, PATCH as SETTINGS_PATCH } from "@/app/api/admin/content-bot/settings/route"
import { DELETE as SRC_DELETE, GET as SRC_GET, PATCH as SRC_PATCH, POST as SRC_POST } from "@/app/api/admin/content-bot/sources/route"
import { POST as RUN_POST } from "@/app/api/admin/content-bot/run/route"
import { GET as CONFIG } from "@/app/api/cron/ingest/config/route"

const req = (path: string, method = "GET", body?: unknown, headers: Record<string, string> = {}) =>
  new NextRequest(`https://chayanjobs.test${path}`, {
    method,
    headers: { "content-type": "application/json", ...headers },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
const superAdmin = { user: { id: "u1", role: "SUPER_ADMIN" } }
const mpsc = { name: "Maharashtra PSC", level: "STATE", url: "https://mpsc.gov.in/adv", state: "Maharashtra", include: "[.]pdf" }

beforeEach(() => {
  vi.clearAllMocks()
  vi.unstubAllEnvs()
  auth.mockResolvedValue(superAdmin)
  prismaMock.ingestSettings.findUnique.mockResolvedValue(null)
  prismaMock.ingestSettings.upsert.mockImplementation(async ({ create }) => ({ ...create, updatedAt: new Date() }))
  prismaMock.ingestSource.findMany.mockResolvedValue([])
  prismaMock.ingestItem.groupBy.mockResolvedValue([])
  prismaMock.state.findUnique.mockResolvedValue({ id: "st1" })
  prismaMock.$transaction.mockResolvedValue([])
})

describe("access", () => {
  it("is super admin only", async () => {
    auth.mockResolvedValue({ user: { id: "a", role: "ADMIN" } })
    expect((await SETTINGS_GET()).status).toBe(403)
    expect((await SRC_POST(req("/x", "POST", mpsc))).status).toBe(403)
    auth.mockResolvedValue(null)
    expect((await SETTINGS_GET()).status).toBe(401)
  })
})

describe("settings", () => {
  it("returns environment defaults until saved, then saves a patch with an audit entry", async () => {
    vi.stubEnv("INGEST_AUTO_APPROVE", "true")
    const got = await (await SETTINGS_GET()).json()
    expect(got.settings).toMatchObject({ saved: false, autoApprove: true, enabled: true })
    expect(got.environment.runNowConfigured).toBe(false)

    const res = await SETTINGS_PATCH(req("/x", "PATCH", { enabled: false, geminiModel: "gemini-3.5-flash-lite" }))
    expect(res.status).toBe(200)
    const saved = prismaMock.ingestSettings.upsert.mock.calls[0][0].create
    expect(saved).toMatchObject({ id: "default", enabled: false, autoApprove: true, geminiModel: "gemini-3.5-flash-lite", updatedById: "u1" })
    expect(writeAuditLog).toHaveBeenCalledWith(expect.objectContaining({ entity: "IngestSettings" }))
  })
  it("rejects invalid settings", async () => {
    expect((await SETTINGS_PATCH(req("/x", "PATCH", { maxLlmCalls: 0 }))).status).toBe(400)
  })
  it("explains a missing migration", async () => {
    prismaMock.ingestSettings.upsert.mockRejectedValue(Object.assign(new Error("missing"), { code: "P2021" }))
    const res = await SETTINGS_PATCH(req("/x", "PATCH", { enabled: false }))
    expect((await res.json()).error).toMatch(/prisma migrate deploy/)
  })
})

describe("sources", () => {
  it("lists sources with overrides, filters and totals", async () => {
    prismaMock.ingestSource.findMany.mockResolvedValue([{ id: "bpsc", enabled: false, custom: false, def: null }])
    const all = await (await SRC_GET(req("/api/admin/content-bot/sources"))).json()
    expect(all.total).toBe(2)
    expect(all.items.find((s: { id: string }) => s.id === "bpsc").enabled).toBe(false)
    expect(all.totals.find((t: { level: string }) => t.level === "STATE")).toEqual({ level: "STATE", total: 1, enabled: 0 })
    const off = await (await SRC_GET(req("/api/admin/content-bot/sources?status=disabled"))).json()
    expect(off.items.map((s: { id: string }) => s.id)).toEqual(["bpsc"])
  })
  it("switches sources on/off in bulk and refuses unknown ids", async () => {
    expect((await SRC_PATCH(req("/x", "PATCH", { ids: ["bpsc", "nic:bihar/patna"], enabled: false }))).status).toBe(200)
    expect(prismaMock.ingestSource.upsert).toHaveBeenCalledTimes(2)
    expect((await SRC_PATCH(req("/x", "PATCH", { ids: ["nope"], enabled: false }))).status).toBe(400)
  })
  it("adds a custom source after checking domain, location and duplicates", async () => {
    expect((await SRC_POST(req("/x", "POST", mpsc))).status).toBe(200)
    expect(prismaMock.ingestSource.create.mock.calls[0][0].data).toMatchObject({ id: "custom:maharashtra-psc", custom: true })

    expect((await SRC_POST(req("/x", "POST", { ...mpsc, url: "https://www.freejobalert.com/x" }))).status).toBe(400)
    expect((await SRC_POST(req("/x", "POST", { ...mpsc, url: "https://bpsc.bihar.gov.in/" }))).status).toBe(400)
    prismaMock.state.findUnique.mockResolvedValue(null)
    const res = await SRC_POST(req("/x", "POST", { ...mpsc, url: "https://mpsc.gov.in/other" }))
    expect((await res.json()).error).toMatch(/does not exist/)
  })
  it("only lets custom sources be edited or deleted", async () => {
    expect((await SRC_DELETE(req("/x?id=bpsc", "DELETE"))).status).toBe(400)
    expect((await SRC_PATCH(req("/x", "PATCH", { id: "bpsc", def: mpsc }))).status).toBe(400)
    prismaMock.ingestSource.findMany.mockResolvedValue([{ id: "custom:mpsc", enabled: true, custom: true, def: { ...mpsc, id: "custom:mpsc" } }])
    expect((await SRC_DELETE(req("/x?id=custom:mpsc", "DELETE"))).status).toBe(200)
    expect(prismaMock.ingestSource.delete).toHaveBeenCalledWith({ where: { id: "custom:mpsc" } })
  })
})

describe("Run now", () => {
  it("explains what is missing when no GitHub token is set", async () => {
    const res = await RUN_POST(req("/x", "POST", { tier: "central" }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/INGEST_GITHUB_TOKEN/)
  })
  it("starts the workflow with the right inputs", async () => {
    vi.stubEnv("INGEST_GITHUB_TOKEN", "ghp_test")
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "production")
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }))
    const res = await RUN_POST(req("/x", "POST", { source: "bpsc", dryRun: true }))
    expect(res.status).toBe(200)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe("https://api.github.com/repos/qyronx558/Chayan/actions/workflows/content-ingest.yml/dispatches")
    expect(JSON.parse(init!.body as string)).toEqual({ ref: "main", inputs: { target: "production", tier: "central", source: "bpsc", dry_run: "true" } })
    expect((init!.headers as Record<string, string>).authorization).toBe("Bearer ghp_test")
  })
})

describe("scraper config endpoint", () => {
  it("needs the ingest secret and returns settings + overrides", async () => {
    vi.stubEnv("INGEST_SECRET", "s3cret")
    expect((await CONFIG(req("/api/cron/ingest/config"))).status).toBe(401)
    prismaMock.ingestSettings.findUnique.mockResolvedValue({ ...{ enabled: false, centralEnabled: true, stateEnabled: true, districtEnabled: false, autoApprove: false, autoApproveDailyCap: 60, minScore: 75, minConfidence: 0.85, maxNewPerSource: 10, maxLlmCalls: 50, geminiModel: "gemini-x" }, updatedAt: new Date(), updatedById: "u1" })
    prismaMock.ingestSource.findMany.mockResolvedValue([{ id: "bpsc", enabled: false, custom: false, def: null }])
    const body = await (await CONFIG(req("/api/cron/ingest/config", "GET", undefined, { authorization: "Bearer s3cret" }))).json()
    expect(body.settings).toEqual({ enabled: false, centralEnabled: true, stateEnabled: true, districtEnabled: false, autoApprove: false, autoApproveDailyCap: 60, minScore: 75, minConfidence: 0.85, maxNewPerSource: 10, maxLlmCalls: 50, geminiModel: "gemini-x" })
    expect(body.sources).toEqual([{ id: "bpsc", enabled: false, custom: false, def: null }])
  })
})
