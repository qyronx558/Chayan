import assert from "node:assert/strict"
import { chromium } from "playwright"

async function main() {
  const origin = process.env.CONTACT_TEST_ORIGIN || "http://127.0.0.1:3107"
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    const errors = []
    page.on("pageerror", (error) => errors.push(error.message))
    const submissions = []
    await page.route("**/*", async (route) => {
      const req = route.request()
      if (new URL(req.url()).origin !== origin) return route.abort()
      if (new URL(req.url()).pathname !== "/api/contact") return route.continue()
      submissions.push({ body: req.postDataJSON(), key: req.headers()["idempotency-key"] })
      if (submissions.length === 1) {
        return route.fulfill({ status: 503, json: { success: false, error: "Temporarily unavailable. Please retry." } })
      }
      return route.fulfill({ status: 201, json: { success: true, reference: `CJ-${submissions.at(-1).key.toUpperCase()}` } })
    })
    const response = await page.goto(`${origin}/contact`)
    assert.equal(response.status(), 200)
    await page.getByRole("heading", { name: "Contact us", exact: true }).waitFor()
    assert.equal(await page.locator('header path[d="M20 48 L30 58 L55 28"]').count(), 1, "Header uses the homepage tick logo")
    assert.equal(await page.locator('footer path[d="M20 48 L30 58 L55 28"]').count(), 1, "Footer uses the homepage tick logo")
    await page.getByRole("button", { name: "Send message", exact: true }).click()
    await page.locator("#contact-name-error").waitFor()
    assert.equal(submissions.length, 0)
    await page.locator("#contact-name").fill("Browser Test")
    await page.locator("#contact-email").fill("test@example.com")
    await page.locator("#contact-topic").selectOption("security")
    await page.locator("#contact-subject").fill("Test browser submission")
    await page.locator("#contact-message").fill("This is an intercepted browser test message.")
    await page.getByRole("button", { name: "Send message", exact: true }).click()
    await page.getByRole("alert").filter({ hasText: "Temporarily unavailable" }).waitFor()
    assert.equal(await page.locator("#contact-message").inputValue(), "This is an intercepted browser test message.")
    await page.getByRole("button", { name: "Send message", exact: true }).click()
    await page.getByRole("heading", { name: "Message received" }).waitFor()
    assert.equal(submissions.length, 2)
    assert.equal(submissions[0].key, submissions[1].key)
    assert.equal(submissions[1].body.topic, "security")
    await page.getByRole("button", { name: "Send another message" }).click()
    assert.equal(await page.locator("#contact-name").inputValue(), "")

    for (const term of ["Reset password", "Report a job", "Delete my data", "Advertise with us", "Security issue"]) {
      await page.getByRole("button", { name: term, exact: true }).click()
      await page.locator("#contact-search-results button").first().waitFor({ state: "visible" })
      assert.ok(await page.locator("#contact-search-results button").count() > 0, `${term} has results`)
    }
    await page.locator("#contact-search-results button").first().click()
    assert.equal(await page.locator('button[id^="faq-question-"][aria-expanded="true"]').count(), 1)

    await page.setViewportSize({ width: 390, height: 844 })
    await page.getByRole("button", { name: "Open menu", exact: true }).click()
    await page.locator("#contact-mobile-navigation").waitFor({ state: "visible" })
    await page.getByRole("button", { name: "Close menu", exact: true }).click()
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "No mobile horizontal overflow")
    await page.setViewportSize({ width: 320, height: 720 })
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "No narrow mobile overflow")
    assert.deepEqual(errors, [])
    console.log("Contact browser checks passed: rendering, validation, retry, idempotency, success reset, popular searches, FAQ, mobile menu and width.")
  } finally {
    await browser.close()
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1 })
