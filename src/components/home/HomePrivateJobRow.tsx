import Link from "next/link"
import { cleanTitle } from "@/lib/card-helpers"
import { formatSalaryRange } from "@/lib/private-jobs-trust"

export interface HomePrivateJob {
  id: string
  title: string
  slug: string
  type: string
  location?: string | null
  salary?: string | null
  salaryMin?: number | null
  salaryMax?: number | null
  salaryCurrency?: string | null
  salaryLocalMin?: number | null
  salaryLocalMax?: number | null
  experience?: string | null
  remotePolicy?: string | null
  isFresherFriendly?: boolean
  isWalkIn?: boolean
  company: { id: string; name: string; slug: string; logo?: string | null }
}

const TYPE_LABEL: Record<string, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  INTERNSHIP: "Internship",
  CONTRACT: "Contract",
}

/** Compact private-job row for the home jobs hub. */
export function HomePrivateJobRow({ job }: { job: HomePrivateJob }) {
  const salary = formatSalaryRange(job.salaryMin, job.salaryMax, job.salary, {
    salaryCurrency: job.salaryCurrency,
    salaryLocalMin: job.salaryLocalMin,
    salaryLocalMax: job.salaryLocalMax,
  })
  const remote = job.remotePolicy === "REMOTE"
  const tags = [
    remote ? "Remote" : job.remotePolicy === "HYBRID" ? "Hybrid" : null,
    job.isFresherFriendly ? "Fresher" : null,
    job.isWalkIn ? "Walk-in" : null,
    TYPE_LABEL[job.type] ?? null,
  ].filter(Boolean) as string[]

  const where = job.location || (remote ? "Remote" : null)

  /* Written the way a classified ad reads: one flowing sentence. */
  return (
    <Link
      href={`/private-jobs/${job.slug}`}
      className="group block border-b border-dotted border-[var(--hs-border-strong)] py-3 text-[14px] leading-snug last:border-0"
    >
      <span className="font-display text-[15px] font-bold text-foreground">{job.company.name.toUpperCase()}</span>
      <span className="text-foreground/75"> requires </span>
      <span className="font-semibold text-foreground decoration-[var(--hs-trust)] decoration-2 underline-offset-[3px] group-hover:underline">
        {cleanTitle(job.title)}
      </span>
      <span className="text-foreground/75">.</span>
      {where && <span className="text-muted-foreground"> {where}.</span>}
      {salary && <span className="font-semibold text-foreground/85"> {salary}.</span>}
      {tags.length > 0 && <span className="italic text-muted-foreground"> {tags.slice(0, 2).join(", ")}.</span>}
      <span className="ml-1 inline-block text-[var(--hs-trust)] opacity-0 transition-opacity group-hover:opacity-100">→</span>
    </Link>
  )
}
