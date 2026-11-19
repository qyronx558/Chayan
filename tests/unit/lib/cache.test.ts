import { beforeEach, describe, expect, it, vi } from "vitest"

const { revalidatePath, revalidateTag } = vi.hoisted(() => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath, revalidateTag }))

import { cacheControl, noStoreResponse, publicApiResponse, revalidateLocationPages, revalidatePublicContent } from "@/lib/cache"

beforeEach(() => {
  revalidatePath.mockReset()
  revalidateTag.mockReset()
})

const paths = () => revalidatePath.mock.calls.map((c) => c[0])
const tags = () => revalidateTag.mock.calls.map((c) => c[0])

describe("cache headers", () => {
  it("sets CDN cache headers from seconds", async () => {
    const res = publicApiResponse({ ok: true }, 30)
    expect(res.headers.get("cache-control")).toBe("public, s-maxage=30, stale-while-revalidate=60")
    expect(await res.json()).toEqual({ ok: true })
  })

  it("maps named policies", () => {
    expect(cacheControl("gov")).toBe("public, s-maxage=21600, stale-while-revalidate=86400")
    expect(cacheControl("private")).toBe("public, s-maxage=3600, stale-while-revalidate=86400")
    expect(cacheControl("search")).toBe("public, s-maxage=300, stale-while-revalidate=3600")
  })

  it("never caches personal responses", () => {
    expect(noStoreResponse({}).headers.get("cache-control")).toBe("private, no-store")
  })
})

describe("revalidatePublicContent", () => {
  it("revalidates only the concrete pages a job appears on", () => {
    revalidatePublicContent("job", "ssc-cgl", { categorySlugs: ["ssc"], stateSlug: "bihar", districtSlug: "patna" })
    expect(paths()).toEqual([
      "/",
      "/jobs",
      "/jobs/states",
      "/apply/ssc-cgl",
      "/apply/ssc-cgl/start",
      "/category/ssc",
      "/jobs/state/bihar",
      "/jobs/district/bihar/patna",
    ])
    expect(tags()).toEqual(["gov-counts"])
    expect(paths().some((p) => p.includes("["))).toBe(false)
  })

  it("revalidates results and their detail + viewer pages", () => {
    revalidatePublicContent("result", "x")
    expect(paths()).toEqual(["/", "/results", "/result/x", "/result/x/view"])
  })

  it("revalidates private job hubs, the detail page and the company page", () => {
    revalidatePublicContent("private-job", "dev", { companySlug: "acme" })
    expect(paths()).toEqual([
      "/",
      "/private-jobs",
      "/private-jobs/remote",
      "/private-jobs/freshers",
      "/private-jobs/walkins",
      "/private-jobs/dev",
      "/private-jobs/dev/apply",
      "/companies/acme",
    ])
    expect(tags()).toEqual(["private-filters"])
  })

  it("only touches hubs when no slug is given", () => {
    revalidatePublicContent("featured")
    expect(paths()).toEqual(["/"])
    revalidatePath.mockReset()
    revalidatePublicContent("blog", "post")
    expect(paths()).toEqual(["/", "/blog", "/blog/post"])
  })

  it("is best-effort outside a request scope", () => {
    revalidatePath.mockImplementation(() => {
      throw new Error("no store")
    })
    expect(() => revalidatePublicContent("job")).not.toThrow()
  })
})

describe("revalidateLocationPages", () => {
  it("targets the given state and district", () => {
    revalidateLocationPages("bihar", "patna")
    expect(paths()).toEqual(["/jobs/states", "/jobs/state/bihar", "/jobs/district/bihar/patna"])
    expect(tags()).toEqual(["locations"])
  })
})
