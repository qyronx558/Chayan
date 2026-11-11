import assert from "node:assert/strict"
import { describe, expect, it, test } from "vitest"
import {
  buildBrowseUrl,
  buildDocProxyUrl,
  buildHtmlProxyUrl,
  cookiesWorkInFrame,
  getExternalHostname,
  headersBlockFraming,
  headersIndicatePdf,
  isSafeExternalUrl,
  looksLikePdfUrl,
  looksLikeUrl,
  normalizeExternalUrl,
  sanitizeDownloadFilename,
} from "@/lib/apply-room"

test("framing is blocked by X-Frame-Options and by a frame-ancestors allow-list", () => {
  assert.equal(headersBlockFraming(new Headers({ "x-frame-options": "SAMEORIGIN" })), true)
  assert.equal(headersBlockFraming(new Headers({ "x-frame-options": "DENY" })), true)
  assert.equal(headersBlockFraming(new Headers({ "content-security-policy": "frame-ancestors 'none'" })), true)
  assert.equal(headersBlockFraming(new Headers({ "content-security-policy": "frame-ancestors 'self' https://partner.example" })), true)
})

test("framing is allowed without those headers, with a wildcard, or with a report-only policy", () => {
  assert.equal(headersBlockFraming(new Headers({ "content-type": "text/html" })), false)
  assert.equal(headersBlockFraming(new Headers({ "content-security-policy": "default-src 'self'; frame-ancestors *" })), false)
  assert.equal(headersBlockFraming(new Headers({ "content-security-policy": "frame-ancestors https:" })), false)
  assert.equal(headersBlockFraming(new Headers({ "content-security-policy-report-only": "frame-ancestors 'none'" })), false)
})

test("session cookies only work in a frame when every cookie is SameSite=None", () => {
  assert.equal(cookiesWorkInFrame([]), null)
  assert.equal(cookiesWorkInFrame(["JSESSIONID=abc; Path=/; HttpOnly"]), false)
  assert.equal(cookiesWorkInFrame(["sid=abc; Path=/; Secure; SameSite=Lax"]), false)
  assert.equal(cookiesWorkInFrame(["sid=abc; Path=/; Secure; SameSite=None"]), true)
  assert.equal(cookiesWorkInFrame(["a=1; Secure; SameSite=None", "b=2; Path=/"]), false)
})

test("PDFs are recognised by content type even when the address has no .pdf", () => {
  assert.equal(headersIndicatePdf(new Headers({ "content-type": "application/pdf" }), "https://x.gov.in/download.php?id=5"), true)
  assert.equal(headersIndicatePdf(new Headers({ "content-type": "text/html" }), "https://x.gov.in/notice.pdf"), false)
  assert.equal(headersIndicatePdf(new Headers({ "content-type": "application/octet-stream" }), "https://x.gov.in/notice.pdf"), true)
})


describe("external url safety", () => {
  it.each([
    ["https://upsc.gov.in", true],
    ["//ssc.gov.in/x", true],
    ["upsc.gov.in/apply", true],
    ["javascript:alert(1)", false],
    ["data:text/html,x", false],
    ["ftp://x.example", false],
    ["not a url", false],
    ["localhost", false],
    ["", false],
    [null, false],
  ])("isSafeExternalUrl(%j) = %s", (raw, expected) => {
    expect(isSafeExternalUrl(raw)).toBe(expected)
  })

  it("normalizes to absolute urls", () => {
    expect(normalizeExternalUrl("//ssc.gov.in/x")).toBe("https://ssc.gov.in/x")
    expect(normalizeExternalUrl("upsc.gov.in/apply")).toBe("https://upsc.gov.in/apply")
    expect(normalizeExternalUrl(" https://a.example/b ")).toBe("https://a.example/b")
    expect(normalizeExternalUrl("javascript:x")).toBeNull()
  })

  it("extracts a readable hostname", () => {
    expect(getExternalHostname("https://www.upsc.gov.in/x")).toBe("upsc.gov.in")
    expect(getExternalHostname("bad")).toBe("official website")
  })
})

describe("url heuristics", () => {
  it("tells urls apart from search queries", () => {
    expect(looksLikeUrl("ssc.gov.in/result")).toBe(true)
    expect(looksLikeUrl("https://x.example")).toBe(true)
    expect(looksLikeUrl("ssc cgl result")).toBe(false)
    expect(looksLikeUrl("mailto:a@b.c")).toBe(false)
    expect(looksLikeUrl("ssc")).toBe(false)
    expect(looksLikeUrl(undefined)).toBe(false)
  })

  it("detects pdf links by path", () => {
    expect(looksLikePdfUrl("https://x.gov.in/a/notice.PDF")).toBe(true)
    expect(looksLikePdfUrl("https://x.gov.in/a.pdf?x=1")).toBe(true)
    expect(looksLikePdfUrl("relative/file.pdf#page=2")).toBe(true)
    expect(looksLikePdfUrl("https://x.gov.in/a.html")).toBe(false)
    expect(looksLikePdfUrl("  ")).toBe(false)
  })
})

describe("in-app url builders", () => {
  it("builds browse, doc and html proxy urls", () => {
    expect(buildBrowseUrl("https://a.example", { title: "T", from: "/jobs", download: true })).toBe(
      "/browse?url=https%3A%2F%2Fa.example&title=T&from=%2Fjobs&download=1",
    )
    expect(buildBrowseUrl("https://a.example")).toBe("/browse?url=https%3A%2F%2Fa.example")
    expect(buildDocProxyUrl("https://a.example/x.pdf", true)).toBe("/api/doc?url=https%3A%2F%2Fa.example%2Fx.pdf&download=1")
    expect(buildHtmlProxyUrl("https://a.example/?q=1")).toBe("/api/proxy?url=https%3A%2F%2Fa.example%2F%3Fq%3D1")
  })

  it("sanitizes download filenames", () => {
    expect(sanitizeDownloadFilename("SSC CGL Notice 2026.pdf")).toBe("ssc-cgl-notice-2026.pdf")
    expect(sanitizeDownloadFilename("../../etc/passwd")).toBe("etc-passwd.pdf")
    expect(sanitizeDownloadFilename("!!!")).toBe("document.pdf")
    expect(sanitizeDownloadFilename(null, "x.pdf")).toBe("x.pdf")
  })
})
