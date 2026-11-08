"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Bell, BellRing, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ApplicationTracker, type TrackerStatus } from "@/components/jobs/ApplicationTracker"

interface JobFollowBellProps {
 jobId: string
 className?: string
}

export function JobFollowBell({ jobId, className = "" }: JobFollowBellProps) {
 const { data: session } = useSession()
 const router = useRouter()
 const [tracked, setTracked] = useState(false)
 const [status, setStatus] = useState<TrackerStatus | null>(null)
 const [loading, setLoading] = useState(false)
 const [checking, setChecking] = useState(true)

 const refresh = useCallback(async () => {
  try {
   const res = await fetch(`/api/applications/check?jobId=${jobId}`)
   const json = await res.json()
   setTracked(!!json.tracked)
   setStatus(json.application?.status || null)
  } catch {
  } finally {
   setChecking(false)
  }
 }, [jobId])

 useEffect(() => {
  if (!session?.user) {
   setChecking(false)
   return
  }
  refresh()
 }, [session, refresh])

 const subscribe = async () => {
  if (!session?.user) {
   router.push("/login")
   return
  }
  setLoading(true)
  try {
   const res = await fetch("/api/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobId, type: "job", status: "interested" }),
   })
   if (res.ok) {
    setTracked(true)
    setStatus("interested")
   }
  } catch {
  } finally {
   setLoading(false)
  }
 }

 if (checking) {
  return <div className={cn("inline-block h-8 w-8 animate-pulse rounded-md bg-paper-3 dark:bg-ink", className)} />
 }

 if (!tracked) {
  return (
   <Button
    size="sm"
    variant="outline"
    disabled={loading}
    onClick={subscribe}
    className={cn(
     "gap-2 border-rule font-semibold text-foreground hover:border-rule hover:bg-paper-2 hover:text-brick dark:border-rule-2 dark:bg-ink dark:text-paper dark:hover:border-rule-2 dark:hover:bg-ink dark:hover:text-paper",
     className
    )}
    title="Get reminders for this job's admit card, exam and result updates"
   >
    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
    Follow Updates
   </Button>
  )
 }

 return (
  <div className={cn("flex items-center gap-2", className)}>
   <span className="hidden items-center gap-1.5 rounded-full border border-rule bg-paper-3 px-2.5 py-1 text-xs font-bold text-foreground sm:flex dark:border-rule dark:bg-paper-3 dark:text-foreground">
    <BellRing className="h-3.5 w-3.5" /> Following
   </span>
   <ApplicationTracker jobId={jobId} type="job" variant="full" />
  </div>
 )
}