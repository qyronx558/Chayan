import { randomInt } from "crypto"
import bcrypt from "bcryptjs"
import { domainOf } from "@/lib/companies"

export const OTP_EXPIRY_MINUTES = 10
export const OTP_MAX_ATTEMPTS = 5
export const OTP_RESEND_COOLDOWN_SECONDS = 60
export const OTP_MAX_SENDS_PER_USER_15MIN = 5
export const OTP_MAX_SENDS_PER_EMAIL_HOUR = 5

const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.in", "yahoo.co.in",
  "outlook.com", "hotmail.com", "live.com", "msn.com", "icloud.com",
  "protonmail.com", "proton.me", "zoho.com", "rediffmail.com", "rediff.com",
  "aol.com", "gmx.com", "yandex.com", "mail.com",
])

/** e.g. hr@acme.com -> h*@acme.com - never expose full inbox in APIs/logs. */
export function maskEmail(email: string): string {
  const [local, domain] = email.toLowerCase().split("@")
  if (!domain) return "***"
  const head = local.length <= 1 ? "*" : `${local[0]}*`
  return `${head}@${domain}`
}

/** Mask for server logs - even the domain's sub-parts stay, local part hidden. */
export function logEmail(email: string): string {
  return maskEmail(email)
}

export function emailDomainOf(email: string): string {
  return email.toLowerCase().trim().split("@")[1] || ""
}

export function isFreeEmailDomain(email: string): boolean {
  return FREE_EMAIL_DOMAINS.has(emailDomainOf(email))
}

/**
 * Work email must belong to the company's own domain.
 * Rejects free providers outright so a random person can't paste
 * "acme.com" + "attacker@gmail.com" and get through.
 */
export function workEmailMatchesCompany(workEmail: string, companyWebsite?: string | null): { ok: boolean; reason?: string } {
  const emailDomain = emailDomainOf(workEmail)
  if (!emailDomain) return { ok: false, reason: "Enter a valid work email" }
  if (isFreeEmailDomain(workEmail)) {
    return { ok: false, reason: "Use your company work email (not Gmail/Yahoo/Outlook). Free inboxes can't verify a company." }
  }
  if (!companyWebsite) return { ok: false, reason: "This company has no website on file - ask an admin for manual review" }
  const siteDomain = domainOf(companyWebsite)
  if (!siteDomain) return { ok: false, reason: "Company website looks invalid - ask an admin for manual review" }
  if (emailDomain !== siteDomain) {
    return { ok: false, reason: `Work email domain (${emailDomain}) must match the company website (${siteDomain})` }
  }
  return { ok: true }
}

export function generateOtp(): string {
  return randomInt(100000, 1000000).toString()
}

export async function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, 10)
}

export async function verifyOtpHash(otp: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(otp.trim(), hash)
  } catch {
    return false
  }
}
