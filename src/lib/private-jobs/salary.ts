/**
 * Salaries in the job's own currency (browser-safe).
 *
 * Storage:
 *  - salaryCurrency      ISO 4217 code; null = INR (every job before this existed)
 *  - salaryLocalMin/Max  yearly amount in that currency (what the employer published)
 *  - salaryMin/Max       the same yearly amount converted to INR, so the ₹ filters,
 *                        "₹10 LPA+" and salary sort work across countries.
 *
 * Indian jobs show "₹6-9 LPA"; others show their own currency ("$150K-$200K/yr",
 * "€60K-€80K/yr") with an approximate rupee value next to it where space allows.
 */

/** Approximate INR per unit (Nov 2026). Only used for filters, sorting and the "≈ ₹" hint. */
export const FX_TO_INR: Record<string, number> = {
  INR: 1, USD: 84, EUR: 91, GBP: 108, CAD: 61, AUD: 55, SGD: 64, NZD: 50, HKD: 10.8, CHF: 96, AED: 22.9, SAR: 22.4, QAR: 23,
  JPY: 0.56, CNY: 11.7, KRW: 0.061, TWD: 2.6, SEK: 7.9, NOK: 7.7, DKK: 12.2, PLN: 21, CZK: 3.6, HUF: 0.23, RON: 18.3, TRY: 2.5,
  ILS: 22.5, BRL: 15, MXN: 4.6, ARS: 0.085, COP: 0.02, CLP: 0.09, PEN: 22.5, ZAR: 4.6, NGN: 0.052, KES: 0.65, EGP: 1.7,
  IDR: 0.0053, MYR: 18.8, PHP: 1.45, THB: 2.4, VND: 0.0033, PKR: 0.3, BDT: 0.7, LKR: 0.28, NPR: 0.62, UAH: 2, BGN: 46.5,
}

const EURO = new Set(["AT", "BE", "HR", "CY", "EE", "FI", "FR", "DE", "GR", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PT", "SK", "SI", "ES"])
const COUNTRY_CURRENCY: Record<string, string> = {
  IN: "INR", US: "USD", GB: "GBP", CA: "CAD", AU: "AUD", SG: "SGD", NZ: "NZD", HK: "HKD", CH: "CHF", AE: "AED", SA: "SAR", QA: "QAR",
  JP: "JPY", CN: "CNY", KR: "KRW", TW: "TWD", SE: "SEK", NO: "NOK", DK: "DKK", PL: "PLN", CZ: "CZK", HU: "HUF", RO: "RON", TR: "TRY",
  IL: "ILS", BR: "BRL", MX: "MXN", AR: "ARS", CO: "COP", CL: "CLP", PE: "PEN", ZA: "ZAR", NG: "NGN", KE: "KES", EG: "EGP",
  ID: "IDR", MY: "MYR", PH: "PHP", TH: "THB", VN: "VND", PK: "PKR", BD: "BDT", LK: "LKR", NP: "NPR", UA: "UAH", BG: "BGN",
}

/** Local currency of a country (ISO 3166 code); USD when unknown. */
export function currencyForCountry(country: string | null | undefined): string {
  if (!country) return "INR"
  if (EURO.has(country)) return "EUR"
  return COUNTRY_CURRENCY[country] ?? "USD"
}

export function isKnownCurrency(code: string | null | undefined): code is string {
  return !!code && code.toUpperCase() in FX_TO_INR
}

/** Yearly amount in `currency` → INR (rounded), null when the currency is unknown. */
export function toInr(amount: number | null | undefined, currency: string | null | undefined): number | null {
  if (amount == null || !Number.isFinite(amount)) return null
  const rate = FX_TO_INR[(currency || "INR").toUpperCase()]
  return rate ? Math.round(amount * rate) : null
}

const PERIOD_FACTOR: [RegExp, number][] = [
  [/hour|hr\b|\/h\b/, 2080],
  [/day|daily/, 260],
  [/week/, 52],
  [/month|\bmo\b|\/mo\b|monthly/, 12],
]

/** Multiplier from a pay interval ("per-month", "hourly", "YEAR") to a year. */
export function yearlyFactor(interval: string | null | undefined): number {
  const v = (interval || "").toLowerCase()
  for (const [re, f] of PERIOD_FACTOR) if (re.test(v)) return f
  return 1
}

export interface Salary {
  /** Yearly, in `currency`. */
  min: number | null
  max: number | null
  currency: string
}

/** A pay range a job board returned as data (Lever, Ashby, Recruitee…), in any currency. */
export function structuredSalary(
  range: { min?: number | string | null; max?: number | string | null; currency?: string | null; interval?: string | null } | null | undefined
): Salary | null {
  if (!range) return null
  const currency = (range.currency || "").toUpperCase()
  if (!isKnownCurrency(currency)) return null
  const f = yearlyFactor(range.interval)
  const conv = (v: number | string | null | undefined) => {
    const n = typeof v === "string" ? Number(v) : v
    return typeof n === "number" && Number.isFinite(n) && n > 0 ? Math.round(n * f) : null
  }
  const out = { min: conv(range.min), max: conv(range.max), currency }
  if (out.min == null && out.max == null) return null
  return plausible(out) ? out : null
}

/** Yearly pay between about ₹1 lakh and ₹20 crore; anything else is not a salary (funding, 401k, a price). */
function plausible(s: Salary): boolean {
  const v = toInr(s.min ?? s.max, s.currency)
  const w = toInr(s.max ?? s.min, s.currency)
  return v != null && w != null && v >= 100_000 && w <= 200_000_000 && w >= v
}

const CODES = Object.keys(FX_TO_INR).filter((c) => c !== "INR").join("|")
const SYM = String.raw`(US\$|CA\$|C\$|AU\$|A\$|S\$|NZ\$|HK\$|R\$|\$|€|£|¥)`
const NUM = String.raw`(\d{1,3}(?:[,.  ]\d{3})+(?:[.,]\d{1,2})?|\d+(?:\.\d+)?)\s?([kKmM])?(?![\w%])`
const RANGE_RE = new RegExp(String.raw`(?:\b(${CODES})\s?)?${SYM}?\s?${NUM}\s*(?:-|–|—|to)\s*${SYM}?\s?${NUM}(?:\s?\b(${CODES})\b)?`, "g")
const SINGLE_RE = new RegExp(String.raw`(?:\b(${CODES})\s?)?${SYM}\s?${NUM}(?:\s?\b(${CODES})\b)?`, "g")
const PAY_CONTEXT = /salary|pay\b|pay range|compensation|base|wage|ote\b|on-target|per (?:year|annum|hour|month)|annual|yearly|hourly|\/yr|\/year|stipend|remuneration/i

function amount(raw: string, unit: string | undefined): number {
  let n: number
  if (/^\d{1,3}(?:[,.  ]\d{3})+(?:[.,]\d{1,2})?$/.test(raw)) {
    // Thousands separators ("150,000", "60.000", "60 000"); drop cents.
    n = Number(raw.replace(/[.,]\d{1,2}$/, "").replace(/[,.  ]/g, ""))
  } else {
    n = Number(raw)
  }
  const u = (unit || "").toLowerCase()
  return u === "k" ? n * 1000 : u === "m" ? n * 1_000_000 : n
}

function symbolCurrency(sym: string | undefined, country: string | null | undefined): string | null {
  switch (sym) {
    case undefined:
      return null
    case "US$":
      return "USD"
    case "C$":
    case "CA$":
      return "CAD"
    case "A$":
    case "AU$":
      return "AUD"
    case "S$":
      return "SGD"
    case "NZ$":
      return "NZD"
    case "HK$":
      return "HKD"
    case "R$":
      return "BRL"
    case "€":
      return "EUR"
    case "£":
      return "GBP"
    case "¥":
      return country === "CN" ? "CNY" : "JPY"
    default: {
      // A bare "$": the dollar of the job's country, else US dollars.
      const local = currencyForCountry(country)
      return ["USD", "CAD", "AUD", "SGD", "NZD", "HKD", "MXN"].includes(local) ? local : "USD"
    }
  }
}

/**
 * Pay range written in a description in a foreign currency, e.g. "The base salary
 * range is $150,000 - $200,000 USD", "€60.000–€80.000 per year", "£45k to £55k",
 * "USD 40/hour". Indian amounts are handled by parseSalaryINR.
 */
export function parseForeignSalary(text: string | null | undefined, country?: string | null): Salary | null {
  if (!text) return null
  const t = text.slice(0, 8000)
  const pick = (m: RegExpMatchArray) => {
    const before = t.slice(Math.max(0, (m.index ?? 0) - 140), m.index)
    const after = t.slice((m.index ?? 0) + m[0].length, (m.index ?? 0) + m[0].length + 40)
    return { ok: PAY_CONTEXT.test(before) || PAY_CONTEXT.test(after), factor: yearlyFactor(after.slice(0, 25)) }
  }
  for (const m of t.matchAll(RANGE_RE)) {
    const [, codeBefore, sym1, n1, u1, sym2, n2, u2, codeAfter] = m
    const currency = (codeBefore || codeAfter)?.toUpperCase() ?? symbolCurrency(sym1 || sym2, country)
    if (!currency) continue
    const ctx = pick(m)
    if (!ctx.ok) continue
    // "$150-200K": a unit written only on the second number applies to both.
    const s: Salary = {
      min: Math.round(amount(n1, u1 || u2) * ctx.factor),
      max: Math.round(amount(n2, u2) * ctx.factor),
      currency,
    }
    if (plausible(s)) return s
  }
  for (const m of t.matchAll(SINGLE_RE)) {
    const [, codeBefore, sym, n, u, codeAfter] = m
    const currency = (codeBefore || codeAfter)?.toUpperCase() ?? symbolCurrency(sym, country)
    if (!currency) continue
    const ctx = pick(m)
    if (!ctx.ok) continue
    const s: Salary = { min: Math.round(amount(n, u) * ctx.factor), max: null, currency }
    if (plausible(s)) return s
  }
  return null
}

/* ───────────────────────── display ───────────────────────── */

const LAKH = 100_000
const CRORE = 10_000_000

/** "₹6-9 LPA", "₹1.2-1.5 Cr", "₹40K+/yr". */
export function formatInr(min: number | null | undefined, max: number | null | undefined): string | null {
  if (min == null && max == null) return null
  const big = Math.max(min ?? 0, max ?? 0) >= CRORE
  const unit = (n: number) => (big ? `${+(n / CRORE).toFixed(n >= 10 * CRORE ? 0 : 1)}` : `${+(n / LAKH).toFixed(1)}`)
  const suffix = big ? " Cr" : " LPA"
  if (min != null && max != null && max > min) return `₹${unit(min)}-${unit(max)}${suffix}`
  if (min != null) return `₹${unit(min)}${max != null ? "" : "+"}${suffix}`
  return `Up to ₹${unit(max as number)}${suffix}`
}

const formatters = new Map<string, Intl.NumberFormat>()
function money(n: number, currency: string): string {
  let f = formatters.get(currency)
  if (!f) {
    try {
      f = new Intl.NumberFormat("en", { style: "currency", currency, notation: "compact", minimumFractionDigits: 0, maximumFractionDigits: 1 })
    } catch {
      f = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 })
    }
    formatters.set(currency, f)
  }
  return f.format(n)
}

/** "$150K-$200K/yr" in the job's own currency. */
export function formatLocal(min: number | null | undefined, max: number | null | undefined, currency: string): string | null {
  if (min == null && max == null) return null
  if (min != null && max != null && max > min) return `${money(min, currency)}-${money(max, currency)}/yr`
  if (min != null) return `${money(min, currency)}${max != null ? "" : "+"}/yr`
  return `Up to ${money(max as number, currency)}/yr`
}

export interface SalaryFields {
  salary?: string | null
  salaryMin?: number | null
  salaryMax?: number | null
  salaryCurrency?: string | null
  salaryLocalMin?: number | null
  salaryLocalMax?: number | null
}

const isForeign = (j: SalaryFields) => !!j.salaryCurrency && j.salaryCurrency !== "INR" && (j.salaryLocalMin != null || j.salaryLocalMax != null)

/** The salary as the employer published it (own currency), else the text. */
export function salaryDisplay(j: SalaryFields): string | null {
  if (isForeign(j)) return formatLocal(j.salaryLocalMin, j.salaryLocalMax, j.salaryCurrency as string)
  return formatInr(j.salaryMin, j.salaryMax) ?? (j.salary?.trim() || null)
}

/** "≈ ₹1.3-1.7 Cr" for foreign salaries (helps Indian candidates compare); null for INR. */
export function salaryInrHint(j: SalaryFields): string | null {
  if (!isForeign(j)) return null
  const v = formatInr(j.salaryMin, j.salaryMax)
  return v ? `≈ ${v}` : null
}

/**
 * Salary fields of a job saved by an admin / employer: amounts are typed in
 * `salaryCurrency` (default INR); foreign amounts are kept as published and
 * converted to INR for filters. Mutates `d`. Untouched when no salary field is sent.
 */
export function normalizeJobSalary(
  d: { salaryMin?: number | null; salaryMax?: number | null; salaryCurrency?: string | null; salaryLocalMin?: number | null; salaryLocalMax?: number | null; salary?: string | null },
  existingCurrency?: string | null
): void {
  if (d.salaryMin === undefined && d.salaryMax === undefined && d.salaryCurrency === undefined) return
  const currency = ((d.salaryCurrency === undefined ? existingCurrency : d.salaryCurrency) || "INR").toUpperCase()
  if (currency === "INR" || !isKnownCurrency(currency)) {
    d.salaryCurrency = null
    d.salaryLocalMin = null
    d.salaryLocalMax = null
    return
  }
  d.salaryCurrency = currency
  if (d.salaryMin !== undefined) {
    d.salaryLocalMin = d.salaryMin
    d.salaryMin = toInr(d.salaryMin, currency)
  }
  if (d.salaryMax !== undefined) {
    d.salaryLocalMax = d.salaryMax
    d.salaryMax = toInr(d.salaryMax, currency)
  }
}

/** Currencies offered in the admin form (common first). */
export const FORM_CURRENCIES = ["INR", "USD", "EUR", "GBP", "CAD", "AUD", "SGD", "AED", "CHF", "JPY", ...Object.keys(FX_TO_INR).filter((c) => !["INR", "USD", "EUR", "GBP", "CAD", "AUD", "SGD", "AED", "CHF", "JPY"].includes(c)).sort()]
