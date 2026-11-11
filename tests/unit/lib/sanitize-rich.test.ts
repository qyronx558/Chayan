import { describe, expect, it } from "vitest"
import { sanitizeCss, sanitizeRichHtml } from "@/lib/sanitize-rich"

describe("sanitizeRichHtml", () => {
  it("returns an empty string for empty input", () => {
    expect(sanitizeRichHtml("")).toBe("")
  })

  it("removes scripts, event handlers and javascript: links", () => {
    const out = sanitizeRichHtml(
      `<p onclick="x()">Hi<script>alert(1)</script></p><a href="javascript:alert(1)">bad</a><img src="x.png" onerror="alert(1)">`,
    )
    expect(out).not.toMatch(/script|onclick|onerror|javascript:/i)
    expect(out).toContain("<p>Hi</p>")
    expect(out).toContain('<img src="x.png" />')
  })

  it("keeps editor formatting: classes, inline styles, tables", () => {
    const html = `<div class="box" style="color:red"><table><tr><td colspan="2">x</td></tr></table></div>`
    const out = sanitizeRichHtml(html)
    expect(out).toContain('class="box"')
    expect(out).toContain('style="color:red"')
    expect(out).toContain('colspan="2"')
  })

  it("only allows iframes from trusted hosts", () => {
    expect(sanitizeRichHtml(`<iframe src="https://www.youtube.com/embed/x"></iframe>`)).toContain("youtube.com")
    expect(sanitizeRichHtml(`<iframe src="https://evil.example/x"></iframe>`)).not.toContain("evil.example")
  })

  it("forces inputs to disabled checkboxes and buttons to type=button", () => {
    const out = sanitizeRichHtml(`<input type="text" name="q"><input type="radio"><button type="submit">Go</button>`)
    expect(out).toContain('type="checkbox"')
    expect(out).toContain('type="radio"')
    expect(out).toContain('disabled="disabled"')
    expect(out).toContain('<button type="button">Go</button>')
  })

  it("drops forms", () => {
    expect(sanitizeRichHtml(`<form action="/x"><p>x</p></form>`)).toBe("<p>x</p>")
  })
})

describe("sanitizeCss", () => {
  it("strips tag breakouts, imports, expressions and javascript urls", () => {
    const out = sanitizeCss(`@import url(evil.css); a{b:expression(alert(1))} </style><script> x{background:url(javascript:alert(1))}`)
    expect(out).not.toMatch(/<|@import|expression\s*\(|javascript:/i)
  })
})
