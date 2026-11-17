"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { MapPin, Users } from "lucide-react"
import { cn, formatDate } from "@/lib/utils"
import { HomeSectionHeader } from "@/components/home/ui/HomeSectionHeader"
import { daysLeft } from "@/components/home/HomeJobRow"
import { handFont } from "@/components/home/fonts"

interface JobItem {
 id: string
 title: string
 slug: string
 department: string
 education?: string | null
 totalVacancies?: number | null
 lastDate?: string | null
 status: string
 location?: string | null
 salary?: string | null
}

const QUALIFICATION_KEYWORDS = [
 "10th", "12th", "ITI", "Diploma", "Graduate", "Post Graduate",
 "Engineering", "B.Tech", "B.Sc", "M.Sc", "B.Com", "M.Com",
 "BA", "MA", "MBA", "B.Ed", "M.Ed", "LLB", "BCA", "MCA",
 "Nursing", "MBBS", "BDS", "Pharmacy", "CA", "PhD", "Any Graduate",
 "M.Phil", "Agriculture", "Journalism", "Hotel Management", "Data Entry",
]

const compact = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "")

function matchesQualification(education: string, keyword: string): boolean {
 const kw = compact(keyword)
 const parts = education.split(/[,\n;]/).map((p) => p.trim()).filter(Boolean)
 for (const part of parts) {
  const compactPart = compact(part)
  if (!compactPart) continue
  if (kw.length <= 3) {
   const tokens = part.split(/\s+/).map(compact)
   if (tokens.some((t) => t === kw)) return true
  } else if (compactPart.includes(kw)) {
   return true
  }
 }
 return false
}

function extractQualifications(education?: string | null): string[] {
 if (!education) return []
 return QUALIFICATION_KEYWORDS.filter((keyword) => matchesQualification(education, keyword))
}

export function JobsByQualification({ className }: { className?: string }) {
 const [jobs, setJobs] = useState<JobItem[]>([])
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState("")
 const [selectedQual, setSelectedQual] = useState("")

 useEffect(() => {
  async function fetchData() {
   try {
    setLoading(true)
    setError("")
    const res = await fetch("/api/jobs?limit=50")
    const json = await res.json()
    if (!json.success) throw new Error(json.error || "Failed to fetch jobs")
    const mapped: JobItem[] = json.data.map((j: any) => ({
     id: j.id,
     title: j.title,
     slug: j.slug,
     department: j.department?.name || "",
     education: j.education,
     totalVacancies: j.totalVacancies,
     lastDate: j.lastDate,
     status: j.status,
     location: j.location,
     salary: j.salary,
    }))
    setJobs(mapped)
   } catch (err) {
    setError(err instanceof Error ? err.message : "Something went wrong")
   } finally {
    setLoading(false)
   }
  }
  fetchData()
 }, [])

 const qualifications = useMemo(() => {
  const present = new Set<string>()
  for (const job of jobs) {
   for (const q of extractQualifications(job.education)) {
    present.add(q)
   }
  }
  return QUALIFICATION_KEYWORDS.filter((q) => present.has(q))
 }, [jobs])

 useEffect(() => {
  if (qualifications.length > 0 && !selectedQual) {
   setSelectedQual(qualifications[0])
  }
 }, [qualifications, selectedQual])

 const filteredJobs = useMemo(() => {
  if (!selectedQual) return jobs
  return jobs.filter((job) => {
   const extracted = extractQualifications(job.education)
   return extracted.includes(selectedQual)
  })
 }, [jobs, selectedQual])

 return (
  <section className={cn("hs-section hs-band", className)}>
   <div className="hs-container">
    <HomeSectionHeader
     eyebrow="by qualification"
     title="Start from what you have studied"
     mark="studied"
     subtitle="Every form begins with the same question: what have you studied? Pick yours, and we'll pull out only the files that ask for it."
    />

    {error ? (
     <p className="hs-r bg-[var(--hs-surface)] px-4 py-8 text-center text-sm text-[var(--color-brick)]">
      We couldn't open the files right now. Please try again in a little while.
     </p>
    ) : loading ? (
     <div className="space-y-0">
      <div className="flex gap-1 pl-4">
       {Array.from({ length: 6 }).map((_, i) => (
        <span key={i} className="hs-skel block h-9 w-24 rounded-b-none" />
       ))}
      </div>
      <span className="hs-skel block h-72 rounded-tl-none" />
     </div>
    ) : (
     <div className="relative">
      {/* folder tabs — one per qualification */}
      {qualifications.length > 0 && (
       <div className="hs-scroll -mb-px overflow-x-auto pl-3 sm:pl-5" data-tour="qualification-pills">
        <div role="tablist" aria-label="Choose your qualification" className="flex min-w-max items-end gap-1">
         {qualifications.map((qual) => {
          const on = selectedQual === qual
          return (
           <button
            key={qual}
            role="tab"
            aria-selected={on}
            onClick={() => setSelectedQual(qual)}
            className={cn(
             "relative rounded-t-[10px] border border-b-0 px-4 text-sm transition-[padding,background-color,color] duration-200",
             on
              ? "z-10 border-[var(--hs-kraft-edge)] bg-[var(--hs-kraft)] pb-3 pt-2.5 font-semibold text-foreground"
              : "border-transparent bg-[var(--hs-kraft-tab)] pb-2 pt-2 text-foreground/65 hover:pb-2.5 hover:text-foreground"
            )}
           >
            {qual}
           </button>
          )
         })}
        </div>
       </div>
      )}

      {/* the folder */}
      <div
       className="relative rounded-[14px] rounded-tl-[4px] border border-[var(--hs-kraft-edge)] bg-[var(--hs-kraft)] p-4 sm:p-7"
       style={{ boxShadow: "0 2px 0 var(--hs-kraft-edge), 0 24px 40px -30px rgb(60 40 10 / .5)" }}
      >
       <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        {/* paper label stuck on the folder */}
        <div className="-rotate-[1.2deg] rounded-[3px] border border-black/10 bg-[var(--hs-paper-slip)] px-4 py-2 shadow-[0_2px_4px_rgb(0_0_0/.08)]">
         <p className="text-[10px] text-muted-foreground">FILE</p>
         <p className={cn(handFont.className, "text-[1.35rem] leading-tight text-foreground")}>
          {selectedQual || "All qualifications"}
         </p>
        </div>
        <p className="text-sm text-foreground/70">
         <span className="font-semibold text-foreground">{filteredJobs.length}</span>{" "}
         {filteredJobs.length === 1 ? "notice asks" : "notices ask"} for this
         {qualifications.length > 0 && (
          <Link
           href={selectedQual ? `/jobs?qualification=${encodeURIComponent(selectedQual)}` : "/jobs"}
           className={cn(handFont.className, "ml-3 inline-block whitespace-nowrap text-[1.1rem] text-[var(--hs-trust)] underline decoration-wavy decoration-1 underline-offset-[5px]")}
          >
           open the full file →
          </Link>
         )}
        </p>
       </div>

       {filteredJobs.length === 0 ? (
        <p className={cn(handFont.className, "py-12 text-center text-xl text-foreground/60")}>
         This file is empty for now. New notices are added as they come in.
        </p>
       ) : (
        <div key={selectedQual} className="grid gap-4 lg:grid-cols-2">
         {filteredJobs.slice(0, 6).map((job, i) => (
          <Challan key={job.id} job={job} index={i} />
         ))}
        </div>
       )}
      </div>
     </div>
    )}
   </div>
  </section>
 )
}

/* An exam-fee challan: perforated counterfoil on the left, the form on the right. */
function Challan({ job, index }: { job: JobItem; index: number }) {
 const d = daysLeft(job.lastDate)
 const closed = d !== null && d < 0
 const tone = d === null ? "text-muted-foreground" : closed ? "text-muted-foreground" : d <= 7 ? "text-[var(--color-brick)]" : "text-[var(--hs-trust)]"
 return (
  <Link
   href={`/apply/${job.slug}`}
   className={cn(
    "hs-reveal group relative flex min-w-0 overflow-hidden rounded-[6px] bg-[var(--hs-paper-slip)] shadow-[0_1px_2px_rgb(60_40_10/.1),0_10px_20px_-16px_rgb(60_40_10/.45)] transition-transform duration-200 hover:-translate-y-0.5",
    index >= 4 && "hidden lg:flex"
   )}
   style={{ animationDelay: `${index * 50}ms` }}
  >
   {/* counterfoil */}
   <div className="relative flex w-[5.5rem] shrink-0 flex-col items-center justify-center border-r-2 border-dashed border-[var(--hs-kraft-edge)] px-2 py-4 text-center sm:w-24">
    <span className="text-[9px] font-semibold text-muted-foreground">LAST DATE</span>
    <span className="mt-1 font-display text-lg font-bold leading-none text-foreground">
     {job.lastDate ? formatDate(job.lastDate, "dd MMM") : "—"}
    </span>
    <span className={cn(handFont.className, "mt-1.5 text-[0.95rem] leading-none", tone)}>
     {d === null ? "see notice" : closed ? "closed" : d === 0 ? "today!" : `${d} days left`}
    </span>
    {/* ticket notches */}
    <span className="absolute -right-[9px] -top-2 h-4 w-4 rounded-full bg-[var(--hs-kraft)]" aria-hidden />
    <span className="absolute -bottom-2 -right-[9px] h-4 w-4 rounded-full bg-[var(--hs-kraft)]" aria-hidden />
   </div>

   {/* the form */}
   <div className="min-w-0 flex-1 px-4 py-3.5">
    <p className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
     <span className="truncate">{job.department || "Government of India"}</span>
     <span className="shrink-0 font-mono">No. {String(index + 1).padStart(3, "0")}</span>
    </p>
    <h3 className="mt-1.5 line-clamp-2 text-[15px] font-bold leading-snug text-foreground transition-colors group-hover:text-[var(--hs-trust)]">
     {job.title}
    </h3>
    <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-dotted border-[var(--hs-border-strong)] pt-2 text-xs text-muted-foreground">
     {job.totalVacancies != null && (
      <span className="inline-flex items-center gap-1">
       <Users className="h-3.5 w-3.5" />
       {job.totalVacancies.toLocaleString("en-IN")} posts
      </span>
     )}
     {job.location && (
      <span className="inline-flex min-w-0 items-center gap-1">
       <MapPin className="h-3.5 w-3.5 shrink-0" />
       <span className="truncate">{job.location}</span>
      </span>
     )}
    </div>
   </div>
  </Link>
 )
}
