import { beforeEach, describe, expect, it, vi } from "vitest"

const prismaMock = vi.hoisted(() => ({
  company: { findUnique: vi.fn(), upsert: vi.fn() },
}))
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }))

import { domainOf, findOrCreateCompany, normalizeWebsite } from "@/lib/companies"

beforeEach(() => {
  prismaMock.company.findUnique.mockReset()
  prismaMock.company.upsert.mockReset().mockImplementation(async (args) => args)
})

describe("normalizeWebsite", () => {
  it("adds https, drops www and paths", () => {
    expect(normalizeWebsite("www.Example.com/careers")).toBe("https://example.com")
    expect(normalizeWebsite("http://jobs.example.org")).toBe("http://jobs.example.org")
    expect(normalizeWebsite("  ")).toBe("")
  })
  it("returns the input when it is not a valid url", () => {
    expect(normalizeWebsite("https://exa mple")).toBe("https://exa mple")
  })
})

describe("domainOf", () => {
  it("extracts the bare lowercase hostname", () => {
    expect(domainOf("https://www.Example.com/a")).toBe("example.com")
    expect(domainOf("example.com")).toBe("example.com")
    expect(domainOf(null)).toBe("")
  })
  it("falls back to string parsing for invalid urls", () => {
    expect(domainOf("http://WWW.bad host.com/x")).toBe("bad host.com")
  })
})

describe("findOrCreateCompany (integration with prisma mock)", () => {
  it("creates with the plain slug when it is free", async () => {
    prismaMock.company.findUnique.mockResolvedValue(null)
    const args = await findOrCreateCompany("  Acme Corp ", "www.acme.com")
    expect(prismaMock.company.findUnique).toHaveBeenCalledWith({ where: { slug: "acme-corp" } })
    expect(args).toEqual({
      where: { name: "Acme Corp" },
      update: { website: "https://acme.com" },
      create: { name: "Acme Corp", slug: "acme-corp", website: "https://acme.com" },
    })
  })

  it("adds a suffix when the slug is taken and skips empty websites", async () => {
    prismaMock.company.findUnique.mockResolvedValue({ id: "1" })
    type UpsertArgs = { create: { slug: string; website?: string }; update: object }
    const args = (await findOrCreateCompany("Acme", "  ")) as unknown as UpsertArgs
    expect(args.create.slug).toMatch(/^acme-[a-z0-9]+$/)
    expect(args.update).toEqual({})
    expect(args.create.website).toBeUndefined()
  })
})
