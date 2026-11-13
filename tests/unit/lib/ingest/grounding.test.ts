import { describe, expect, it } from "vitest"
import { dateVariants, groundExtraction, normForMatch } from "@/lib/ingest/grounding"
import { NOTICE_TEXT, extraction } from "./fixtures"

describe("groundExtraction", () => {
  it("keeps every fact that is printed in the notice", () => {
    const g = groundExtraction(extraction(), NOTICE_TEXT, [])
    expect(g.dropped).toEqual([])
    expect(g.verifiedRatio).toBe(1)
    expect(g.extraction.totalVacancies).toBe(25)
    expect(g.extraction.lastDate).toBe("2026-11-30")
    expect(g.extraction.importantDates).toHaveLength(2)
  })

  it("drops a hallucinated vacancy count, date, advertisement number and link", () => {
    const g = groundExtraction(
      extraction({
        totalVacancies: 250,
        lastDate: "2026-12-30",
        advertisementNo: "DHS/PAT/99/2026",
        applyLink: "https://apply-now.example.com/form",
      }),
      NOTICE_TEXT,
      [],
    )
    expect([...g.dropped].sort()).toEqual(["advertisementNo", "applyLink", "lastDate", "totalVacancies"])
    expect(g.extraction.totalVacancies).toBeNull()
    expect(g.extraction.lastDate).toBeNull()
    expect(g.extraction.applyLink).toBeNull()
    expect(g.verifiedRatio).toBeLessThan(0.8)
  })

  it("drops free-text fields whose evidence is not in the notice", () => {
    const base = extraction()
    const g = groundExtraction(
      extraction({ experience: "Minimum 3 years in a 100-bed hospital", evidence: { ...base.evidence, experience: "3 years experience in a 100 bed hospital" } }),
      NOTICE_TEXT,
      [],
    )
    expect(g.dropped).toContain("experience")
    expect(g.extraction.experience).toBeNull()
  })

  it("accepts a link that appears in the link list of the page", () => {
    const g = groundExtraction(extraction({ applyLink: "https://forms.bihar.gov.in/dhs/apply" }), NOTICE_TEXT, [
      { url: "https://forms.bihar.gov.in/dhs/apply", label: "Apply" },
    ])
    expect(g.extraction.applyLink).toBe("https://forms.bihar.gov.in/dhs/apply")
  })

  it("reads Devanagari digits and Indian digit grouping", () => {
    const text = "कुल पद: १,२५० ... अंतिम तिथि ३०/११/२०२६"
    const g = groundExtraction(
      extraction({
        totalVacancies: 1250, lastDate: "2026-11-30", startDate: null, advertisementNo: null, salary: null, ageLimit: null,
        education: null, selectionProcess: null, applicationFee: null, howToApply: null, importantDates: null, officialWebsite: null,
      }),
      text,
      [],
    )
    expect(g.extraction.totalVacancies).toBe(1250)
    expect(g.extraction.lastDate).toBe("2026-11-30")
    expect(g.dropped).toEqual([])
  })

  it("does nothing (verifiedRatio 0) without source text", () => {
    const g = groundExtraction(extraction(), "", [])
    expect(g.verifiedRatio).toBe(0)
    expect(g.extraction.totalVacancies).toBe(25)
  })
})

describe("date + text normalisation", () => {
  it("lists the common spellings of a date", () => {
    const v = dateVariants("2026-11-05")
    expect(v).toContain(normForMatch("05/11/2026"))
    expect(v).toContain(normForMatch("5 November 2026"))
    expect(v).toContain(normForMatch("05.11.26"))
  })
  it("normForMatch collapses punctuation and case", () => {
    expect(normForMatch("Rs. 20,000/-  Per Month")).toBe("rs 20 000 per month")
  })
})
