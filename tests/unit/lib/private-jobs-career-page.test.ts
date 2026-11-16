import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/prisma", () => ({ prisma: {} }))
vi.mock("@/lib/cache", () => ({ revalidatePublicContent: vi.fn() }))

import {
  careerPageKey,
  detectAtsBoard,
  extractJsonLdPostings,
  extractLinks,
  groundAiJobs,
  readCareerPage,
  robotsDisallows,
  safeCareerUrl,
} from "@/lib/private-jobs/career-page"
import { mapAshby, boardTokenFrom } from "@/lib/private-jobs/feeds"
import { moderationForCreate } from "@/lib/private-jobs/feed-sync"

const PAGE = "https://careers.acme.in/jobs"

const html = (body: string) => `<html><head><title>Careers</title></head><body>${body}</body></html>`
const longText = "We are hiring across teams. ".repeat(10)

/** Fake network: robots.txt, the careers page, and (optionally) Gemini. */
function fakeFetch(page: string, gemini?: unknown, robots = "User-agent: *\nDisallow: /private") {
  return vi.fn(async (url: string) => {
    if (url.endsWith("/robots.txt")) return new Response(robots, { status: 200 })
    if (url.includes("generativelanguage.googleapis.com")) {
      return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(gemini) }] } }] })
    }
    if (url.includes("boards-api.greenhouse.io")) {
      return Response.json({ jobs: [{ id: 7, title: "SRE", absolute_url: "https://boards.greenhouse.io/acme/jobs/7", location: { name: "Pune" } }] })
    }
    return new Response(page, { status: 200 })
  })
}

describe("URL and robots safety", () => {
  it("only allows public http(s) URLs", () => {
    expect(safeCareerUrl("https://acme.com/careers")?.toString()).toBe("https://acme.com/careers")
    for (const bad of ["http://localhost:3000", "http://127.0.0.1/x", "http://10.0.0.5/", "http://192.168.1.1", "file:///etc/passwd", "https://user:pw@acme.com", "http://intranet/"]) {
      expect(safeCareerUrl(bad)).toBeNull()
    }
  })

  it("honours robots.txt disallow rules for * and our bot", () => {
    const txt = "User-agent: Googlebot\nDisallow: /\n\nUser-agent: *\nDisallow: /admin\nDisallow: /*.pdf$"
    expect(robotsDisallows(txt, "/careers")).toBe(false)
    expect(robotsDisallows(txt, "/admin/jobs")).toBe(true)
    expect(robotsDisallows(txt, "/files/x.pdf")).toBe(true)
    expect(robotsDisallows("User-agent: ChayanJobsBot\nDisallow: /", "/careers")).toBe(true)
  })

  it("refuses to read a page robots.txt disallows", async () => {
    await expect(readCareerPage(PAGE, { companyName: "Acme", fetchImpl: fakeFetch(html(longText), null, "User-agent: *\nDisallow: /jobs") })).rejects.toThrow(/robots/)
  })

  it("makes a stable key per page", () => {
    expect(careerPageKey("https://acme.com/careers#top")).toBe(careerPageKey("https://ACME.com/careers"))
  })
})

describe("structured sources first (no AI)", () => {
  it("reads schema.org JobPosting JSON-LD", async () => {
    const ld = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "JobPosting",
          title: "Data Engineer",
          url: "https://careers.acme.in/jobs/42",
          identifier: { value: "42" },
          description: "<p>Spark &amp; SQL</p>",
          datePosted: "2026-11-10",
          employmentType: "FULL_TIME",
          jobLocation: { "@type": "Place", address: { addressLocality: "Hyderabad", addressCountry: "IN" } },
          baseSalary: { currency: "INR", value: { minValue: 1200000, maxValue: 1800000, unitText: "YEAR" } },
        },
      ],
    }
    const page = html(`<script type="application/ld+json">${JSON.stringify(ld)}</script>`)
    const posts = extractJsonLdPostings(page, PAGE)
    expect(posts[0]).toMatchObject({ title: "Data Engineer", location: "Hyderabad, IN", applyUrl: "https://careers.acme.in/jobs/42", descriptionText: "Spark & SQL" })
    expect(posts[0].salary).toMatchObject({ min: 1200000, max: 1800000, currency: "INR", interval: "per-year" })
    const fetchImpl = fakeFetch(page)
    const r = await readCareerPage(PAGE, { companyName: "Acme", fetchImpl })
    expect(r).toMatchObject({ method: "jsonld", aiUsed: false })
    expect(fetchImpl.mock.calls.some(([u]) => String(u).includes("generativelanguage"))).toBe(false)
  })

  it("detects an embedded ATS board and reads it through the official API", async () => {
    expect(detectAtsBoard('<iframe src="https://boards.greenhouse.io/embed/job_board?for=acmeindia"></iframe>')).toEqual({ provider: "GREENHOUSE", token: "acmeindia" })
    expect(detectAtsBoard('<a href="https://jobs.lever.co/acme/123">Apply</a>')).toEqual({ provider: "LEVER", token: "acme" })
    expect(detectAtsBoard('<a href="https://jobs.ashbyhq.com/acme">Jobs</a>')).toEqual({ provider: "ASHBY", token: "acme" })
    const r = await readCareerPage(PAGE, { companyName: "Acme", fetchImpl: fakeFetch(html('<a href="https://boards.greenhouse.io/acme">Open roles</a>')) })
    expect(r.method).toBe("ats")
    expect(r.ats).toEqual({ provider: "GREENHOUSE", token: "acme" })
    expect(r.postings[0].title).toBe("SRE")
  })

  it("maps Ashby boards including INR compensation", () => {
    const [p] = mapAshby({
      jobs: [
        {
          id: "a1",
          title: "Backend Engineer",
          location: "Bengaluru",
          secondaryLocations: [{ location: "Remote - India" }],
          employmentType: "FullTime",
          workplaceType: "Hybrid",
          descriptionPlain: "Go and Kafka",
          jobUrl: "https://jobs.ashbyhq.com/acme/a1",
          publishedAt: "2026-11-01T00:00:00Z",
          compensation: { summaryComponents: [{ compensationType: "Salary", interval: "1 YEAR", currencyCode: "INR", minValue: 2000000, maxValue: 3000000 }] },
        },
        { id: "hidden", title: "Unlisted", jobUrl: "https://x", isListed: false },
      ],
    })
    expect(p).toMatchObject({ externalId: "a1", workplaceType: "hybrid", locations: ["Bengaluru", "Remote - India"] })
    expect(p.salary).toMatchObject({ min: 2000000, currency: "INR", interval: "per-year" })
    expect(boardTokenFrom("ASHBY", "https://jobs.ashbyhq.com/acme")).toBe("acme")
  })
})

describe("Gemini extraction is grounded in the page", () => {
  const body = html(`
    <h1>Open positions</h1>
    <ul>
      <li><a href="/jobs/101">Senior Product Designer</a> - Bengaluru - 5+ years</li>
      <li><a href="/jobs/102">Customer Support Associate</a> - Pune</li>
    </ul>
    <p>${longText}</p>`)
  const text = "Open positions\n• Senior Product Designer - Bengaluru - 5+ years\n• Customer Support Associate - Pune\n" + longText
  const links = extractLinks(body, PAGE)

  it("keeps real jobs, drops invented titles, and only uses links that exist", () => {
    const reply = {
      isJobListing: true,
      jobs: [
        { title: "Senior Product Designer", location: "Bengaluru", linkIndex: 0, experience: "5+ years", salary: "₹40 LPA", summary: "Design.", confidence: 0.95 },
        { title: "Customer Support Associate", location: "Mumbai", linkIndex: 99, confidence: 0.9 },
        { title: "Chief Happiness Officer", location: "Delhi", linkIndex: 1, confidence: 0.99 },
      ],
    }
    const out = groundAiJobs(reply, text, links, PAGE)
    expect(out.map((p) => p.title)).toEqual(["Senior Product Designer", "Customer Support Associate"])
    expect(out[0]).toMatchObject({ applyUrl: "https://careers.acme.in/jobs/101", location: "Bengaluru", confidence: 0.95 })
    expect(out[0].descriptionText).toContain("5+ years")
    expect(out[0].descriptionText).not.toContain("40 LPA") // salary not on the page
    // invalid link index → page URL, location not on page → null, confidence lowered
    expect(out[1]).toMatchObject({ applyUrl: PAGE, location: null, confidence: 0.72 })
  })

  it("returns nothing for a page that is not a job listing", () => {
    expect(groundAiJobs({ isJobListing: false, jobs: [] }, text, links, PAGE)).toEqual([])
  })

  it("calls Gemini once, then skips it while the page is unchanged", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key")
    const reply = { isJobListing: true, jobs: [{ title: "Senior Product Designer", location: "Bengaluru", linkIndex: 0, confidence: 0.9 }] }
    const fetchImpl = fakeFetch(body, reply)
    const first = await readCareerPage(PAGE, { companyName: "Acme", fetchImpl })
    expect(first).toMatchObject({ method: "ai", aiUsed: true })
    expect(first.postings).toHaveLength(1)
    const geminiCalls = () => fetchImpl.mock.calls.filter(([u]) => String(u).includes("generativelanguage")).length
    expect(geminiCalls()).toBe(1)

    const again = await readCareerPage(PAGE, { companyName: "Acme", fetchImpl, previousHash: first.pageHash })
    expect(again.method).toBe("unchanged")
    expect(geminiCalls()).toBe(1)
  })

  it("defers instead of calling Gemini when the run's AI budget is used", async () => {
    const r = await readCareerPage(PAGE, { companyName: "Acme", fetchImpl: fakeFetch(body), allowAi: false })
    expect(r).toMatchObject({ deferred: true, aiUsed: false })
  })

  it("explains JavaScript-only pages instead of guessing", async () => {
    const r = await readCareerPage(PAGE, { companyName: "Acme", fetchImpl: fakeFetch(html('<div id="root"></div><script>app()</script>')) })
    expect(r.method).toBe("none")
    expect(r.note).toMatch(/JavaScript/)
  })
})

describe("publishing rules", () => {
  it("publishes structured postings, and AI postings only when allowed and confident", () => {
    const off = { autoPublishAi: false, minConfidence: 0.8 }
    const on = { autoPublishAi: true, minConfidence: 0.8 }
    expect(moderationForCreate(null, off)).toBe("APPROVED")
    expect(moderationForCreate(0.99, off)).toBe("PENDING")
    expect(moderationForCreate(0.85, on)).toBe("APPROVED")
    expect(moderationForCreate(0.7, on)).toBe("PENDING")
  })
})
