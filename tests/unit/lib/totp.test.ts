import { afterEach, describe, expect, it, vi } from "vitest"
import { base32Decode, base32Encode, verifyTOTP } from "@/lib/totp"

// RFC 6238 test secret ("12345678901234567890" in ASCII).
const SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ"

afterEach(() => {
  vi.useRealTimers()
})

describe("base32", () => {
  it("encodes and decodes round-trip", () => {
    const bytes = new TextEncoder().encode("12345678901234567890")
    expect(base32Encode(bytes)).toBe(SECRET)
    expect(new TextDecoder().decode(base32Decode(SECRET))).toBe("12345678901234567890")
  })

  it("ignores padding, lowercase and invalid characters", () => {
    expect(base32Decode("mzxw6===")).toEqual(new TextEncoder().encode("foo"))
    expect(base32Decode("MZ!XW6")).toEqual(new TextEncoder().encode("foo"))
  })
})

describe("verifyTOTP", () => {
  it("accepts the RFC 6238 code at T=59s", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(59_000)
    expect(await verifyTOTP(SECRET, "287082", 0)).toBe(true)
  })

  it("accepts the previous step inside the window and rejects outside it", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(59_000 + 30_000)
    expect(await verifyTOTP(SECRET, "287082", 1)).toBe(true)
    expect(await verifyTOTP(SECRET, "287082", 0)).toBe(false)
  })

  it("rejects wrong codes", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(59_000)
    expect(await verifyTOTP(SECRET, "000000")).toBe(false)
  })
})
