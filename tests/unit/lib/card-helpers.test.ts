import { describe, expect, it } from "vitest"
import { cleanTitle, filterValidItems, getOrgAlias, isDummyItem, isDummyTitle } from "@/lib/card-helpers"

describe("getOrgAlias", () => {
  it("maps long organisation names to short aliases", () => {
    expect(getOrgAlias("Union  Public Service Commission")).toBe("UPSC")
    expect(getOrgAlias("staff selection commission")).toBe("SSC")
  })
  it("returns the trimmed name when there is no alias", () => {
    expect(getOrgAlias("  Some Board ")).toBe("Some Board")
    expect(getOrgAlias(null)).toBe("")
  })
})

describe("cleanTitle", () => {
  it("removes the site suffix in any spelling", () => {
    expect(cleanTitle("SSC CGL 2026 | ChayanJobs")).toBe("SSC CGL 2026")
    expect(cleanTitle("Exam tips - Chayan Jobs Blog")).toBe("Exam tips")
    expect(cleanTitle("A   B — chayanjobs")).toBe("A B")
    expect(cleanTitle(undefined)).toBe("")
  })
})

describe("dummy filtering", () => {
  it.each(["", "ab", "test", "Demo", "Lorem ipsum job", "asdf asdf", "Sample post | ChayanJobs"])("%j is dummy", (t) => {
    expect(isDummyTitle(t)).toBe(true)
  })

  it("keeps real titles", () => {
    expect(isDummyTitle("RRB NTPC Recruitment 2026")).toBe(false)
  })

  it("treats non-string titles as dummy and filters lists", () => {
    expect(isDummyItem({ title: 42 })).toBe(true)
    expect(filterValidItems(null)).toEqual([])
    expect(filterValidItems([{ title: "UPSC CSE 2026" }, { title: "test" }, {}])).toEqual([{ title: "UPSC CSE 2026" }])
  })
})
