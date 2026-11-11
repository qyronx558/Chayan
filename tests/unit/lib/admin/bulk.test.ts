import { describe, expect, it, vi } from "vitest"
import { bulkEndpoint, cloneEndpoint, IMPORT_TEMPLATES, moduleKeys, runBulk, templateCsv } from "@/lib/admin/bulk"

describe("bulk helpers", () => {
  it("exposes endpoints, module keys and csv templates", () => {
    expect(bulkEndpoint()).toBe("/api/admin/bulk")
    expect(cloneEndpoint()).toBe("/api/admin/clone")
    expect(moduleKeys()).toEqual(Object.keys(IMPORT_TEMPLATES))
    expect(templateCsv("Job").startsWith("title,slug,departmentId")).toBe(true)
    expect(templateCsv("Unknown")).toBe("title,slug\n")
  })
})

describe("runBulk", () => {
  it("sends ids in chunks of 50 and sums results", async () => {
    const post = vi.fn(async (_url: string, body?: unknown) => ({ success: true, data: { updated: (body as { ids: string[] }).ids.length } }))
    const ids = Array.from({ length: 120 }, (_, i) => `id${i}`)
    const result = await runBulk({ post: post as never }, { module: "Job", ids, action: "publish" })
    expect(post).toHaveBeenCalledTimes(3)
    expect(result).toEqual({ ok: 120, failed: 0, errors: [] })
  })

  it("records failed chunks and keeps going", async () => {
    const post = vi
      .fn()
      .mockImplementationOnce(async () => {
        throw new Error("boom")
      })
      .mockImplementationOnce(async () => ({ success: true, data: { deleted: 3 } }))
      .mockImplementationOnce(async () => {
        throw "not an error object"
      })
    const ids = Array.from({ length: 101 }, (_, i) => `id${i}`)
    const result = await runBulk({ post }, { module: "Job", ids, action: "delete" })
    expect(result).toEqual({ ok: 3, failed: 51, errors: ["boom", "Bulk chunk failed"] })
  })

  it("assumes the chunk size when the server omits counts", async () => {
    const result = await runBulk({ post: async () => ({ success: true }) as never }, { module: "Job", ids: ["a", "b"], action: "expire" })
    expect(result.ok).toBe(2)
  })
})
