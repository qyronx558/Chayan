import { beforeEach, describe, expect, it, vi } from "vitest"

const revalidatePath = vi.hoisted(() => vi.fn())
vi.mock("next/cache", () => ({ revalidatePath }))

import { publicApiResponse, revalidatePublicContent } from "@/lib/cache"

beforeEach(() => {
  revalidatePath.mockReset()
})

describe("publicApiResponse", () => {
  it("sets CDN cache headers", async () => {
    const res = publicApiResponse({ ok: true }, 30)
    expect(res.headers.get("cache-control")).toBe("public, s-maxage=30, stale-while-revalidate=60")
    expect(await res.json()).toEqual({ ok: true })
  })
  it("defaults to 60 seconds", () => {
    expect(publicApiResponse({}).headers.get("cache-control")).toContain("s-maxage=60")
  })
})

describe("revalidatePublicContent", () => {
  const paths = () => revalidatePath.mock.calls.map((c) => c[0])

  it("revalidates home, listing, category and detail pages for jobs", () => {
    revalidatePublicContent("job", "ssc-cgl")
    expect(paths()).toEqual(["/", "/category/[slug]", "/jobs", "/apply", "/apply/ssc-cgl"])
  })

  it("revalidates results and the detail page", () => {
    revalidatePublicContent("result", "x")
    expect(paths()).toEqual(["/", "/results", "/result", "/result/x"])
  })

  it("skips detail pages when there is no detail route", () => {
    revalidatePublicContent("blog", "post")
    expect(paths()).toEqual(["/", "/blog"])
    revalidatePath.mockReset()
    revalidatePublicContent("featured")
    expect(paths()).toEqual(["/"])
  })
})
