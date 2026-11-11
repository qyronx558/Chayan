import { describe, expect, it } from "vitest"
import {
  isMissingColumnError,
  isMissingTableError,
  isSchemaMismatchError,
  isUnknownArgumentError,
  MIGRATION_REQUIRED_MESSAGE,
} from "@/lib/prisma-errors"

const withCode = (code: string, message = "x") => Object.assign(new Error(message), { code })

describe("prisma error helpers", () => {
  it("detects unknown arguments", () => {
    expect(isUnknownArgumentError(new Error("Unknown argument `foo`"))).toBe(true)
    expect(isUnknownArgumentError("plain string")).toBe(false)
  })

  it("detects missing columns by code or message", () => {
    expect(isMissingColumnError(withCode("P2022"))).toBe(true)
    expect(isMissingColumnError(new Error('column "x" does not exist'))).toBe(true)
    expect(isMissingColumnError(new Error("no such column: y"))).toBe(true)
    expect(isMissingColumnError(new Error("other"))).toBe(false)
  })

  it("detects missing tables by code or message", () => {
    expect(isMissingTableError(withCode("P2021"))).toBe(true)
    expect(isMissingTableError(new Error("no such table: z"))).toBe(true)
    expect(isMissingTableError(null)).toBe(false)
  })

  it("combines all schema mismatch checks", () => {
    expect(isSchemaMismatchError(withCode("P2021"))).toBe(true)
    expect(isSchemaMismatchError(new Error("Unknown argument"))).toBe(true)
    expect(isSchemaMismatchError(new Error("timeout"))).toBe(false)
    expect(MIGRATION_REQUIRED_MESSAGE).toMatch(/migration/)
  })
})
