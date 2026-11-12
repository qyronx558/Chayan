import { beforeEach, describe, expect, it, vi } from "vitest"

const prismaMock = vi.hoisted(() => ({
  state: { findUnique: vi.fn() },
  district: { findUnique: vi.fn() },
}))
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }))

import { buildJobLocationWhere, validateJobLocation } from "@/lib/locations-server"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("buildJobLocationWhere", () => {
  const where = (qs: string) => buildJobLocationWhere(new URLSearchParams(qs))

  it("is empty without location params", () => {
    expect(where("search=clerk")).toEqual([])
  })

  it("filters exactly by level, state and district slugs", () => {
    expect(where("level=state&state=rajasthan")).toEqual([{ jobLevel: "STATE" }, { state: { slug: "rajasthan" } }])
    expect(where("level=district&state=chhattisgarh&district=bilaspur")).toEqual([
      { jobLevel: "DISTRICT" },
      { state: { slug: "chhattisgarh" } },
      { district: { slug: "bilaspur", state: { slug: "chhattisgarh" } } },
    ])
  })

  it("ignores unknown levels", () => {
    expect(where("level=galactic")).toEqual([])
  })

  it("state pages show central + that state's state jobs", () => {
    expect(where("eligibleState=rajasthan")).toEqual([
      { OR: [{ jobLevel: "CENTRAL" }, { jobLevel: "STATE", state: { slug: "rajasthan" } }] },
    ])
  })

  it("district pages also include that district's jobs", () => {
    expect(where("eligibleState=rajasthan&eligibleDistrict=jaipur")).toEqual([
      {
        OR: [
          { jobLevel: "CENTRAL" },
          { jobLevel: "STATE", state: { slug: "rajasthan" } },
          { jobLevel: "DISTRICT", district: { slug: "jaipur", state: { slug: "rajasthan" } } },
        ],
      },
    ])
  })
})

describe("validateJobLocation", () => {
  it("accepts a district that belongs to the state", async () => {
    prismaMock.state.findUnique.mockResolvedValue({ id: "s1" })
    prismaMock.district.findUnique.mockResolvedValue({ stateId: "s1" })
    expect(await validateJobLocation({ jobLevel: "DISTRICT", stateId: "s1", districtId: "d1" })).toEqual({
      ok: true,
      value: { jobLevel: "DISTRICT", stateId: "s1", districtId: "d1" },
    })
  })

  it("rejects a district from another state", async () => {
    prismaMock.state.findUnique.mockResolvedValue({ id: "s1" })
    prismaMock.district.findUnique.mockResolvedValue({ stateId: "s2" })
    const res = await validateJobLocation({ jobLevel: "DISTRICT", stateId: "s1", districtId: "d1" })
    expect(res).toEqual({ ok: false, error: "Selected District does not belong to the selected State." })
  })

  it("rejects a missing state", async () => {
    prismaMock.state.findUnique.mockResolvedValue(null)
    const res = await validateJobLocation({ jobLevel: "STATE", stateId: "gone" })
    expect(res.ok).toBe(false)
  })

  it("does not query the database for central jobs", async () => {
    expect(await validateJobLocation({ jobLevel: "CENTRAL", stateId: "s1" })).toMatchObject({ ok: true })
    expect(prismaMock.state.findUnique).not.toHaveBeenCalled()
  })
})
