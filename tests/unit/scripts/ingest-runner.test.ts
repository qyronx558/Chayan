import path from "node:path"
import { describe, expect, it } from "vitest"
import { inShard, loadSources, parseArgs, selectSources } from "../../../scripts/ingest/run"
import { parseRobots } from "../../../scripts/ingest/http"
import { isReadableText } from "../../../scripts/ingest/documents"
import { hostCandidates } from "../../../scripts/ingest/discover-districts"
import { INGEST_KINDS, type SourceDef } from "@/lib/ingest/types"

describe("CLI args", () => {
  it("parses tier, shard, source and flags", () => {
    expect(parseArgs(["--tier=district", "--shard=2/4", "--dry-run", "--limit=5"])).toMatchObject({
      tier: "district",
      shard: { k: 2, n: 4 },
      dryRun: true,
      limit: 5,
    })
    expect(parseArgs(["--source=nic:bihar/patna"]).source).toBe("nic:bihar/patna")
    expect(() => parseArgs(["--tier=planet"])).toThrow(/unknown --tier/)
    expect(parseArgs([]).limit).toBeUndefined() // admin setting decides
    expect(parseArgs(["--scheduled"]).scheduled).toBe(true)
  })
  it("skips switched-off sources unless one is asked for by id", () => {
    const all = [
      { id: "a", name: "A", level: "STATE", adapter: "html-links", url: "https://a.gov.in" },
      { id: "b", name: "B", level: "STATE", adapter: "html-links", url: "https://b.gov.in", disabled: true },
    ] as SourceDef[]
    expect(selectSources(all, { tier: "state" }).map((s) => s.id)).toEqual(["a"])
    expect(selectSources(all, { source: "b" }).map((s) => s.id)).toEqual(["b"])
  })
})

describe("sharding", () => {
  const ids = Array.from({ length: 200 }, (_, i) => `nic:s/d${i}`)
  it("puts every source in exactly one of N shards", () => {
    for (const id of ids) {
      const hits = [1, 2, 3, 4].filter((k) => inShard(id, { k, n: 4 }))
      expect(hits).toHaveLength(1)
    }
  })
  it("spreads sources roughly evenly", () => {
    const sizes = [1, 2, 3, 4].map((k) => ids.filter((id) => inShard(id, { k, n: 4 })).length)
    for (const s of sizes) expect(s).toBeGreaterThan(30)
  })
})

describe("committed source registry", () => {
  const all = loadSources(path.resolve(__dirname, "../../../scripts/ingest/sources"))

  it("has unique ids and valid adapters / levels", () => {
    expect(new Set(all.map((s) => s.id)).size).toBe(all.length)
    for (const s of all) {
      expect(["nic-s3waas", "html-links"]).toContain(s.adapter)
      expect(["CENTRAL", "STATE", "DISTRICT"]).toContain(s.level)
      expect(s.url).toMatch(/^https:\/\//)
      if (s.include) expect(() => new RegExp(s.include!)).not.toThrow()
    }
  })

  it("gives state + district names to every local source (needed to place posts on location pages)", () => {
    for (const s of all) {
      if (s.level !== "CENTRAL") expect(s.state, s.id).toBeTruthy()
      if (s.level === "DISTRICT") expect(s.district, s.id).toBeTruthy()
    }
  })

  it("covers all three tiers", () => {
    const pick = (tier: "central" | "state" | "district") => selectSources(all, { tier })
    expect(pick("central").length).toBeGreaterThan(0)
    expect(pick("state").length).toBeGreaterThan(0)
    expect(pick("district").length).toBeGreaterThan(100)
    expect(selectSources(all, { source: "bpsc" }).map((s: SourceDef) => s.id)).toEqual(["bpsc"])
  })

  it("knows every content kind", () => {
    expect(INGEST_KINDS).toContain("jobs")
  })
})

describe("robots.txt", () => {
  it("uses the * group when there is no bot-specific one", () => {
    expect(parseRobots("User-agent: *\nDisallow: /admin\nDisallow: /search # q\n")).toEqual(["/admin", "/search"])
  })
  it("prefers our own group, even when grouped with other agents", () => {
    const txt = "User-agent: *\nDisallow: /\n\nUser-agent: Googlebot\nUser-agent: ChayanJobsBot\nDisallow: /private\n"
    expect(parseRobots(txt)).toEqual(["/private"])
  })
  it("treats an empty Disallow as allow-all", () => {
    expect(parseRobots("User-agent: *\nDisallow:\n")).toEqual([])
  })
})

describe("PDF readability", () => {
  it("accepts English and Unicode Hindi text layers", () => {
    expect(isReadableText("Applications are invited for the post of Staff Nurse. The last date for the application is 30/11/2026. ".repeat(4))).toBe(true)
    expect(isReadableText("जिला स्वास्थ्य समिति पटना द्वारा संविदा आधारित स्टाफ नर्स पद हेतु आवेदन आमंत्रित किए जाते हैं ".repeat(4))).toBe(true)
  })
  it("rejects scans and legacy-font (Kruti Dev) gibberish", () => {
    expect(isReadableText("")).toBe(false)
    expect(isReadableText("ftyk LokLF; lfefr iVuk }kjk lafonk vk/kkfjr LVkWQ ulZ in gsrq vkosnu vkeaf=r fd, tkrs gSa ".repeat(4))).toBe(false)
  })
})

describe("district host candidates", () => {
  it("tries joined, hyphenated and first-word hosts on nic.in and gov.in", () => {
    expect(hostCandidates("East Champaran")).toEqual(
      expect.arrayContaining(["eastchamparan.nic.in", "east-champaran.nic.in", "east.nic.in", "eastchamparan.gov.in"]),
    )
    expect(hostCandidates("Y.S.R. (Kadapa)")).toContain("ysr.nic.in")
  })
})
