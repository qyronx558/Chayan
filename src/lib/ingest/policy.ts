import type { QualityReport } from "./quality"

/**
 * When may the bot publish without a human? Off by default. Even when on,
 * only clean, high-confidence posts qualify, and a daily cap keeps the site
 * growing at a steady, natural pace instead of dumping thousands of pages
 * at once (a classic "scaled content" signal).
 */
export interface AutoApproveConfig {
  enabled: boolean
  dailyCap: number
  minScore: number
  minConfidence: number
}

export function autoApproveConfig(env: Record<string, string | undefined> = process.env): AutoApproveConfig {
  const num = (v: string | undefined, d: number) => (v && Number.isFinite(Number(v)) ? Number(v) : d)
  return {
    enabled: env.INGEST_AUTO_APPROVE === "true",
    dailyCap: Math.max(0, Math.floor(num(env.INGEST_AUTO_APPROVE_DAILY_CAP, 60))),
    minScore: num(env.INGEST_AUTO_APPROVE_MIN_SCORE, 75),
    minConfidence: num(env.INGEST_AUTO_APPROVE_MIN_CONFIDENCE, 0.85),
  }
}

export function canAutoApprove(q: QualityReport, cfg: AutoApproveConfig, approvedToday: number): boolean {
  return (
    cfg.enabled &&
    approvedToday < cfg.dailyCap &&
    q.reject === null &&
    q.flags.length === 0 &&
    q.score >= cfg.minScore &&
    q.confidence >= cfg.minConfidence
  )
}
