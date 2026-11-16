import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/prisma", () => ({ prisma: {} }))
vi.mock("@/lib/cache", () => ({ revalidatePublicContent: vi.fn() }))

import { boardTokenFrom, fetchFeed, mapGreenhouse, mapLever, type FeedPosting } from "@/lib/private-jobs/feeds"
import {
  buildJobFields,
  feedJobSlug,
  isIndiaPosting,
  MAX_CREATES_PER_RUN,
  planFeedSync,
  type ExistingFeedJob,
  type FeedContext,
} from "@/lib/private-jobs/feed-sync"
import { buildPrivateJobPostingLd } from "@/lib/private-jobs/seo"

const ctx: FeedContext = {
  id: "feed1",
  provider: "LEVER",
  boardToken: "acme",
  boardUrl: "https://jobs.lever.co/acme",
  indiaOnly: true,
  createdById: "admin1",
  company: { id: "c1", name: "Acme", website: "https://acme.com", verified: true },
}

const posting = (id: string, over: Partial<FeedPosting> = {}): FeedPosting => ({
  externalId: id,
  title: `Backend Engineer ${id}`,
  location: "Bengaluru",
  locations: [],
  descriptionText: "Build APIs in Node.js and PostgreSQL. 2-4 years of experience. CTC ₹12-18 LPA.",
  applyUrl: `https://jobs.lever.co/acme/${id}`,
  department: "Engineering",
  commitment: "Full-time",
  workplaceType: null,
  salary: null,
  postedAt: new Date("2026-11-01T00:00:00Z"),
  ...over,
})

describe("feed adapters", () => {
  it("maps Greenhouse jobs, decoding the entity-encoded description", () => {
    const [job] = mapGreenhouse({
      jobs: [
        {
          id: 123,
          title: " Data Analyst ",
          absolute_url: "https://boards.greenhouse.io/acme/jobs/123",
          location: { name: "Mumbai" },
          content: "&lt;p&gt;SQL &amp;amp; Python&lt;/p&gt;",
          departments: [{ name: "Analytics" }],
          first_published: "2026-11-10T10:00:00Z",
        },
        { id: 9, title: "missing url" },
      ],
    })
    expect(job).toMatchObject({ externalId: "123", title: "Data Analyst", location: "Mumbai", department: "Analytics", descriptionText: "SQL & Python" })
  })

  it("maps Lever postings including workplace type and salary", () => {
    const [p] = mapLever([
      {
        id: "abc",
        text: "Designer",
        hostedUrl: "https://jobs.lever.co/acme/abc",
        createdAt: 1_790_000_000_000,
        categories: { location: "Pune", team: "Design", commitment: "Intern", allLocations: ["Pune", "Remote"] },
        descriptionPlain: "Figma daily.",
        lists: [{ text: "You will", content: "<li>Design</li>" }],
        workplaceType: "hybrid",
        salaryRange: { min: 30000, max: 40000, currency: "INR", interval: "per-month-salary" },
      },
    ])
    expect(p).toMatchObject({ externalId: "abc", location: "Pune", workplaceType: "hybrid", commitment: "Intern", locations: ["Pune", "Remote"] })
    expect(p.descriptionText).toContain("You will\n• Design")
  })

  it("rejects malformed payloads instead of treating them as an empty board", () => {
    expect(() => mapGreenhouse({ error: "nope" })).toThrow()
    expect(() => mapLever({ ok: false })).toThrow()
  })

  it("extracts board tokens from URLs and rejects junk", () => {
    expect(boardTokenFrom("GREENHOUSE", "https://boards.greenhouse.io/razorpay")).toBe("razorpay")
    expect(boardTokenFrom("GREENHOUSE", "https://boards-api.greenhouse.io/v1/boards/razorpay/jobs")).toBe("razorpay")
    expect(boardTokenFrom("LEVER", "jobs.lever.co/acme/abc-123")).toBe("acme")
    expect(boardTokenFrom("LEVER", "acme")).toBe("acme")
    expect(boardTokenFrom("LEVER", "https://evil.com/acme")).toBeNull()
    expect(boardTokenFrom("LEVER", "a b;rm")).toBeNull()
  })

  it("surfaces a missing board as a clear error", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("not found", { status: 404 }))
    await expect(fetchFeed("LEVER", "nobody", fetchImpl)).rejects.toThrow(/Board not found/)
    expect(fetchImpl.mock.calls[0][0]).toBe("https://api.lever.co/v0/postings/nobody?mode=json")
  })
})

describe("normalised job fields", () => {
  it("builds clean, comparable fields from a posting", () => {
    const f = buildJobFields(posting("1", { location: "Bangalore, India" }), ctx)
    expect(f).toMatchObject({
      location: "Bengaluru, India",
      remotePolicy: "ONSITE",
      type: "FULL_TIME",
      category: "Engineering",
      salaryMin: 1_200_000,
      salaryMax: 1_800_000,
      salary: "₹12-18 LPA",
      expMin: 2,
      expMax: 4,
      experience: "2-4 yrs",
      isFresherFriendly: false,
    })
    expect(f.skills).toEqual(expect.arrayContaining(["PostgreSQL"]))
    // The company's official board is proof: feed jobs land at least "Trusted".
    expect(f.proofUrl).toBe("https://jobs.lever.co/acme")
    expect(f.trustScore).toBeGreaterThanOrEqual(50)
    expect(buildJobFields(posting("1", { location: "Bangalore, India" }), ctx).contentHash).toBe(f.contentHash)
    expect(buildJobFields(posting("1", { title: "Changed" }), ctx).contentHash).not.toBe(f.contentHash)
  })

  it("keeps India and India-remote postings only when indiaOnly", () => {
    expect(isIndiaPosting(posting("1"))).toBe(true)
    expect(isIndiaPosting(posting("1", { location: "London", locations: ["London", "Hyderabad"] }))).toBe(true)
    expect(isIndiaPosting(posting("1", { location: "Remote", locations: [] }))).toBe(true)
    expect(isIndiaPosting(posting("1", { location: "Remote - US", locations: [] }))).toBe(false)
    expect(isIndiaPosting(posting("1", { location: "Berlin" }))).toBe(false)
  })

  it("makes stable, URL-safe slugs", () => {
    expect(feedJobSlug("Sr. Engineer (Payments)", "Acme Pvt Ltd", "GREENHOUSE", "4012345")).toBe("sr-engineer-payments-acme-pvt-ltd-gh4012345")
  })
})

describe("planFeedSync", () => {
  const existingFor = (fields: ReturnType<typeof buildJobFields>, over: Partial<ExistingFeedJob> = {}): ExistingFeedJob => ({
    id: "j1",
    externalId: "1",
    contentHash: fields.contentHash,
    status: "ACTIVE",
    closedAt: null,
    ...over,
  })

  it("creates new, updates changed, leaves unchanged and counts missing", () => {
    const p1 = posting("1")
    const unchanged = existingFor(buildJobFields(p1, ctx))
    const changed: ExistingFeedJob = { id: "j2", externalId: "2", contentHash: "old", status: "ACTIVE", closedAt: null }
    const gone: ExistingFeedJob = { id: "j9", externalId: "9", contentHash: "x", status: "ACTIVE", closedAt: null }
    const others = Array.from({ length: 4 }, (_, i) => existingFor(buildJobFields(posting(`k${i}`), ctx), { id: `jk${i}`, externalId: `k${i}` }))
    const plan = planFeedSync(
      [p1, posting("2"), posting("3"), ...others.map((o) => posting(o.externalId as string))],
      [unchanged, changed, gone, ...others],
      ctx
    )
    expect(plan.creates.map((c) => c.externalId)).toEqual(["3"])
    expect(plan.updates.map((u) => u.id)).toEqual(["j2"])
    expect(plan.seenIds).toEqual(expect.arrayContaining(["j1", "j2", "jk0"]))
    expect(plan.missingIds).toEqual(["j9"])
    expect(plan.held).toBeNull()
  })

  it("reopens jobs the sync closed earlier, but never ones an admin expired", () => {
    const fields = buildJobFields(posting("1"), ctx)
    const plan = planFeedSync(
      [posting("1"), posting("2")],
      [
        existingFor(fields, { status: "EXPIRED", closedAt: new Date() }),
        existingFor(buildJobFields(posting("2"), ctx), { id: "j2", externalId: "2", status: "EXPIRED", closedAt: null }),
      ],
      ctx
    )
    expect(plan.reopenIds).toEqual(["j1"])
  })

  it("skips foreign postings without treating them as missing", () => {
    const foreign = posting("5", { location: "New York" })
    const existing: ExistingFeedJob = { id: "j5", externalId: "5", contentHash: "x", status: "ACTIVE", closedAt: null }
    const plan = planFeedSync([foreign], [existing], ctx)
    expect(plan.skipped).toBe(1)
    expect(plan.missingIds).toEqual([])
  })

  it("holds (closes nothing) when the source suddenly returns nothing or drops most jobs", () => {
    const live = Array.from({ length: 10 }, (_, i) => ({ id: `j${i}`, externalId: `${i}`, contentHash: "x", status: "ACTIVE", closedAt: null }))
    const empty = planFeedSync([], live, ctx)
    expect(empty.held).toMatch(/no postings/)
    expect(empty.missingIds).toEqual([])

    const dropped = planFeedSync([posting("0"), posting("1")], live, ctx)
    expect(dropped.held).toMatch(/dropped 8 of 10/)
    expect(dropped.missingIds).toEqual([])

    const forced = planFeedSync([posting("0"), posting("1")], live, ctx, { force: true })
    expect(forced.held).toBeNull()
    expect(forced.missingIds).toHaveLength(8)
    expect(planFeedSync([], live, ctx, { force: true }).missingIds).toEqual([])
  })

  it("caps creates per run and reports the overflow", () => {
    const many = Array.from({ length: MAX_CREATES_PER_RUN + 5 }, (_, i) => posting(`n${i}`))
    const plan = planFeedSync(many, [], ctx)
    expect(plan.creates).toHaveLength(MAX_CREATES_PER_RUN)
    expect(plan.overflow).toBe(5)
  })
})

describe("JobPosting structured data", () => {
  it("emits the fields Google for Jobs needs", () => {
    const ld = buildPrivateJobPostingLd(
      {
        title: "Backend Engineer",
        slug: "backend-engineer-acme",
        description: "Line one.\n\nLine <two>",
        createdAt: new Date("2026-11-01T00:00:00Z"),
        lastDate: null,
        expiresAt: new Date("2026-12-15T00:00:00Z"),
        type: "INTERNSHIP",
        location: "Bengaluru, Karnataka",
        remotePolicy: "HYBRID",
        salaryMin: 600000,
        salaryMax: null,
        vacancies: 3,
        skills: ["Node.js"],
        qualification: null,
        expMin: 1,
        company: { name: "Acme", website: "https://acme.com", logo: null },
      },
      "https://site.test"
    )
    expect(ld).toMatchObject({
      "@type": "JobPosting",
      employmentType: "INTERN",
      validThrough: "2026-12-15T00:00:00.000Z",
      description: "<p>Line one.</p><p>Line &lt;two&gt;</p>",
      hiringOrganization: { name: "Acme", sameAs: "https://acme.com" },
      jobLocation: { address: { addressLocality: "Bengaluru", addressCountry: "IN" } },
      baseSalary: { currency: "INR", value: { minValue: 600000, unitText: "YEAR" } },
      totalJobOpenings: 3,
    })
    expect(ld.jobLocationType).toBeUndefined()
  })
})
