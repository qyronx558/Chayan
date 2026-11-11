import assert from "node:assert/strict"
import { test } from "node:test"
import { cookiesWorkInFrame, headersBlockFraming, headersIndicatePdf } from "../src/lib/apply-room"
import { frameErrorHtml, rewriteHtmlForPreview, safeFetch, validateProxyTarget } from "../src/lib/proxy"

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

test("the proxy error page reports cj-frame-error and cannot be broken out of", () => {
  const html = frameErrorHtml(`</script><script>alert(1)</script>`, `https://x.gov.in/"><script>alert(2)</script>`)
  assert.match(html, /cj-frame-error/)
  assert.equal(html.includes("<script>alert("), false)
  assert.equal(html.includes(`"><script>`), false)
})

test("preview rewriting keeps links inside ChayanJobs and announces readiness", () => {
  const out = rewriteHtmlForPreview(
    `<html><head><meta http-equiv="Content-Security-Policy" content="frame-ancestors 'none'"></head>` +
      `<body><a href="/notice">n</a><a href="/files/a.pdf">p</a><a href="https://other.example/x">o</a><form action="/login"></form></body></html>`,
    "https://x.gov.in/home"
  )
  assert.equal(/http-equiv="Content-Security-Policy"/i.test(out), false)
  assert.match(out, /<base href="https:\/\/x\.gov\.in\/home">/)
  assert.match(out, /href="\/api\/proxy\?url=https%3A%2F%2Fx\.gov\.in%2Fnotice"/)
  assert.match(out, /href="\/api\/doc\?url=https%3A%2F%2Fx\.gov\.in%2Ffiles%2Fa\.pdf"/)
  assert.match(out, /href="\/browse\?url=https%3A%2F%2Fother\.example%2Fx"/)
  assert.match(out, /<form target="_blank" action="\/login">/)
  assert.match(out, /cj-frame-ready/)
})

test("server-side fetches refuse internal and credentialed addresses", async () => {
  await assert.rejects(safeFetch("http://127.0.0.1/admin"), /Blocked address/)
  await assert.rejects(safeFetch("http://169.254.169.254/latest/meta-data"), /Blocked address/)
  await assert.rejects(safeFetch("http://[::1]/"), /Blocked address/)
  await assert.rejects(safeFetch("https://user:pass@example.com/"), /Blocked address/)
  assert.throws(() => validateProxyTarget("javascript:alert(1)"), /Invalid URL/)
})
