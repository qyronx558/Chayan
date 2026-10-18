import assert from "node:assert/strict"
import { chromium } from "playwright"

const browser = await chromium.launch({
  headless: true,
  ...(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}),
})

try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    await page.addInitScript(() => {
      for (const key of ["ChayanJobs_welcomed", "ChayanJobs_tour_v2_home_seen"]) {
        localStorage.setItem(key, "true")
      }
      localStorage.setItem("ChayanJobs-cookie-consent", "accepted")
    })
    await page.route("**/api/**", (route) => route.fulfill({ json:
      new URL(route.request().url()).pathname === "/api/auth/session"
        ? {} : { success: true, data: [] },
    }))
    // Keep the regression independent of available job/admission records.
    for (const resource of ["jobs", "admissions"]) {
      await page.route(`**/api/${resource}?*`, (route) => route.fulfill({ json: {
        success: true,
        data: [{ id: `scroll-test-${resource}`, title: `Scroll test ${resource}`,
          slug: `scroll-test-${resource}`, department: { name: "Test Department" },
          status: "ACTIVE", lastDate: "2099-12-31" }],
      } }))
    }
    await page.goto(process.env.SCROLL_TEST_ORIGIN || "http://localhost:3000")
    await page.getByRole("heading", { name: "Latest Admissions", exact: true }).waitFor()
    await page.evaluate(() => document.fonts.ready)
    const header = page.locator("header.sticky").first()
    const snapshot = () => page.evaluate(() => {
      const rect = document.querySelector("header.sticky").getBoundingClientRect()
      return { x: rect.x, y: rect.y, width: rect.width, scrollY }
    })

    async function checkOverlay(trigger, overlay) {
      await trigger.scrollIntoViewIfNeeded()
      await page.waitForTimeout(200)
      const before = await snapshot()
      assert.equal(before.y, 0, "Header stays sticky before opening")
      assert.ok(before.scrollY > 100, "Exercise the scrolled-page regression")
      await trigger.click()
      await overlay.waitFor({ state: "visible" })
      assert.deepEqual(await snapshot(), before, "Opening preserves header and page position")
      assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).overflowY), "hidden")
      await page.mouse.move(width - 25, 850)
      await page.mouse.wheel(0, 400)
      await page.waitForTimeout(150)
      assert.deepEqual(await snapshot(), before, "Background scrolling remains locked")
      await page.keyboard.press("Escape")
      await overlay.waitFor({ state: "hidden" })
      assert.deepEqual(await snapshot(), before, "Closing preserves header and page position")
      assert.equal(await page.locator("body").getAttribute("data-scroll-locked"), null)
    }

    for (const title of ["Latest Government Jobs", "Latest Admissions"]) {
      const section = page.locator("section").filter({ has: page.getByRole("heading", { name: title, exact: true }) })
      await checkOverlay(section.getByRole("button", { name: "Track this job", exact: true }).first(), page.getByRole("menu"))
    }
    await checkOverlay(header.getByRole("button", { name: "Toggle theme" }), page.getByRole("menu"))
    if (width === 1440) {
      await checkOverlay(header.getByRole("search", { name: "Search", exact: true }), page.getByRole("dialog", { name: "Search", exact: true }))
    } else {
      await checkOverlay(header.getByRole("button", { name: "Toggle navigation menu" }), page.getByRole("dialog"))
    }
    await page.mouse.wheel(0, 400)
    await page.waitForTimeout(150)
    assert.ok((await snapshot()).scrollY > 100)
    assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).overflowY), "visible")
    console.log(`PASS ${width}px: job/admission Track, theme, ${width === 1440 ? "search dialog" : "navigation drawer"}, header position and scroll locks`)
    await page.close()
  }
} finally {
  await browser.close()
}
