import { afterEach, describe, expect, it, vi } from "vitest"
import {
  ADMIN_MODULES,
  BULK_ACTIONS,
  canApprove,
  canBulk,
  canImport,
  canSeeAll,
  isExpiredRow,
  isExpiringSoon,
  isProbablyBrokenUrl,
  missingFieldsScore,
  moduleMeta,
} from "@/lib/admin/permissions"

afterEach(() => {
  vi.useRealTimers()
})

describe("module registry", () => {
  it("finds module metadata by key", () => {
    expect(moduleMeta("Job")?.endpoint).toBe("/api/jobs")
    expect(moduleMeta("Nope")).toBeUndefined()
    expect(ADMIN_MODULES).toHaveLength(6)
    expect(BULK_ACTIONS.filter((a) => a.superOnly).map((a) => a.value)).toEqual(["approve", "reject"])
  })
})

describe("permission helpers", () => {
  it("gives admins bulk/import and super admins approve/see-all", () => {
    expect([canBulk("ADMIN"), canImport("ADMIN"), canApprove("ADMIN"), canSeeAll("ADMIN")]).toEqual([true, true, false, false])
    expect([canApprove("SUPER_ADMIN"), canSeeAll("SUPER_ADMIN")]).toEqual([true, true])
    expect(canBulk("USER")).toBe(false)
  })
})

describe("quality helpers", () => {
  it("detects expired and expiring rows", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-06-15T00:00:00Z"))
    expect(isExpiredRow("2026-06-01", "ACTIVE")).toBe(true)
    expect(isExpiredRow("2026-06-01", "EXPIRED")).toBe(false)
    expect(isExpiredRow("bad")).toBe(false)
    expect(isExpiredRow(null)).toBe(false)
    expect(isExpiringSoon("2026-06-18")).toBe(true)
    expect(isExpiringSoon("2026-07-30")).toBe(false)
    expect(isExpiringSoon("2026-06-01")).toBe(false)
    expect(isExpiringSoon("bad")).toBe(false)
    expect(isExpiringSoon(undefined)).toBe(false)
  })

  it("lists missing required fields", () => {
    expect(missingFieldsScore({ title: "x", slug: " ", lastDate: null }, ["title", "slug", "lastDate", "status"])).toEqual([
      "slug",
      "lastDate",
      "status",
    ])
  })

  it("flags broken urls but allows relative paths", () => {
    expect(isProbablyBrokenUrl("/jobs/x")).toBe(false)
    expect(isProbablyBrokenUrl("https://ssc.gov.in")).toBe(false)
    expect(isProbablyBrokenUrl("ssc")).toBe(true)
    expect(isProbablyBrokenUrl(null)).toBe(false)
  })
})
