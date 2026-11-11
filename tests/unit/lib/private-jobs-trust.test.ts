import { describe, expect, it } from "vitest"
import { buildEmailApplyTemplate, buildPrepKit, computeTrustScore, formatSalaryRange } from "@/lib/private-jobs-trust"

describe("computeTrustScore", () => {
  it("rates a verified employer with matching domain and proof as Verified", () => {
    const r = computeTrustScore({
      applicationUrl: "https://careers.acme.com/job/1",
      companyWebsite: "https://www.acme.com",
      companyVerified: true,
      proofUrl: "https://acme.com/proof",
      applicationEmail: "hr@acme.com",
    })
    expect(r.label).toBe("Verified")
    expect(r.score).toBe(100)
    expect(r.hostname).toBe("careers.acme.com")
    expect(r.reasons).toContain("Apply link matches acme.com")
    expect(r.reasons.length).toBeLessThanOrEqual(5)
  })

  it("gives credit for known ATS platforms", () => {
    const r = computeTrustScore({ applicationUrl: "https://jobs.lever.co/acme", companyWebsite: "acme.com" })
    expect(r.reasons).toContain("Known ATS / job platform")
    expect(r.score).toBe(32)
    expect(r.label).toBe("Unverified")
  })

  it("gives a little credit for any external link", () => {
    expect(computeTrustScore({ applicationUrl: "https://x.example" }).score).toBe(28)
  })

  it("penalises free email, scam patterns and missing apply routes", () => {
    const scam = computeTrustScore({
      applicationEmail: "hr.jobs@gmail.com",
      description: "Pay a refundable security deposit. Contact on telegram to pay fee. Earn ₹ 50000 per day",
    })
    expect(scam.label).toBe("Risky")
    expect(scam.score).toBe(0)
    expect(scam.reasons).toContain("Free email apply - verify HR identity")
    expect(scam.reasons.some((r) => r.includes("fee/deposit"))).toBe(true)

    const empty = computeTrustScore({})
    expect(empty.score).toBe(5)
    expect(empty.reasons).toContain("No apply link or email")
    expect(empty.hostname).toBeNull()
  })

  it("rewards a company-domain email", () => {
    const r = computeTrustScore({ applicationEmail: "jobs@acme.in" })
    expect(r.score).toBe(28)
    expect(r.reasons).toContain("Company-domain email")
  })
})

describe("buildPrepKit", () => {
  it("builds keyword-triggered questions capped at 8", () => {
    const kit = buildPrepKit({
      title: "Sales Executive",
      description: "Business development, customer support, Excel and SQL dashboards, walk-in interview",
      skills: ["Excel", "SQL"],
      experience: "2 years",
    })
    expect(kit.questions[0].q).toContain("Sales Executive")
    expect(kit.questions.length).toBeLessThanOrEqual(8)
    expect(kit.questions.some((q) => q.q.includes("pipeline"))).toBe(true)
    expect(kit.checklist).toContain("Align your 2 years experience to the top 3 responsibilities")
    expect(kit.docs.length).toBe(5)
  })

  it("extracts skills from the text when none are given", () => {
    const kit = buildPrepKit({ title: "Python Developer", description: "Django APIs" })
    expect(kit.questions.some((q) => q.q.includes("Python"))).toBe(true)
    expect(kit.questions.some((q) => q.q.includes("toughest bug"))).toBe(true)
    expect(kit.checklist.at(-1)).toMatch(/projects\/internships/)
    expect(kit.questions.at(-1)?.q).toMatch(/salary expectation/)
  })
})

describe("buildEmailApplyTemplate", () => {
  it("fills in the applicant and skills", () => {
    const t = buildEmailApplyTemplate({ jobTitle: "Analyst", company: "Acme", applicantName: "Asha", skills: ["SQL", "Excel"] })
    expect(t.subject).toBe("Application for Analyst - Asha")
    expect(t.body).toContain("Key skills: SQL, Excel.")
    expect(t.body).toContain("Asha")
  })
  it("uses placeholders when the name is missing", () => {
    const t = buildEmailApplyTemplate({ jobTitle: "Analyst", company: "Acme" })
    expect(t.subject).toBe("Application for Analyst - Candidate")
    expect(t.body).toContain("Your Name")
    expect(t.body).not.toContain("Key skills")
  })
})

describe("formatSalaryRange", () => {
  it("formats ranges in lakhs and rupees", () => {
    expect(formatSalaryRange(300000, 650000)).toBe("₹3L – ₹6.5L")
    expect(formatSalaryRange(25000, null)).toBe("₹25,000+")
    expect(formatSalaryRange(null, 500000)).toBe("Up to ₹5L")
    expect(formatSalaryRange(500000, 500000)).toBe("₹5L+")
    expect(formatSalaryRange(null, null, "As per norms")).toBe("As per norms")
    expect(formatSalaryRange()).toBeNull()
  })
})
