import { describe, expect, it } from "vitest"
import { triageNotice } from "@/lib/ingest/classify"

describe("triageNotice", () => {
  it("reads file-name style titles with underscores", () => {
    expect(triageNotice("MICRO_BIOLOGIST-2026_ADVERTISEMENT (08-09-2026)")).toMatchObject({ relevant: true, kind: "jobs" })
  })
  it("treats a bare advertisement as a job unless it is a tender", () => {
    expect(triageNotice("Advertisement No. 12/2026 District Health Society").relevant).toBe(true)
    expect(triageNotice("Advertisement for e-tender of computer supply").relevant).toBe(false)
  })
  it.each([
    ["Recruitment of Staff Nurse on contract basis", "jobs"],
    ["Walk-in interview for Medical Officer", "jobs"],
    ["Advertisement for the posts of Assistant Professor", "jobs"],
    ["संविदा आधारित नियोजन हेतु विज्ञापन - भर्ती", "jobs"],
    ["Final Result of Combined Competitive Examination", "results"],
    ["Merit list of ANM candidates", "results"],
    ["Download admit card for PRT exam", "admit-cards"],
    ["Final Answer Key for the post of Primary Teacher", "answer-keys"],
    ["Revised syllabus for CCE Mains", "syllabus"],
    ["Admission notice for B.Ed session 2026-28", "admissions"],
  ])("%s → %s", (title, kind) => {
    const t = triageNotice(title)
    expect(t.relevant).toBe(true)
    expect(t.kind).toBe(kind)
  })

  it.each([
    "E-Tender for construction of community hall",
    "Quotation for supply of stationery",
    "Transfer and posting order of BDOs",
    "Minutes of the district coordination meeting",
    "निविदा सूचना - भवन निर्माण",
    "Public holiday list 2027",
  ])("drops noise: %s", (title) => {
    expect(triageNotice(title).relevant).toBe(false)
  })

  it("keeps a recruitment even if the title mentions a meeting", () => {
    expect(triageNotice("Recruitment of data entry operators - meeting hall interview").relevant).toBe(true)
  })

  it("uses the description when the title alone is vague", () => {
    expect(triageNotice("Important notice", "Applications invited for 12 posts of Panchayat Secretary").kind).toBe("jobs")
    expect(triageNotice("Notice").relevant).toBe(false)
  })
})
