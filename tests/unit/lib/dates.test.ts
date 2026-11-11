import { describe, expect, it } from "vitest"
import {
  daysInMonthFor,
  getMonthMatrix,
  humanizeKey,
  monthLabel,
  monthRange,
  parseFlexibleDate,
  parseMonthParts,
  toDayKey,
  toMonthKey,
} from "@/lib/dates"

describe("parseFlexibleDate", () => {
  it("returns null for empty input", () => {
    expect(parseFlexibleDate(undefined)).toBeNull()
    expect(parseFlexibleDate(null)).toBeNull()
    expect(parseFlexibleDate("   ")).toBeNull()
  })

  it("parses day-month-year with any separator and short years", () => {
    expect(parseFlexibleDate("05/03/2026")).toEqual(new Date(2026, 2, 5))
    expect(parseFlexibleDate("5-3-26")).toEqual(new Date(2026, 2, 5))
    expect(parseFlexibleDate("15.08.2025")).toEqual(new Date(2025, 7, 15))
  })

  it("parses month names with optional day and year", () => {
    expect(parseFlexibleDate("12 March 2026")).toEqual(new Date(2026, 2, 12))
    expect(parseFlexibleDate("Sep. 2027")?.getMonth()).toBe(8)
    expect(parseFlexibleDate("Sep. 2027")?.getDate()).toBe(1)
    expect(parseFlexibleDate("Dec 2026")).toEqual(new Date(2026, 11, 1))
  })

  it("returns null for text with no date", () => {
    expect(parseFlexibleDate("to be announced")).toBeNull()
  })
})

describe("month helpers", () => {
  it("returns a UTC month range", () => {
    const { start, end } = monthRange("2026-02")
    expect(start.toISOString()).toBe("2026-02-01T00:00:00.000Z")
    expect(end.toISOString()).toBe("2026-03-01T00:00:00.000Z")
  })

  it("round-trips month keys and labels", () => {
    expect(toMonthKey(new Date(Date.UTC(2026, 8, 30)))).toBe("2026-09")
    expect(monthLabel("2026-09")).toMatch(/September.*2026/)
  })

  it("clamps bad month parts", () => {
    expect(parseMonthParts("2026-13")).toEqual({ year: 2026, month: 12 })
    expect(parseMonthParts("2026-00")).toEqual({ year: 2026, month: 1 })
    expect(parseMonthParts("bad").month).toBe(1)
    expect(parseMonthParts("bad").year).toBe(new Date().getFullYear())
  })

  it("knows how many days a month has (incl. leap years)", () => {
    expect(daysInMonthFor("2028-02")).toBe(29)
    expect(daysInMonthFor("2026-02")).toBe(28)
    expect(daysInMonthFor("2026-04")).toBe(30)
  })

  it("builds a calendar grid of full weeks", () => {
    const weeks = getMonthMatrix("2026-02") // Feb 2026 starts on a Sunday
    expect(weeks.every((w) => w.length === 7)).toBe(true)
    expect(weeks[0][0]).toBe(1)
    const days = weeks.flat().filter((d) => d !== null)
    expect(days).toHaveLength(28)

    const march = getMonthMatrix("2026-03") // starts on Sunday too, 31 days
    expect(march.flat().filter((d) => d === null).length).toBe(march.length * 7 - 31)
  })
})

describe("toDayKey / humanizeKey", () => {
  it("formats local day keys from dates and strings", () => {
    expect(toDayKey(new Date(2026, 0, 2))).toBe("2026-01-02")
    expect(toDayKey("2026-12-31T10:00:00")).toBe("2026-12-31")
  })

  it("turns snake/kebab keys into title case", () => {
    expect(humanizeKey("exam_date_foo")).toBe("Exam Date Foo")
    expect(humanizeKey("  last--date  ")).toBe("Last Date")
  })
})
