const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

export function base32Decode(encoded: string): Uint8Array {
  let bits = ""
  for (const char of encoded.toUpperCase().replace(/=+$/, "")) {
    const idx = ALPHABET.indexOf(char)
    if (idx === -1) continue
    bits += idx.toString(2).padStart(5, "0")
  }
  const bytes: number[] = []
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2))
  }
  return new Uint8Array(bytes)
}

export function base32Encode(buffer: Uint8Array): string {
  let bits = ""
  for (const byte of buffer) {
    bits += byte.toString(2).padStart(8, "0")
  }
  let result = ""
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, "0")
    result += ALPHABET[parseInt(chunk, 2)]
  }
  return result
}

export async function verifyTOTP(secret: string, token: string, window = 1): Promise<boolean> {
  const timeStep = 30
  const now = Math.floor(Date.now() / 1000 / timeStep)
  const key = base32Decode(secret)
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key.buffer as ArrayBuffer,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  )

  for (let i = -window; i <= window; i++) {
    const time = now + i
    const buf = new ArrayBuffer(8)
    const view = new DataView(buf)
    view.setUint32(0, 0)
    view.setUint32(4, time)

    const hmacResult = new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, buf))
    const offset = hmacResult[hmacResult.length - 1] & 0x0f
    const code =
      ((hmacResult[offset] & 0x7f) << 24) |
      ((hmacResult[offset + 1] & 0xff) << 16) |
      ((hmacResult[offset + 2] & 0xff) << 8) |
      (hmacResult[offset + 3] & 0xff)
    const otp = String(code % 10 ** 6).padStart(6, "0")
    if (otp === token) return true
  }
  return false
}
