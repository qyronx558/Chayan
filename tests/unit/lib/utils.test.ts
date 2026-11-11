import { afterEach, describe, expect, it, vi } from "vitest"
import {
  absoluteUrl,
  cn,
  createJsonLD,
  debounce,
  formatCompact,
  formatDate,
  formatSalary,
  formatViews,
  generateSEO,
  getBaseUrl,
  getStatusColor,
  safeJsonLd,
  slugify,
  timeAgo,
  truncate,
} from "@/lib/utils"

afterEach(() => {
  vi.useRealTimers()
})

describe("cn", () => {
  it("joins classes and lets later tailwind classes win", () => {
    expect(cn("p-2", false && "hidden", "p-4")).toBe("p-4")
    expect(cn("a", ["b", { c: true, d: false }])).toBe("a b c")
  })
})

describe("formatDate", () => {
  it("formats dates and ISO strings", () => {
    expect(formatDate(new Date(2026, 0, 5))).toBe("05 Jan 2026")
    expect(formatDate("2026-03-09T00:00:00", "yyyy-MM-dd")).toBe("2026-03-09")
  })
  it("returns an empty string for missing or invalid input", () => {
    expect(formatDate(null)).toBe("")
    expect(formatDate(undefined)).toBe("")
    expect(formatDate("not a date")).toBe("")
  })
})

describe("formatSalary / truncate / slugify", () => {
  it("falls back when salary is missing", () => {
    expect(formatSalary(null)).toBe("Not Disclosed")
    expect(formatSalary("₹25,000")).toBe("₹25,000")
  })
  it("truncates long text and keeps short text", () => {
    expect(truncate(null)).toBe("")
    expect(truncate("short", 10)).toBe("short")
    expect(truncate("hello world again", 6)).toBe("hello...")
  })
  it("creates lowercase url-safe slugs", () => {
    expect(slugify("SSC CGL 2026: Apply Now!")).toBe("ssc-cgl-2026-apply-now")
  })
})

describe("getStatusColor", () => {
  it("maps each known status and has a default", () => {
    expect(getStatusColor("ACTIVE")).toContain("text-foreground")
    expect(getStatusColor("EXPIRED")).toContain("text-brick")
    expect(getStatusColor("UPCOMING")).toContain("text-brick")
    expect(getStatusColor("OTHER")).toContain("text-muted-foreground")
  })
})

describe("debounce", () => {
  it("only calls the function once after the delay with the last arguments", () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const debounced = debounce(fn, 100)
    debounced("a")
    debounced("b")
    vi.advanceTimersByTime(99)
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledOnce()
    expect(fn).toHaveBeenCalledWith("b")
  })
})

describe("urls and SEO", () => {
  it("strips trailing slashes from the base url", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://site.test///")
    expect(getBaseUrl()).toBe("https://site.test")
    expect(absoluteUrl("jobs")).toBe("https://site.test/jobs")
    expect(absoluteUrl("/jobs")).toBe("https://site.test/jobs")
  })

  it("uses the default domain when no env var is set", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "")
    expect(getBaseUrl()).toBe("https://ChayanJobs.in")
  })

  it("builds open graph, twitter and canonical metadata", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://site.test")
    const seo = generateSEO({ title: "T", description: "D", url: "blog/post", type: "article", publishedTime: "2026-01-01" })
    expect(seo.alternates.canonical).toBe("https://site.test/blog/post")
    expect(seo.openGraph.images[0].url).toBe("https://site.test/og.png")
    expect(seo.openGraph.type).toBe("article")
    expect(seo.twitter.images).toEqual(["https://site.test/og.png"])

    const home = generateSEO({ title: "T", description: "D", image: "https://cdn.test/x.png" })
    expect(home.openGraph.url).toBe("https://site.test")
    expect(home.openGraph.images[0].url).toBe("https://cdn.test/x.png")
    expect(home.openGraph.type).toBe("website")
  })
})

describe("formatCompact / formatViews", () => {
  it.each([
    [null, "0"],
    [Number.NaN, "0"],
    [-5, "0"],
    [982, "982"],
    [12_400, "12.4k"],
    [99_999, "100k"],
    [250_000, "2.5L"],
    [23_000_000, "2.3Cr"],
  ])("formatCompact(%s) = %s", (input, expected) => {
    expect(formatCompact(input as number | null)).toBe(expected)
  })

  it("uses singular and plural labels", () => {
    expect(formatViews(1)).toBe("1 view")
    expect(formatViews(0)).toBe("0 views")
    expect(formatViews(12_400)).toBe("12.4k views")
  })
})

describe("timeAgo", () => {
  it("labels recent days and falls back to a date", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-06-30T12:00:00Z"))
    const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000)
    expect(timeAgo(null)).toBe("")
    expect(timeAgo("garbage")).toBe("")
    expect(timeAgo(daysAgo(0))).toBe("Today")
    expect(timeAgo(daysAgo(1))).toBe("Yesterday")
    expect(timeAgo(daysAgo(4))).toBe("4d ago")
    expect(timeAgo(daysAgo(8))).toBe("1wk ago")
    expect(timeAgo(daysAgo(15))).toBe("2w ago")
    expect(timeAgo(daysAgo(60).toISOString())).toBe(formatDate(daysAgo(60)))
  })
})

describe("JSON-LD", () => {
  it("serialises data and escapes < so it cannot close a script tag", () => {
    expect(createJsonLD({ a: 1 })).toBe('{"a":1}')
    const out = safeJsonLd({ title: "</script><script>alert(1)</script>" })
    expect(out).not.toContain("<")
    expect(JSON.parse(out).title).toBe("</script><script>alert(1)</script>")
  })
})
