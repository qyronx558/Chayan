"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Calendar, MapPin, Users } from "lucide-react"
import { cn, formatDate } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

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

const STATUS_STYLES: Record<string, string> = {
 ACTIVE: "text-foreground",
 EXPIRED: "text-muted-foreground",
 UPCOMING: "text-brick",
}

const STATUS_LABELS: Record<string, string> = {
 ACTIVE: "Active",
 EXPIRED: "Expired",
 UPCOMING: "Upcoming",
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

 if (error) {
  return (
  <section className={cn("bg-muted/50 py-16", className)}>
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
     <p className="text-brick">Failed to load jobs. Please try again later.</p>
    </div>
   </section>
  )
 }

 return (
  <section className={cn("bg-paper-2 py-12 sm:py-16", className)}>
   <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div className="mb-8 flex flex-wrap items-end justify-between gap-3 border-b border-rule pb-2">
     <div>
      <p className="agate mb-1 text-[10px] text-brick">03</p>
      <h2 className="font-display text-[1.6rem] font-bold leading-tight text-foreground sm:text-[1.9rem]">Jobs by qualification</h2>
      <p className="mt-1 text-sm text-muted-foreground">Find government jobs matching your educational qualification</p>
     </div>
     <Link
      href="/jobs"
      className="hidden text-sm font-medium text-brick underline decoration-1 underline-offset-4 hover:decoration-2 sm:block"
     >
      View all
     </Link>
    </div>

    {loading ? (
     <div className="min-w-0 space-y-4">
      <div className="no-scrollbar flex min-w-0 gap-2 overflow-x-auto pb-2">
       {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-24 rounded-none" />
       ))}
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
       {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="border-rule">
         <CardContent className="p-5">
          <div className="mb-3 flex gap-2">
           <Skeleton className="h-5 w-20 rounded-none" />
           <Skeleton className="h-5 w-16 rounded-none" />
          </div>
          <Skeleton className="mb-3 h-5 w-3/4" />
          <div className="flex flex-wrap gap-4">
           <Skeleton className="h-4 w-24" />
           <Skeleton className="h-4 w-20" />
           <Skeleton className="h-4 w-28" />
          </div>
         </CardContent>
        </Card>
       ))}
      </div>
     </div>
    ) : (
     <>
      {qualifications.length > 0 && (
       <div className="no-scrollbar mb-8 min-w-0 overflow-x-auto px-1 pb-1" data-tour="qualification-pills">
        <div className="flex min-w-0 snap-x gap-2 pb-2">
         {qualifications.map((qual) => (
          <button
           key={qual}
           onClick={() => setSelectedQual(qual)}
           className={cn(
            "shrink-0 snap-start whitespace-nowrap border px-5 py-1.5 text-sm font-medium transition-colors",
            selectedQual === qual
             ? "border-ink bg-ink text-paper"
             : "border-rule bg-transparent text-muted-foreground hover:border-brick hover:text-brick"
           )}
          >
           {qual}
          </button>
         ))}
        </div>
       </div>
      )}

      {filteredJobs.length === 0 ? (
       <p className="py-12 text-center text-muted-foreground">No jobs found for this qualification.</p>
      ) : (
       <div
        key={selectedQual}
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
       >
        {filteredJobs.slice(0, 4).map((job) => (
         <Link key={job.id} href={`/apply/${job.slug}`} className="group block">
          <Card className="h-full border-rule transition-colors hover:border-rule-2">
           <CardContent className="p-5">
            <div className="mb-2 flex flex-wrap items-center gap-2">
             <Badge variant="secondary" className="text-xs">{job.department}</Badge>
             <span className={cn("agate inline-flex items-center text-xs", STATUS_STYLES[job.status] || "text-foreground")}>
              {STATUS_LABELS[job.status] || job.status}
             </span>
            </div>
            <h3 className="mb-3 line-clamp-2 font-display text-base font-bold leading-snug text-foreground transition-colors group-hover:text-brick">
             {job.title}
            </h3>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
             {job.location && (
              <span className="inline-flex items-center gap-1">
               <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
               {job.location}
              </span>
             )}
             {job.totalVacancies != null && (
              <span className="inline-flex items-center gap-1">
               <Users className="h-3.5 w-3.5 text-muted-foreground" />
               {job.totalVacancies} Vacanc{job.totalVacancies === 1 ? "y" : "ies"}
              </span>
             )}
             {job.lastDate && (
              <span className="inline-flex items-center gap-1">
               <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
               {formatDate(job.lastDate)}
              </span>
             )}
            </div>
           </CardContent>
          </Card>
         </Link>
        ))}
       </div>
      )}

      {qualifications.length > 0 && (
       <div className="mt-6 text-center">
        <Link href={`/jobs?qualification=${selectedQual}`}>
         <Button variant="outline">
          View all {selectedQual} jobs
         </Button>
        </Link>
       </div>
      )}
     </>
    )}
   </div>
  </section>
 )
}
