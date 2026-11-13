import { describe, expect, it } from "vitest"
import { assessQuality, copiedRatio, isThinJob, substantiveCount, type QualityInput } from "@/lib/ingest/quality"
import { autoApproveConfig, canAutoApprove } from "@/lib/ingest/policy"
import { NOTICE_TEXT, extraction } from "./fixtures"

const today = "2026-11-14"
function input(over: Partial<QualityInput> = {}): QualityInput {
  const ex = extraction()
  return {
    kind: "jobs",
    title: ex.title,
    department: ex.department,
    summary: ex.summary,
    lastDate: ex.lastDate,
    officialNotification: "https://cdn.s3waas.gov.in/s3abc/uploads/2026/11/dhs.pdf",
    applyLink: null,
    officialWebsite: "https://patna.nic.in",
    facts: { ...ex, importantDates: ex.importantDates ?? undefined },
    sourceText: NOTICE_TEXT,
    grounded: true,
    verifiedRatio: 1,
    llmConfidence: 0.92,
    ...over,
  }
}

describe("assessQuality", () => {
  it("scores a complete, verified, original post highly with no flags", () => {
    const q = assessQuality(input(), today)
    expect(q.reject).toBeNull()
    expect(q.flags).toEqual([])
    expect(q.score).toBeGreaterThanOrEqual(90)
    expect(q.confidence).toBeGreaterThan(0.9)
  })

  it.each([
    [{ title: "Notice" }, "missing or too-short title"],
    [{ department: null }, "missing department"],
    [{ officialNotification: "https://some-blog.example.com/a.pdf" }, "notification is not on an official domain"],
    [{ lastDate: "2026-11-01" }, "deadline already passed"],
  ])("rejects %o", (over, reason) => {
    expect(assessQuality(input(over as Partial<QualityInput>), today).reject).toBe(reason)
  })

  it("flags an overview copied from the notice (duplicate content)", () => {
    const copied = NOTICE_TEXT.split("\n").slice(4, 9).join(" ")
    const q = assessQuality(input({ summary: copied }), today)
    expect(q.flags.some((f) => f.startsWith("overview copies the notice"))).toBe(true)
  })

  it("flags thin posts, missing overviews and unofficial links", () => {
    const q = assessQuality(input({ summary: "Short.", facts: { lastDate: "2026-11-30" }, applyLink: "https://bit.ly/x" }), today)
    expect(q.flags).toEqual(
      expect.arrayContaining(["thin: fewer than 3 facts", "overview missing or too short", "apply link is not an official domain"]),
    )
    expect(q.score).toBeLessThan(50)
  })

  it("never treats a scanned (unverified) notice as high confidence", () => {
    const q = assessQuality(input({ grounded: false, verifiedRatio: 0 }), today)
    expect(q.flags).toContain("scanned notice - facts not machine-verified")
    expect(q.confidence).toBeLessThan(0.6)
  })
})

describe("thin-page rules", () => {
  it("counts substantive facts", () => {
    expect(substantiveCount({ totalVacancies: 5, education: "", ageLimit: null, importantDates: {} })).toBe(1)
  })
  it("treats a page with < 3 facts and no overview as thin", () => {
    expect(isThinJob({ lastDate: new Date() })).toBe(true)
    expect(isThinJob({ lastDate: new Date(), summary: "x".repeat(200) })).toBe(false)
    expect(isThinJob({ lastDate: new Date(), totalVacancies: 3, education: "10th" })).toBe(false)
  })
  it("copiedRatio is ~0 for a paraphrase and high for a copy", () => {
    expect(copiedRatio(extraction().summary!, NOTICE_TEXT)).toBeLessThan(0.1)
    expect(
      copiedRatio("Educational Qualification: GNM / B.Sc Nursing from a recognised institute and registration with Bihar Nurses Registration Council.", NOTICE_TEXT),
    ).toBeGreaterThan(0.9)
  })
})

describe("auto-approve policy", () => {
  const good = assessQuality(input(), today)
  it("is off unless explicitly enabled", () => {
    expect(canAutoApprove(good, autoApproveConfig({}), 0)).toBe(false)
  })
  it("approves only clean posts and respects the daily cap", () => {
    const cfg = autoApproveConfig({ INGEST_AUTO_APPROVE: "true", INGEST_AUTO_APPROVE_DAILY_CAP: "2" })
    expect(cfg).toMatchObject({ enabled: true, dailyCap: 2, minScore: 75, minConfidence: 0.85 })
    expect(canAutoApprove(good, cfg, 0)).toBe(true)
    expect(canAutoApprove(good, cfg, 2)).toBe(false)
    expect(canAutoApprove({ ...good, flags: ["no last date"] }, cfg, 0)).toBe(false)
    expect(canAutoApprove({ ...good, confidence: 0.7 }, cfg, 0)).toBe(false)
  })
})
