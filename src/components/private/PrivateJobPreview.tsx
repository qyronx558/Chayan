"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowUpRight, BadgeCheck, Building2, CalendarClock, ExternalLink, ShieldAlert, ShieldCheck } from "lucide-react"
import { cn, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { BookmarkButton } from "@/components/layout/BookmarkButton"
import { CardShareButton } from "@/components/ui/card-actions"
import { PrivateTracker } from "@/components/private/PrivateTracker"
import { CompanyLogo } from "@/components/private/CompanyLogo"
import { RichTextView } from "@/components/shared/RichTextView"
import { containsHtml } from "@/lib/blog-prose"
import { cleanJobDescription } from "@/lib/private-jobs/description"
import { htmlToText } from "@/lib/private-jobs/html-text"
import {
  JOB_TYPE_LABEL,
  jobPlace,
  postedAgo,
  salaryText,
  trustLabel,
  WORK_MODE_LABEL,
  type ListJob,
} from "@/components/private/job-list-utils"

function Fact({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className={cn("mt-0.5 truncate text-sm font-medium tabular-nums", muted ? "text-muted-foreground" : "text-foreground")}>{value}</dd>
    </div>
  )
}

/**
 * Desktop detail pane next to the list: the decision-making facts first
 * (pay, experience, place, freshness, trust), then the description.
 */
export function PrivateJobPreview({ job, nowMs }: { job: ListJob; nowMs: number }) {
  const [expanded, setExpanded] = useState(false)
  const href = `/private-jobs/${job.slug}`
  const pay = salaryText(job)
  const trust = trustLabel(job.trustScore)
  const verified = job.company.verifiedStatus === "VERIFIED"
  const fromSource = job.source === "ATS_FEED"
  const description = cleanJobDescription(job.description)?.trim() || ""
  const isHtml = containsHtml(description)
  const long = (isHtml ? htmlToText(description) : description).length > 900

  return (
    <aside aria-label={`${job.title} at ${job.company.name}`} className="sticky top-24 flex max-h-[calc(100vh-7rem)] flex-col overflow-hidden rounded-2xl border border-rule bg-background">
      <header className="border-b border-rule p-5">
        <div className="flex items-start gap-3.5">
          <CompanyLogo name={job.company.name} logo={job.company.logo} size={52} />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold leading-snug text-foreground">{job.title}</h2>
            <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
              {job.company.slug ? (
                <Link href={`/companies/${job.company.slug}`} className="truncate hover:underline">
                  {job.company.name}
                </Link>
              ) : (
                <span className="truncate">{job.company.name}</span>
              )}
              {verified && <BadgeCheck className="h-4 w-4 shrink-0 text-sky-600" aria-label="Verified employer" />}
              <span aria-hidden>·</span>
              <span className="shrink-0">{postedAgo(job.createdAt, nowMs)}</span>
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button asChild className="min-w-32">
            <Link href={`${href}/apply`}>
              Apply <ArrowUpRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <BookmarkButton privateJobId={job.id} size="default" />
          <CardShareButton title={job.title} url={href} />
          <PrivateTracker privateJobId={job.id} variant="compact" className="ml-auto" />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto overscroll-contain p-5">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3.5 sm:grid-cols-3">
          <Fact label="Salary" value={pay ?? "Not disclosed"} muted={!pay} />
          <Fact label="Experience" value={job.experience ?? "Not specified"} muted={!job.experience} />
          <Fact label="Location" value={jobPlace(job, { full: true }) ?? (job.remotePolicy === "REMOTE" ? "Remote" : "Not specified")} />
          <Fact label="Work mode" value={job.remotePolicy ? WORK_MODE_LABEL[job.remotePolicy] : "On-site"} />
          <Fact label="Job type" value={JOB_TYPE_LABEL[job.type] ?? job.type} />
          {job.vacancies ? <Fact label="Openings" value={String(job.vacancies)} /> : job.category ? <Fact label="Team" value={job.category} /> : null}
        </dl>

        <div
          className={cn(
            "mt-5 flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-sm",
            trust?.tone === "warn" ? "bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200" : "bg-muted/60 text-foreground/80"
          )}
        >
          {trust?.tone === "warn" ? <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /> : <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />}
          <div className="min-w-0">
            <p className="font-medium">
              {trust?.tone === "warn" ? "Verify this employer before applying" : fromSource ? "From the company's own careers board" : trust ? `${trust.label} listing` : "Listing details"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {fromSource ? "Synced automatically - it closes here when the company removes it. " : ""}
              ChayanJobs never asks for fees. Report anything suspicious from the full page.
              {job.proofUrl && (
                <>
                  {" "}
                  <a href={job.proofUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-0.5 font-medium text-foreground hover:underline">
                    Source <ExternalLink className="h-3 w-3" />
                  </a>
                </>
              )}
            </p>
          </div>
        </div>

        {job.lastDate && (
          <p className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarClock className="h-4 w-4" /> Apply by <span className="font-medium text-foreground">{formatDate(job.lastDate)}</span>
          </p>
        )}

        {(job.skills?.length ?? 0) > 0 && (
          <section className="mt-5">
            <h3 className="text-sm font-semibold">Skills</h3>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {job.skills!.map((s) => (
                <li key={s} className="rounded-md bg-muted px-2 py-0.5 text-xs text-foreground/80">
                  {s}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-5">
          <h3 className="text-sm font-semibold">About the role</h3>
          {description ? (
            <>
              {isHtml ? (
                <div
                  className={cn(
                    "mt-2 text-sm [&_h2]:mt-4 [&_h2]:text-base [&_h3]:mt-3 [&_h3]:text-sm",
                    !expanded && long && "max-h-80 overflow-hidden [mask-image:linear-gradient(to_bottom,black_75%,transparent)]"
                  )}
                >
                  <RichTextView html={description} />
                </div>
              ) : (
                <p className={cn("mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/85", !expanded && long && "line-clamp-[14]")}>{description}</p>
              )}
              {long && (
                <button type="button" onClick={() => setExpanded((v) => !v)} className="mt-1.5 text-sm font-medium text-foreground hover:underline">
                  {expanded ? "Show less" : "Show more"}
                </button>
              )}
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">The company hasn&apos;t shared a description here - open the full page for details.</p>
          )}
        </section>
      </div>

      <footer className="flex items-center justify-between border-t border-rule px-5 py-3 text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Building2 className="h-4 w-4" /> {job.company.name}
        </span>
        <Link href={href} className="inline-flex items-center gap-1 font-medium text-foreground hover:underline">
          Full details <ArrowUpRight className="h-4 w-4" />
        </Link>
      </footer>
    </aside>
  )
}

export function PrivateJobPreviewEmpty() {
  return (
    <div className="sticky top-24 flex h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-rule text-center">
      <p className="text-sm font-medium">Select a job to see the details</p>
      <p className="mt-1 text-xs text-muted-foreground">Tip: use J and K to move through the list.</p>
    </div>
  )
}
