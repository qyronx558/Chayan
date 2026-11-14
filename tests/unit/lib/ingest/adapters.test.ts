import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { htmlToText, parseHtmlLinks, parseListing, parseNicS3waas } from "@/lib/ingest/adapters"
import type { SourceDef } from "@/lib/ingest/types"

const fixture = (name: string) => readFileSync(path.join(__dirname, "../../../fixtures/ingest", name), "utf8")

describe("parseNicS3waas (real Patna district board)", () => {
  const parsed = parseNicS3waas(fixture("nic-patna-recruitment.html"), "https://patna.nic.in/notice_category/recruitment/", { id: "nic:bihar/patna" })

  it("maps every column to the right field", () => {
    expect(parsed.empty).toBe(false)
    expect(parsed.items).toHaveLength(1)
    const [it0] = parsed.items
    expect(it0.title).toBe("Office of the District Education Officer, Patna (Letter No. 3189, Dated 22/09/2026)")
    expect(it0.description).toMatch(/^Important notice regarding the distribution of Result Card for STET 2024/)
    expect(it0.startDate).toBe("24/09/2026")
    expect(it0.endDate).toBe("31/10/2026")
    expect(it0.sourceId).toBe("nic:bihar/patna")
  })

  it("uses the first PDF as the canonical URL and keeps every attachment", () => {
    const [it0] = parsed.items
    expect(it0.url).toBe("https://cdn.s3waas.gov.in/s3fb7b9ffa5462084c5f4e7e85a093e6d7/uploads/2026/09/17902329392696.pdf")
    expect(it0.links).toHaveLength(3)
    expect(it0.links[1].label).toBe("STET 2024 Result Card Distribution Center")
  })

  it("follows the pagination link", () => {
    expect(parsed.nextPage).toBe("https://patna.nic.in/notice_category/recruitment/page/2")
  })
})

describe("parseNicS3waas empty board", () => {
  it("detects the 'no notice matched' page", () => {
    const parsed = parseNicS3waas(fixture("nic-pune-empty.html"), "https://pune.gov.in/en/notice_category/recruitment/", { id: "nic:maharashtra/pune" })
    expect(parsed).toEqual({ items: [], nextPage: null, empty: true })
  })
})

describe("parseHtmlLinks (real BPSC homepage)", () => {
  const src: SourceDef = { id: "bpsc", name: "BPSC", level: "STATE", adapter: "html-links", url: "https://bpsc.bihar.gov.in/", include: "[.]pdf" }
  const parsed = parseListing(src, fixture("bpsc-home.html"), src.url)

  it("keeps only document links with real titles", () => {
    expect(parsed.items.length).toBeGreaterThan(0)
    for (const item of parsed.items) {
      expect(item.url).toMatch(/\.pdf/i)
      expect(item.title.length).toBeGreaterThanOrEqual(15)
      expect(item.url.startsWith("https://")).toBe(true)
    }
  })

  it("never returns the same URL twice", () => {
    const urls = parsed.items.map((i) => i.url)
    expect(new Set(urls).size).toBe(urls.length)
  })
})

describe("parseHtmlLinks basics", () => {
  const html = `<html><body>
    <nav><a href="/recruitment.pdf">Recruitment menu link should be ignored</a></nav>
    <main>
      <ul>
        <li>12/11/2026 <a href="/docs/advt-07-2026.pdf">Advertisement No. 07/2026 for Junior Engineer posts</a></li>
        <li><a href="/docs/short.pdf">New</a></li>
        <li><a href="/about">About the commission and its history</a></li>
        <li><a href="/docs/advt-07-2026.pdf#page=2">Advertisement No. 07/2026 duplicate anchor</a></li>
      </ul>
    </main>
    <footer><a href="/tender.pdf">Footer tender notice link here</a></footer>
  </body></html>`

  it("strips navigation/footer, short labels, duplicates and non-matching links", () => {
    const { items } = parseHtmlLinks(html, "https://psc.example.gov.in/", { id: "x", include: "[.]pdf" })
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      url: "https://psc.example.gov.in/docs/advt-07-2026.pdf",
      title: "Advertisement No. 07/2026 for Junior Engineer posts",
    })
    expect(items[0].description).toContain("12/11/2026")
  })

  it("honours a scope selector", () => {
    const { items } = parseHtmlLinks(`<body><div id="news"><a href="/a.pdf">Notification for Staff Nurse posts 2026</a></div><div><a href="/b.pdf">Notification for other unrelated posts</a></div></body>`, "https://x.gov.in/", { id: "x", scope: "#news" })
    expect(items.map((i) => i.url)).toEqual(["https://x.gov.in/a.pdf"])
  })
})

describe("htmlToText", () => {
  it("returns readable lines without navigation", () => {
    const text = htmlToText("<body><header>Menu</header><main><h1>Staff Nurse</h1><p>Last date: 30/11/2026</p><table><tr><td>Posts</td><td>25</td></tr></table></main></body>")
    expect(text).toContain("Staff Nurse")
    expect(text).toContain("Last date: 30/11/2026")
    expect(text).toMatch(/Posts\s*\n?\s*25/)
    expect(text).not.toContain("Menu")
  })
})
