"use client"

const COOKIE = "emp_ref"
const KEY = "emp_ref_code"

/** Persist ?ref=CODE for 60 days (cookie + localStorage, first-touch wins). */
export function captureReferralFromUrl() {
  if (typeof window === "undefined") return
  try {
    const params = new URLSearchParams(window.location.search)
    const ref = (params.get("ref") || "").trim().toUpperCase()
    if (!ref || !/^CHY-[A-Z0-9]{4,8}$/.test(ref)) return
    if (localStorage.getItem(KEY)) return // first touch wins
    localStorage.setItem(KEY, ref)
    document.cookie = `${COOKIE}=${encodeURIComponent(ref)}; path=/; max-age=${60 * 24 * 3600}; SameSite=Lax`
  } catch { /* never break pages */ }
}

export function getStoredReferralCode(): string | null {
  if (typeof window === "undefined") return null
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function clearStoredReferralCode() {
  try {
    localStorage.removeItem(KEY)
    document.cookie = `${COOKIE}=; path=/; max-age=0; SameSite=Lax`
  } catch { /* ignore */ }
}
