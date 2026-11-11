import { describe, expect, it } from "vitest"
import {
  addHeadingIds,
  BLOG_PROSE_CLASSES,
  containsHtml,
  extractFaq,
  extractTakeaways,
  getReadingTimeMinutes,
  sanitizeHtmlDocument,
  slugifyHeading,
  stripHtmlToText,
} from "@/lib/blog-prose"

describe("html detection and cleanup", () => {
  it("detects html", () => {
    expect(containsHtml("<p>x</p>")).toBe(true)
    expect(containsHtml("a < b")).toBe(false)
    expect(containsHtml(null)).toBe(false)
  })

  it("removes document wrappers, styles and titles", () => {
    expect(sanitizeHtmlDocument("<!DOCTYPE html><html><head><x></head><body><style>a{}</style><title>t</title><p>Hi</p></body></html>")).toBe("<p>Hi</p>")
  })

  it("converts html to plain text with entities decoded", () => {
    expect(stripHtmlToText("<ul><li>One</li><li>Two</li></ul><p>A&nbsp;&amp;&lt;B&gt; &quot;q&quot;<br/>end</p>")).toBe('One, Two, A &<B> "q" end')
    expect(stripHtmlToText("plain")).toBe("plain")
    expect(stripHtmlToText(undefined)).toBe("")
  })
})

describe("reading time", () => {
  it("defaults to 2 minutes for empty content and is at least 1", () => {
    expect(getReadingTimeMinutes(null)).toBe(2)
    expect(getReadingTimeMinutes("few words")).toBe(1)
  })
  it("counts ~200 words per minute", () => {
    expect(getReadingTimeMinutes(`<p>${"word ".repeat(1000)}</p>`)).toBe(5)
  })
})

describe("headings", () => {
  it("slugifies headings, keeping Devanagari", () => {
    expect(slugifyHeading("  Fees & Dates!  ")).toBe("fees-and-dates")
    expect(slugifyHeading("परीक्षा तिथि")).toBe("परीक्षा-तिथि")
    expect(slugifyHeading("x".repeat(100))).toHaveLength(80)
  })

  it("adds ids to h2/h3 but keeps existing ids and empty headings", () => {
    const out = addHeadingIds(`<h2>Eligibility</h2><h3 id="keep">K</h3><h2><span></span></h2>`)
    expect(out).toContain('<h2 id="eligibility" class="scroll-mt-28">Eligibility</h2>')
    expect(out).toContain('<h3 id="keep">K</h3>')
    expect(out).toContain("<h2><span></span></h2>")
  })

  it("wraps plain text paragraphs", () => {
    expect(addHeadingIds("one\n\ntwo")).toBe("<p>one</p>\n<p>two</p>")
  })
})

describe("takeaways and FAQ", () => {
  const long = "This is a sufficiently long sentence that should count as a takeaway."
  it("extracts sentences of reasonable length", () => {
    expect(extractTakeaways("ex", `<p>${long} Short. ${long}</p>`, 1)).toEqual([long])
    expect(extractTakeaways("ex", "<p>tiny</p>")).toEqual(["ex"])
    expect(extractTakeaways(null, null)).toEqual([])
    expect(extractTakeaways("ex", null)).toEqual(["ex"])
  })

  it("extracts question headings followed by answers", () => {
    const html = `<h2>What is the last date?</h2><p>The last date to apply is 30 June 2026 for all.</p>
      <h3>Too short?</h3><p>no</p>`
    expect(extractFaq(html)).toEqual([{ q: "What is the last date?", a: "The last date to apply is 30 June 2026 for all." }])
    expect(extractFaq("plain text?")).toEqual([])
  })

  it("exposes prose classes", () => {
    expect(BLOG_PROSE_CLASSES.length).toBeGreaterThan(0)
  })
})
