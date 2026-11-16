import { describe, expect, it } from "vitest"
import {
  dedupeHash,
  detectJobType,
  detectRemotePolicy,
  experienceLabel,
  extractPostingSkills,
  htmlToText,
  isFresherFriendly,
  isIndiaLocation,
  normalizeLocation,
  parseExperience,
  parseSalaryINR,
  salaryLabel,
  structuredSalaryINR,
} from "@/lib/private-jobs/normalize"

describe("salary", () => {
  it.each([
    ["₹6-9 LPA", 600_000, 900_000],
    ["CTC: 12 to 18 lakhs per annum", 1_200_000, 1_800_000],
    ["INR 4.5 L - 6 L", 450_000, 600_000],
    ["Rs. 25,000 - 35,000 per month", 300_000, 420_000],
    ["Salary 1.2 Cr", 12_000_000, null],
    ["₹8 LPA", 800_000, null],
    ["2-4 years of experience, 5 days a week. CTC ₹12-18 LPA.", 1_200_000, 1_800_000],
    ["Stipend: 15000 per month", 180_000, null],
  ])("parses %s", (text, min, max) => {
    expect(parseSalaryINR(text)).toEqual({ min, max })
  })

  it("refuses non-INR and unclear text rather than guessing", () => {
    expect(parseSalaryINR("$120k - $150k")).toEqual({ min: null, max: null })
    expect(parseSalaryINR("Competitive salary, 5 days a week")).toEqual({ min: null, max: null })
    expect(parseSalaryINR("Rs 5 joining bonus")).toEqual({ min: null, max: null })
  })

  it("converts structured ranges and labels them", () => {
    expect(structuredSalaryINR({ min: 50000, max: 80000, currency: "INR", interval: "per-month-salary" })).toEqual({ min: 600000, max: 960000 })
    expect(structuredSalaryINR({ min: 100000, currency: "USD", interval: "per-year-salary" })).toEqual({ min: null, max: null })
    expect(salaryLabel(600000, 900000)).toBe("₹6-9 LPA")
    expect(salaryLabel(1250000, null)).toBe("₹12.5+ LPA")
    expect(salaryLabel(null, null)).toBeNull()
  })
})

describe("experience", () => {
  it.each([
    ["3-5 years of experience", 3, 5],
    ["Minimum 4 years in backend", 4, null],
    ["2+ yrs React", 2, null],
    ["Freshers welcome", 0, 1],
    ["Great team culture", null, null],
  ])("parses %s", (text, min, max) => {
    expect(parseExperience(text)).toEqual({ min, max })
  })

  it("labels and flags fresher roles", () => {
    expect(experienceLabel(0, 1)).toBe("Fresher (0-1 yrs)")
    expect(experienceLabel(3, null)).toBe("3+ yrs")
    expect(isFresherFriendly("Graduate Engineer Trainee", { min: null, max: null })).toBe(true)
    expect(isFresherFriendly("Senior Backend Engineer", { min: 0, max: 1 })).toBe(false)
    expect(isFresherFriendly("Backend Engineer", { min: 0, max: 2 })).toBe(true)
  })
})

describe("location, work mode and type", () => {
  it("recognises Indian locations and canonicalises city names", () => {
    expect(isIndiaLocation("Bangalore, Karnataka")).toBe(true)
    expect(isIndiaLocation("Gurgaon")).toBe(true)
    expect(isIndiaLocation("San Francisco, CA")).toBe(false)
    expect(normalizeLocation("Bangalore, Karnataka, India")).toBe("Bengaluru, Karnataka, India")
    expect(normalizeLocation("Gurgaon / Bangalore / bengaluru")).toBe("Gurugram, Bengaluru")
  })

  it("detects work mode and job type", () => {
    expect(detectRemotePolicy("remote", "Pune", "Engineer")).toBe("REMOTE")
    expect(detectRemotePolicy(null, "Pune (Hybrid)", "Engineer")).toBe("HYBRID")
    expect(detectRemotePolicy(null, "Remote - India", "Engineer")).toBe("REMOTE")
    expect(detectRemotePolicy(null, "Pune", "Engineer")).toBe("ONSITE")
    expect(detectJobType("Intern", "Software Engineer")).toBe("INTERNSHIP")
    expect(detectJobType(null, "Contract - Data Analyst")).toBe("CONTRACT")
    expect(detectJobType("Full-time", "Engineer")).toBe("FULL_TIME")
  })
})

describe("skills, text and hashes", () => {
  it("matches skills on word boundaries only", () => {
    const skills = extractPostingSkills("Senior React Developer", "We use TypeScript, Node.js and PostgreSQL. Go-to-market experience is a plus.")
    expect(skills[0]).toBe("React")
    expect(skills).toContain("TypeScript")
    expect(skills).not.toContain("Go")
    expect(skills).not.toContain("C")
  })

  it("turns HTML (including entity-encoded HTML) into readable text", () => {
    expect(htmlToText("<p>Hello&nbsp;<b>world</b></p><ul><li>One</li><li>Two</li></ul>")).toBe("Hello world\n• One\n• Two")
    expect(htmlToText(htmlToText("&lt;p&gt;Build &amp;amp; ship&lt;/p&gt;"))).toBe("Build & ship")
  })

  it("dedupe hash ignores case, seniority abbreviations and extra cities", () => {
    expect(dedupeHash("Acme", "Sr. Backend Engineer", "Bangalore, India")).toBe(dedupeHash("acme", "Senior Backend Engineer", "Bengaluru"))
    expect(dedupeHash("Acme", "Backend Engineer", "Pune")).not.toBe(dedupeHash("Acme", "Backend Engineer", "Mumbai"))
  })
})
