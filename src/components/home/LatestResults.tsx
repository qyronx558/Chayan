"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight, Download, Calendar, FileCheck2 } from "lucide-react"
import { BookmarkButton } from "@/components/layout/BookmarkButton"
import { cn, formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SectionHeader } from "@/components/ui/section-header"
import { ContentCard, ContentCardSkeleton } from "@/components/ui/content-card"

interface Result {
  id: string
  title: string
  department: string
  resultDate: string
  createdAt: string
  description?: string | null
  pdfUrl?: string
  slug: string
}

export function LatestResults() {
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/results?limit=9")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setResults(
            data.data.map((item: Record<string, unknown>) => ({
              id: item.id as string,
              title: item.title as string,
              department: (item.department as { name: string })?.name ?? "",
              resultDate: item.resultDate as string,
              createdAt: item.createdAt as string,
              description: item.description as string | null | undefined,
              pdfUrl: item.pdfUrl as string | undefined,
              slug: item.slug as string,
            }))
          )
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className={cn("py-16")}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          icon={FileCheck2}
          iconClassName="from-emerald-600 to-teal-800"
          title="Latest Results"
          subtitle="Recently published examination results"
          viewAllHref="/results"
        />

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <ContentCardSkeleton key={i} />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-500">No results published yet.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((result) => (
              <ContentCard
                key={result.id}
                icon={FileCheck2}
                iconClassName="from-emerald-600 to-teal-800"
                badge={<Badge variant="secondary" className="max-w-[65%] truncate bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-600">{result.department}</Badge>}
                statusBadge={<span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Result</span>}
                title={result.title}
                description={result.description}
                meta={[
                  { icon: Calendar, text: result.resultDate ? `Result: ${formatDate(result.resultDate)}` : `Released: ${formatDate(result.createdAt)}` },
                ]}
                href={`/result/${result.slug}`}
                ctaLabel="View Result"
                footer={
                  <div className="flex items-center gap-1">
                    <BookmarkButton resultId={result.id} />
                    {result.pdfUrl ? (
                      <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-[11px]" asChild>
                        <a href={result.pdfUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="h-3.5 w-3.5" />
                          PDF
                        </a>
                      </Button>
                    ) : null}
                  </div>
                }
              />
            ))}
          </div>
        )}

        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/results"
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            View All Results
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}