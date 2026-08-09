"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight, Download, Calendar, FileText } from "lucide-react"
import { BookmarkButton } from "@/components/layout/BookmarkButton"
import { cn, formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SectionHeader } from "@/components/ui/section-header"
import { ContentCard, ContentCardSkeleton } from "@/components/ui/content-card"

interface AdmitCard {
  id: string
  title: string
  department: string
  examDate?: string
  downloadUrl?: string
  slug: string
}

export function LatestAdmitCards() {
  const [admitCards, setAdmitCards] = useState<AdmitCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admit-cards?limit=8")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAdmitCards(
            data.data.map((item: Record<string, unknown>) => ({
              id: item.id as string,
              title: item.title as string,
              department: (item.department as { name: string })?.name ?? "",
              examDate: item.examDate as string | undefined,
              downloadUrl: item.downloadUrl as string | undefined,
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
          icon={FileText}
          iconClassName="from-violet-600 to-purple-800"
          title="Latest Admit Cards"
          subtitle="Download your examination hall tickets"
          viewAllHref="/admit-cards"
        />

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ContentCardSkeleton key={i} />
            ))}
          </div>
        ) : admitCards.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-500">No admit cards released yet.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {admitCards.map((card) => (
              <ContentCard
                key={card.id}
                icon={FileText}
                iconClassName="from-violet-600 to-purple-800"
                badge={<Badge variant="secondary" className="max-w-[65%] truncate bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-600">{card.department}</Badge>}
                statusBadge={<span className="inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700">Admit Card</span>}
                title={card.title}
                meta={card.examDate ? [{ icon: Calendar, text: `Exam: ${formatDate(card.examDate)}` }] : []}
                href={`/admit-card/${card.slug}`}
                ctaLabel="Get Admit Card"
                footer={
                  <div className="flex items-center gap-1">
                    <BookmarkButton admitCardId={card.id} />
                    <Button size="sm" className="h-7 gap-1 px-2 text-[11px]" asChild>
                      <a href={card.downloadUrl || `/admit-card/${card.slug}`} target={card.downloadUrl ? "_blank" : undefined} rel="noopener noreferrer">
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </a>
                    </Button>
                  </div>
                }
              />
            ))}
          </div>
        )}

        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/admit-cards"
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            View All Admit Cards
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}