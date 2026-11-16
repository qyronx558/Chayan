"use client"

import { useEffect } from "react"
import { CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { markApplied, useAppliedAt, useAppliedSync } from "@/lib/private-jobs/applied-store"

export function appliedOn(iso: string): string {
  const d = new Date(iso)
  const sameYear = d.getFullYear() === new Date().getFullYear()
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", ...(sameYear ? {} : { year: "numeric" }) })
}

/** "✓ Applied · 12 Nov" when the candidate already opened this job's application. */
export function AppliedBadge({ jobId, className, compact }: { jobId: string; className?: string; compact?: boolean }) {
  const at = useAppliedAt(jobId)
  if (!at) return null
  return (
    <span
      title={`You opened the application on ${new Date(at).toLocaleString("en-IN")}`}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
        className
      )}
    >
      <CheckCircle2 className="h-3 w-3" aria-hidden />
      {compact ? "Applied" : `Applied · ${appliedOn(at)}`}
    </span>
  )
}

/** Mounted in the Apply room: opening the application records the job as applied. */
export function ApplyVisitTracker({ job }: { job: { id: string; title: string; company: string; slug: string } }) {
  const signedIn = useAppliedSync()
  const { id, title, company, slug } = job
  useEffect(() => {
    // Wait a moment so the session is known (saves to the account when signed in).
    const t = window.setTimeout(() => markApplied({ id, title, company, slug }, { signedIn }), 1500)
    return () => window.clearTimeout(t)
  }, [id, title, company, slug, signedIn])
  return null
}
