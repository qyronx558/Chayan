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
              "h-8 gap-1.5 px-2.5 text-[11px] font-semibold shadow-sm",
              tracked
                ? cn("border-transparent text-white", info?.active || "bg-teal-600 text-white")
                : "border-gray-200 bg-white text-gray-500 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-teal-700",
              className
            )}
            aria-label="Application status"
          >
            {tracked && info ? <info.icon className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {tracked && info ? info.short : "Track"}
            <ChevronDown className="h-3 w-3 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          <DropdownMenuLabel className="text-xs text-gray-500">Application Status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {TRACKER_STATUSES.map((s) => (
            <DropdownMenuItem
              key={s.value}
              onClick={() => updateStatus(s.value)}
              className={cn("gap-2 text-sm", status === s.value && "bg-gray-50 font-semibold dark:bg-gray-800")}
            >
              <s.icon className={cn("h-4 w-4", s.color)} />
              {s.label}
              {status === s.value && <CheckCheck className="ml-auto h-3.5 w-3.5 text-gray-400" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={stopTracking} className="gap-2 text-sm text-red-600 focus:text-red-600">
            <Trash2 className="h-4 w-4" />
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
            "gap-2",
            tracked
              ? cn("border-transparent font-semibold text-white shadow-sm", info?.active || "bg-teal-600 text-white")
              : "border-white/30 bg-white/10 font-semibold text-white backdrop-blur hover:bg-white/20",
            className
          )}
        >
          {tracked && info ? <info.icon className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {tracked && info ? info.label : "Track Application"}
          <ChevronDown className="h-3.5 w-3.5 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs text-gray-500">Application Status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {TRACKER_STATUSES.map((s) => (
          <DropdownMenuItem
            key={s.value}
            onClick={() => updateStatus(s.value)}
            className={cn("gap-2 text-sm", status === s.value && "bg-gray-50 font-semibold dark:bg-gray-800")}
          >
            <s.icon className={cn("h-4 w-4", s.color)} />
            {s.label}
            {status === s.value && <CheckCheck className="ml-auto h-3.5 w-3.5 text-gray-400" />}
          </DropdownMenuItem>
        ))}
        {tracked && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={stopTracking} className="gap-2 text-sm text-red-600 focus:text-red-600">
              <Trash2 className="h-4 w-4" />
              Stop Tracking
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}