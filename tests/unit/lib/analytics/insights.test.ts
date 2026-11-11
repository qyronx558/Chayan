import { describe, expect, it } from "vitest"
import { buildInsights } from "@/lib/analytics/insights"

const base = { views: 0, signups: 0, perJobViews: 0, siteViews: 0, categoryNames: [], categoryJobCounts: [], totalJobs: 0 }

describe("buildInsights", () => {
  it("returns nothing for a healthy site", () => {
    expect(buildInsights(base)).toEqual([])
  })

  it("flags low conversion, view mismatch, duplicates and concentration", () => {
    const items = buildInsights({
      views: 10_000,
      signups: 1,
      perJobViews: 500,
      siteViews: 100,
      categoryNames: ["Bank Jobs", "bank job", "Police Jobs", "police job"],
      categoryJobCounts: [
        { name: "A", jobs: 80 },
        { name: "B", jobs: 10 },
        { name: "C", jobs: 5 },
        { name: "D", jobs: 5 },
      ],
      totalJobs: 100,
    })
    expect(items.map((k) => k.key)).toEqual(["low-conversion", "view-mismatch", "duplicate-categories", "category-concentration"])
    expect(items[2].explanation).toMatch(/2 suspected pairs/)
    expect(items[3].explanation).toMatch(/95%/)
  })

  it("uses singular wording for one duplicate pair", () => {
    const [dup] = buildInsights({ ...base, categoryNames: ["Bank Jobs", "bank job"] })
    expect(dup.explanation).toMatch(/1 suspected pair found/)
  })
})
