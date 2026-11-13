import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { urlHash } from "@/lib/ingest/normalize"
import { NOTICE_TEXT, extraction } from "../../../unit/lib/ingest/fixtures"

const { prismaMock, importContent, revalidatePublicContent, writeAuditLog } = vi.hoisted(() => ({
  prismaMock: {
    user: { upsert: vi.fn() },
    category: { findMany: vi.fn() },
    department: { findMany: vi.fn() },
    ingestItem: { findMany: vi.fn(), count: vi.fn(), upsert: vi.fn() },
    crawlerRun: { create: vi.fn() },
    job: { findMany: vi.fn(), updateMany: vi.fn() },
    result: { findMany: vi.fn() },
  },
  importContent: vi.fn(),
  revalidatePublicContent: vi.fn(),
  writeAuditLog: vi.fn(),
}))
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }))
vi.mock("@/lib/cache", () => ({ revalidatePublicContent }))
vi.mock("@/lib/moderation", () => ({ writeAuditLog }))
vi.mock("@/lib/bulk-upload/import", () => ({
  importContent,
  REVALIDATE_KIND: { jobs: "job", results: "result", "admit-cards": "admit-card", "answer-keys": "answer-key", admissions: "admission", syllabus: "syllabus" },
}))

import { POST as INGEST } from "@/app/api/cron/ingest/route"
import { POST as SEEN } from "@/app/api/cron/ingest/seen/route"
import { POST as RUN } from "@/app/api/cron/ingest/run/route"
import { GET as TAXONOMY } from "@/app/api/cron/ingest/taxonomy/route"
import { GET as EXPIRE } from "@/app/api/cron/expire-jobs/route"

const SECRET = "test-ingest-secret"
const req = (path: string, body?: unknown, token = SECRET, method = "POST") =>
  new NextRequest(`https://chayanjobs.test${path}`, {
    method,
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    ...(body !== undefined ? { body: typeof body === "string" ? body : JSON.stringify(body) } : {}),
  })

function post(over: Record<string, unknown> = {}, ex = extraction()) {
  return {
    sourceId: "nic:bihar/patna",
    sourceUrl: "https://cdn.s3waas.gov.in/s3abc/uploads/2026/11/dhs.pdf",
    officialNotification: "https://cdn.s3waas.gov.in/s3abc/uploads/2026/11/dhs.pdf",
    level: "DISTRICT",
    state: "Bihar",
    district: "Patna",
    allowHosts: ["s3waas.gov.in"],
    sourceText: NOTICE_TEXT,
    links: [],
    extraction: ex,
    ...over,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv("INGEST_SECRET", SECRET)
  vi.stubEnv("CRON_SECRET", "cron-secret")
  vi.useFakeTimers({ toFake: ["Date"] })
  vi.setSystemTime(new Date("2026-11-14T06:00:00Z"))
  prismaMock.user.upsert.mockResolvedValue({ id: "bot1" })
  prismaMock.category.findMany.mockResolvedValue([{ name: "Medical" }, { name: "State Govt" }, { name: "Central Govt" }])
  prismaMock.ingestItem.findMany.mockResolvedValue([])
  prismaMock.ingestItem.count.mockResolvedValue(0)
  prismaMock.ingestItem.upsert.mockResolvedValue({})
  prismaMock.job.findMany.mockResolvedValue([])
  importContent.mockImplementation(async (_kind, rows: unknown[], _uid, _c, opts) => {
    rows.forEach((_r, i) => opts.onRow(i, { status: "created", id: `job${i}`, slug: `s${i}` }))
    return { imported: rows.length, skipped: 0, errors: [] }
  })
})

describe("auth + validation", () => {
  it("rejects a missing or wrong token", async () => {
    expect((await INGEST(req("/api/cron/ingest", { items: [post()] }, ""))).status).toBe(401)
    expect((await INGEST(req("/api/cron/ingest", { items: [post()] }, "wrong"))).status).toBe(401)
    expect((await SEEN(req("/api/cron/ingest/seen", { urls: ["https://a.gov.in"] }, "cron-secret"))).status).toBe(401)
  })
  it("fails closed when the secret is not configured", async () => {
    vi.stubEnv("INGEST_SECRET", "")
    expect((await INGEST(req("/api/cron/ingest", { items: [post()] }))).status).toBe(500)
  })
  it("rejects malformed payloads and non-http source URLs", async () => {
    expect((await INGEST(req("/api/cron/ingest", "not json"))).status).toBe(400)
    const res = await INGEST(req("/api/cron/ingest", { items: [post({ sourceUrl: "javascript:alert(1)" })] }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/sourceUrl/)
  })
})

describe("POST /api/cron/ingest", () => {
  it("stores a verified district job as PENDING with exact field placement", async () => {
    const res = await INGEST(req("/api/cron/ingest", { items: [post()] }))
    const json = await res.json()
    expect(json.results).toEqual([expect.objectContaining({ status: "POSTED", moderation: "PENDING", entityId: "job0" })])

    const [kind, rows, userId, , opts] = importContent.mock.calls[0]
    expect(kind).toBe("jobs")
    expect(userId).toBe("bot1")
    expect(opts.moderation(rows[0], 0)).toBe("PENDING")
    expect(rows[0]).toMatchObject({
      title: "District Health Society Patna Staff Nurse Recruitment 2026",
      department: "District Health Society, Patna",
      category: "Medical",
      jobLevel: "DISTRICT",
      state: "Bihar",
      district: "Patna",
      location: "Patna, Bihar",
      advertisementNo: "DHS/PAT/12/2026",
      totalVacancies: 25,
      ageLimit: "21 to 37 years as on 01/01/2026",
      startDate: "2026-11-12",
      lastDate: "2026-11-30",
      officialNotification: "https://cdn.s3waas.gov.in/s3abc/uploads/2026/11/dhs.pdf",
      officialWebsite: "https://patna.nic.in",
      importantDates: { "Application start": "12/11/2026", "Last date": "30/11/2026" },
      status: "ACTIVE",
    })
    expect(rows[0].summary).toMatch(/^The District Health Society in Patna is hiring 25 Staff Nurses/)

    const saved = prismaMock.ingestItem.upsert.mock.calls[0][0]
    expect(saved.where).toEqual({ urlHash: urlHash(post().sourceUrl) })
    expect(saved.create).toMatchObject({ status: "POSTED", entityType: "Job", entityId: "job0", autoApproved: false, kind: "jobs" })
    expect(revalidatePublicContent).not.toHaveBeenCalled() // nothing went live
  })

  it("re-verifies on the server: a hallucinated count never reaches the database", async () => {
    await INGEST(req("/api/cron/ingest", { items: [post({}, extraction({ totalVacancies: 999 }))] }))
    expect(importContent.mock.calls[0][1][0].totalVacancies).toBeNull()
  })

  it("skips irrelevant notices and expired deadlines without creating posts", async () => {
    const res = await INGEST(
      req("/api/cron/ingest", {
        items: [
          post({ sourceUrl: "https://a.gov.in/1.pdf" }, extraction({ kind: "irrelevant" })),
          post({ sourceUrl: "https://a.gov.in/2.pdf", sourceText: NOTICE_TEXT.replaceAll("30/11/2026", "01/11/2026") }, extraction({ lastDate: "2026-11-01", importantDates: null })),
        ],
      }),
    )
    const { results } = await res.json()
    expect(results.map((r: { status: string }) => r.status)).toEqual(["SKIPPED", "SKIPPED"])
    expect(results[1].reason).toBe("deadline already passed")
    expect(importContent).not.toHaveBeenCalled()
    expect(prismaMock.ingestItem.upsert).toHaveBeenCalledTimes(2)
  })

  it("marks cross-source and near-identical posts as DUPLICATE", async () => {
    prismaMock.ingestItem.findMany.mockImplementation(async (args: { where: { contentHash?: { in: string[] } } }) =>
      args.where.contentHash ? [{ contentHash: args.where.contentHash.in[0] }] : [],
    )
    const first = await (await INGEST(req("/api/cron/ingest", { items: [post()] }))).json()
    expect(first.results[0]).toMatchObject({ status: "DUPLICATE", reason: "already published from another source" })

    prismaMock.ingestItem.findMany.mockResolvedValue([])
    prismaMock.job.findMany.mockResolvedValue([{ title: "Staff Nurse Recruitment 2026 - District Health Society Patna" }])
    const second = await (await INGEST(req("/api/cron/ingest", { items: [post()] }))).json()
    expect(second.results[0]).toMatchObject({ status: "DUPLICATE", reason: "near-identical post already exists" })
    expect(importContent).not.toHaveBeenCalled()
  })

  it("auto-approves clean posts only when enabled, within the daily cap", async () => {
    vi.stubEnv("INGEST_AUTO_APPROVE", "true")
    vi.stubEnv("INGEST_AUTO_APPROVE_DAILY_CAP", "1")
    const items = [post({ sourceUrl: "https://a.gov.in/1.pdf" }), post({ sourceUrl: "https://a.gov.in/2.pdf" }, extraction({ title: "District Health Society Patna ANM Recruitment 2026", advertisementNo: null }))]
    const { results } = await (await INGEST(req("/api/cron/ingest", { items }))).json()
    expect(results.map((r: { moderation: string }) => r.moderation)).toEqual(["APPROVED", "PENDING"])
    expect(revalidatePublicContent).toHaveBeenCalledWith("job")
    expect(prismaMock.ingestItem.upsert.mock.calls[0][0].create.autoApproved).toBe(true)
  })

  it("never invents categories - unknown ones fall back by level", async () => {
    await INGEST(req("/api/cron/ingest", { items: [post({}, extraction({ category: "Health Jobs" }))] }))
    expect(importContent.mock.calls[0][1][0].category).toBe("State Govt")
  })

  it("routes results to their own module with the PDF as the result link", async () => {
    importContent.mockImplementation(async (_k, rows: unknown[], _u, _c, opts) => {
      rows.forEach((_r, i) => opts.onRow(i, { status: "created", id: `r${i}`, slug: "x" }))
      return { imported: 1, skipped: 0, errors: [] }
    })
    prismaMock.result.findMany.mockResolvedValue([])
    await INGEST(req("/api/cron/ingest", { items: [post({}, extraction({ kind: "results", title: "District Health Society Patna Staff Nurse Merit List 2026", resultDate: null }))] }))
    const [kind, rows] = importContent.mock.calls[0]
    expect(kind).toBe("results")
    expect(rows[0]).toMatchObject({ pdfUrl: post().officialNotification, status: "PUBLISHED" })
    expect(rows[0].description).toBe(extraction().summary)
  })

  it("records import failures as FAILED so they are retried", async () => {
    importContent.mockImplementation(async (_k, rows: unknown[], _u, _c, opts) => {
      rows.forEach((_r, i) => opts.onRow(i, { status: "error", message: 'District "Patna" not found in Bihar' }))
      return { imported: 0, skipped: 0, errors: [] }
    })
    const { results } = await (await INGEST(req("/api/cron/ingest", { items: [post()] }))).json()
    expect(results[0]).toMatchObject({ status: "FAILED", reason: 'District "Patna" not found in Bihar' })
  })
})

describe("helper routes", () => {
  it("/seen returns only new URLs and retries failed ones", async () => {
    prismaMock.ingestItem.findMany.mockResolvedValue([
      { urlHash: urlHash("https://a.gov.in/done.pdf"), status: "POSTED", attempts: 1 },
      { urlHash: urlHash("https://a.gov.in/retry.pdf"), status: "FAILED", attempts: 1 },
      { urlHash: urlHash("https://a.gov.in/dead.pdf"), status: "FAILED", attempts: 3 },
    ])
    const res = await SEEN(req("/api/cron/ingest/seen", { urls: ["https://a.gov.in/done.pdf", "https://a.gov.in/retry.pdf", "https://a.gov.in/dead.pdf", "https://a.gov.in/new.pdf"] }))
    expect((await res.json()).unseen).toEqual(["https://a.gov.in/retry.pdf", "https://a.gov.in/new.pdf"])
  })

  it("/taxonomy lists existing names", async () => {
    prismaMock.department.findMany.mockResolvedValue([{ name: "BPSC" }])
    const json = await (await TAXONOMY(req("/api/cron/ingest/taxonomy", undefined, SECRET, "GET"))).json()
    expect(json).toEqual({ success: true, categories: ["Medical", "State Govt", "Central Govt"], departments: ["BPSC"] })
  })

  it("/run records a CrawlerRun", async () => {
    prismaMock.crawlerRun.create.mockResolvedValue({ id: "run1" })
    const res = await RUN(req("/api/cron/ingest/run", { source: "district-1of4", startedAt: "2026-11-14T00:30:00.000Z", imported: 3, errors: 1 }))
    expect(await res.json()).toEqual({ success: true, id: "run1" })
    expect(prismaMock.crawlerRun.create.mock.calls[0][0].data).toMatchObject({ source: "ingest:district-1of4", imported: 3, errors: 1 })
  })

  it("/expire-jobs uses CRON_SECRET and expires by IST calendar day", async () => {
    prismaMock.job.updateMany.mockResolvedValue({ count: 4 })
    expect((await EXPIRE(req("/api/cron/expire-jobs", undefined, SECRET, "GET"))).status).toBe(401)
    const json = await (await EXPIRE(req("/api/cron/expire-jobs", undefined, "cron-secret", "GET"))).json()
    expect(json).toEqual({ success: true, expired: 4 })
    expect(prismaMock.job.updateMany.mock.calls[0][0].where).toEqual({ status: { not: "EXPIRED" }, lastDate: { lt: new Date("2026-11-14T00:00:00.000Z") } })
    expect(revalidatePublicContent).toHaveBeenCalledWith("job")
  })
})
