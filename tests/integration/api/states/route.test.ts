import { beforeEach, describe, expect, it, vi } from "vitest"

const prismaMock = vi.hoisted(() => ({ state: { findMany: vi.fn() } }))
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }))

import { GET } from "@/app/api/states/route"
import { INDIAN_STATES_28 } from "@/lib/states"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("GET /api/states", () => {
  it("only asks for the 28 states, sorted", async () => {
    prismaMock.state.findMany.mockResolvedValue([{ id: "s1", name: "Bihar" }])
    const res = await GET()
    expect(await res.json()).toEqual({ success: true, data: [{ id: "s1", name: "Bihar" }] })
    expect(prismaMock.state.findMany).toHaveBeenCalledWith({
      where: { name: { in: [...INDIAN_STATES_28] } },
      orderBy: { name: "asc" },
    })
  })

  it("returns 500 on database errors", async () => {
    prismaMock.state.findMany.mockImplementation(async () => {
      throw new Error("offline")
    })
    const res = await GET()
    expect(res.status).toBe(500)
    expect((await res.json()).success).toBe(false)
  })
})
