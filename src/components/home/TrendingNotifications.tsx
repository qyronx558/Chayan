"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Flame, Eye, Calendar, ArrowRight } from "lucide-react"
import { cn, formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { SectionHeader } from "@/components/ui/section-header"

interface Notification {
  id: string
  title: string
  date: string
  category: string
  views: number
  slug: string
}

function formatViews(views: number): string {
  if (views >= 100000) return `${(views / 100000).toFixed(1)}L`
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`
  return views.toString()
}

const RANK_STYLES = [
  "border-amber-200 bg-amber-100 text-amber-700",
  "border-gray-200 bg-gray-100 text-gray-600",
  "border-orange-200 bg-orange-100 text-orange-700",
]

export function TrendingNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/notifications?limit=6&isTrending=true")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setNotifications(
            data.data.map((item: Record<string, unknown>) => ({
              id: item.id as string,
              title: item.title as string,
              date: (item.createdAt as string) || (item.date as string),
              category: (item.category as { name: string }).name,
              views: item.views as number,
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
          icon={Flame}
          iconClassName="from-orange-500 to-red-600"
          title="Trending Notifications"
          subtitle="Most viewed alerts right now"
          viewAllHref="/notifications"
        />

        {loading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="border-gray-200">
                <CardContent className="flex items-center gap-3 p-3.5">
                  <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
                  <Skeleton className="h-3 flex-1" />
                  <Skeleton className="h-3 w-12 shrink-0" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-gray-500">No trending notifications right now.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {notifications.slice(0, 5).map((item, index) => (
              <div key={item.id}>
                <Link href="/notifications" className="block">
                  <Card className="group border-gray-200 transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md">
                    <CardContent className="flex items-center gap-3.5 p-3.5">
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                          RANK_STYLES[index % 3]
                        )}
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="secondary" className="px-1.5 py-0 text-[10px] leading-normal">
                            {item.category}
                          </Badge>
                          <span className="flex items-center gap-1 text-[10px] text-gray-400">
                            <Calendar className="h-3 w-3" />
                            {formatDate(item.date)}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-1 text-sm font-medium text-gray-900 transition-colors group-hover:text-orange-700">
                          {item.title}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-600">
                          <Eye className="h-3 w-3" />
                          {formatViews(item.views)}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 -translate-x-1 text-orange-300 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-hover:text-orange-500" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}