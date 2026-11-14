import { describe, expect, it } from "vitest"
import {
  cleanText,
  contentHash,
  isOfficialUrl,
  isStaleListing,
  jaccard,
  normalizeUrl,
  parseIndianDate,
  titleTokens,
  todayIST,
  urlHash,
} from "@/lib/ingest/normalize"

describe("normalizeUrl / urlHash", () => {
  it("drops fragments, tracking params and trailing slashes, keeps real params sorted", () => {
    expect(normalizeUrl("HTTPS://Patna.NIC.in/notice/?b=2&utm_source=x&a=1#top")).toBe("https://patna.nic.in/notice?a=1&b=2")
  })
  it("resolves relative links against the page", () => {
    expect(normalizeUrl("../uploads/a.pdf", "https://x.gov.in/notices/list/")).toBe("https://x.gov.in/notices/uploads/a.pdf")
  })
  it("rejects non-http schemes", () => {
    expect(normalizeUrl("javascript:alert(1)")).toBeNull()
    expect(normalizeUrl("mailto:a@b.in")).toBeNull()
  })
  it("treats http/https and www as the same document", () => {
    expect(urlHash("http://www.ibps.in/a.pdf")).toBe(urlHash("https://ibps.in/a.pdf"))
    expect(urlHash("https://ibps.in/a.pdf")).not.toBe(urlHash("https://ibps.in/b.pdf"))
  })
})

describe("parseIndianDate", () => {
  it.each([
    ["24/09/2026", "2026-09-24"],
    ["05-11-2026", "2026-11-05"],
    ["5.1.26", "2026-01-05"],
    ["13-Nov-2026", "2026-11-13"],
    ["15th December, 2026", "2026-12-15"],
    ["December 15, 2026", "2026-12-15"],
    ["2026-03-01T00:00:00Z", "2026-03-01"],
    ["Last date: 31/10/2026 (5 PM)", "2026-10-31"],
  ])("%s → %s", (raw, iso) => {
    expect(parseIndianDate(raw)).toBe(iso)
  })
  it("reads numeric dates day-first and rejects impossible ones", () => {
    expect(parseIndianDate("02/03/2026")).toBe("2026-03-02")
    expect(parseIndianDate("31/02/2026")).toBeNull()
    expect(parseIndianDate("13/13/2026")).toBeNull()
    expect(parseIndianDate("soon")).toBeNull()
    expect(parseIndianDate(undefined)).toBeNull()
  })
})

describe("todayIST", () => {
  it("rolls over at IST midnight, not UTC midnight", () => {
    expect(todayIST(new Date("2026-11-13T18:29:00Z"))).toBe("2026-11-13")
    expect(todayIST(new Date("2026-11-13T18:31:00Z"))).toBe("2026-11-14")
  })
})

describe("isOfficialUrl", () => {
  it("accepts restricted government / academic registries", () => {
    expect(isOfficialUrl("https://patna.nic.in/x.pdf")).toBe(true)
    expect(isOfficialUrl("https://cdn.s3waas.gov.in/x.pdf")).toBe(true)
    expect(isOfficialUrl("https://www.iitb.ac.in/jobs")).toBe(true)
  })
  it("rejects open registries unless allow-listed", () => {
    expect(isOfficialUrl("https://sarkari-jobs.org.in/x")).toBe(false)
    expect(isOfficialUrl("https://www.ibps.in/x.pdf")).toBe(false)
    expect(isOfficialUrl("https://www.ibps.in/x.pdf", ["ibps.in"])).toBe(true)
    expect(isOfficialUrl("https://evilibps.in/x.pdf", ["ibps.in"])).toBe(false)
    expect(isOfficialUrl("not a url")).toBe(false)
    expect(isOfficialUrl(null)).toBe(false)
  })
})

describe("titles and fingerprints", () => {
  it("ignores boilerplate words when comparing titles", () => {
    const a = titleTokens("Recruitment of Staff Nurse Posts - District Health Society, Patna")
    const b = titleTokens("Staff Nurse Vacancy Notice District Health Society Patna")
    expect(jaccard(a, b)).toBe(1)
    expect(jaccard(a, titleTokens("BPSC 70th CCE Result"))).toBeLessThan(0.2)
  })
  it("collides for the same notice from two sources, differs for another deadline", () => {
    const base = { kind: "jobs", department: "Bihar Public Service Commission", advertisementNo: "Advt. No. 04/2026", title: "Assistant Professor" }
    expect(contentHash({ ...base, lastDate: "2026-12-01" })).toBe(contentHash({ ...base, advertisementNo: "advt no 04/2026", title: "Other wording", lastDate: "2026-12-01" }))
    expect(contentHash({ ...base, lastDate: "2026-12-01" })).not.toBe(contentHash({ ...base, lastDate: "2026-12-15" }))
  })
  it("cleanText strips control chars and collapses whitespace", () => {
    expect(cleanText(" a\u0000\n\n b\t c ")).toBe("a b c")
  })
})

describe("isStaleListing", () => {
  const today = "2026-11-14"
  it("uses the end date when the board prints one", () => {
    expect(isStaleListing({ title: "x", endDate: "31/10/2026" }, today)).toBe(true)
    expect(isStaleListing({ title: "x", endDate: "30/11/2026" }, today)).toBe(false)
  })
  it("drops archive entries whose every printed date is old", () => {
    expect(isStaleListing({ title: "Result dated 11.01.2025 for PGT" }, today)).toBe(true)
    expect(isStaleListing({ title: "Announcement dated 13.11.2026 regarding interview" }, today)).toBe(false)
  })
  it("keeps undated items (the LLM + server decide)", () => {
    expect(isStaleListing({ title: "Notification for CRP PO/MT-XVI" }, today)).toBe(false)
  })
})
