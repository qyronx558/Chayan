import { prisma } from "@/lib/prisma"

/**
 * Shared rate limiter for auth and other abuse-prone endpoints.
 *
 * Counters live in the existing "ContactRateLimit" table so they hold across
 * serverless instances. Keys are namespaced ("rl:") and hashed, so they never
 * collide with the contact form's own entries. If the database is unavailable
 * the limiter falls back to a per-instance in-memory counter instead of
 * blocking real users.
 *
 * Edge-safe on purpose (Web Crypto only): this file is imported by auth.ts,
 * which is bundled into the middleware.
 */

export interface RateRule {
  key: string
  max: number
  windowSec: number
}

export interface RateResult {
  ok: boolean
  retryAfter: number
}

const memory = new Map<string, { count: number; expiresAt: number }>()

const IPV4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/
const IPV6 = /^[0-9a-f:.]{2,45}$/i

/** Client IP from a header the ingress proxy overwrites. Null when none is trusted. */
export function clientIp(request: { headers: Headers } | null | undefined): string | null {
  if (!request?.headers) return null
  const header = process.env.CONTACT_IP_HEADER || (process.env.VERCEL ? "x-vercel-forwarded-for" : "")
  if (!header) return null
  const ip = request.headers.get(header)?.split(",")[0]?.trim()
  if (!ip) return null
  return IPV4.test(ip) || (ip.includes(":") && IPV6.test(ip)) ? ip.toLowerCase() : null
}

async function hashKey(key: string): Promise<string> {
  const secret = process.env.AUTH_SECRET || "rate-limit-development"
  const bytes = new TextEncoder().encode(`${secret}:rl:${key}`)
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))
  let out = ""
  for (const b of digest) out += b.toString(16).padStart(2, "0")
  return out
}

function hitMemory(key: string, windowSec: number, now: number): { count: number; expiresAt: number } {
  if (memory.size > 5000) {
    for (const [k, v] of memory) if (v.expiresAt <= now) memory.delete(k)
  }
  const entry = memory.get(key)
  if (!entry || entry.expiresAt <= now) {
    const fresh = { count: 1, expiresAt: now + windowSec * 1000 }
    memory.set(key, fresh)
    return fresh
  }
  entry.count += 1
  return entry
}

async function hit(rule: RateRule): Promise<{ count: number; expiresAt: number }> {
  const now = Date.now()
  const key = await hashKey(rule.key)
  try {
    const nowDate = new Date(now)
    const expiresAt = new Date(now + rule.windowSec * 1000)
    const [entry] = await prisma.$queryRaw<{ count: number; expiresAt: Date }[]>`
      INSERT INTO "ContactRateLimit" ("key", "count", "expiresAt") VALUES (${key}, 1, ${expiresAt})
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "ContactRateLimit"."expiresAt" <= ${nowDate} THEN 1 ELSE "ContactRateLimit"."count" + 1 END,
        "expiresAt" = CASE WHEN "ContactRateLimit"."expiresAt" <= ${nowDate} THEN ${expiresAt} ELSE "ContactRateLimit"."expiresAt" END
      RETURNING "count", "expiresAt"
    `
    return { count: Number(entry.count), expiresAt: new Date(entry.expiresAt).getTime() }
  } catch {
    return hitMemory(key, rule.windowSec, now)
  }
}

/** Counts one hit against every rule. Blocked when any rule is over its cap. */
export async function rateLimit(rules: RateRule[]): Promise<RateResult> {
  let retryAfter = 0
  for (const rule of rules) {
    const entry = await hit(rule)
    if (entry.count > rule.max) {
      retryAfter = Math.max(retryAfter, Math.max(1, Math.ceil((entry.expiresAt - Date.now()) / 1000)))
    }
  }
  return { ok: retryAfter === 0, retryAfter }
}

/** Rules for one login-style attempt: tight per email+IP, loose per IP and per email. */
export function loginRules(scope: string, email: string, ip: string | null): RateRule[] {
  const id = email.trim().toLowerCase().slice(0, 200)
  const windowSec = 15 * 60
  if (!ip) return [{ key: `${scope}:email:${id}`, max: 20, windowSec }]
  return [
    { key: `${scope}:pair:${id}:${ip}`, max: 10, windowSec },
    { key: `${scope}:email:${id}`, max: 50, windowSec },
    { key: `${scope}:ip:${ip}`, max: 100, windowSec },
  ]
}

/** Per-IP rule that is skipped (returns no rules) when no trusted IP is known. */
export function ipRules(scope: string, ip: string | null, max: number, windowSec: number): RateRule[] {
  return ip ? [{ key: `${scope}:ip:${ip}`, max, windowSec }] : []
}

export const TOO_MANY_ATTEMPTS = "Too many attempts. Please try again later."
