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
  { value: "interested", label: "Interested", short: "Interested", icon: Eye, color: "text-blue-600", active: "bg-blue-600 text-white" },
  { value: "applied", label: "Applied", short: "Applied", icon: Send, color: "text-cyan-600", active: "bg-cyan-600 text-white" },
  { value: "admit_card", label: "Admit Card", short: "Admit Card", icon: Ticket, color: "text-violet-600", active: "bg-violet-600 text-white" },
  { value: "exam_done", label: "Exam Done", short: "Exam Done", icon: PenLine, color: "text-amber-600", active: "bg-amber-600 text-white" },
  { value: "result_out", label: "Result Out", short: "Result Out", icon: Trophy, color: "text-emerald-600", active: "bg-emerald-600 text-white" },
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
    return <div className={cn("inline-block h-8 w-20 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800", className)} />
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
              "h-8 gap-1.5 rounded-lg border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-slate-500 shadow-sm hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1",
              tracked && cn("border-transparent text-white hover:text-white", info?.active || "bg-slate-600"),
              className
            )}
            aria-label={tracked && info ? `Tracking: ${info.label}. Change status` : "Track this job"}
          >
            {tracked && info ? <info.icon className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {tracked && info ? info.short : "Track"}
            <ChevronDown className="h-3 w-3 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={6} className="w-48 rounded-[14px] border-slate-200 bg-white p-1.5 shadow-xl">
          <DropdownMenuLabel className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Application status</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-slate-100" />
          {TRACKER_STATUSES.map((s) => (
            <DropdownMenuItem
              key={s.value}
              onClick={() => updateStatus(s.value)}
              className={cn("gap-2 rounded-lg px-2 py-2 text-[13px] focus:bg-slate-50", status === s.value && "bg-slate-50 font-semibold")}
            >
              <s.icon className={cn("h-4 w-4", s.color)} aria-hidden />
              {s.label}
              {status === s.value && <CheckCheck className="ml-auto h-3.5 w-3.5 text-slate-400" aria-hidden />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator className="bg-slate-100" />
          <DropdownMenuItem onClick={stopTracking} className="gap-2 rounded-lg px-2 py-2 text-[13px] font-medium text-red-600 focus:bg-red-50 focus:text-red-600">
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
            "h-8 gap-1.5 rounded-lg border-slate-200 bg-white px-2.5 text-[12px] font-semibold text-slate-600 shadow-sm hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1",
            tracked && cn("border-transparent text-white hover:text-white", info?.active || "bg-slate-600"),
            className
          )}
          aria-label={tracked && info ? `Tracking: ${info.label}. Change status` : "Track application"}
        >
          {tracked && info ? <info.icon className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {tracked && info ? info.label : "Track"}
          <ChevronDown className="h-3.5 w-3.5 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="w-48 rounded-[14px] border-slate-200 bg-white p-1.5 shadow-xl">
        <DropdownMenuLabel className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Application status</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-slate-100" />
        {TRACKER_STATUSES.map((s) => (
          <DropdownMenuItem
            key={s.value}
            onClick={() => updateStatus(s.value)}
            className={cn("gap-2 rounded-lg px-2 py-2 text-[13px] focus:bg-slate-50", status === s.value && "bg-slate-50 font-semibold")}
          >
            <s.icon className={cn("h-4 w-4", s.color)} aria-hidden />
            {s.label}
            {status === s.value && <CheckCheck className="ml-auto h-3.5 w-3.5 text-slate-400" aria-hidden />}
          </DropdownMenuItem>
        ))}
        {tracked && (
          <>
            <DropdownMenuSeparator className="bg-slate-100" />
            <DropdownMenuItem onClick={stopTracking} className="gap-2 rounded-lg px-2 py-2 text-[13px] font-medium text-red-600 focus:bg-red-50 focus:text-red-600">
              <Trash2 className="h-4 w-4" aria-hidden />
              Stop Tracking
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}