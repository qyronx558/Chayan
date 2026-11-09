"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { SectionHeader } from "@/components/ui/section-header"

interface ExamItem {
 id: string
 name: string
 slug: string
 description?: string | null
 categoryId: string
 category: { id: string; name: string; slug: string }
}

interface CategoryItem {
 id: string
 name: string
 slug: string
 description?: string | null
 _count: { job: number }
}

type DisplayItem =
 | { kind: "exam"; exam: ExamItem }
 | { kind: "category"; category: CategoryItem }

export function PopularExams({ className }: { className?: string }) {
 const [items, setItems] = useState<DisplayItem[]>([])
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState("")

 useEffect(() => {
  async function fetchData() {
   try {
    setLoading(true)
    setError("")

    const examRes = await fetch("/api/exams?sort=trending")
    const examJson = await examRes.json()

    if (examJson.success && examJson.data.length > 0) {
     setItems(examJson.data.map((e: ExamItem) => ({ kind: "exam" as const, exam: e })))
     return
    }

    const catRes = await fetch("/api/categories")
    const catJson = await catRes.json()
    if (!catJson.success) throw new Error(catJson.error || "Failed to fetch categories")

    const cats: CategoryItem[] = catJson.data
    const withJobs = cats
     .filter((c) => c._count.job > 0)
     .sort((a, b) => b._count.job - a._count.job)
    setItems(withJobs.map((c) => ({ kind: "category" as const, category: c })))
   } catch (err) {
    setError(err instanceof Error ? err.message : "Something went wrong")
   } finally {
    setLoading(false)
   }
  }
  fetchData()
 }, [])

 if (error) {
  return (
   <section className={cn("py-12 sm:py-16", className)}>
    <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
     <p className="text-brick">Failed to load exams. Please try again later.</p>
    </div>
   </section>
  )
 }

 return (
  <section className={cn("py-16", className)}>
   <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <SectionHeader
     icon={BookOpen}
     index="05"
     title="Popular exams"
     subtitle="Upcoming examination schedules"
     viewAllHref="/jobs"
     viewAllLabel="Browse exams"
    />

    {loading ? (
     <div className="no-scrollbar flex min-w-0 snap-x gap-5 overflow-x-auto pb-4">
      {Array.from({ length: 6 }).map((_, i) => (
       <div key={i} className="w-[78vw] max-w-72 shrink-0 snap-start sm:w-72">
        <Card className="border-rule">
         <Skeleton className="h-32 w-full rounded-none" />
         <CardContent className="p-4">
          <Skeleton className="mb-2 h-4 w-28 rounded-none" />
          <Skeleton className="h-4 w-20 rounded-none" />
         </CardContent>
        </Card>
       </div>
      ))}
     </div>
    ) : items.length === 0 ? (
     <p className="py-12 text-center text-muted-foreground">No exams available.</p>
    ) : (
     <div className="no-scrollbar min-w-0 overflow-x-auto pb-4">
      <div className="flex min-w-0 snap-x gap-5">
       {items.map((item) => {
        if (item.kind === "exam") {
         const exam = item.exam
         return (
          <div key={exam.id} className="w-[78vw] max-w-72 shrink-0 snap-start sm:w-72">
           <Link href={`/jobs?categoryId=${exam.categoryId}`} className="group block">
            <Card className="flex h-full flex-col border-rule transition-colors group-hover:border-rule-2">
             <CardContent className="flex flex-1 flex-col p-5">
              <span className="agate text-xs text-brick">
               {exam.category?.name || "General"}
              </span>
              <h3 className="mt-2 line-clamp-2 font-display text-xl font-bold leading-tight text-foreground transition-colors group-hover:text-brick">
               {exam.name}
              </h3>
              {exam.description && (
               <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                {exam.description}
               </p>
              )}
              <span className="mt-auto border-t border-rule pt-3 text-sm font-medium text-brick underline decoration-1 underline-offset-4 group-hover:decoration-2">
               View jobs
              </span>
             </CardContent>
            </Card>
           </Link>
          </div>
         )
        }

        const cat = item.category
        return (
         <div key={cat.id} className="w-[78vw] max-w-72 shrink-0 snap-start sm:w-72">
          <Link href={`/jobs?categoryId=${cat.id}`} className="group block">
           <Card className="flex h-full flex-col border-rule transition-colors group-hover:border-rule-2">
            <CardContent className="flex flex-1 flex-col p-5">
             <span className="agate text-xs text-brick">
              {cat._count.job} active {cat._count.job === 1 ? "opening" : "openings"}
             </span>
             <h3 className="mt-2 line-clamp-2 font-display text-xl font-bold leading-tight text-foreground transition-colors group-hover:text-brick">
              {cat.name}
             </h3>
             {cat.description && (
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
               {cat.description}
              </p>
             )}
             <span className="mt-auto border-t border-rule pt-3 text-sm font-medium text-brick underline decoration-1 underline-offset-4 group-hover:decoration-2">
              View jobs
             </span>
            </CardContent>
           </Card>
          </Link>
         </div>
        )
       })}
      </div>
     </div>
    )}

    <div className="mt-6 border-t border-rule pt-3 text-center sm:hidden">
     <Link
      href="/jobs"
      className="text-sm font-medium text-brick underline decoration-1 underline-offset-4 hover:decoration-2"
     >
      Browse all exams
     </Link>
    </div>
   </div>
  </section>
 )
}
