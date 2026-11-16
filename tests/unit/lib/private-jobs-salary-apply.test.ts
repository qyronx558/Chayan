import { describe, expect, it } from "vitest"
import {
  currencyForCountry,
  formatInr,
  formatLocal,
  normalizeJobSalary,
  parseForeignSalary,
  salaryDisplay,
  salaryInrHint,
  structuredSalary,
  toInr,
} from "@/lib/private-jobs/salary"
import { inAppApplyUrl } from "@/lib/private-jobs/apply-url"
import { proxyCannotRender } from "@/lib/apply-room"
import { formatSalaryRange } from "@/lib/private-jobs-trust"
import { buildJobFields } from "@/lib/private-jobs/feed-sync"
import type { FeedPosting } from "@/lib/private-jobs/feeds"
import type { FeedContext } from "@/lib/private-jobs/feed-sync"

const ctx: FeedContext = {
  id: "f1", provider: "GREENHOUSE" as FeedContext["provider"], boardToken: "acme", boardUrl: "https://boards.greenhouse.io/acme", indiaOnly: false, createdById: null,
  company: { id: "c1", name: "Acme", website: null, verified: false },
} as FeedContext

describe("salary currency", () => {
  it("maps countries to their currency", () => {
    expect(currencyForCountry("IN")).toBe("INR")
    expect(currencyForCountry("US")).toBe("USD")
    expect(currencyForCountry("DE")).toBe("EUR")
    expect(currencyForCountry("GB")).toBe("GBP")
    expect(currencyForCountry("ZZ")).toBe("USD")
  })

  it("keeps structured pay in its own currency, yearly", () => {
    expect(structuredSalary({ min: 150000, max: 200000, currency: "usd", interval: "per-year" })).toEqual({ min: 150000, max: 200000, currency: "USD" })
    expect(structuredSalary({ min: 5000, max: 6000, currency: "EUR", interval: "per-month" })).toEqual({ min: 60000, max: 72000, currency: "EUR" })
    expect(structuredSalary({ min: 40, max: 60, currency: "USD", interval: "hourly" })).toEqual({ min: 83200, max: 124800, currency: "USD" })
    expect(structuredSalary({ min: 1, max: 2, currency: "XYZ" })).toBeNull()
    expect(structuredSalary({ min: 5, max: 9, currency: "USD", interval: "year" })).toBeNull() // not a salary
  })

  it("parses foreign ranges from text only in a pay context", () => {
    expect(parseForeignSalary("The base salary range for this role is $150,000 - $200,000 USD.", "US")).toEqual({ min: 150000, max: 200000, currency: "USD" })
    expect(parseForeignSalary("Salary: €60.000–€80.000 per year", "DE")).toEqual({ min: 60000, max: 80000, currency: "EUR" })
    expect(parseForeignSalary("Compensation £45k to £55k", "GB")).toEqual({ min: 45000, max: 55000, currency: "GBP" })
    expect(parseForeignSalary("Pay range: CAD 90K-110K", "CA")).toEqual({ min: 90000, max: 110000, currency: "CAD" })
    expect(parseForeignSalary("We raised $50M - $80M from investors", "US")).toBeNull()
    expect(parseForeignSalary("Our revenue grew from $5 to $9 per share", "US")).toBeNull()
  })

  it("formats India in LPA and abroad in local currency", () => {
    expect(formatInr(600000, 900000)).toBe("₹6-9 LPA")
    expect(formatInr(12_000_000, 15_000_000)).toBe("₹1.2-1.5 Cr")
    expect(formatLocal(150000, 200000, "USD")).toBe("$150K-$200K/yr")
    const job = { salaryMin: toInr(150000, "USD"), salaryMax: toInr(200000, "USD"), salaryCurrency: "USD", salaryLocalMin: 150000, salaryLocalMax: 200000 }
    expect(salaryDisplay(job)).toBe("$150K-$200K/yr")
    expect(salaryInrHint(job)).toMatch(/^≈ ₹1\.3-1\.7 Cr$/)
    expect(formatSalaryRange(job.salaryMin, job.salaryMax, null, job)).toBe("$150K-$200K/yr")
    expect(salaryInrHint({ salaryMin: 600000, salaryMax: 900000 })).toBeNull()
  })

  it("normalizes admin-entered salaries", () => {
    const usd = { salaryMin: 100000, salaryMax: 120000, salaryCurrency: "usd" as string | null }
    normalizeJobSalary(usd)
    expect(usd).toMatchObject({ salaryCurrency: "USD", salaryLocalMin: 100000, salaryLocalMax: 120000, salaryMin: 8_400_000, salaryMax: 10_080_000 })
    const inr: Record<string, unknown> = { salaryMin: 600000, salaryCurrency: "INR" }
    normalizeJobSalary(inr)
    expect(inr).toMatchObject({ salaryMin: 600000, salaryCurrency: null, salaryLocalMin: null })
    const untouched: Record<string, unknown> = { title: "x" }
    normalizeJobSalary(untouched)
    expect(untouched).toEqual({ title: "x" })
  })

  it("feed jobs abroad keep their currency; Indian jobs stay in rupees", () => {
    const base: FeedPosting = {
      externalId: "1", title: "Engineer", location: "New York, NY", locations: [], descriptionText: "Build things.", applyUrl: "https://x.test/1",
      department: null, commitment: null, workplaceType: null, salary: { min: 150000, max: 200000, currency: "USD", interval: "per-year" }, postedAt: null,
      country: "US", city: "New York",
    }
    const us = buildJobFields(base, ctx)
    expect(us).toMatchObject({ salaryCurrency: "USD", salaryLocalMin: 150000, salaryMin: 12_600_000, salary: "$150K-$200K/yr" })
    const india = buildJobFields({ ...base, location: "Bengaluru", country: "IN", city: "Bengaluru", salary: null, descriptionText: "CTC: ₹12-18 LPA" }, ctx)
    expect(india).toMatchObject({ salaryCurrency: null, salaryMin: 1_200_000, salaryMax: 1_800_000 })
  })
})

describe("in-app apply URLs", () => {
  it("uses the Greenhouse embeddable form, also for custom domains", () => {
    expect(inAppApplyUrl("https://boards.greenhouse.io/stripe/jobs/123")).toBe("https://job-boards.greenhouse.io/embed/job_app?for=stripe&token=123")
    expect(inAppApplyUrl("https://stripe.com/jobs/search?gh_jid=123", { feed: { provider: "GREENHOUSE", boardToken: "stripe" }, externalId: "123" })).toBe(
      "https://job-boards.greenhouse.io/embed/job_app?for=stripe&token=123"
    )
  })
  it("opens Lever and Workable on their application step", () => {
    expect(inAppApplyUrl("https://jobs.lever.co/spotify/2a55d6c9-c564-443a-be3e-a3851db5a93b")).toBe("https://jobs.lever.co/spotify/2a55d6c9-c564-443a-be3e-a3851db5a93b/apply")
    expect(inAppApplyUrl("https://apply.workable.com/huggingface/j/81B46579FE/")).toBe("https://apply.workable.com/huggingface/j/81B46579FE/apply/")
    expect(inAppApplyUrl("https://apply.workable.com/j/81B46579FE", { feed: { provider: "WORKABLE", boardToken: "huggingface" } })).toBe("https://apply.workable.com/huggingface/j/81B46579FE/apply/")
  })
  it("leaves other sites alone", () => {
    expect(inAppApplyUrl("https://careers.example.com/job/1")).toBe("https://careers.example.com/job/1")
    expect(inAppApplyUrl("not a url")).toBe("not a url")
  })
  it("knows portals the served copy cannot render", () => {
    expect(proxyCannotRender("https://jobs.ashbyhq.com/notion/abc")).toBe(true)
    expect(proxyCannotRender("https://acme.wd5.myworkdayjobs.com/en-US/External/job/1")).toBe(true)
    expect(proxyCannotRender("https://jobs.smartrecruiters.com/oneclick-ui/company/x/publication/1")).toBe(true)
    expect(proxyCannotRender("https://jobs.smartrecruiters.com/Freshworks/1")).toBe(false)
    expect(proxyCannotRender("https://careers.bunq.com/o/x")).toBe(false)
  })
})
