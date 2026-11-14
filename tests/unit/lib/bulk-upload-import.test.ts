import { beforeEach, describe, expect, it, vi } from "vitest"

const { prismaMock, findDistrictIdByName, validateJobLocation } = vi.hoisted(() => ({
  findDistrictIdByName: vi.fn(),
  validateJobLocation: vi.fn(),
  prismaMock: {
    department: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
    category: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
    state: { findMany: vi.fn() },
    job: { findMany: vi.fn(), create: vi.fn() },
  },
}))
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }))
vi.mock("@/lib/locations-server", () => ({ findDistrictIdByName, validateJobLocation }))

import { importContent, type RowOutcome } from "@/lib/bulk-upload/import"

const row = (over: Record<string, unknown> = {}) => ({
  title: "Staff Nurse Recruitment 2026",
  department: "District Health Society",
  category: "Medical",
  state: "Bihar",
  district: "Patna",
  jobLevel: "DISTRICT",
  totalVacancies: 25,
  lastDate: "2026-11-30",
  importantDates: { "Last date": "30/11/2026", Bad: 5, "": "x" },
  summary: "Original overview.",
  ...over,
})

beforeEach(() => {
  vi.clearAllMocks()
  findDistrictIdByName.mockResolvedValue("d1")
  validateJobLocation.mockImplementation(async (v: { jobLevel?: string; stateId: string | null; districtId: string | null }) => ({
    ok: true,
    value: { jobLevel: v.jobLevel ?? (v.stateId ? "STATE" : "CENTRAL"), stateId: v.stateId, districtId: v.districtId },
  }))
  prismaMock.department.findMany.mockResolvedValue([{ id: "dep1", name: "District Health Society" }])
  prismaMock.category.findMany.mockResolvedValue([{ id: "cat1", name: "Medical" }])
  prismaMock.state.findMany.mockResolvedValue([{ id: "st1", name: "Bihar" }])
  prismaMock.job.findMany.mockResolvedValue([{ slug: "existing", title: "Existing Job" }])
  prismaMock.job.create.mockResolvedValue({ id: "job1" })
})

describe("importContent", () => {
  it("keeps the bulk-upload default: rows are published and marked reviewed", async () => {
    const out = await importContent("jobs", [row()], "admin1", { newDepartments: 0, newCategories: 0 })
    expect(out).toEqual({ imported: 1, skipped: 0, errors: [] })
    const data = prismaMock.job.create.mock.calls[0][0].data
    expect(data).toMatchObject({ moderation: "APPROVED", reviewedById: "admin1", jobLevel: "DISTRICT", totalVacancies: 25 })
    expect(data.reviewedAt).toBeInstanceOf(Date)
  })

  it("lets the ingest bot create PENDING rows with summary + important dates, and reports each row", async () => {
    const outcomes: RowOutcome[] = []
    await importContent("jobs", [row(), row({ title: "Existing Job" }), row({ title: "" })], "bot1", { newDepartments: 0, newCategories: 0 }, {
      moderation: () => "PENDING",
      onRow: (_i, o) => outcomes.push(o),
    })
    const data = prismaMock.job.create.mock.calls[0][0].data
    expect(data.moderation).toBe("PENDING")
    expect(data).not.toHaveProperty("reviewedById")
    expect(data.summary).toBe("Original overview.")
    expect(data.importantDates).toEqual({ "Last date": "30/11/2026", Bad: "5" })
    expect(outcomes).toEqual([
      { status: "created", id: "job1", slug: "staff-nurse-recruitment-2026" },
      { status: "duplicate" },
      { status: "error", message: "Title is required." },
    ])
  })
})
