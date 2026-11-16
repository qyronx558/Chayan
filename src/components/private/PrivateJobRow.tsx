"use client"

import Link from "next/link"
import { BadgeCheck, Briefcase, Banknote, MapPin, ShieldAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import { BookmarkButton } from "@/components/layout/BookmarkButton"
import { CompanyLogo } from "@/components/private/CompanyLogo"
import { AppliedBadge } from "@/components/private/AppliedBadge"
import {
  isFresh,
  JOB_TYPE_LABEL,
  postedAgo,
  salaryText,
  jobPlace,
  trustLabel,
  WORK_MODE_LABEL,
  type ListJob,
} from "@/components/private/job-list-utils"

/**
 * One job in the private-jobs list. Every row puts the same facts in the same
 * place (logo, title, company, location · pay · experience, skills, freshness),
 * so the list can be scanned without reading.
 */
export function PrivateJobRow({
  job,
  selected,
  onSelect,
  nowMs,
}: {
  job: ListJob
  selected?: boolean
  /** Desktop split view: select instead of navigating (plain left click only). */
  onSelect?: (job: ListJob) => boolean
  nowMs: number
}) {
  const href = `/private-jobs/${job.slug}`
  const loc = jobPlace(job)
  const mode = job.remotePolicy ? WORK_MODE_LABEL[job.remotePolicy] : null
  const pay = salaryText(job)
  const trust = trustLabel(job.trustScore)
  const verified = job.company.verifiedStatus === "VERIFIED"
  const skills = job.skills ?? []
  const fresh = isFresh(job.createdAt, nowMs)

  return (
    <article
      className={cn(
        "group relative rounded-2xl border bg-background p-4 transition-[border-color,box-shadow] duration-150",
        selected ? "border-foreground shadow-[0_0_0_1px_var(--color-foreground,currentColor)]" : "border-rule hover:border-foreground/40"
      )}
    >
      <div className="flex gap-3.5">
        <CompanyLogo name={job.company.name} logo={job.company.logo} />
        <div className="min-w-0 flex-1">
          <h3 className="pr-9 text-[15px] font-semibold leading-snug text-foreground">
            <Link
              href={href}
              aria-current={selected ? "true" : undefined}
              onClick={(e) => {
                if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
                if (onSelect?.(job)) e.preventDefault()
              }}
              className="line-clamp-2 outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-foreground"
            >
              {job.title}
            </Link>
          </h3>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
            <span className="truncate">{job.company.name}</span>
            {verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-sky-600" aria-label="Verified employer" />}
          </p>

          <ul className="mt-2.5 flex flex-wrap gap-x-3.5 gap-y-1 text-[13px] text-foreground/80">
            {(loc || mode) && (
              <li className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                {[loc, mode && mode !== "On-site" ? mode : null].filter(Boolean).join(" · ") || mode}
              </li>
            )}
            <li className={cn("flex items-center gap-1 tabular-nums", !pay && "text-muted-foreground")}>
              <Banknote className="h-3.5 w-3.5 text-muted-foreground" />
              {pay ?? "Not disclosed"}
            </li>
            {job.experience && (
              <li className="flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                {job.experience}
              </li>
            )}
          </ul>

          {skills.length > 0 && (
            <ul className="mt-2.5 flex flex-wrap gap-1.5" aria-label="Skills">
              {skills.slice(0, 3).map((s) => (
                <li key={s} className="rounded-md bg-muted px-2 py-0.5 text-xs text-foreground/80">
                  {s}
                </li>
              ))}
              {skills.length > 3 && <li className="px-1 py-0.5 text-xs text-muted-foreground">+{skills.length - 3}</li>}
            </ul>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <AppliedBadge jobId={job.id} />
            {fresh && <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">New</span>}
            <span>{postedAgo(job.createdAt, nowMs)}</span>
            <span aria-hidden>·</span>
            <span>{JOB_TYPE_LABEL[job.type] ?? job.type}</span>
            {job.isFresherFriendly && (
              <>
                <span aria-hidden>·</span>
                <span>Freshers</span>
              </>
            )}
            {job.isWalkIn && (
              <>
                <span aria-hidden>·</span>
                <span>Walk-in</span>
              </>
            )}
            {trust && trust.tone !== "warn" && (
              <>
                <span aria-hidden>·</span>
                <span className="text-foreground/70">{trust.label}</span>
              </>
            )}
            {trust?.tone === "warn" && (
              <span className="flex items-center gap-1 text-amber-700">
                <ShieldAlert className="h-3.5 w-3.5" /> {trust.label}
              </span>
            )}
          </div>
        </div>
      </div>
      {/* Above the stretched link so it stays clickable. */}
      <div className="absolute right-2.5 top-2.5 z-10">
        <BookmarkButton privateJobId={job.id} size="icon" />
      </div>
    </article>
  )
}

export function PrivateJobRowSkeleton() {
  return (
    <div className="rounded-2xl border border-rule p-4" aria-hidden>
      <div className="flex gap-3.5">
        <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
          <div className="flex gap-1.5 pt-1">
            <div className="h-5 w-14 animate-pulse rounded-md bg-muted" />
            <div className="h-5 w-16 animate-pulse rounded-md bg-muted" />
          </div>
        </div>
      </div>
    </div>
  )
}
