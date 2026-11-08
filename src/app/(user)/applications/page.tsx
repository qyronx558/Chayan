"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Briefcase, CalendarClock, MapPin, Loader2, Trash2, ArrowRight, ClipboardList,
} from "lucide-react"
import { formatDate, cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import {
  ApplicationTracker, TRACKER_STATUSES, type TrackerStatus,
} from "@/components/jobs/ApplicationTracker"

interface ApplicationItem {
  id: string
  type: "job" | "admission"
  status: TrackerStatus
  appliedAt: string | null
  deadline: string | null
  nextUpcoming: string | null
  content: {
    id: string
    title: string
    slug: string
    department: string
    category: string | null
    location: string | null
    salary: string | null
    totalVacancies: number | null
  }
  href: string
}

const ORDER: TrackerStatus[] = ["interested", "applied", "admit_card", "exam_done", "result_out"]

export default function ApplicationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [items, setItems] = useState<ApplicationItem[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchApplications = useCallback(async (silent = false) => {
    try {
      const res = await fetch("/api/applications")
      if (res.ok) {
        const json = await res.json()
        if (json.success) {
          setItems(json.data)
          setCounts(json.counts || {})
          setLastUpdated(new Date())
        }
      }
    } catch {
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }
    if (status === "authenticated") {
      fetchApplications()
    }
  }, [status, router, fetchApplications])

  useEffect(() => {
    if (status !== "authenticated") return
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchApplications(true)
      }
    }, 5000)
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchApplications(true)
    }
    const onFocus = () => fetchApplications(true)
    document.addEventListener("visibilitychange", onVisible)
    window.addEventListener("focus", onFocus)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener("visibilitychange", onVisible)
      window.removeEventListener("focus", onFocus)
    }
  }, [status, fetchApplications])

  const removeApplication = async (id: string) => {
    setRemovingId(id)
    try {
      const item = items.find((i) => i.id === id)
      const res = await fetch(`/api/applications?jobId=${item?.content.id}`, { method: "DELETE" })
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== id))
        toast("Application tracking removed", "success")
      } else {
        toast("Failed to remove", "destructive")
      }
    } catch {
      toast("Failed to remove", "destructive")
    } finally {
      setRemovingId(null)
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Skeleton className="mb-6 h-8 w-56" />
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  const total = items.length

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink text-paper ">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Applications</h1>
            <p className="text-sm text-muted-foreground">Track every job and admission you care about - from interested to result.</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 rounded-full border border-rule bg-paper-3 px-3 py-1 text-xs font-medium text-foreground dark:border-rule dark:bg-paper-3 dark:text-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-paper-3 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-paper-3" />
            </span>
            Live{lastUpdated ? ` · ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : ""}
          </div>
        </div>

        {total === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-16">
              <Briefcase className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold text-foreground">No tracked applications</h3>
              <p className="mb-6 max-w-md text-center text-sm text-muted-foreground">
                Tap the Track button on any job or admission to start following it. You&apos;ll get deadline, admit card and result reminders.
              </p>
              <Button asChild>
                <Link href="/jobs">
                  Browse Jobs <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {TRACKER_STATUSES.map((s) => (
                <div
                  key={s.value}
                  className={cn(
                    "rounded-xl border p-3 text-center transition-colors",
                    (counts[s.value] || 0) > 0
                      ? "border-rule bg-paper-3 dark:border-rule dark:bg-paper-3"
                      : "border-rule bg-background dark:border-ink dark:bg-ink"
                  )}
                >
                  <s.icon className={cn("mx-auto mb-1 h-5 w-5", s.color)} />
                  <p className="text-xl font-bold text-foreground">{counts[s.value] || 0}</p>
                  <p className="text-[11px] font-medium text-muted-foreground">{s.short}</p>
                </div>
              ))}
            </div>

            <div className="space-y-8">
              {ORDER.map((statusKey) => {
                const info = TRACKER_STATUSES.find((s) => s.value === statusKey)!
                const group = items.filter((i) => i.status === statusKey)
                if (group.length === 0) return null
                return (
                  <section key={statusKey}>
                    <div className="mb-3 flex items-center gap-2">
                      <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg text-paper", info.active)}>
                        <info.icon className="h-4 w-4" />
                      </span>
                      <h2 className="text-lg font-bold text-foreground">{info.label}</h2>
                      <Badge variant="secondary" className="text-xs">{group.length}</Badge>
                    </div>
                    <div className="space-y-3">
                      {group.map((item) => (
                        <ApplicationRow
                          key={item.id}
                          item={item}
                          onRemove={removeApplication}
                          isRemoving={removingId === item.id}
                        />
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}

function ApplicationRow({
  item,
  onRemove,
  isRemoving,
}: {
  item: ApplicationItem
  onRemove: (id: string) => void
  isRemoving: boolean
}) {
  const deadlineMs = item.deadline ? new Date(item.deadline).getTime() : null
  const isUrgent = deadlineMs !== null && deadlineMs - Date.now() > 0 && deadlineMs - Date.now() < 7 * 86400000
  const isOverdue = deadlineMs !== null && deadlineMs <= Date.now()
  const nextMs = item.nextUpcoming ? new Date(item.nextUpcoming).getTime() : null

  return (
    <Card className="group border-rule transition-colors hover:border-rule dark:border-ink">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <Link href={item.href} className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="max-w-full truncate text-xs">{item.content.department}</Badge>
            {item.type === "admission" ? (
              <Badge className="bg-paper-2 text-brick text-[10px] dark:bg-paper-2 dark:text-brick">Admission</Badge>
            ) : (
              <Badge className="bg-paper-3 text-brick text-[10px] dark:bg-paper-3 dark:text-brick">Job</Badge>
            )}
            {isUrgent && <Badge className="bg-paper-2 text-brick text-[10px] dark:bg-paper-2 dark:text-brick">Closing Soon</Badge>}
            {isOverdue && <Badge className="bg-paper-2 text-brick text-[10px] dark:bg-paper-2 dark:text-brick">Deadline Passed</Badge>}
          </div>
          <h3 className="mb-2 text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-brick dark:text-paper">
            {item.content.title}
          </h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {item.deadline && (
              <span className={cn("inline-flex items-center gap-1", isUrgent ? "font-semibold text-brick" : isOverdue ? "font-semibold text-brick" : "")}>
                <CalendarClock className="h-3.5 w-3.5" />
                Apply by: {formatDate(item.deadline)}
              </span>
            )}
            {nextMs !== null && nextMs > Date.now() && (
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="h-3.5 w-3.5" />
                Next: {formatDate(item.nextUpcoming!)}
              </span>
            )}
            {item.content.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {item.content.location}
              </span>
            )}
            {item.appliedAt && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                Applied {formatDate(item.appliedAt)}
              </span>
            )}
          </div>
        </Link>
        <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
          <ApplicationTracker jobId={item.content.id} type={item.type} />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-brick"
            onClick={() => onRemove(item.id)}
            disabled={isRemoving}
            aria-label="Stop tracking"
          >
            {isRemoving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}