import { describe, expect, it } from "vitest"
import {
  bucketCountForRange,
  bucketSizeForRange,
  classifyAgent,
  deviceFromUa,
  findDuplicateGroups,
  hashIp,
  normalizeCategory,
  sourceFromEvent,
  sourceLabel,
  verifySearchBot,
} from "@/lib/analytics/parse"

const CHROME = "Mozilla/5.0 (Windows NT 10.0) Chrome/120"
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Mobile/15E148"

describe("classifyAgent", () => {
  it("separates humans, search bots and other bots", () => {
    expect(classifyAgent(CHROME)).toBe("human")
    expect(classifyAgent("Mozilla/5.0 (compatible; Googlebot/2.1)")).toBe("search_bot")
    expect(classifyAgent("curl/8.0")).toBe("unknown_bot")
    expect(classifyAgent("Mozilla/5.0 HeadlessChrome")).toBe("unknown_bot")
    expect(classifyAgent("SomeApp/1.0")).toBe("unknown_bot")
    expect(classifyAgent(null)).toBe("unknown_bot")
  })
})

describe("deviceFromUa", () => {
  it("detects mobile, tablet and desktop", () => {
    expect(deviceFromUa(IPHONE)).toBe("mobile")
    expect(deviceFromUa("Mozilla/5.0 (iPad; Mobile)")).toBe("tablet")
    expect(deviceFromUa("Mozilla/5.0 (iPad)")).toBe("tablet")
    expect(deviceFromUa(CHROME)).toBe("desktop")
    expect(deviceFromUa(undefined)).toBe("desktop")
  })
})

describe("hashIp", () => {
  it("returns a stable salted 32-char hash", () => {
    expect(hashIp(null)).toBeNull()
    const a = hashIp("1.2.3.4")
    expect(a).toMatch(/^[0-9a-f]{32}$/)
    expect(hashIp("1.2.3.4")).toBe(a)
    expect(hashIp("1.2.3.5")).not.toBe(a)
  })
})

describe("traffic sources", () => {
  it.each([
    [{ referrer: "https://wa.me/123" }, "messaging"],
    [{ utmSource: "telegram" }, "messaging"],
    [{}, "direct"],
    [{ referrer: "https://www.google.com/" }, "organic"],
    [{ utmSource: "x", utmMedium: "cpc" }, "organic"],
    [{ referrer: "https://news.example/" }, "referral"],
  ] as const)("%j -> %s", (input, key) => {
    expect(sourceFromEvent(input)).toBe(key)
  })

  it("has human labels", () => {
    expect(sourceLabel("organic")).toBe("Organic search")
    expect(sourceLabel("direct")).toBe("Direct")
    expect(sourceLabel("messaging")).toBe("WhatsApp & Telegram")
    expect(sourceLabel("referral")).toBe("Referral")
  })
})

describe("category names", () => {
  it("normalises plurals and punctuation", () => {
    expect(normalizeCategory(" Railway Jobs! ")).toBe("railway job")
    expect(normalizeCategory("Vacancies")).toBe("vacancy")
    expect(normalizeCategory("Boxes")).toBe("box")
    expect(normalizeCategory("Class")).toBe("class")
  })

  it("groups near-duplicates", () => {
    expect(findDuplicateGroups(["Bank Jobs", "bank job", "Railway", "Police"])).toEqual([["Bank Jobs", "bank job"]])
  })
})

describe("chart buckets", () => {
  it("picks daily, 3-day and 2-week buckets", () => {
    expect([bucketSizeForRange(7), bucketSizeForRange(60), bucketSizeForRange(365)]).toEqual([1, 3, 14])
    expect([bucketCountForRange(7), bucketCountForRange(60), bucketCountForRange(365)]).toEqual([7, 20, 27])
  })
})

describe("verifySearchBot", () => {
  it("trusts only known crawler hostnames", async () => {
    expect(await verifySearchBot("crawl-1.googlebot.com", "1.1.1.1")).toBe(true)
    expect(await verifySearchBot("msnbot.search.msn.com", "1.1.1.1")).toBe(true)
    expect(await verifySearchBot("evil.example", "1.1.1.1")).toBe(false)
    expect(await verifySearchBot(null, "1.1.1.1")).toBe(false)
  })
})
