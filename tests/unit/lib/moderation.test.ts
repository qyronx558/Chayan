import { beforeEach, describe, expect, it, vi } from "vitest"

const { prismaMock, revalidatePublicContent } = vi.hoisted(() => ({
  prismaMock: {
    log: { create: vi.fn() },
    job: { findUnique: vi.fn(), update: vi.fn() },
    blogPost: { findUnique: vi.fn(), update: vi.fn() },
  },
  revalidatePublicContent: vi.fn(),
}))
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }))
vi.mock("@/lib/cache", () => ({ revalidatePublicContent }))
vi.mock("@/lib/revalidate-content", () => ({ getScopeFor: async () => ({}) }))

import {
  defaultModerationForRole,
  isModerationStatus,
  isReviewableEntity,
  REVIEWABLE_ENTITIES,
  REVIEWABLE_META,
  reviewContent,
  staffAudit,
  writeAuditLog,
} from "@/lib/moderation"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("type guards", () => {
  it("recognises entities and statuses", () => {
    expect(isReviewableEntity("Job")).toBe(true)
    expect(isReviewableEntity("User")).toBe(false)
    expect(isModerationStatus("PENDING")).toBe(true)
    expect(isModerationStatus(1)).toBe(false)
    for (const entity of REVIEWABLE_ENTITIES) expect(REVIEWABLE_META[entity]).toBeDefined()
  })

  it("auto-approves only super admins", () => {
    expect(defaultModerationForRole("SUPER_ADMIN")).toBe("APPROVED")
    expect(defaultModerationForRole("ADMIN")).toBe("PENDING")
    expect(defaultModerationForRole()).toBe("PENDING")
  })
})

describe("audit logging", () => {
  it("writes a log row with optional fields", async () => {
    await writeAuditLog({ action: "CREATE", entity: "Job", entityId: "1" })
    expect(prismaMock.log.create).toHaveBeenCalledWith({ data: { action: "CREATE", entity: "Job", entityId: "1" } })
  })

  it("never throws when the database fails", async () => {
    prismaMock.log.create.mockImplementation(async () => {
      throw new Error("db")
    })
    await expect(writeAuditLog({ action: "A", entity: "B", entityId: "C", userId: "u", details: "d" })).resolves.toBeUndefined()
  })

  it("describes the staff actor", async () => {
    await staffAudit({ action: "DELETE", entity: "Job", entityId: "1", user: { id: "u1", email: "a@b.c", role: "ADMIN" }, note: "dup" })
    expect(prismaMock.log.create.mock.calls[0][0].data).toMatchObject({ userId: "u1", details: "dup - by a@b.c (ADMIN)" })
    await staffAudit({ action: "DELETE", entity: "Job", entityId: "1", user: null })
    expect(prismaMock.log.create.mock.calls[1][0].data.details).toBe("by system (UNKNOWN)")
  })
})

describe("reviewContent", () => {
  it("approves content, logs it and revalidates the page", async () => {
    prismaMock.job.findUnique.mockResolvedValue({ id: "j1" })
    prismaMock.job.update.mockResolvedValue({ id: "j1", slug: "ssc-cgl" })
    const updated = await reviewContent({ entity: "Job", id: "j1", action: "APPROVE", reviewerId: "r1", reviewerRole: "SUPER_ADMIN", note: "  ok  " })
    expect(updated).toEqual({ id: "j1", slug: "ssc-cgl" })
    const data = prismaMock.job.update.mock.calls[0][0].data
    expect(data).toMatchObject({ moderation: "APPROVED", reviewedById: "r1", reviewNote: "ok" })
    expect(prismaMock.log.create.mock.calls[0][0].data.details).toBe("APPROVED by r1 (SUPER_ADMIN): ok")
    expect(revalidatePublicContent).toHaveBeenCalledWith("job", "ssc-cgl", {})
  })

  it("rejects without a note and revalidates the listing", async () => {
    prismaMock.blogPost.findUnique.mockResolvedValue({ id: "b1" })
    prismaMock.blogPost.update.mockResolvedValue({ id: "b1" })
    await reviewContent({ entity: "Blog", id: "b1", action: "REJECT", reviewerId: "r1" })
    expect(prismaMock.blogPost.update.mock.calls[0][0].data).toMatchObject({ moderation: "REJECTED", reviewNote: null })
    expect(prismaMock.log.create.mock.calls[0][0].data.details).toBe("REJECTED by r1")
    expect(revalidatePublicContent).toHaveBeenCalledWith("blog")
  })

  it("throws 404 for missing content", async () => {
    prismaMock.job.findUnique.mockResolvedValue(null)
    await expect(reviewContent({ entity: "Job", id: "x", action: "APPROVE", reviewerId: "r" })).rejects.toMatchObject({ status: 404 })
  })

  it("throws for entities without a delegate", async () => {
    await expect(reviewContent({ entity: "Result", id: "x", action: "APPROVE", reviewerId: "r" })).rejects.toThrow(/Unsupported entity/)
  })
})
