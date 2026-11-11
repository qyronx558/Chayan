import { describe, expect, it } from "vitest"
import { calcAge, CATEGORIES, EXAM_NORMS } from "@/lib/tools/exam-age-norms"

describe("exam norms data", () => {
  it("has a relaxation for every category in every exam", () => {
    for (const norm of EXAM_NORMS) {
      expect(norm.maxAge).toBeGreaterThan(norm.minAge)
      for (const c of CATEGORIES) expect(norm.relaxations[c.value]).toBeTypeOf("number")
    }
    expect(new Set(EXAM_NORMS.map((n) => n.id)).size).toBe(EXAM_NORMS.length)
  })
})

describe("calcAge", () => {
  it("computes exact years, months and days", () => {
    expect(calcAge(new Date(2000, 0, 15), new Date(2026, 7, 1))).toMatchObject({ years: 26, months: 6, days: 17 })
  })

  it("borrows days and months correctly", () => {
    expect(calcAge(new Date(2000, 11, 31), new Date(2026, 0, 1))).toMatchObject({ years: 25, months: 0, days: 1 })
  })

  it("reports total and decimal years", () => {
    const a = calcAge(new Date(Date.UTC(2000, 0, 1)), new Date(Date.UTC(2001, 0, 1)))
    expect(a.totalDays).toBe(366)
    expect(a.decimalYears).toBeCloseTo(1.002, 3)
  })
})
