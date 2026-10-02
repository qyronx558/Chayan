import { randomBytes, createHash } from "crypto"
import { prisma } from "@/lib/prisma"

/**
 * ChayanJobsJobs coin rewards (pilot).
 * 1,000 coins = ₹20  →  1 coin = 2 paise.
 *
 * Poster (verified company, rewarded job only):
 *   JOB_LIVE_7D  = 100 coins  - real unique job live 7+ days
 *   THREE_APPS   = 900 coins  - 3 unique, completed, verified applications
 *   INTERVIEW    = 500 coins  - employer-confirmed interview
 *   HIRE         = 500 coins  - employer-confirmed hire
 * Referrer:
 *   REFERRAL     = 1,000 coins - invited company reaches 3-app milestone
 *
 * Views / clicks / partial applications are DISPLAY ONLY - never paid.
 * Pilot caps: 100 new companies, one rewarded job per company.
 */
export const COIN_RULES = {
  COINS_PER_1000_TO_RUPEES: 20,
  PAISE_PER_COIN: 2,
  JOB_LIVE_7D_COINS: 100,
  THREE_APPS_COINS: 900,
  INTERVIEW_COINS: 500,
  HIRE_COINS: 500,
  REFERRAL_COINS: 1000,
  MIN_WITHDRAW_COINS: 1000,
  PILOT_MAX_COMPANIES: 100,
  REWARDED_JOBS_PER_COMPANY: 1,
  LIVE_DAYS_REQUIRED: 7,
  APPS_REQUIRED: 3,
} as const

export function formatINR(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
}

export function coinsToPaise(coins: number): number {
  return Math.round(coins * COIN_RULES.PAISE_PER_COIN)
}

export function coinsToINR(coins: number): number {
  return (coins * COIN_RULES.PAISE_PER_COIN) / 100
}

export function formatCoins(coins: number): string {
  return `${coins.toLocaleString("en-IN")} coins (≈${formatINR(coinsToPaise(coins))})`
}

/** Short human code, e.g. CHY-8K2QMX. Collision-checked on create. */
export function generateReferralCode(): string {
  return `CHY-${randomBytes(3).toString("base64url").toUpperCase().replace(/[^A-Z0-9]/g, "X").slice(0, 6)}`
}

/** Privacy-safe session fingerprint: salted hash, never raw IP/UA. */
export function sessionHash(ip: string | null, ua: string | null, day: string): string {
  const salt = process.env.AUTH_SECRET || "ChayanJobs-emp-metrics"
  return createHash("sha256").update(`${salt}|${ip || ""}|${ua || ""}|${day}`).digest("hex").slice(0, 32)
}

/** Mask UPI for display: ok****@upi. Full value only used at payout time. */
export function maskUpi(upi: string): string {
  const [head, tail] = upi.split("@")
  if (!tail) return upi.length <= 4 ? "****" : `${upi.slice(0, 2)}****`
  const h = head.length <= 2 ? `${head}****` : `${head.slice(0, 2)}****`
  return `${h}@${tail}`
}

/** Statuses that count as a "completed" application (beyond just saving). */
const COMPLETED_STATUSES = ["applied", "shortlisted", "interview", "offer", "joined"] as const

export interface MilestoneProgress {
  enrolled: boolean
  pilotFull: boolean
  rewardedJobId: string | null
  liveDays: number
  liveDone: boolean
  appsDone: boolean
  uniqueApplicants: number
  interviewDone: boolean
  hireDone: boolean
  coinsEarned: number
  coinsPending: number
}

async function hasCoin(kind: "JOB_LIVE_7D" | "THREE_APPS" | "INTERVIEW_CONFIRMED" | "HIRE_CONFIRMED" | "REFERRAL_BONUS", companyId: string, jobId: string | null): Promise<boolean> {
  const row = await prisma.coinLedger.findFirst({
    where: { kind: kind as never, companyId, ...(jobId ? { jobId } : {}) },
    select: { id: true },
  })
  return !!row
}

/**
 * Evaluate milestones for one enrolled company. Idempotent - already-awarded
 * kinds are skipped. Awards land as PENDING for admin review.
 * Returns what was newly awarded.
 */
export async function evaluateCompanyMilestones(companyId: string): Promise<{ awarded: { kind: string; coins: number }[]; progress: MilestoneProgress | null }> {
  const awarded: { kind: string; coins: number }[] = []
  const enrollment = await prisma.rewardEnrollment.findUnique({ where: { companyId } })
  if (!enrollment) {
    const count = await prisma.rewardEnrollment.count()
    return { awarded, progress: { enrolled: false, pilotFull: count >= COIN_RULES.PILOT_MAX_COMPANIES, rewardedJobId: null, liveDays: 0, liveDone: false, appsDone: false, uniqueApplicants: 0, interviewDone: false, hireDone: false, coinsEarned: 0, coinsPending: 0 } }
  }

  const company = await prisma.company.findUnique({ where: { id: companyId }, select: { verifiedStatus: true } })
  const companyVerified = company?.verifiedStatus === "VERIFIED"

  // One rewarded job per company: earliest approved job wins and sticks.
  let jobId = enrollment.rewardedJobId
  if (!jobId) {
    const first = await prisma.privateJob.findFirst({
      where: { companyId, moderation: "APPROVED" },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    })
    if (!first) {
      return { awarded, progress: { enrolled: true, pilotFull: false, rewardedJobId: null, liveDays: 0, liveDone: false, appsDone: false, uniqueApplicants: 0, interviewDone: false, hireDone: false, coinsEarned: 0, coinsPending: 0 } }
    }
    jobId = first.id
    await prisma.rewardEnrollment.update({ where: { companyId }, data: { rewardedJobId: jobId } })
  }

  const job = await prisma.privateJob.findUnique({
    where: { id: jobId },
    select: { id: true, createdAt: true, status: true, moderation: true, applicationUrl: true, title: true },
  })
  if (!job) return { awarded, progress: null }

  const liveDays = Math.floor((Date.now() - new Date(job.createdAt).getTime()) / 86400000)
  const liveOk = companyVerified && job.moderation === "APPROVED" && job.status === "ACTIVE" && liveDays >= COIN_RULES.LIVE_DAYS_REQUIRED

  // Fraud: job must be unique - same apply URL must not appear on another live job.
  let duplicate = false
  if (job.applicationUrl) {
    const dup = await prisma.privateJob.findFirst({
      where: { applicationUrl: job.applicationUrl, id: { not: job.id }, status: "ACTIVE" },
      select: { id: true },
    })
    duplicate = !!dup
  }

  // Unique, completed, verified applicants - excluding company insiders (self-dealing).
  const [apps, insiderIds] = await Promise.all([
    prisma.privateApplication.findMany({
      where: { privateJobId: job.id, status: { in: [...COMPLETED_STATUSES] as never[] } },
      select: { userId: true, status: true, createdAt: true, user: { select: { id: true, emailVerified: true } } },
    }),
    prisma.companyMember.findMany({ where: { companyId }, select: { userId: true } }).then((m) => new Set(m.map((x) => x.userId))),
  ])
  const genuine = apps.filter((a) => a.user.emailVerified && !insiderIds.has(a.userId))
  const uniqueApplicants = new Set(genuine.map((a) => a.userId)).size

  // Velocity flag: 3+ completions within 10 minutes → stays PENDING with a review note.
  const times = genuine.map((a) => new Date(a.createdAt).getTime()).sort((x, y) => x - y)
  const velocity = times.length >= 3 && times[2] - times[0] < 10 * 60 * 1000

  const coinRows = await prisma.coinLedger.findMany({ where: { companyId, jobId }, select: { kind: true, coins: true, status: true } })
  const coinsEarned = coinRows.filter((r) => r.status === "APPROVED" || r.status === "PAID").reduce((s, r) => s + r.coins, 0)
  const coinsPending = coinRows.filter((r) => r.status === "PENDING").reduce((s, r) => s + r.coins, 0)

  const progress: MilestoneProgress = {
    enrolled: true, pilotFull: false, rewardedJobId: jobId, liveDays,
    liveDone: await hasCoin("JOB_LIVE_7D", companyId, jobId),
    appsDone: await hasCoin("THREE_APPS", companyId, jobId),
    uniqueApplicants,
    interviewDone: await hasCoin("INTERVIEW_CONFIRMED", companyId, jobId),
    hireDone: await hasCoin("HIRE_CONFIRMED", companyId, jobId),
    coinsEarned, coinsPending,
  }

  // 1) 7-day live - skipped when duplicate URL (not a unique job).
  if (liveOk && !duplicate && !progress.liveDone) {
    await prisma.coinLedger.create({
      data: { userId: enrollment.userId, companyId, jobId, kind: "JOB_LIVE_7D", coins: COIN_RULES.JOB_LIVE_7D_COINS, status: "PENDING", note: `Live ${liveDays}d, unique URL, verified company` },
    })
    awarded.push({ kind: "JOB_LIVE_7D", coins: COIN_RULES.JOB_LIVE_7D_COINS })
    progress.liveDone = true
  }

  // 2) 3 unique completed applications - also releases the referrer's 1,000 coins.
  if (companyVerified && !duplicate && uniqueApplicants >= COIN_RULES.APPS_REQUIRED && !progress.appsDone) {
    await prisma.coinLedger.create({
      data: { userId: enrollment.userId, companyId, jobId, kind: "THREE_APPS", coins: COIN_RULES.THREE_APPS_COINS, status: "PENDING", note: `${uniqueApplicants} unique verified applicants${velocity ? " - velocity flag, review timestamps" : ""}` },
    })
    awarded.push({ kind: "THREE_APPS", coins: COIN_RULES.THREE_APPS_COINS })
    progress.appsDone = true

    const ref = await prisma.employerReferral.findFirst({ where: { companyId, status: { in: ["PENDING", "CONFIRMED"] } } }).catch(() => null)
    if (ref) {
      const refPaid = await hasCoin("REFERRAL_BONUS", companyId, jobId)
      if (!refPaid) {
        await prisma.$transaction([
          prisma.employerReferral.update({ where: { id: ref.id }, data: { status: "REWARDED", confirmedAt: new Date(), signupBonusPaise: COIN_RULES.REFERRAL_COINS } }),
          prisma.coinLedger.create({
            data: { userId: ref.referrerUserId, companyId, jobId, kind: "REFERRAL_BONUS", coins: COIN_RULES.REFERRAL_COINS, status: "PENDING", note: `Invited company reached ${COIN_RULES.APPS_REQUIRED} applications` },
          }),
        ])
        awarded.push({ kind: "REFERRAL_BONUS", coins: COIN_RULES.REFERRAL_COINS })
      }
    }
  }

  return { awarded, progress }
}
