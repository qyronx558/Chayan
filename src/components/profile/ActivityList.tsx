"use client"

import Link from "next/link"
import { DataCard } from "@/components/admin/dashboard/DataCard"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/utils"

export interface ActivityEvent {
  id: string
  summary: string
  createdAt: string
}

interface ActivityListProps {
  events: ActivityEvent[]
  loading: boolean
  userId: string
}

export function ActivityList({ events, loading, userId }: ActivityListProps) {
  return (
    <DataCard
      title="Activity"
      subtitle="Your recent account events"
      action={
        <Link href={`/admin/logs?actor=${encodeURIComponent(userId)}`} className="text-xs font-medium text-teal-700 underline-offset-4 hover:underline dark:text-teal-300">
          View in System logs
        </Link>
      }
    >
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 rounded-lg" />
          <Skeleton className="h-12 rounded-lg" />
          <Skeleton className="h-12 rounded-lg" />
        </div>
      ) : events.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">No recent activity.</p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-white/[0.06]">
          {events.map((e) => (
            <li key={e.id} className="flex items-start justify-between gap-3 py-2.5">
              <p className="min-w-0 flex-1 text-sm text-slate-700 dark:text-slate-300">{e.summary}</p>
              <span className="shrink-0 text-xs tabular-nums text-slate-500 dark:text-slate-400">{formatDate(new Date(e.createdAt), "dd MMM, HH:mm")}</span>
            </li>
          ))}
        </ul>
      )}
    </DataCard>
  )
}
