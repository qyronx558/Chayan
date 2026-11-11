import { describe, expect, it } from "vitest"
import {
  canManageAllContent,
  canManageUsers,
  canReviewContent,
  contentScope,
  isAdmin,
  isSuperAdmin,
  resolveContentScope,
  shortAdminId,
} from "@/lib/roles"

describe("role checks", () => {
  it.each([
    ["USER", false, false],
    ["ADMIN", true, false],
    ["SUPER_ADMIN", true, true],
    [null, false, false],
    [undefined, false, false],
  ])("%s -> admin=%s super=%s", (role, admin, superAdmin) => {
    expect(isAdmin(role)).toBe(admin)
    expect(isSuperAdmin(role)).toBe(superAdmin)
    expect(canManageAllContent(role)).toBe(superAdmin)
    expect(canManageUsers(role)).toBe(superAdmin)
    expect(canReviewContent(role)).toBe(superAdmin)
  })
})

describe("contentScope", () => {
  it("limits regular admins to their own content", () => {
    expect(contentScope("ADMIN", "u1")).toEqual({ createdById: "u1" })
    expect(contentScope("ADMIN", null)).toEqual({})
    expect(contentScope("SUPER_ADMIN", "u1")).toEqual({})
    expect(contentScope(undefined)).toEqual({})
  })
})

describe("resolveContentScope", () => {
  it("lets super admins see all content, optionally filtered", () => {
    expect(resolveContentScope("all", "SUPER_ADMIN", "me")).toEqual({})
    expect(resolveContentScope("all", "SUPER_ADMIN", "me", "other")).toEqual({ createdById: "other" })
  })

  it("throws a 403 when a regular admin asks for all content", () => {
    try {
      resolveContentScope("all", "ADMIN", "me")
      expect.unreachable()
    } catch (error) {
      expect((error as Error & { status: number }).status).toBe(403)
    }
  })

  it("defaults to the owner scope", () => {
    expect(resolveContentScope("mine", "ADMIN", "me")).toEqual({ createdById: "me" })
    expect(resolveContentScope(null, "SUPER_ADMIN", "me")).toEqual({})
  })
})

describe("shortAdminId", () => {
  it("shortens long ids and handles missing ones", () => {
    expect(shortAdminId(null)).toBe("-")
    expect(shortAdminId("abc")).toBe("abc")
    expect(shortAdminId("abcdefghijk")).toBe("abcdefgh…")
    expect(shortAdminId("abcdefghijk", 3)).toBe("abc…")
  })
})
