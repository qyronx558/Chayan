import { describe, expect, it } from "vitest"
import { ageOn, buildStrengthSteps, interestRank, journeySentence, lakhsFromRupees, normalizeProfileResponse, rupeesFromLakhs } from "@/lib/profile"
import { profileUpdateSchema } from "@/lib/profile-schemas"

const base = { email: "a@b.co", id: "u1", name: "Asha Rao" }

describe("career paths", () => {
  it("computes age in years and months, respecting the day of month", () => {
    expect(ageOn("2000-05-20", new Date(2026, 4, 19))).toEqual({ years: 25, months: 11 })
    expect(ageOn("2000-05-20", new Date(2026, 4, 20))).toEqual({ years: 26, months: 0 })
    expect(ageOn("", new Date())).toBeNull()
    expect(ageOn("2999-01-01", new Date(2026, 0, 1))).toBeNull()
  })

  it("round-trips salary between lakhs and rupees", () => {
    expect(rupeesFromLakhs("4.5")).toBe(450000)
    expect(lakhsFromRupees(450000)).toBe("4.5")
    expect(rupeesFromLakhs("abc")).toBeNull()
    expect(lakhsFromRupees(null)).toBe("")
  })

  it("ranks the road you lean on first, defaulting to open", () => {
    expect(interestRank("active")).toBeGreaterThan(interestRank(null))
    expect(interestRank(null)).toBeGreaterThan(interestRank("paused"))
  })

  it("describes the journey without favouring either road", () => {
    expect(journeySentence("active", "active")).toMatch(/both/)
    expect(journeySentence(null, null)).toMatch(/both roads open/i)
    expect(journeySentence("paused", "active")).toBe("Focused on company jobs.")
    expect(journeySentence("active", "paused")).toBe("Focused on the government road.")
  })

  it("gives members one strength step per road", () => {
    const p = normalizeProfileResponse({ ...base, qualification: "Graduate", preferredStates: ["Bihar"], experienceYears: 0, skills: ["Excel"] })!
    const steps = buildStrengthSteps(p, { applications: 0, privateApplications: 1, bookmarks: 0, comments: 0 })
    const byKey = Object.fromEntries(steps.map((s) => [s.key, s.done]))
    expect(byKey["gov-path"]).toBe(true)
    expect(byKey["private-path"]).toBe(true)
    expect(byKey["tracker"]).toBe(true)
  })

  it("keeps fresher (0 years) distinct from unknown", () => {
    expect(normalizeProfileResponse({ ...base, experienceYears: 0 })!.experienceYears).toBe(0)
    expect(normalizeProfileResponse(base)!.experienceYears).toBeNull()
  })

  it("validates the private-road fields", () => {
    const ok = profileUpdateSchema.safeParse({ name: "Asha", language: "English", workModes: ["REMOTE"], jobTypes: ["INTERNSHIP"], experienceYears: 2, privateInterest: "active" })
    expect(ok.success).toBe(true)
    expect(profileUpdateSchema.safeParse({ name: "Asha", language: "English", workModes: ["MOON"] }).success).toBe(false)
    expect(profileUpdateSchema.safeParse({ name: "Asha", language: "English", skills: Array.from({ length: 21 }, (_, i) => `s${i}`) }).success).toBe(false)
  })
})
