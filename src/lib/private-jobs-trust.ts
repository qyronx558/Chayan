import { getExternalHostname, normalizeExternalUrl } from "@/lib/apply-room"
import { formatLocal, type SalaryFields } from "@/lib/private-jobs/salary"
import { extractSkills } from "@/lib/skills"

export interface TrustInput {
  applicationUrl?: string | null
  applicationEmail?: string | null
  proofUrl?: string | null
  companyWebsite?: string | null
  companyVerified?: boolean
  description?: string | null
}

export interface TrustResult {
  score: number
  label: "Verified" | "Trusted" | "Unverified" | "Risky"
  reasons: string[]
  hostname: string | null
}

/** Rule-based genuineness score. No AI, no invented data - only URL/email signals. */
export function computeTrustScore(input: TrustInput): TrustResult {
  let score = 20
  const reasons: string[] = []
  const targetUrl = normalizeExternalUrl(input.applicationUrl)
  const hostname = targetUrl ? getExternalHostname(targetUrl) : null

  if (input.companyVerified) {
    score += 30
    reasons.push("Verified employer")
  }
  if (input.proofUrl && normalizeExternalUrl(input.proofUrl)) {
    score += 20
    reasons.push("Official posting proof attached")
  }
  if (targetUrl && input.companyWebsite) {
    try {
      const appHost = new URL(targetUrl).hostname.replace(/^www\./, "").toLowerCase()
      const coHost = input.companyWebsite.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].toLowerCase()
      if (appHost === coHost || appHost.endsWith(`.${coHost}`)) {
        score += 25
        reasons.push(`Apply link matches ${coHost}`)
      } else if (/(lever|greenhouse|ashby|workday|successfactors|naukri|linkedin|indeed|foundit)/i.test(appHost)) {
        score += 12
        reasons.push("Known ATS / job platform")
      }
    } catch { /* ignore */ }
  } else if (targetUrl) {
    score += 8
    reasons.push("External apply link present")
  }

  const email = (input.applicationEmail || "").toLowerCase().trim()
  if (email) {
    if (/(gmail|yahoo|rediff|outlook|hotmail|protonmail)/.test(email)) {
      score -= 10
      reasons.push("Free email apply - verify HR identity")
    } else if (email.includes("@")) {
      score += 8
      reasons.push("Company-domain email")
    }
  }

  const desc = (input.description || "").toLowerCase()
  const scamSignals: { re: RegExp; msg: string; penalty: number }[] = [
    { re: /(registration|security|refundable).{0,20}(fee|deposit|charge)/, msg: "Asks for fee/deposit", penalty: 45 },
    { re: /(telegram|whatsapp).{0,30}(pay|fee|deposit|gift|task)/, msg: "Telegram/WhatsApp money pattern", penalty: 40 },
    { re: /(earn|income).{0,20}(per day|daily|₹\s?\d{4,})/, msg: "Too-good-to-be-true pay promise", penalty: 20 },
    { re: /(aadhaar|otp|bank).{0,20}(share|send|whatsapp)/, msg: "Asks for OTP/bank details", penalty: 35 },
  ]
  for (const s of scamSignals) {
    if (s.re.test(desc)) {
      score -= s.penalty
      reasons.push(`Warning: ${s.msg}`)
    }
  }
  if (!targetUrl && !email) {
    score -= 15
    reasons.push("No apply link or email")
  }

  score = Math.max(0, Math.min(100, score))
  const label = score >= 75 ? "Verified" : score >= 50 ? "Trusted" : score >= 30 ? "Unverified" : "Risky"
  return { score, label, reasons: reasons.slice(0, 5), hostname }
}

export interface PrepQuestion {
  q: string
  hint: string
}

/** Build interview prep from JD text only - keyword-triggered, never hallucinated company facts. */
export function buildPrepKit(opts: {
  title: string
  description?: string | null
  skills?: string[] | null
  category?: string | null
  experience?: string | null
}): { questions: PrepQuestion[]; checklist: string[]; docs: string[] } {
  const text = `${opts.title} ${opts.description || ""} ${opts.category || ""}`.toLowerCase()
  const skills = (opts.skills && opts.skills.length > 0 ? opts.skills : extractSkills(`${opts.title} ${opts.description || ""}`)).slice(0, 8)
  const questions: PrepQuestion[] = []

  questions.push({ q: `Walk me through your experience relevant to "${opts.title}"`, hint: "2-min story: role → action → measurable result" })
  for (const s of skills.slice(0, 4)) {
    questions.push({ q: `How have you used ${s} in a real project?`, hint: `Prepare one example + one challenge with ${s}` })
  }
  if (/sales|business development|bde/i.test(text)) questions.push({ q: "How do you build and close a pipeline from cold leads?", hint: "Prospecting → qualification → follow-up cadence → numbers" })
  if (/support|service|bpo|voice|non-voice/i.test(text)) questions.push({ q: "How do you handle an angry customer while meeting SLAs?", hint: "Listen → acknowledge → resolve → document, with CSAT example" })
  if (/data|analyst|excel|sql|power bi/i.test(text)) questions.push({ q: "Describe a dashboard/report you built that changed a decision.", hint: "Source → cleaning → metric → business impact" })
  if (/developer|engineer|react|node|python|java/i.test(text)) questions.push({ q: "Explain your toughest bug and how you debugged it.", hint: "Repro → hypothesis → fix → test you added" })
  if (/hr|recruit|talent/i.test(text)) questions.push({ q: "How do you source and close a hard-to-fill role?", hint: "Channels → screening rubric → offer-follow-up" })
  if (/marketing|seo|social|content/i.test(text)) questions.push({ q: "Which campaign moved a metric, and by how much?", hint: "Channel → creative → CAC/CTR/conversion delta" })
  if (/walk.?in|interview.*venue/i.test(text)) questions.push({ q: "What will you carry and ask at the walk-in?", hint: "Resume copies + ID + questions on shift, growth, probation" })
  questions.push({ q: "What is your salary expectation and notice period?", hint: "Give range from listing; confirm joining date" })

  const checklist = [
    "Research the company careers page and match 3 JD keywords to your resume",
    "Tailor resume headline to the exact role title",
    "Prepare 2 STAR stories (achievement + conflict)",
    "List 3 questions to ask the interviewer (growth, team, success metric)",
    opts.experience ? `Align your ${opts.experience} experience to the top 3 responsibilities` : "Map your projects/internships to the top 3 responsibilities",
  ]
  const docs = ["Updated resume (PDF, <2MB)", "Govt ID + address proof", "Education / experience letters", "Passport photo", "Offer/payslip (only if asked, for experienced)"]
  return { questions: questions.slice(0, 8), checklist, docs }
}

export function buildEmailApplyTemplate(opts: { jobTitle: string; company: string; applicantName?: string | null; skills?: string[] }): { subject: string; body: string } {
  const subject = `Application for ${opts.jobTitle} - ${opts.applicantName || "Candidate"}`
  const skillLine = opts.skills && opts.skills.length > 0 ? `Key skills: ${opts.skills.slice(0, 6).join(", ")}.` : ""
  const body = `Dear Hiring Manager,\n\nI am applying for the ${opts.jobTitle} role at ${opts.company}. ${skillLine}\n\nPlease find my resume attached. I would welcome a short screening call at your convenience.\n\nThank you,\n${opts.applicantName || "Your Name"}\nPhone: \nLinkedIn: \nPortfolio: `
  return { subject, body }
}

/**
 * Salary for display. Pass the job (`local`) so a foreign salary is shown in its
 * own currency ("$150K-$200K/yr") rather than its rupee equivalent.
 */
export function formatSalaryRange(min?: number | null, max?: number | null, fallback?: string | null, local?: SalaryFields | null): string | null {
  if (local?.salaryCurrency && local.salaryCurrency !== "INR" && (local.salaryLocalMin != null || local.salaryLocalMax != null)) {
    return formatLocal(local.salaryLocalMin, local.salaryLocalMax, local.salaryCurrency)
  }
  const fmt = (n: number) => (n >= 100000 ? `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L` : `₹${n.toLocaleString("en-IN")}`)
  if (min && max && max > min) return `${fmt(min)} – ${fmt(max)}`
  if (min) return `${fmt(min)}+`
  if (max) return `Up to ${fmt(max)}`
  return fallback || null
}
