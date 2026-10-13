"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight, ExternalLink, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
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

const GRADIENTS = [
  "from-blue-700 to-blue-900",
  "from-sky-600 to-blue-700",
  "from-amber-500 to-orange-600",
  "from-emerald-600 to-green-700",
  "from-violet-600 to-purple-700",
  "from-rose-600 to-pink-700",
  "from-cyan-600 to-sky-700",
  "from-indigo-600 to-blue-800",
  "from-orange-500 to-red-600",
  "from-emerald-500 to-green-600",
]

function getGradient(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length]
}

export function PopularExams({ className }: { className?: string }) {
  const [exams, setExams] = useState<ExamItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchExams() {
      try {
        setLoading(true)
        setError("")
        const res = await fetch("/api/exams?sort=trending")
        const json = await res.json()
        if (!json.success) throw new Error(json.error || "Failed to fetch exams")
        setExams(json.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong")
      } finally {
        setLoading(false)
      }
    }
    fetchExams()
  }, [])

  if (error) {
    return (
      <section className={cn("py-16", className)}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-red-500">Failed to load exams. Please try again later.</p>
        </div>
      </section>
    )
  }

  return (
    <section className={cn("py-16", className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          icon={BookOpen}
          iconClassName="from-amber-500 to-orange-700"
          title="Popular Exams"
          subtitle="Upcoming examination schedules"
          viewAllHref="/jobs"
          viewAllLabel="Browse Exams"
        />

        {loading ? (
          <div className="no-scrollbar flex min-w-0 snap-x gap-5 overflow-x-auto px-1 pb-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-[78vw] max-w-72 shrink-0 snap-start sm:w-72">
                <Card className="overflow-hidden border-gray-200">
                  <Skeleton className="h-32 w-full" />
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-28 mb-2" />
                    <Skeleton className="h-4 w-20" />
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        ) : exams.length === 0 ? (
          <p className="py-12 text-center text-gray-500">No exams available.</p>
        ) : (
          <div className="no-scrollbar min-w-0 overflow-x-auto px-1 pb-4">
            <div className="flex min-w-0 snap-x gap-5">
              {exams.map((exam) => (
                <div key={exam.id} className="w-[78vw] max-w-72 shrink-0 snap-start sm:w-72">
                  <Link href={`/jobs?categoryId=${exam.categoryId}`} className="group block">
                    <Card className="overflow-hidden border-gray-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/10">
                      <CardContent className="p-0">
                        <div className={cn("relative bg-gradient-to-r p-5 text-white", getGradient(exam.category?.name || exam.name))}>
                          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                          <Badge variant="secondary" className="mb-2 bg-white/20 text-white hover:bg-white/30">
                            {exam.category?.name || "General"}
                          </Badge>
                          <h3 className="line-clamp-2 text-lg font-bold leading-tight">{exam.name}</h3>
                          {exam.description && (
                            <p className="mt-1 line-clamp-2 text-sm text-white/80">{exam.description}</p>
                          )}
                        </div>
                        <div className="flex items-center justify-between p-4">
                          <span className="text-sm font-semibold text-blue-600 transition-colors group-hover:text-blue-700">
                            View Jobs
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-all duration-300 group-hover:bg-gradient-to-r group-hover:from-[#1e3a5f] group-hover:to-blue-700 group-hover:text-white">
                            Explore
                            <ExternalLink className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Browse All Exams
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}