import { createHmac, randomUUID } from "node:crypto"
import { isIP } from "node:net"
import type { Prisma } from "@prisma/client"

export function createReference(): string {
  return `CJ-${randomUUID().toUpperCase()}`
}

// Only trust a header overwritten by the deployment's ingress proxy.
export function getClientIp(request: Request): string | null {
  const header = process.env.CONTACT_IP_HEADER || (process.env.VERCEL ? "x-vercel-forwarded-for" : "")
  if (!header) return null
  const ip = request.headers.get(header)?.split(",")[0]?.trim()
  return ip && isIP(ip) ? ip : null
}

export class ContactRateLimitError extends Error {
  constructor(public retryAfterSeconds: number) { super("Too many messages") }
}

export async function checkContactRateLimit(tx: Prisma.TransactionClient, email: string, ip: string | null) {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000)
  const secret = process.env.AUTH_SECRET
  if (process.env.NODE_ENV === "production" && !secret) throw new Error("AUTH_SECRET is required")
  const hash = (value: string) => createHmac("sha256", secret || "contact-development").update(value).digest("hex")
  const limits = [
    { key: hash(`email:${email.toLowerCase()}`), max: 5 },
    // Safe fallback caps abuse globally when no trusted client IP is available.
    { key: hash(ip ? `ip:${ip}` : "global"), max: ip ? 5 : 100 },
  ].sort((a, b) => a.key.localeCompare(b.key))

  for (const { key, max } of limits) {
    const [entry] = await tx.$queryRaw<{ count: number; expiresAt: Date }[]>`
      INSERT INTO "ContactRateLimit" ("key", "count", "expiresAt") VALUES (${key}, 1, ${expiresAt})
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "ContactRateLimit"."expiresAt" <= ${now} THEN 1 ELSE "ContactRateLimit"."count" + 1 END,
        "expiresAt" = CASE WHEN "ContactRateLimit"."expiresAt" <= ${now} THEN ${expiresAt} ELSE "ContactRateLimit"."expiresAt" END
      RETURNING "count", "expiresAt"
    `
    if (entry.count > max) throw new ContactRateLimitError(Math.max(1, Math.ceil((entry.expiresAt.getTime() - now.getTime()) / 1000)))
  }
}
