import { describe, expect, it } from "vitest"
import {
  buildRefLookup,
  emptyToNull,
  normalizeHeader,
  normalizeJobStatus,
  parseImportDate,
  parseVacancies,
  resolveRefId,
} from "@/lib/admin/import-normalize"

describe("normalizeHeader", () => {
  it.each([
    ["Job Title", "title"],
    ["No. of Posts", "totalVacancies"],
    ["Last-Date", "lastDate"],
    ["Hall Ticket", "downloadUrl"],
    ["Department Name", "departmentId"],
  ])("%j -> %s", (raw, key) => {
    expect(normalizeHeader(raw)).toBe(key)
  })
  it("returns null for unknown or empty headers", () => {
    expect(normalizeHeader("whatever")).toBeNull()
    expect(normalizeHeader(" -- ")).toBeNull()
  })
})

describe("normalizeJobStatus", () => {
  it("maps human words to the enum", () => {
    expect(normalizeJobStatus("Live")).toBe("ACTIVE")
    expect(normalizeJobStatus("closed")).toBe("EXPIRED")
    expect(normalizeJobStatus("coming soon")).toBe("UPCOMING")
    expect(normalizeJobStatus("n/a")).toBeUndefined()
    expect(normalizeJobStatus(null)).toBeUndefined()
    expect(normalizeJobStatus("weird")).toBeUndefined()
  })
})

describe("emptyToNull", () => {
  it("nulls placeholders and trims strings", () => {
    for (const v of [null, undefined, "", "  ", "NA", "n/a", "---", "Nil"]) expect(emptyToNull(v)).toBeNull()
    expect(emptyToNull("  x ")).toBe("x")
    expect(emptyToNull(5)).toBe(5)
  })
})

describe("parseImportDate", () => {
  it("parses real dates and rejects placeholders", () => {
    expect(parseImportDate("2026-08-03")).toBe("2026-08-03T00:00:00.000Z")
    expect(parseImportDate(new Date("2026-01-01T00:00:00Z"))).toBe("2026-01-01T00:00:00.000Z")
    expect(parseImportDate(new Date("bad"))).toBeNull()
    for (const v of ["TBA", "to be announced", "Soon", "TBD: later", "garbage", "", null]) expect(parseImportDate(v)).toBeNull()
  })
})

describe("parseVacancies", () => {
  it("extracts positive integers", () => {
    expect(parseVacancies("1,200 posts")).toBe(1200)
    expect(parseVacancies(12.7)).toBe(12)
    expect(parseVacancies(0)).toBeNull()
    expect(parseVacancies("-5")).toBeNull()
    expect(parseVacancies("none")).toBeNull()
    expect(parseVacancies(undefined)).toBeNull()
  })
})

describe("reference lookup", () => {
  const lookup = buildRefLookup([
    { id: "d1", name: "Staff Selection Commission", slug: "ssc" },
    { id: "d2", name: "staff selection commission" },
    { id: "j1", title: "SSC CGL 2026" },
  ])

  it("resolves ids, names, slugs and titles case-insensitively (first wins)", () => {
    expect(resolveRefId("d2", lookup)).toBe("d2")
    expect(resolveRefId("SSC", lookup)).toBe("d1")
    expect(resolveRefId("STAFF SELECTION COMMISSION", lookup)).toBe("d1")
    expect(resolveRefId(" ssc cgl 2026 ", lookup)).toBe("j1")
  })

  it("returns null when not found", () => {
    expect(resolveRefId("missing", lookup)).toBeNull()
    expect(resolveRefId("", lookup)).toBeNull()
    expect(resolveRefId(null, lookup)).toBeNull()
  })
})
