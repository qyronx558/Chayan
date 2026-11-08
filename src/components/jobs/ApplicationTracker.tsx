"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
 Eye, Send, Ticket, PenLine, Trophy, CheckCheck, Trash2, ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
 DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
 DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type TrackerStatus = "interested" | "applied" | "admit_card" | "exam_done" | "result_out"

export const TRACKER_STATUSES: { value: TrackerStatus; label: string; short: string; icon: typeof Eye; color: string; active: string }[] = [
 { value: "interested", label: "Interested", short: "Interested", icon: Eye, color: "text-muted-foreground", active: "bg-ink text-paper" },
 { value: "applied", label: "Applied", short: "Applied", icon: Send, color: "text-muted-foreground", active: "bg-ink text-paper" },
 { value: "admit_card", label: "Admit Card", short: "Admit Card", icon: Ticket, color: "text-muted-foreground", active: "bg-ink text-paper" },
 { value: "exam_done", label: "Exam Done", short: "Exam Done", icon: PenLine, color: "text-muted-foreground", active: "bg-ink text-paper" },
 { value: "result_out", label: "Result Out", short: "Result Out", icon: Trophy, color: "text-muted-foreground", active: "bg-ink text-paper" },
]

export function statusInfo(status: TrackerStatus | null) {
 return TRACKER_STATUSES.find((s) => s.value === status) || null
}

interface ApplicationTrackerProps {
 jobId: string
 type?: "job" | "admission"
 variant?: "compact" | "full"
 className?: string
}

export function ApplicationTracker({
 jobId,
 type = "job",
 variant = "compact",
 className = "",
}: ApplicationTrackerProps) {
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

 const updateStatus = async (next: TrackerStatus) => {
  if (!session?.user) {
   router.push("/login")
   return
  }
  setLoading(true)
  try {
   const res = await fetch("/api/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobId, type, status: next }),
   })
   if (res.ok) {
    setTracked(true)
    setStatus(next)
   }
  } catch {
  } finally {
   setLoading(false)
  }
 }

 const stopTracking = async () => {
  setLoading(true)
  try {
   const res = await fetch(`/api/applications?jobId=${jobId}`, { method: "DELETE" })
   if (res.ok) {
    setTracked(false)
    setStatus(null)
   }
  } catch {
  } finally {
   setLoading(false)
  }
 }

 if (checking) {
  return <div className={cn("inline-block h-8 w-20 animate-pulse bg-paper-3", className)} />
 }

 const info = statusInfo(status)

 if (variant === "compact") {
  return (
   <DropdownMenu>
    <DropdownMenuTrigger asChild>
     <Button
      variant="outline"
      size="sm"
      disabled={loading}
      className={cn(
       "h-8 gap-1.5 border-rule px-2.5 text-[11px] font-medium text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-brick focus-visible:ring-offset-1",
       tracked && cn("border-transparent text-paper hover:text-paper", info?.active || "bg-ink"),
       className
      )}
      aria-label={tracked && info ? `Tracking: ${info.label}. Change status` : "Track this job"}
     >
      {tracked && info ? <info.icon className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      {tracked && info ? info.short : "Track"}
      <ChevronDown className="h-3 w-3 opacity-60" />
     </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" sideOffset={6} className="w-48 border-rule bg-background p-1.5">
     <DropdownMenuLabel className="agate px-2 py-1.5 text-[11px] text-muted-foreground">Application status</DropdownMenuLabel>
     <DropdownMenuSeparator className="bg-rule" />
     {TRACKER_STATUSES.map((s) => (
      <DropdownMenuItem
       key={s.value}
       onClick={() => updateStatus(s.value)}
       className={cn("gap-2 px-2 py-2 text-[13px] focus:bg-paper-2", status === s.value && "bg-paper-2 font-semibold")}
      >
       <s.icon className={cn("h-4 w-4", s.color)} aria-hidden />
       {s.label}
       {status === s.value && <CheckCheck className="ml-auto h-3.5 w-3.5 text-muted-foreground" aria-hidden />}
      </DropdownMenuItem>
     ))}
     <DropdownMenuSeparator className="bg-rule" />
     <DropdownMenuItem onClick={stopTracking} className="gap-2 px-2 py-2 text-[13px] font-medium text-brick focus:bg-paper-2">
      <Trash2 className="h-4 w-4" aria-hidden />
      Stop Tracking
     </DropdownMenuItem>
    </DropdownMenuContent>
   </DropdownMenu>
  )
 }

 return (
  <DropdownMenu>
   <DropdownMenuTrigger asChild>
    <Button
     variant="outline"
     size="sm"
     disabled={loading}
     className={cn(
      "h-8 gap-1.5 border-rule px-2.5 text-[12px] font-medium text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-brick focus-visible:ring-offset-1",
      tracked && cn("border-transparent text-paper hover:text-paper", info?.active || "bg-ink"),
      className
     )}
     aria-label={tracked && info ? `Tracking: ${info.label}. Change status` : "Track application"}
    >
     {tracked && info ? <info.icon className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
     {tracked && info ? info.label : "Track"}
     <ChevronDown className="h-3.5 w-3.5 opacity-70" />
    </Button>
   </DropdownMenuTrigger>
   <DropdownMenuContent align="end" sideOffset={6} className="w-48 border-rule bg-background p-1.5">
    <DropdownMenuLabel className="agate px-2 py-1.5 text-[11px] text-muted-foreground">Application status</DropdownMenuLabel>
    <DropdownMenuSeparator className="bg-rule" />
    {TRACKER_STATUSES.map((s) => (
     <DropdownMenuItem
      key={s.value}
      onClick={() => updateStatus(s.value)}
      className={cn("gap-2 px-2 py-2 text-[13px] focus:bg-paper-2", status === s.value && "bg-paper-2 font-semibold")}
     >
      <s.icon className={cn("h-4 w-4", s.color)} aria-hidden />
      {s.label}
      {status === s.value && <CheckCheck className="ml-auto h-3.5 w-3.5 text-muted-foreground" aria-hidden />}
     </DropdownMenuItem>
    ))}
    {tracked && (
     <>
      <DropdownMenuSeparator className="bg-rule" />
      <DropdownMenuItem onClick={stopTracking} className="gap-2 px-2 py-2 text-[13px] font-medium text-brick focus:bg-paper-2">
       <Trash2 className="h-4 w-4" aria-hidden />
       Stop Tracking
      </DropdownMenuItem>
     </>
    )}
   </DropdownMenuContent>
  </DropdownMenu>
 )
}