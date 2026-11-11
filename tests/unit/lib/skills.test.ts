import { describe, expect, it } from "vitest"
import {
  computeMatchScore,
  extractEducationLevel,
  extractExperienceYears,
  extractLocations,
  extractSkills,
  generateImprovementTips,
  SKILLS,
} from "@/lib/skills"

const job = (overrides: Partial<Parameters<typeof computeMatchScore>[4]> = {}) => ({
  title: "React Developer",
  description: "Build apps with React and TypeScript. B.Tech required.",
  category: "IT",
  location: "Bangalore",
  experience: "3 years",
  salary: null,
  ...overrides,
})

describe("resume text extraction", () => {
  it("finds known skills case-insensitively, sorted and unique", () => {
    const skills = extractSkills("Worked on react, TYPESCRIPT and Docker. React again.")
    expect(skills).toEqual(expect.arrayContaining(["React", "TypeScript", "Docker"]))
    expect(skills).toEqual([...skills].sort())
    expect(new Set(skills).size).toBe(skills.length)
    expect(SKILLS.length).toBeGreaterThan(50)
  })

  it("reads years of experience from common phrasings", () => {
    expect(extractExperienceYears("5+ years of experience in sales")).toBe(5)
    expect(extractExperienceYears("Experience: 2-4 years")).toBe(2)
    expect(extractExperienceYears("3 yrs in support")).toBe(3)
    expect(extractExperienceYears("fresher")).toBe(0)
  })

  it("detects the education level", () => {
    expect(extractEducationLevel("Completed B.Tech in CSE")).toBe("bachelor")
    expect(extractEducationLevel("MCA from IGNOU")).toBe("master")
    expect(extractEducationLevel("PhD in physics")).toBe("phd")
    expect(extractEducationLevel("passed 10th")).toBe("10th")
    expect(extractEducationLevel("xyz")).toBe("unknown")
  })

  it("normalises city aliases and remote work", () => {
    expect(extractLocations("Based in Bengaluru, open to WFH or Gurugram")).toEqual(["Bangalore", "Gurgaon", "Remote"])
    expect(extractLocations("nowhere")).toEqual([])
  })
})

describe("computeMatchScore", () => {
  it("scores a strong match highly", () => {
    const result = computeMatchScore(["React", "TypeScript"], 4, "bachelor", ["Bangalore"], job())
    expect(result.matchedSkills).toEqual(["React", "TypeScript"])
    expect(result.score).toBe(100)
    expect(result.details).toContain("Location compatible")
    expect(result.details.some((d) => d.startsWith("Experience meets"))).toBe(true)
  })

  it("gives partial credit for less experience and no matching skills", () => {
    const result = computeMatchScore(["Python"], 1, "unknown", ["Delhi"], job())
    expect(result.matchedSkills).toEqual([])
    // skills 0 + exp round(1/3*10)=3 + edu 10 + loc 0
    expect(result.score).toBe(13)
    expect(result.details).toContain("Experience: 1yrs (need 3yrs)")
  })

  it("uses defaults when the job has no experience or location", () => {
    const result = computeMatchScore([], 0, "bachelor", [], job({ experience: null, location: null }))
    // skills 0 + exp 10 + edu 15 + loc 10
    expect(result.score).toBe(35)
  })

  it("treats remote jobs as location compatible", () => {
    const result = computeMatchScore([], 2, "unknown", ["Delhi"], job({ location: "Remote", experience: "no number" }))
    expect(result.details).toContain("Location compatible")
  })
})

describe("generateImprovementTips", () => {
  it("suggests improvements for weak profiles", () => {
    const tips = generateImprovementTips(30, [], ["Python"], job())
    expect(tips).toContain("Your profile needs significant improvement to match this role")
    expect(tips).toContain("Add more relevant skills from your experience to your resume")
    expect(tips).toContain("Gain 3+ years of experience in this domain")
  })

  it("encourages good and strong candidates", () => {
    expect(generateImprovementTips(75, ["a", "b", "c"], [], job({ experience: null }))).toEqual([
      "You are a strong candidate! Highlight your achievements in the application",
    ])
    expect(generateImprovementTips(55, [], [], job({ experience: null }))).toEqual([
      "You have a good profile. Tailor your resume to emphasize matching skills",
    ])
  })
})
