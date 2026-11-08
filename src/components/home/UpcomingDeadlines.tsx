"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"
import { SectionHeader } from "@/components/ui/section-header"
import { formatDate } from "@/lib/utils"

interface CalendarEvent {
 date: string
 type: "last_date" | "exam" | "admit_card" | "result" | "admission_begin" | "admission_last"
 label: string
 title: string
 department: string
 href: string
}

export function UpcomingDeadlines({ className }: { className?: string }) {
 const [events, setEvents] = useState<CalendarEvent[]>([])
 const [loading, setLoading] = useState(true)

 useEffect(() => {
  fetch("/api/exam-calendar?upcoming=1&limit=6")
   .then((res) => res.json())
   .then((data) => {
    if (data.success) setEvents(data.data)
   })
   .catch(() => {})
   .finally(() => setLoading(false))
 }, [])

 return (
  <section className={cn("py-16", className)} data-tour="deadlines-teaser">
   <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <SectionHeader
     icon={CalendarDays}
     title="Upcoming deadlines"
     subtitle="Application deadlines, exam dates and results coming up next"
     viewAllHref="/exam-calendar"
    />

    {loading ? (
     <div className="grid gap-3 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
       <div key={i} className="h-20 animate-pulse border-t-2 border-rule bg-paper-2" />
      ))}
     </div>
    ) : events.length === 0 ? null : (
     <div className="grid gap-x-8 sm:grid-cols-2">
      {events.map((e, i) => (
       <Link
        key={`${e.date}-${i}`}
        href={e.href}
        className="group flex items-center gap-4 border-t border-rule py-3.5 transition-colors"
       >
        <div className="flex w-12 shrink-0 flex-col items-center border-r border-rule pr-3 text-center">
         <span className="font-display text-xl font-bold leading-none text-foreground">
          {formatDate(e.date).split(" ")[0]}
         </span>
         <span className="agate mt-1 text-[0.65rem] text-muted-foreground">
          {formatDate(e.date).split(" ")[1]}
         </span>
        </div>
        <div className="min-w-0 flex-1">
         <p className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-brick">
          {e.title}
         </p>
         <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {e.department}
         </p>
        </div>
        <span className="agate shrink-0 text-[0.65rem] text-brick">{e.label}</span>
       </Link>
      ))}
     </div>
    )}

    <div className="mt-6 border-t border-rule pt-3 text-center sm:hidden">
     <Link
      href="/exam-calendar"
      className="text-sm font-medium text-brick underline decoration-1 underline-offset-4 hover:decoration-2"
     >
      View full calendar
     </Link>
    </div>
   </div>
  </section>
 )
}
