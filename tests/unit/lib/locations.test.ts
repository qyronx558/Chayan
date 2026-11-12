import { describe, expect, it } from "vitest"
import path from "node:path"
import {
  districtPagePath,
  jobLocationLabel,
  parseCsv,
  parseJobLevel,
  resolveJobLocation,
  statePagePath,
  toSlug,
} from "@/lib/locations"
import { readLocationsCsv } from "@/lib/location-seed"
import { districtSchema, jobSchema, stateSchema } from "@/lib/validations"

describe("toSlug", () => {
  it("makes URL-safe slugs", () => {
    expect(toSlug("Uttar Pradesh")).toBe("uttar-pradesh")
    expect(toSlug("Jammu & Kashmir")).toBe("jammu-and-kashmir")
    expect(toSlug("Dr. B.R. Ambedkar Konaseema")).toBe("dr-b-r-ambedkar-konaseema")
    expect(toSlug("North 24 Parganas")).toBe("north-24-parganas")
    expect(toSlug("Mohla-Manpur-Ambagarh Chowki")).toBe("mohla-manpur-ambagarh-chowki")
    expect(toSlug("Zünheboto")).toBe("zunheboto")
    expect(toSlug("  Lahaul and Spiti ")).toBe("lahaul-and-spiti")
  })
})

describe("parseJobLevel", () => {
  it("accepts any casing and rejects junk", () => {
    expect(parseJobLevel("central")).toBe("CENTRAL")
    expect(parseJobLevel(" District ")).toBe("DISTRICT")
    expect(parseJobLevel("national")).toBeNull()
    expect(parseJobLevel(undefined)).toBeNull()
  })
})

describe("resolveJobLocation", () => {
  it("central drops state and district", () => {
    expect(resolveJobLocation({ jobLevel: "CENTRAL", stateId: "s1", districtId: "d1" })).toEqual({
      ok: true,
      value: { jobLevel: "CENTRAL", stateId: null, districtId: null },
    })
  })

  it("state requires a state and drops the district", () => {
    expect(resolveJobLocation({ jobLevel: "STATE", stateId: null })).toMatchObject({ ok: false, field: "stateId" })
    expect(resolveJobLocation({ jobLevel: "state", stateId: "s1", districtId: "d1" })).toEqual({
      ok: true,
      value: { jobLevel: "STATE", stateId: "s1", districtId: null },
    })
  })

  it("district requires both", () => {
    expect(resolveJobLocation({ jobLevel: "DISTRICT", stateId: null, districtId: "d1" })).toMatchObject({ ok: false, field: "stateId" })
    expect(resolveJobLocation({ jobLevel: "DISTRICT", stateId: "s1" })).toMatchObject({ ok: false, field: "districtId" })
    expect(resolveJobLocation({ jobLevel: "DISTRICT", stateId: "s1", districtId: "d1" })).toEqual({
      ok: true,
      value: { jobLevel: "DISTRICT", stateId: "s1", districtId: "d1" },
    })
  })

  it("derives the level for legacy callers that only send ids", () => {
    expect(resolveJobLocation({}).ok && resolveJobLocation({})).toMatchObject({ value: { jobLevel: "CENTRAL" } })
    expect(resolveJobLocation({ stateId: "s1" })).toMatchObject({ value: { jobLevel: "STATE", stateId: "s1" } })
    expect(resolveJobLocation({ stateId: "s1", districtId: "d1" })).toMatchObject({ value: { jobLevel: "DISTRICT" } })
  })

  it("rejects unknown levels", () => {
    expect(resolveJobLocation({ jobLevel: "galactic" })).toMatchObject({ ok: false, field: "jobLevel" })
  })
})

describe("jobLocationLabel", () => {
  const state = { name: "Rajasthan", slug: "rajasthan" }
  const district = { name: "Jaipur", slug: "jaipur" }
  it("labels each level", () => {
    expect(jobLocationLabel({ jobLevel: "CENTRAL", state: null })).toBe("All India")
    expect(jobLocationLabel({ jobLevel: "STATE", state })).toBe("Rajasthan")
    expect(jobLocationLabel({ jobLevel: "DISTRICT", state, district })).toBe("Jaipur, Rajasthan")
  })
  it("falls back to the data when the level is missing", () => {
    expect(jobLocationLabel({ state })).toBe("Rajasthan")
    expect(jobLocationLabel({})).toBe("All India")
  })
})

describe("page paths", () => {
  it("builds state and district URLs", () => {
    expect(statePagePath("rajasthan")).toBe("/jobs/state/rajasthan")
    expect(districtPagePath("chhattisgarh", "bilaspur")).toBe("/jobs/district/chhattisgarh/bilaspur")
  })
})

describe("parseCsv", () => {
  it("handles quotes, escaped quotes, CRLF and a BOM", () => {
    expect(parseCsv('﻿a,b\r\n"x, y","say ""hi"""\r\n\r\n')).toEqual([
      ["a", "b"],
      ["x, y", 'say "hi"'],
    ])
  })
})

describe("india_districts_statewise.csv", () => {
  const rows = readLocationsCsv(path.join(process.cwd(), "prisma", "data", "india_districts_statewise.csv"))
  const states = new Map<string, { type: string; districts: string[] }>()
  for (const r of rows) {
    const s = states.get(r.state) ?? { type: r.stateType, districts: [] }
    s.districts.push(r.district)
    states.set(r.state, s)
  }

  it("has 28 states and 8 union territories", () => {
    const types = [...states.values()].map((s) => s.type)
    expect(types.filter((t) => t === "STATE")).toHaveLength(28)
    expect(types.filter((t) => t === "UNION_TERRITORY")).toHaveLength(8)
  })

  it("has roughly 780 districts with unique slugs per state", () => {
    expect(rows.length).toBeGreaterThan(760)
    expect(rows.length).toBeLessThan(820)
    for (const [name, s] of states) {
      const slugs = s.districts.map(toSlug)
      expect(new Set(slugs).size, `duplicate district slug in ${name}`).toBe(slugs.length)
      expect(slugs.every((x) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(x))).toBe(true)
    }
  })

  it("allows the same district name in different states", () => {
    expect(states.get("Chhattisgarh")?.districts).toContain("Bilaspur")
    expect(states.get("Himachal Pradesh")?.districts).toContain("Bilaspur")
  })
})

describe("location schemas", () => {
  const base = { title: "Clerk", slug: "clerk", departmentId: "d", categoryId: "c" }

  it("jobSchema enforces state/district per level", () => {
    expect(jobSchema.safeParse({ ...base, jobLevel: "central" }).success).toBe(true)
    const noState = jobSchema.safeParse({ ...base, jobLevel: "STATE" })
    expect(noState.success).toBe(false)
    expect(noState.error?.issues[0].path).toEqual(["stateId"])
    const noDistrict = jobSchema.safeParse({ ...base, jobLevel: "DISTRICT", stateId: "s1" })
    expect(noDistrict.error?.issues[0].path).toEqual(["districtId"])
    expect(jobSchema.safeParse({ ...base, jobLevel: "DISTRICT", stateId: "s1", districtId: "d1" }).success).toBe(true)
    // Bulk import: district by name is resolved server-side.
    expect(jobSchema.safeParse({ ...base, jobLevel: "DISTRICT", stateId: "s1", districtName: "Jaipur" }).success).toBe(true)
    expect(jobSchema.safeParse({ ...base, jobLevel: "planet" }).success).toBe(false)
  })

  it("state and district schemas validate slugs", () => {
    expect(stateSchema.parse({ name: "Goa" })).toMatchObject({ name: "Goa", type: "STATE" })
    expect(stateSchema.safeParse({ name: "Goa", slug: "Bad Slug" }).success).toBe(false)
    expect(districtSchema.parse({ name: "North Goa", slug: "" }).slug).toBeNull()
    expect(districtSchema.safeParse({ name: "" }).success).toBe(false)
  })
})
