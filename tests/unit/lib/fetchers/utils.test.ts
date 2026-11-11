import { beforeEach, describe, expect, it, vi } from "vitest"

const prismaMock = vi.hoisted(() => {
  const model = () => ({ findUnique: vi.fn(), create: vi.fn() })
  return { department: model(), category: model(), state: model() }
})
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }))

import { ensureCategory, ensureDepartment, ensureState, parseLastDate, slugify } from "@/lib/fetchers/utils"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("slugify", () => {
  it("makes url-safe slugs", () => {
    expect(slugify("  Staff Selection Commission (SSC) ")).toBe("staff-selection-commission-ssc")
  })
})

describe("parseLastDate", () => {
  it("parses dd/mm/yyyy and free-form dates", () => {
    expect(parseLastDate("Last date: 5/3/2026")?.toISOString()).toBe("2026-03-05T00:00:00.000Z")
    expect(parseLastDate("2026-07-01")?.toISOString()).toBe("2026-07-01T00:00:00.000Z")
    expect(parseLastDate("")).toBeUndefined()
    expect(parseLastDate("soon")).toBeUndefined()
  })
})

describe.each([
  ["department", ensureDepartment],
  ["category", ensureCategory],
  ["state", ensureState],
] as const)("ensure %s", (model, ensure) => {
  it("returns the existing id", async () => {
    prismaMock[model].findUnique.mockResolvedValue({ id: "existing" })
    expect(await ensure("Some Name")).toBe("existing")
    expect(prismaMock[model].create).not.toHaveBeenCalled()
  })

  it("creates a row when missing", async () => {
    prismaMock[model].findUnique.mockResolvedValue(null)
    prismaMock[model].create.mockResolvedValue({ id: "new" })
    expect(await ensure("Some Name")).toBe("new")
    expect(prismaMock[model].create).toHaveBeenCalledWith({ data: { name: "Some Name", slug: "some-name" } })
  })
})
