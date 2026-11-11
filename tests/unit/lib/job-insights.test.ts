import { describe, expect, it } from "vitest"
import {
  buildDateRows,
  buildTimeline,
  feeKpi,
  formatRupees,
  getDeadline,
  inferSelectionSteps,
  parseFeeBars,
  parseSalaryRange,
  shortFact,
  stepify,
  vacancyScale,
  windowProgress,
} from "@/lib/job-insights"

const NOW = new Date("2026-06-15T00:00:00Z").getTime()
const DAY = 86_400_000
const iso = (offsetDays: number) => new Date(NOW + offsetDays * DAY).toISOString()

describe("stepify", () => {
  it("splits newlines, bullets and numbered lists", () => {
    expect(stepify("Written Exam\nInterview")).toEqual(["Written Exam", "Interview"])
    expect(stepify("1. CBT 2. Skill Test 3) DV")).toEqual(["CBT", "Skill Test", "DV"])
    expect(stepify("• Prelims • Mains")).toEqual(["Prelims", "Mains"])
    expect(stepify(null)).toEqual([])
  })
})

describe("parseFeeBars", () => {
  it("parses category fees into bars", () => {
    expect(parseFeeBars("General/OBC: Rs 100, SC: Rs 50, PH: Nil")).toEqual([
      { label: "General", amount: 100 },
      { label: "SC", amount: 50 },
      { label: "PH", amount: 0 },
    ])
  })

  it("keeps thousands separators and ignores bare years", () => {
    expect(parseFeeBars("UR: ₹1,000\nST: ₹500\nNotification 2026")).toEqual([
      { label: "General", amount: 1000 },
      { label: "ST", amount: 500 },
    ])
  })

  it("returns [] for a single flat fee or empty input", () => {
    expect(parseFeeBars("Rs 100 for all")).toEqual([])
    expect(parseFeeBars(null)).toEqual([])
    expect(parseFeeBars("x")).toEqual([])
  })

  it("labels women, combined and unknown categories", () => {
    const bars = parseFeeBars("Female: Free; SC/ST: Rs 0; Other Fee: Rs 300")
    expect(bars.map((b) => b.label).slice(0, 2)).toEqual(["Women", "SC / ST"])
    // Unknown categories fall back to the first characters of the text.
    expect(bars[2]).toMatchObject({ amount: 300 })
    expect(bars[2].label.startsWith("Other")).toBe(true)
  })
})

describe("formatters", () => {
  it("formats rupees", () => {
    expect(formatRupees(0)).toBe("Free")
    expect(formatRupees(125000)).toBe("₹1,25,000")
  })

  it("parses salary ranges", () => {
    expect(parseSalaryRange("Rs. 35400 - 112400")).toEqual({ min: 35400, max: 112400 })
    expect(parseSalaryRange("₹21,700-69,100 (Level-3)")).toEqual({ min: 21700, max: 69100 })
    expect(parseSalaryRange("Level-6")).toBeNull()
    expect(parseSalaryRange(undefined)).toBeNull()
  })

  it("labels vacancy scale", () => {
    expect(vacancyScale(0)).toBeNull()
    expect(vacancyScale(10)?.label).toBe("Limited")
    expect(vacancyScale(60)?.label).toBe("Medium")
    expect(vacancyScale(300)?.label).toBe("Large")
    expect(vacancyScale(5000)).toMatchObject({ label: "Mega drive", percent: 92 })
  })

  it("gives short facts only", () => {
    expect(shortFact("<b>18-27 years</b>")).toBe("18-27 years")
    expect(shortFact("x".repeat(40))).toBeNull()
    expect(shortFact(null)).toBeNull()
  })

  it("summarises the fee for a KPI chip", () => {
    expect(feeKpi("General: Rs 500, SC: Nil")).toBe("Free onwards (up to ₹500)")
    expect(feeKpi("General: Rs 500, SC: Rs 250")).toBe("₹250 – ₹500")
    expect(feeKpi("General: Rs 100, OBC: Rs 100")).toBe("₹100")
    expect(feeKpi("Rs 100 for everyone")).toBe("Rs 100 for everyone")
    expect(feeKpi("a".repeat(60))).toBe(`${"a".repeat(42)}…`)
    expect(feeKpi(null)).toBeNull()
  })
})

describe("windowProgress", () => {
  it("returns the percent of the window elapsed", () => {
    expect(windowProgress(iso(-5), iso(5), NOW)).toBe(50)
    expect(windowProgress(iso(1), iso(5), NOW)).toBe(0)
    expect(windowProgress(iso(-5), iso(-1), NOW)).toBe(100)
    expect(windowProgress(iso(5), iso(1), NOW)).toBeNull()
    expect(windowProgress(null, iso(1), NOW)).toBeNull()
  })
})

describe("buildTimeline", () => {
  it("uses important dates sorted and marks the last", () => {
    const stages = buildTimeline({ "Exam Date": iso(10), "Start": iso(-10), "Bad": "TBA" }, null, null, NOW)
    expect(stages.map((s) => s.label)).toEqual(["Start", "Exam Date"])
    expect(stages[0].done).toBe(true)
    expect(stages[1]).toMatchObject({ done: false, isLast: true, key: "exam-date" })
  })

  it("falls back to start and last dates", () => {
    const stages = buildTimeline(null, iso(-1), iso(3), NOW)
    expect(stages.map((s) => s.key)).toEqual(["start", "last"])
    expect(stages[1].isLast).toBe(true)
    expect(buildTimeline({ Only: "TBA" }, null, "bad", NOW)).toEqual([])
  })
})

describe("inferSelectionSteps", () => {
  it("assigns icons by keyword", () => {
    expect(inferSelectionSteps("CBT\nPhysical Test (PET)\nInterview\nDocument Verification\nMedical\nFinal Merit\nOther")).toEqual([
      { label: "CBT", icon: "exam" },
      { label: "Physical Test (PET)", icon: "physical" },
      { label: "Interview", icon: "interview" },
      { label: "Document Verification", icon: "document" },
      { label: "Medical", icon: "medical" },
      { label: "Final Merit", icon: "final" },
      { label: "Other", icon: "other" },
    ])
    expect(inferSelectionSteps("")).toEqual([])
  })
})

describe("getDeadline", () => {
  it("reports closed, upcoming, open, urgent and none", () => {
    expect(getDeadline(null, iso(-1), "ACTIVE", NOW).state).toBe("closed")
    expect(getDeadline(null, iso(5), "EXPIRED", NOW).label).toBe("Applications closed")
    expect(getDeadline(iso(3), iso(30), "ACTIVE", NOW)).toMatchObject({ state: "upcoming", progress: 0 })
    expect(getDeadline(null, null, "UPCOMING", NOW)).toMatchObject({ state: "upcoming", label: "Opening soon" })
    expect(getDeadline(null, null, "ACTIVE", NOW)).toMatchObject({ state: "none", label: "Applications open" })
    expect(getDeadline(iso(-1), iso(20), "ACTIVE", NOW)).toMatchObject({ state: "open", daysLeft: 20, label: "20 days left" })
    expect(getDeadline(null, iso(3), "ACTIVE", NOW)).toMatchObject({ state: "urgent", daysLeft: 3 })
    expect(getDeadline(null, iso(0.5), "ACTIVE", NOW).label).toBe("Closes today")
  })
})

describe("buildDateRows", () => {
  it("merges stored dates with start/last and sorts unparseable last", () => {
    const rows = buildDateRows({ "Exam Date": iso(30), "Result": "To be notified" }, iso(-10), iso(10))
    expect(rows.map((r) => r.label)).toEqual(["Applications open", "Last date to apply", "Exam Date", "Result"])
    expect(rows[1].key).toBe(true)
    expect(rows[3]).toMatchObject({ value: "To be notified", ms: null })
  })

  it("does not duplicate start/last when already listed", () => {
    const rows = buildDateRows({ "Start Date": iso(-1), "Closing Date": iso(1) }, iso(-1), iso(1))
    expect(rows).toHaveLength(2)
    expect(buildDateRows(null, null, null)).toEqual([])
  })
})
