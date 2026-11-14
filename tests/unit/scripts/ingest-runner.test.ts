import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it, vi } from "vitest"
import { inShard, loadSources, parseArgs, resolveApiBase, robotsNote, selectSources } from "../../../scripts/ingest/run"
import { fallbackAgentFor, parseRobots } from "../../../scripts/ingest/http"
import { isReadableText } from "../../../scripts/ingest/documents"
import { hostCandidates, pageNamesState } from "../../../scripts/ingest/discover-districts"
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

  it("covers 40+ central boards, 28+ state boards and most districts", () => {
    expect(all.filter((s) => s.level === "CENTRAL").length).toBeGreaterThanOrEqual(40)
    expect(all.filter((s) => s.level === "STATE").length).toBeGreaterThanOrEqual(28)
    expect(all.filter((s) => s.level === "DISTRICT").length).toBeGreaterThanOrEqual(550)
  })

  it("uses the exact seeded state / district names (posts must land on real location pages)", () => {
    const csv = readFileSync(path.resolve(__dirname, "../../../prisma/data/india_districts_statewise.csv"), "utf8")
      .split(/\r?\n/)
      .slice(1)
      .filter(Boolean)
      .map((l) => l.match(/("([^"]|"")*"|[^,]*)(,|$)/g)!.map((c) => c.replace(/,$/, "").replace(/^"|"$/g, "").trim()))
    const states = new Set(csv.map((c) => c[0]))
    const districts = new Set(csv.map((c) => `${c[0]}/${c[2]}`))
    for (const s of all) {
      if (s.state) expect(states, s.id).toContain(s.state)
      if (s.district) expect(districts, s.id).toContain(`${s.state}/${s.district}`)
    }
  })
})

describe("TLS compatibility fallbacks", () => {
  it("retries legacy-renegotiation servers with the legacy agent, keeping certificate checks first", () => {
    expect(fallbackAgentFor("ERR_SSL_UNSAFE_LEGACY_RENEGOTIATION_DISABLED", "strict")).toBe("legacy")
    expect(fallbackAgentFor("UNABLE_TO_VERIFY_LEAF_SIGNATURE", "strict")).toBe("lenient")
    expect(fallbackAgentFor("UNABLE_TO_VERIFY_LEAF_SIGNATURE", "legacy")).toBe("legacyLenient")
    expect(fallbackAgentFor("ERR_SSL_UNSAFE_LEGACY_RENEGOTIATION_DISABLED", "lenient")).toBe("legacyLenient")
  })
  it("does not retry other errors or loop", () => {
    expect(fallbackAgentFor("ENOTFOUND", "strict")).toBeNull()
    expect(fallbackAgentFor("UNABLE_TO_VERIFY_LEAF_SIGNATURE", "lenient")).toBeNull()
    expect(fallbackAgentFor("ERR_SSL_UNSAFE_LEGACY_RENEGOTIATION_DISABLED", "legacyLenient")).toBeNull()
  })
})

describe("robots-blocked notices", () => {
  it("explains the S3WaaS CDN's outside-India block once per host", () => {
    expect(robotsNote("cdn.s3waas.gov.in", 76)).toMatch(/76 notice file\(s\).*outside India.*District PDFs/)
    expect(robotsNote("example.gov.in", 2)).not.toMatch(/India/)
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
  it("adds state portal domains, renamed-district aliases and state prefixes", () => {
    expect(hostCandidates("Barpeta", "Assam")).toContain("barpeta.assam.gov.in")
    expect(hostCandidates("Gurugram", "Haryana")).toContain("gurgaon.nic.in")
    expect(hostCandidates("Kangra", "Himachal Pradesh")).toContain("hpkangra.nic.in")
    expect(hostCandidates("Central Delhi", "Delhi")).toContain("dmcentral.delhi.gov.in")
    expect(pageNamesState("जिला मुंगेली, छत्तीसगढ़ सरकार", "Chhattisgarh")).toBe(true)
    expect(pageNamesState("district patna, government of bihar", "Bihar")).toBe(true)
    expect(pageNamesState("district patna, government of bihar", "Assam")).toBe(false)
    // two-letter guesses only under a state domain, never bare nic.in
    expect(hostCandidates("Dakshina Kannada", "Karnataka")).not.toContain("dk.nic.in")
  })
})

describe("site address", () => {
  const redirect = (to: string) => new Response(null, { status: 308, headers: { location: to } })
  const ok = () => new Response("{}", { status: 401 })

  it("follows the apex → www redirect once, so the secret is never dropped", async () => {
    const f = vi.fn().mockResolvedValueOnce(redirect("https://www.chayanjobs.com/api/cron/ingest/config")).mockResolvedValueOnce(ok())
    await expect(resolveApiBase("https://chayanjobs.com/", f)).resolves.toBe("https://www.chayanjobs.com")
    expect(f.mock.calls[0][1]).toMatchObject({ redirect: "manual" })
    expect(f.mock.calls[0][1].headers).toBeUndefined() // no secret on the probe
  })
  it("keeps an address that does not redirect", async () => {
    await expect(resolveApiBase("https://www.chayanjobs.com", vi.fn().mockResolvedValue(ok()))).resolves.toBe("https://www.chayanjobs.com")
  })
  it("refuses to follow a redirect to another site", async () => {
    const f = vi.fn().mockResolvedValue(redirect("https://evil.example.com/x"))
    await expect(resolveApiBase("https://chayanjobs.com", f)).rejects.toThrow(/another site/)
  })
})
