import { describe, expect, it } from "vitest"
import { prepareArticleHtml, renderRichHtml } from "@/lib/rich-html"

describe("renderRichHtml", () => {
  it("strips document wrappers and scripts", () => {
    const out = renderRichHtml(
      `<!DOCTYPE html><html><head><title>x</title><meta charset="utf-8"></head><body><p>Hi</p><script>alert(1)</script></body></html>`,
    )
    expect(out).toBe("<p>Hi</p>")
  })

  it("scopes safe <style> blocks to .rich-content", () => {
    const out = renderRichHtml(`<style>p{color:red} @import url(x.css);</style><p>x</p>`)
    expect(out.startsWith("<style>@scope (.rich-content){p{color:red}")).toBe(true)
    expect(out).not.toContain("@import")
    expect(out.endsWith("<p>x</p>")).toBe(true)
  })

  it("drops empty style blocks", () => {
    expect(renderRichHtml(`<style>   </style><p>x</p>`)).toBe("<p>x</p>")
  })
})

describe("prepareArticleHtml", () => {
  it("returns an empty string for missing html", () => {
    expect(prepareArticleHtml(null)).toBe("")
    expect(prepareArticleHtml("")).toBe("")
  })

  it("adds ids to headings", () => {
    expect(prepareArticleHtml("<h2>How to apply</h2>")).toMatch(/<h2[^>]*id="[^"]+"/)
  })
})
