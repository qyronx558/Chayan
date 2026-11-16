import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/prisma", () => ({ prisma: {} }))
vi.mock("@/lib/cache", () => ({ revalidatePublicContent: vi.fn() }))

import { cleanJobDescription, jobDescriptionHtml, jobDescriptionText, unwrapEscapedHtml } from "@/lib/private-jobs/description"
import { guessDomains, logoCandidatesFromHtml, pageMatchesCompany, resolveCompanyLogo, siteRoot } from "@/lib/private-jobs/logo"

/** What the rich-text editor stores when HTML source is pasted into it. */
const ESCAPED = [
  "<p>&lt;style&gt;</p><p> .job-content {</p><p> max-width: 950px;</p><p> background: #ffffff;</p><p> }</p><p>&lt;/style&gt;</p>",
  '<p>&lt;div class="job-content"&gt;</p><p> &lt;h2&gt;Job Details&lt;/h2&gt;</p>',
  "<p> &lt;p&gt;&lt;strong&gt;Job number:&lt;/strong&gt; 200041085&lt;/p&gt;</p>",
  "<p> &lt;h2&gt;Responsibilities&lt;/h2&gt;</p><p> &lt;ul&gt;</p><p> &lt;li&gt;</p><p> Apply engineering principles.</p><p> &lt;/li&gt;</p><p> &lt;/ul&gt;</p>",
  '<p> &lt;a href="javascript:alert(1)" onclick="x()"&gt;Apply&lt;/a&gt;</p><p>&lt;/div&gt;</p>',
].join("")

describe("job description cleanup", () => {
  it("recovers escaped HTML source and drops the pasted CSS", () => {
    expect(unwrapEscapedHtml(ESCAPED)).toContain("<h2>Job Details</h2>")
    const out = cleanJobDescription(ESCAPED)!
    expect(out).toContain("<h2>Job Details</h2>")
    expect(out).toContain("<p><strong>Job number:</strong> 200041085</p>")
    expect(out).toMatch(/<ul>\s*<li>\s*Apply engineering principles.\s*<\/li>\s*<\/ul>/)
    expect(out).not.toMatch(/style|job-content|max-width|&lt;|class=|onclick|javascript/)
    expect(jobDescriptionText(ESCAPED)).toMatch(/^Job Details\n+Job number: 200041085/)
  })

  it("strips a real pasted <style> design but keeps the content", () => {
    const raw = '<style>.job-content{background:#fff}</style><div class="job-content"><h1>Role</h1><p style="color:red">Build things</p></div>'
    expect(cleanJobDescription(raw)).toBe("<h2>Role</h2><p>Build things</p>")
  })

  it("leaves normal descriptions untouched", () => {
    const plain = "We are hiring.\n\n• Python\n• SQL"
    const rich = '<p>Design with <span style="color:#0a0">care</span></p><ul><li>Figma</li></ul>'
    expect(cleanJobDescription(plain)).toBe(plain)
    expect(cleanJobDescription(rich)).toBe(rich)
    expect(cleanJobDescription("Use &lt;br&gt; in emails")).toBe("Use &lt;br&gt; in emails")
    expect(cleanJobDescription(null)).toBeNull()
  })

  it("gives structured data clean HTML or null for plain text", () => {
    expect(jobDescriptionHtml("plain text")).toBeNull()
    expect(jobDescriptionHtml('<p class="x" style="y">Hi</p>')).toBe("<p>Hi</p>")
  })
})

describe("company logo lookup", () => {
  it("guesses domains, acronym before first word", () => {
    const d = guessDomains("Tata Consultancy Services")
    expect(d.indexOf("tcs.com")).toBeGreaterThan(-1)
    expect(d.indexOf("tcs.com")).toBeLessThan(d.indexOf("tata.com"))
    expect(guessDomains("Paytm")[0]).toBe("paytm.com")
    expect(siteRoot("careers.acme.co.in")).toBe("acme.co.in")
  })

  it("ranks real logos over favicons and ignores product / cookie-banner images", () => {
    const html = `<html><head>
      <link rel="icon" href="/favicon.ico">
      <link rel="apple-touch-icon" sizes="120x120" href="/icon-120.png">
      <link rel="apple-touch-icon" sizes="180x180" href="/icon-180.png">
      <script type="application/ld+json">{"@type":"Organization","logo":"https://cdn.acme.com/logo.svg"}</script>
      </head><body>
      <header><img class="product-logo" alt="Catalyst" src="/catalyst.svg"><img alt="Acme logo" src="/acme.svg"></header>
      <div id="onetrust-banner"><img alt="Acme logo" src="/cookie.png"></div></body></html>`
    const c = logoCandidatesFromHtml(html, "https://acme.com/", { companyName: "Acme Technologies" })
    expect(c.best).toEqual(["https://acme.com/icon-180.png", "https://acme.com/icon-120.png", "https://cdn.acme.com/logo.svg"])
    expect(c.named).toEqual(["https://acme.com/acme.svg"])
    expect(c.weak).toEqual(["https://acme.com/favicon.ico"])
  })

  it("only accepts a guessed site whose page names the company", () => {
    expect(pageMatchesCompany("<title>Paytm: Secure payments</title>", "Paytm")).toBe(true)
    expect(pageMatchesCompany("<title>Domain for sale</title>", "Paytm")).toBe(false)
  })

  it("uses the job board logo first, and Wikidata (incl. aliases) when the site blocks bots", async () => {
    const png = () => new Response(new Uint8Array(500), { status: 200, headers: { "content-type": "image/png" } })
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.startsWith("https://jobs.lever.co/acme")) return new Response('<img class="main-header-logo" src="https://lever-logos.example/acme.png">', { headers: { "content-type": "text/html" } })
      if (url.includes("wbsearchentities"))
        return Response.json({ search: [{ id: "Q1", label: "Big Tech Limited", description: "Indian IT services company", aliases: ["BigTech"] }] })
      if (url.includes("wbgetentities"))
        return Response.json({ entities: { Q1: { claims: { P856: [{ mainsnak: { datavalue: { value: "https://bigtech.com" } } }], P154: [{ mainsnak: { datavalue: { value: "BigTech logo.svg" } } }] } } } })
      if (url.includes("bigtech.com/")) return new Response("blocked", { status: 403 })
      if (url.includes("lever-logos.example") || url.includes("Special:FilePath")) return png()
      return new Response("nope", { status: 404 })
    })
    const board = await resolveCompanyLogo({ name: "Acme", boardUrls: ["https://jobs.lever.co/acme"] }, { fetchImpl })
    expect(board).toEqual({ logo: "https://lever-logos.example/acme.png", source: "board", website: null })

    const wd = await resolveCompanyLogo({ name: "BigTech" }, { fetchImpl })
    expect(wd).toMatchObject({ source: "wikidata", website: "https://bigtech.com" })
    expect(wd?.logo).toBe("https://commons.wikimedia.org/wiki/Special:FilePath/BigTech_logo.svg?width=256")
  })

  it("never uses a page or link that is not an image", async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url === "https://acme.com/") return new Response('<link rel="apple-touch-icon" href="/icon.png">', { headers: { "content-type": "text/html" } })
      if (url.endsWith("/icon.png")) return new Response("<html>not found</html>", { headers: { "content-type": "text/html" } })
      if (url.includes("google.com/s2/favicons")) return new Response(new Uint8Array(400), { headers: { "content-type": "image/png" } })
      return new Response("", { status: 404 })
    })
    const r = await resolveCompanyLogo({ name: "Acme", website: "https://acme.com" }, { fetchImpl })
    expect(r).toMatchObject({ source: "icon-service" })
    expect(r?.logo).toContain("google.com/s2/favicons?domain=acme.com")
  })
})
