import { createHmac } from "crypto"

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

export function base32Decode(encoded: string): Buffer {
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
  return Buffer.from(bytes)
}

export function base32Encode(buffer: Buffer): string {
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

export function verifyTOTP(secret: string, token: string, window = 1): boolean {
  const timeStep = 30
  const now = Math.floor(Date.now() / 1000 / timeStep)
  for (let i = -window; i <= window; i++) {
    const time = now + i
    const buf = Buffer.alloc(8)
    buf.writeUInt32BE(0, 0)
    buf.writeUInt32BE(time, 4)
    const key = base32Decode(secret)
    const hmac = createHmac("sha1", key).update(buf).digest()
    const offset = hmac[hmac.length - 1] & 0x0f
    const code =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)
    const otp = String(code % 10 ** 6).padStart(6, "0")
    if (otp === token) return true
  }
  return false
}
