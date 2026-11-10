import { createHmac, randomBytes, timingSafeEqual } from "crypto"

export const EDIT_WINDOW_MS = 15 * 60 * 1000
export const RATE_LIMIT_MS = 30 * 1000
export const RATE_LIMIT_STRIKES = 3
export const CAPTCHA_LOCKOUT_MS = 10 * 60 * 1000
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024

type RateEntry = { lastAt: number; strikes: number; captchaUntil: number }

const rateLimits = new Map<string, RateEntry>()

function getEntry(userId: string): RateEntry {
  let entry = rateLimits.get(userId)
  if (!entry) {
    entry = { lastAt: 0, strikes: 0, captchaUntil: 0 }
    rateLimits.set(userId, entry)
  }
  return entry
}

export function checkRateLimit(userId: string): {
  allowed: boolean
  requiresCaptcha: boolean
  retryAfterSeconds: number
} {
  const entry = getEntry(userId)
  const now = Date.now()
  const requiresCaptcha = now < entry.captchaUntil
  const elapsed = now - entry.lastAt

  if (elapsed < RATE_LIMIT_MS) {
    return {
      allowed: false,
      requiresCaptcha,
      retryAfterSeconds: Math.ceil((RATE_LIMIT_MS - elapsed) / 1000),
    }
  }

  return { allowed: true, requiresCaptcha, retryAfterSeconds: 0 }
}

export function recordCommentPosted(userId: string): void {
  const entry = getEntry(userId)
  const now = Date.now()
  if (now - entry.lastAt < RATE_LIMIT_MS * 2) {
    entry.strikes += 1
  } else {
    entry.strikes = 1
  }
  entry.lastAt = now
  if (entry.strikes >= RATE_LIMIT_STRIKES) {
    entry.captchaUntil = now + CAPTCHA_LOCKOUT_MS
    entry.strikes = 0
  }
}

const COACHING_PATTERNS = [
  /\ballen\b/i,
  /\bresonance\b/i,
  /\bcareer\s*will\b/i,
  /\badda ?247\b/i,
  /\btestbook\b/i,
  /\bbyj[uo]'?s?\b/i,
  /\bunacademy\b/i,
  /\bgradeup\b/i,
  /\bwifistudy\b/i,
  /\bsscadda\b/i,
  /\bexampur\b/i,
  /\bstudy\s*iq\b/i,
  /\bvajiram\b/i,
  /\bdrishti\s*ias\b/i,
]

export type FlagReason = "phone_number" | "external_link" | "coaching_promotion"

export function moderateContent(content: string): FlagReason[] {
  const reasons: FlagReason[] = []
  if (/(\+?\d[\d\s-]{8,}\d)/.test(content)) reasons.push("phone_number")
  if (/(https?:\/\/|www\.|[a-z0-9-]+\.(com|in|net|org|co)(\/|\s|$))/i.test(content)) {
    reasons.push("external_link")
  }
  if (COACHING_PATTERNS.some((re) => re.test(content))) reasons.push("coaching_promotion")
  return reasons
}

// Without AUTH_SECRET a random per-process key is used, never a value that
// is readable in the source code.
const fallbackSecret = randomBytes(32).toString("hex")

function secret(): string {
  return process.env.AUTH_SECRET || fallbackSecret
}

export function issueCaptcha(): { question: string; token: string } {
  const a = Math.floor(Math.random() * 9) + 2
  const b = Math.floor(Math.random() * 9) + 2
  const answer = a + b
  const expires = Date.now() + 5 * 60 * 1000
  const payload = `${answer}.${expires}`
  const sig = createHmac("sha256", secret()).update(payload).digest("hex")
  return {
    question: `What is ${a} + ${b}?`,
    token: Buffer.from(`${payload}.${sig}`).toString("base64url"),
  }
}

export function verifyCaptcha(token: string, answer: string): boolean {
  try {
    const [payload, sig] = Buffer.from(token, "base64url").toString("utf8").split(".")
    if (!payload || !sig) return false
    const expected = createHmac("sha256", secret()).update(payload).digest("hex")
    const a = Buffer.from(sig, "hex")
    const b = Buffer.from(expected, "hex")
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false
    const [expectedAnswer, expires] = payload.split(".")
    if (Date.now() > Number(expires)) return false
    return expectedAnswer.trim() === answer.trim()
  } catch {
    return false
  }
}

export function canEdit(createdAt: Date, editedAt: Date | null, role?: string | null): boolean {
  if (role === "ADMIN" || role === "SUPER_ADMIN") return true
  return !editedAt && Date.now() - createdAt.getTime() <= EDIT_WINDOW_MS
}
