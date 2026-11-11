import { describe, expect, it } from "vitest"
import { DAY_MS, engagementScore, freshnessTerm, isCold, staleTerm, urgencyTerm, viewTerm } from "@/lib/trending/score"
import { ENTITY_TYPE, MODULE_META, MODULE_SCORING, TRENDING_MODULES } from "@/lib/trending/config"

const NOW = Date.UTC(2026, 5, 15)

describe("viewTerm", () => {
  it("is log-scaled and never negative", () => {
    expect(viewTerm(0)).toBe(0)
    expect(viewTerm(-10)).toBe(0)
    expect(viewTerm(100)).toBeCloseTo(4.615, 2)
  })
})

describe("freshnessTerm", () => {
  it("halves every half-life and treats future items as fresh", () => {
    expect(freshnessTerm(NOW, new Date(NOW), 10)).toBe(1)
    expect(freshnessTerm(NOW, new Date(NOW - 10 * DAY_MS), 10)).toBeCloseTo(0.5)
    expect(freshnessTerm(NOW, new Date(NOW + DAY_MS).toISOString(), 10)).toBe(1)
  })
  it("returns 0 for missing or invalid dates", () => {
    expect(freshnessTerm(NOW, null, 10)).toBe(0)
    expect(freshnessTerm(NOW, "bad", 10)).toBe(0)
  })
})

describe("urgencyTerm", () => {
  it("grows linearly as the deadline approaches", () => {
    expect(urgencyTerm(NOW, new Date(NOW + 7 * DAY_MS), 14, 2)).toBeCloseTo(1)
    expect(urgencyTerm(NOW, new Date(NOW + 1), 14, 2)).toBeCloseTo(2)
  })
  it("is 0 when past, too far, disabled or invalid", () => {
    expect(urgencyTerm(NOW, new Date(NOW - 1), 14, 2)).toBe(0)
    expect(urgencyTerm(NOW, new Date(NOW + 20 * DAY_MS), 14, 2)).toBe(0)
    expect(urgencyTerm(NOW, new Date(NOW + DAY_MS), 14, 0)).toBe(0)
    expect(urgencyTerm(NOW, new Date(NOW + DAY_MS), 0, 2)).toBe(0)
    expect(urgencyTerm(NOW, "bad", 14, 2)).toBe(0)
    expect(urgencyTerm(NOW, null, 14, 2)).toBe(0)
  })
})

describe("staleTerm", () => {
  it("penalises past dates only", () => {
    expect(staleTerm(new Date(NOW - 1), NOW, 2)).toBe(-2)
    expect(staleTerm(new Date(NOW + 1), NOW, 2)).toBe(0)
    expect(staleTerm(null, NOW, 2)).toBe(0)
    expect(staleTerm(new Date(NOW - 1), NOW, 0)).toBe(0)
    expect(staleTerm("bad", NOW, 2)).toBe(0)
  })
})

describe("engagement", () => {
  it("weights views, bookmarks and clicks", () => {
    expect(engagementScore({ views: 0, bookmarks: 2, clicks: 4 }, 3, 2, 1.5)).toBe(10)
    expect(engagementScore({ views: 0, bookmarks: -5, clicks: -1 }, 3, 2, 1.5)).toBe(0)
  })
  it("detects a cold start", () => {
    expect(isCold([{ views: 0, bookmarks: 0, clicks: 0 }])).toBe(true)
    expect(isCold([{ views: 0, bookmarks: 1, clicks: 0 }])).toBe(false)
    expect(isCold([])).toBe(true)
  })
})

describe("trending config", () => {
  it("has scoring, entity type and meta for every module", () => {
    for (const m of TRENDING_MODULES) {
      expect(MODULE_SCORING[m as keyof typeof MODULE_SCORING].halfLifeDays).toBeGreaterThan(0)
      expect(ENTITY_TYPE[m as keyof typeof ENTITY_TYPE]).toMatch(/^[A-Z_]+$/)
      expect(MODULE_META[m].href.startsWith("/")).toBe(true)
    }
  })
})
