import { describe, expect, it } from "vitest"
import {
  applicationSchema,
  companyOtpSendSchema,
  companyOtpVerifySchema,
  discussionCommentSchema,
  featuredItemSchema,
  jobReferralSchema,
  jobSchema,
  loginSchema,
  notificationSchema,
  privateJobSchema,
  registerSchema,
  resultSchema,
  reviewActionSchema,
  searchSchema,
} from "@/lib/validations"

describe("auth schemas", () => {
  it("validates login", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true)
    expect(loginSchema.safeParse({ email: "nope", password: "" }).success).toBe(false)
  })

  it("requires matching passwords of at least 8 chars", () => {
    const ok = { name: "Asha", email: "a@b.co", password: "longpass1", confirmPassword: "longpass1" }
    expect(registerSchema.safeParse(ok).success).toBe(true)
    const mismatch = registerSchema.safeParse({ ...ok, confirmPassword: "different" })
    expect(mismatch.success).toBe(false)
    expect(mismatch.error?.issues[0].path).toEqual(["confirmPassword"])
    expect(registerSchema.safeParse({ ...ok, password: "short", confirmPassword: "short" }).success).toBe(false)
  })
})

describe("content schemas", () => {
  const base = { title: "SSC CGL", slug: "ssc-cgl", departmentId: " d1 ", categoryId: "c1" }

  it("trims required ids and normalises 'none' sentinels to null", () => {
    const parsed = jobSchema.parse({ ...base, stateId: "__none", totalVacancies: "120", lastDate: "2026-07-01" })
    expect(parsed.departmentId).toBe("d1")
    expect(parsed.stateId).toBeNull()
    expect(parsed.totalVacancies).toBe(120)
    expect(parsed.lastDate).toBeInstanceOf(Date)
    expect(parsed.status).toBe("ACTIVE")
    for (const v of ["none", "None", "   ", "__draft"]) expect(jobSchema.parse({ ...base, stateId: v }).stateId).toBeNull()
  })

  it("rejects a missing required selection", () => {
    expect(jobSchema.safeParse({ ...base, departmentId: "  " }).success).toBe(false)
    expect(resultSchema.safeParse({ ...base, categoryId: "" }).success).toBe(false)
  })

  it("accepts absolute or root-relative notification urls", () => {
    const n = { title: "t", slug: "s", categoryId: "c" }
    expect(notificationSchema.safeParse({ ...n, officialUrl: "https://x.gov.in" }).success).toBe(true)
    expect(notificationSchema.safeParse({ ...n, officialUrl: "/jobs/x" }).success).toBe(true)
    expect(notificationSchema.safeParse({ ...n, officialUrl: "x.gov.in" }).success).toBe(false)
  })
})

describe("discussion comments", () => {
  const c = { content: "Hello", postType: "JOB", postId: "p1" }
  it("defaults the kind and only allows cloudinary images", () => {
    expect(discussionCommentSchema.parse(c).kind).toBe("GENERAL")
    expect(discussionCommentSchema.safeParse({ ...c, imageUrl: "https://res.cloudinary.com/x/y.png" }).success).toBe(true)
    expect(discussionCommentSchema.safeParse({ ...c, imageUrl: "https://evil.example/y.png" }).success).toBe(false)
    expect(discussionCommentSchema.safeParse({ ...c, postType: "OTHER" }).success).toBe(false)
    expect(discussionCommentSchema.safeParse({ ...c, content: "" }).success).toBe(false)
  })
})

describe("review actions", () => {
  it("requires a note when rejecting", () => {
    expect(reviewActionSchema.safeParse({ entity: "Job", id: "1", action: "APPROVE" }).success).toBe(true)
    expect(reviewActionSchema.safeParse({ entity: "Job", id: "1", action: "REJECT" }).success).toBe(false)
    expect(reviewActionSchema.safeParse({ entity: "Job", id: "1", action: "REJECT", note: "  " }).success).toBe(false)
    expect(reviewActionSchema.safeParse({ entity: "Job", id: "1", action: "REJECT", note: "dup" }).success).toBe(true)
  })
})

describe("private jobs", () => {
  const p = { title: "Dev", slug: "dev", type: "FULL_TIME" }
  it("requires exactly one of companyId or companyName", () => {
    expect(privateJobSchema.safeParse({ ...p, companyId: "c1" }).success).toBe(true)
    expect(privateJobSchema.safeParse({ ...p, companyName: " Acme " }).success).toBe(true)
    expect(privateJobSchema.safeParse({ ...p, companyName: "   " }).success).toBe(false)
    expect(privateJobSchema.safeParse({ ...p, companyId: "c1", companyName: "Acme" }).success).toBe(false)
  })
  it("caps experience at 30 years", () => {
    expect(privateJobSchema.safeParse({ ...p, companyId: "c1", expMax: 31 }).success).toBe(false)
  })
})

describe("employer schemas", () => {
  it("needs a company or a new name + domain", () => {
    expect(companyOtpSendSchema.safeParse({ companyId: "c1", workEmail: "hr@acme.com" }).success).toBe(true)
    expect(companyOtpSendSchema.safeParse({ name: "Acme", domain: "acme.com", workEmail: "hr@acme.com" }).success).toBe(true)
    expect(companyOtpSendSchema.safeParse({ name: "Acme", workEmail: "hr@acme.com" }).success).toBe(false)
  })
  it("accepts only 6-digit codes", () => {
    expect(companyOtpVerifySchema.safeParse({ challengeId: "x", otp: " 123456 " }).success).toBe(true)
    expect(companyOtpVerifySchema.safeParse({ challengeId: "x", otp: "12345a" }).success).toBe(false)
  })
  it("validates referrals", () => {
    const r = { title: "Engineer", companyName: "Acme", url: "https://acme.com/jobs/1" }
    expect(jobReferralSchema.safeParse({ ...r, proofUrl: "" }).success).toBe(true)
    expect(jobReferralSchema.safeParse({ ...r, url: "acme" }).success).toBe(false)
  })
})

describe("misc schemas", () => {
  it("applies defaults and coercion", () => {
    expect(applicationSchema.parse({ jobId: "j" })).toEqual({ jobId: "j", type: "job", status: "interested" })
    expect(searchSchema.parse({ page: "2" })).toMatchObject({ page: 2, limit: 10, order: "desc" })
    expect(searchSchema.safeParse({ limit: "500" }).success).toBe(false)
    const f = featuredItemSchema.parse({ title: "t", type: "JOB", linkUrl: "/x" })
    expect(f).toMatchObject({ ctaLabel: "View Details", isActive: true, isPinned: false })
  })
})
