import { describe, expect, it, vi } from "vitest"
import { publishedFrom } from "../../../scripts/ingest/run"
import { wantsDirect } from "../../../scripts/ingest/transport"
import { groupPublished, revalidateSite } from "../../../scripts/ingest/site"
import type { IngestPost } from "@/lib/ingest/schema"

const post = (kind: string) => ({ extraction: { kind } }) as unknown as IngestPost

describe("transport choice", () => {
  it("goes direct when a database is configured, unless forced to http", () => {
    expect(wantsDirect({ DATABASE_URL: "postgres://x" })).toBe(true)
    expect(wantsDirect({ DATABASE_URL: "postgres://x", INGEST_TRANSPORT: "http" })).toBe(false)
    expect(wantsDirect({})).toBe(false)
    expect(wantsDirect({ DATABASE_URL: "  " })).toBe(false)
  })
})

describe("published posts", () => {
  it("keeps only auto-approved new posts, with their kind", () => {
    const batch = [post("jobs"), post("results"), post("jobs"), post("irrelevant")]
    const results = [
      { status: "POSTED", moderation: "APPROVED", entityId: "j1" },
      { status: "POSTED", moderation: "PENDING", entityId: "r1" },
      { status: "DUPLICATE" },
      { status: "SKIPPED" },
    ]
    expect(publishedFrom(batch, results)).toEqual([{ kind: "jobs", entityId: "j1" }])
  })

  it("groups ids per kind", () => {
    const g = groupPublished([
      { kind: "jobs", entityId: "a" },
      { kind: "results", entityId: "b" },
      { kind: "jobs", entityId: "c" },
    ])
    expect(g.get("jobs")).toEqual(["a", "c"])
    expect(g.get("results")).toEqual(["b"])
  })
})

describe("revalidateSite", () => {
  it("calls the site once per kind, after following its redirect", async () => {
    const calls: { url: string; body?: string }[] = []
    const fetchFn = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), body: init?.body as string | undefined })
      if (init?.method === "HEAD") return { url: "https://www.site.test/" } as Response
      return { status: 200 } as Response
    }) as unknown as typeof fetch
    await revalidateSite(
      [
        { kind: "job", slugs: ["a", "b"] },
        { kind: "result", slugs: [] },
      ],
      () => {},
      { APP_URL: "https://site.test", CRON_SECRET: "s" },
      fetchFn,
    )
    expect(calls.map((c) => c.url)).toEqual([
      "https://site.test/",
      "https://www.site.test/api/cron/revalidate",
      "https://www.site.test/api/cron/revalidate",
    ])
    expect(JSON.parse(calls[1].body!)).toEqual({ kind: "job", slugs: ["a", "b"] })
    expect(JSON.parse(calls[2].body!)).toEqual({ kind: "result" })
  })

  it("does nothing when nothing was published or secrets are missing", async () => {
    const fetchFn = vi.fn() as unknown as typeof fetch
    await revalidateSite([], () => {}, { APP_URL: "https://x", CRON_SECRET: "s" }, fetchFn)
    await revalidateSite([{ kind: "job", slugs: ["a"] }], () => {}, {}, fetchFn)
    expect(fetchFn).not.toHaveBeenCalled()
  })
})
