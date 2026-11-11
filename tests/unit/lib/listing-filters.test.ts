import { afterEach, describe, expect, it, vi } from "vitest"
import { buildDateRange, dateInDays, parseIsoDate, parseNumber, parsePostedWithin, postedSince } from "@/lib/listing-filters"

afterEach(() => {
  vi.useRealTimers()
})

describe("listing filters", () => {
  it("parses ISO dates and rejects bad ones", () => {
    expect(parseIsoDate("2026-01-02")?.toISOString()).toBe("2026-01-02T00:00:00.000Z")
    expect(parseIsoDate("nope")).toBeNull()
    expect(parseIsoDate(null)).toBeNull()
  })

  it("builds open and closed date ranges", () => {
    expect(buildDateRange(null, undefined)).toBeUndefined()
    expect(buildDateRange("2026-01-01", null)).toEqual({ gte: new Date("2026-01-01") })
    expect(buildDateRange(null, "2026-02-01")).toEqual({ lte: new Date("2026-02-01") })
    expect(buildDateRange("2026-01-01", "2026-02-01")).toEqual({ gte: new Date("2026-01-01"), lte: new Date("2026-02-01") })
  })

  it("computes days ago and days ahead", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-05-10T00:00:00Z"))
    expect(postedSince(7).toISOString()).toBe("2026-05-03T00:00:00.000Z")
    expect(dateInDays(3).toISOString()).toBe("2026-05-13T00:00:00.000Z")
  })

  it("parses numbers with a fallback", () => {
    expect(parseNumber("12")).toBe(12)
    expect(parseNumber("x", 5)).toBe(5)
    expect(parseNumber(undefined, 9)).toBe(9)
    expect(parseNumber("Infinity", 1)).toBe(1)
  })

  it("only accepts the posted-within presets", () => {
    expect(parsePostedWithin("1")).toBe(1)
    expect(parsePostedWithin("7")).toBe(7)
    expect(parsePostedWithin("30")).toBe(30)
    expect(parsePostedWithin("14")).toBe(0)
    expect(parsePostedWithin(null)).toBe(0)
  })
})
