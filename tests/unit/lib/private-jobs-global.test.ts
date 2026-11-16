import { describe, expect, it } from "vitest"
import { allCountries, canonicalCity, countryName, locationLabel, normalizeJobGeo, parseLocation, toCountryCode } from "@/lib/private-jobs/geo"
import { boardTokenFrom, feedApiUrl, mapBreezy, mapPersonio, mapRecruitee, mapSmartRecruiters, mapWorkable } from "@/lib/private-jobs/feeds"
import { sameCompany, slugCandidates } from "@/lib/private-jobs/discovery"
import { detectAtsBoard } from "@/lib/private-jobs/career-page"

describe("geo", () => {
  it("knows every country by code and name", () => {
    expect(allCountries().length).toBeGreaterThan(240)
    expect(countryName("DE")).toBe("Germany")
    expect(countryName("Atlantis")).toBe("Atlantis")
    expect(toCountryCode("United States")).toBe("US")
    expect(toCountryCode("usa")).toBe("US")
    expect(toCountryCode("UK")).toBe("GB")
    expect(toCountryCode("in")).toBe("IN")
    expect(toCountryCode("Narnia")).toBeNull()
  })

  it("canonicalises city spellings", () => {
    expect(canonicalCity("bangalore")).toBe("Bengaluru")
    expect(canonicalCity("Gurgaon")).toBe("Gurugram")
    expect(canonicalCity("NYC")).toBe("New York")
    expect(canonicalCity("lagos ")).toBe("Lagos")
    expect(canonicalCity("SMALLTOWN")).toBe("Smalltown")
  })

  it.each([
    ["Bangalore, Karnataka", "Bengaluru", "IN"],
    ["Bengaluru, Karnataka, India", "Bengaluru", "IN"],
    ["San Francisco, CA", "San Francisco", "US"],
    ["SF, NYC, CHI", "San Francisco", "US"],
    ["New York, NY, United States", "New York", "US"],
    ["Toronto, ON", "Toronto", "CA"],
    ["London, United Kingdom", "London", "GB"],
    ["Berlin, Germany", "Berlin", "DE"],
    ["Remote - US", null, "US"],
    ["Remote (Germany)", null, "DE"],
    ["Singapore", "Singapore", "SG"],
    ["Dublin; London", "Dublin", "IE"],
    ["Austin, Texas", "Austin", "US"],
    ["Sydney, NSW, Australia", "Sydney", "AU"],
  ])("parses %s", (raw, city, country) => {
    expect(parseLocation(raw)).toEqual({ city, country })
  })

  it("prefers structured board hints over text", () => {
    expect(parseLocation("Office", { country: "fr", city: "Paris" })).toEqual({ city: "Paris", country: "FR" })
    expect(parseLocation("Somewhere", { country: "Netherlands" })).toEqual({ city: "Somewhere", country: "NL" })
  })

  it("does not invent a place for remote-only postings", () => {
    expect(parseLocation("Remote")).toEqual({ city: null, country: null })
    expect(parseLocation("")).toEqual({ city: null, country: null })
  })

  it("normalises a job being saved", () => {
    const a: { location?: string | null; country?: string | null; city?: string | null } = { location: "Pune, Maharashtra" }
    normalizeJobGeo(a)
    expect(a).toEqual({ location: "Pune, Maharashtra", country: "IN", city: "Pune" })

    const b: { location?: string | null; country?: string | null; city?: string | null } = { location: null, country: "germany", city: "munich" }
    normalizeJobGeo(b)
    expect(b).toEqual({ location: "Munich, Germany", country: "DE", city: "Munich" })

    const c: { location?: string | null; country?: string | null; city?: string | null } = { country: "Wakanda", city: "Birnin Zana" }
    normalizeJobGeo(c)
    expect(c).toMatchObject({ country: "Wakanda", city: "Birnin Zana", location: "Birnin Zana, Wakanda" })

    const untouched: { location?: string | null; title?: string } = { title: "x" }
    normalizeJobGeo(untouched)
    expect(untouched).toEqual({ title: "x" })
    expect(locationLabel("Paris", "FR")).toBe("Paris, France")
  })
})

describe("more job boards", () => {
  it("parses board tokens from URLs", () => {
    expect(boardTokenFrom("SMARTRECRUITERS", "https://careers.smartrecruiters.com/BoschGroup")).toBe("BoschGroup")
    expect(boardTokenFrom("SMARTRECRUITERS", "https://jobs.smartrecruiters.com/Ubisoft2/7440-dev")).toBe("Ubisoft2")
    expect(boardTokenFrom("WORKABLE", "https://apply.workable.com/huggingface/")).toBe("huggingface")
    expect(boardTokenFrom("RECRUITEE", "https://bunq.recruitee.com/o/some-job")).toBe("bunq")
    expect(boardTokenFrom("PERSONIO", "https://acme.jobs.personio.de/")).toBe("acme")
    expect(boardTokenFrom("BREEZY", "https://acme.breezy.hr/p/123")).toBe("acme")
    expect(boardTokenFrom("BREEZY", "plain-token")).toBe("plain-token")
    expect(feedApiUrl("SMARTRECRUITERS", "Acme")).toContain("api.smartrecruiters.com/v1/companies/Acme/postings")
  })

  it("detects new boards embedded in careers pages", () => {
    expect(detectAtsBoard('<a href="https://careers.smartrecruiters.com/Visa">jobs</a>')).toEqual({ provider: "SMARTRECRUITERS", token: "Visa" })
    expect(detectAtsBoard('<script src="https://apply.workable.com/api/v1/widget"></script><a href="https://apply.workable.com/acme/">')).toEqual({
      provider: "WORKABLE",
      token: "acme",
    })
    expect(detectAtsBoard('<iframe src="https://acme.recruitee.com/embed"></iframe>')).toEqual({ provider: "RECRUITEE", token: "acme" })
  })

  it("maps SmartRecruiters postings with structured location", () => {
    const jobs = mapSmartRecruiters(
      {
        content: [
          {
            id: "744000",
            name: "Data Engineer",
            releasedDate: "2026-11-10T10:00:00Z",
            location: { city: "Lyon", country: "fr", remote: false, fullLocation: "Lyon, Auvergne-Rhône-Alpes, France" },
            typeOfEmployment: { label: "Full-time" },
            experienceLevel: { label: "Mid-Senior Level" },
          },
          { id: "", name: "skip" },
        ],
      },
      "Ubisoft2"
    )
    expect(jobs).toHaveLength(1)
    expect(jobs[0]).toMatchObject({ externalId: "744000", country: "fr", city: "Lyon", commitment: "Full-time" })
    expect(jobs[0].applyUrl).toBe("https://jobs.smartrecruiters.com/Ubisoft2/744000")
    expect(parseLocation(jobs[0].location, { country: jobs[0].country, city: jobs[0].city })).toEqual({ city: "Lyon", country: "FR" })
  })

  it("maps Workable, Recruitee and Breezy jobs", () => {
    const wk = mapWorkable({
      name: "Hugging Face",
      jobs: [
        {
          title: "ML Engineer",
          shortcode: "ABC123",
          url: "https://apply.workable.com/j/ABC123",
          telecommuting: true,
          description: "<p>Build <b>models</b></p>",
          locations: [{ city: "Paris", country: "France", countryCode: "FR" }],
        },
      ],
    })
    expect(wk[0]).toMatchObject({ externalId: "ABC123", country: "FR", city: "Paris", workplaceType: "remote", descriptionText: "Build models" })

    const rc = mapRecruitee({
      offers: [
        {
          id: 9,
          title: "Backend Dev",
          careers_url: "https://bunq.recruitee.com/o/backend-dev",
          city: "Amsterdam",
          country_code: "NL",
          status: "published",
          description: "<p>Go</p>",
          salary: { min: "60000", max: "80000", currency: "EUR", period: "year" },
        },
        { id: 10, title: "Draft", careers_url: "x", status: "draft" },
      ],
    })
    expect(rc).toHaveLength(1)
    expect(rc[0]).toMatchObject({ country: "NL", city: "Amsterdam", salary: { min: 60000, max: 80000, currency: "EUR" } })

    const bz = mapBreezy([
      { id: "b1", name: "Designer", url: "https://acme.breezy.hr/p/b1", location: { name: "Austin, TX", city: "Austin", country: { id: "US", name: "United States" } } },
    ])
    expect(bz[0]).toMatchObject({ externalId: "b1", country: "US", city: "Austin" })
  })

  it("maps the Personio XML feed", () => {
    const xml = `<?xml version="1.0"?><workzag-jobs><position><id>42</id><office>Munich</office><department>Engineering</department><name>Frontend Engineer</name><employmentType>permanent</employmentType><createdAt>2026-11-01T09:00:00+00:00</createdAt><jobDescriptions><jobDescription><name>Your tasks</name><value><![CDATA[<p>Ship UI</p>]]></value></jobDescription></jobDescriptions></position></workzag-jobs>`
    const jobs = mapPersonio(xml, "acme")
    expect(jobs).toHaveLength(1)
    expect(jobs[0]).toMatchObject({ externalId: "42", title: "Frontend Engineer", location: "Munich", department: "Engineering" })
    expect(jobs[0].descriptionText).toContain("Ship UI")
    expect(jobs[0].applyUrl).toBe("https://acme.jobs.personio.de/job/42")
    expect(() => mapPersonio("<html></html>", "acme")).toThrow()
  })
})

describe("job-board discovery helpers", () => {
  it("builds board slugs from company names", () => {
    expect(slugCandidates("Hugging Face")).toEqual(expect.arrayContaining(["huggingface", "hugging-face"]))
    expect(slugCandidates("Razorpay Software Private Limited")).toContain("razorpaysoftware")
    expect(slugCandidates("Acme Technologies Inc.")).toContain("acme")
    expect(slugCandidates("!!!")).toEqual([])
  })

  it("matches company names loosely but not look-alikes", () => {
    expect(sameCompany("Hugging Face", "HuggingFace Inc.")).toBe(true)
    expect(sameCompany("Bosch", "Bosch Group")).toBe(true)
    expect(sameCompany("Stripe", "Stripes Media")).toBe(true)
    expect(sameCompany("Notion", "Motion")).toBe(false)
  })
})
