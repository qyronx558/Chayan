"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { ArrowRight, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useDataVersion, withDataVersion } from "@/components/providers/DataVersion"

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
 departmentId?: string | null
}

interface DepartmentItem {
 id: string
 name: string
 slug: string
}

function formatCount(count: number): string {
 if (count >= 1000) return `${(count / 1000).toFixed(0)}K+`
 return count.toString()
}

export function JobsByDepartment({ className }: { className?: string }) {
 const dataVersion = useDataVersion()
 const [departments, setDepartments] = useState<DepartmentItem[]>([])
 const [jobs, setJobs] = useState<JobItem[]>([])
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState("")

 useEffect(() => {
  async function fetchData() {
   try {
    setLoading(true)
    setError("")
    const [deptRes, jobsRes] = await Promise.all([
     fetch("/api/departments"),
     fetch(withDataVersion("/api/jobs?limit=100", dataVersion)),
    ])
    const deptJson = await deptRes.json()
    const jobsJson = await jobsRes.json()
    if (!deptJson.success) throw new Error(deptJson.error || "Failed to fetch departments")
    if (!jobsJson.success) throw new Error(jobsJson.error || "Failed to fetch jobs")
    setDepartments(deptJson.data)
    const mapped: JobItem[] = jobsJson.data.map((j: any) => ({
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
     departmentId: j.departmentId,
    }))
    setJobs(mapped)
   } catch (err) {
    setError(err instanceof Error ? err.message : "Something went wrong")
   } finally {
    setLoading(false)
   }
  }
  fetchData()
 }, [dataVersion])

 const deptJobMap = useMemo(() => {
  const map = new Map<string, JobItem[]>()
  for (const job of jobs) {
   if (!job.departmentId) continue
   const existing = map.get(job.departmentId) || []
   existing.push(job)
   map.set(job.departmentId, existing)
  }
  return map
 }, [jobs])

 if (error) {
  return (
   <section className={cn("bg-paper-2 py-16", className)}>
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
     <p className="text-brick">Failed to load data. Please try again later.</p>
    </div>
   </section>
  )
 }

 return (
  <section className={cn("bg-paper-2 py-16", className)}>
   <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div className="mb-8 flex items-center justify-between">
     <div>
      <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Jobs by Department</h2>
      <p className="mt-1 text-sm text-muted-foreground">Browse job openings by department or category</p>
     </div>
     <Link
      href="/jobs"
      className="group hidden items-center gap-1 text-sm font-medium text-brick hover:text-brick sm:flex"
     >
      View All
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
     </Link>
    </div>

    {loading ? (
     <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
       <Card key={i} className="border-rule overflow-hidden">
        <Skeleton className="h-32 w-full" />
        <CardContent className="p-3">
         <Skeleton className="h-3 w-20" />
        </CardContent>
       </Card>
      ))}
     </div>
    ) : (
     <>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
       {departments.map((dept) => {
        const count = deptJobMap.get(dept.id)?.length || 0
        return (
         <div key={dept.id}>
          <Link
           href={`/jobs?departmentId=${dept.id}`}
           className="group block"
          >
           <Card className={cn(
            "overflow-hidden border-rule transition-all hover:-translate-y-0.5 hover:"
           )}>
            <CardContent className="p-0">
             <div className="bg-ink p-4 text-paper">
              <Building2 className="h-6 w-6 mb-1" />
              <h3 className="mt-1 text-lg font-bold">{dept.name}</h3>
              {count > 0 && (
               <p className="text-sm opacity-90">{formatCount(count)} Jobs</p>
              )}
             </div>
             <div className="flex items-center justify-between p-3 text-sm">
              <span className="text-muted-foreground">{count > 0 ? `${count} openings` : "No openings"}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
             </div>
            </CardContent>
           </Card>
          </Link>
         </div>
        )
       })}
      </div>

      {departments.length === 0 && !loading && (
       <p className="py-12 text-center text-muted-foreground">No departments available.</p>
      )}
     </>
    )}
   </div>
  </section>
 )
}
