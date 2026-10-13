"use client"
import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Eye, Send, UserCheck, CalendarClock, Trophy, Briefcase, XCircle, MinusCircle, ChevronDown, CheckCheck, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/toast"

export type PrivateStatus = "saved" | "applied" | "shortlisted" | "interview" | "offer" | "joined" | "rejected" | "withdrawn"

export const PRIVATE_STATUSES: { value: PrivateStatus; label: string; icon: typeof Eye; color: string; active: string }[] = [
  { value: "saved", label: "Saved", icon: Eye, color: "text-blue-600", active: "bg-blue-600" },
  { value: "applied", label: "Applied", icon: Send, color: "text-cyan-600", active: "bg-cyan-600" },
  { value: "shortlisted", label: "Shortlisted", icon: UserCheck, color: "text-violet-600", active: "bg-violet-600" },
  { value: "interview", label: "Interview", icon: CalendarClock, color: "text-amber-600", active: "bg-amber-600" },
  { value: "offer", label: "Offer", icon: Trophy, color: "text-emerald-600", active: "bg-emerald-600" },
  { value: "joined", label: "Joined", icon: Briefcase, color: "text-green-700", active: "bg-green-700" },
  { value: "rejected", label: "Rejected", icon: XCircle, color: "text-red-500", active: "bg-red-500" },
  { value: "withdrawn", label: "Withdrawn", icon: MinusCircle, color: "text-gray-500", active: "bg-gray-500" },
]

export function PrivateTracker({ privateJobId, variant = "full", className = "", onChange }: { privateJobId: string; variant?: "compact" | "full"; className?: string; onChange?: (s: PrivateStatus | null) => void }) {
  void variant
  const { data: session } = useSession()
  const router = useRouter()
  const [status, setStatus] = useState<PrivateStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/private-applications")
      if (!res.ok) return
      const json = await res.json()
      const found = (json.data || []).find((x: { job: { id: string }; status: PrivateStatus }) => x.job.id === privateJobId)
      setStatus(found?.status || null)
    } catch { /* ignore */ } finally { setChecking(false) }
  }, [privateJobId])

  useEffect(() => {
    if (!session?.user) { setChecking(false); return }
    refresh()
  }, [session, refresh])

  const update = async (next: PrivateStatus) => {
    if (!session?.user) { router.push("/login"); return }
    setLoading(true)
    try {
      const res = await fetch("/api/private-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ privateJobId, status: next }),
      })
      const json = await res.json()
      if (json.success) {
        setStatus(next)
        onChange?.(next)
        toast(`Marked as ${next}`, "success")
      } else toast(json.error || "Failed", "destructive")
    } catch { toast("Failed", "destructive") } finally { setLoading(false) }
  }

  const stop = async () => {
    setLoading(true)
    try {
      await fetch(`/api/private-applications?privateJobId=${privateJobId}`, { method: "DELETE" })
      setStatus(null)
      onChange?.(null)
    } finally { setLoading(false) }
  }

  if (checking) return <div className={cn("h-8 w-24 animate-pulse rounded-lg bg-slate-100", className)} />
  const info = PRIVATE_STATUSES.find((s) => s.value === status)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={loading} aria-label={info ? `Tracking: ${info.label}. Change status` : "Track this job"} className={cn("h-8 gap-1.5 rounded-lg border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-slate-500 shadow-sm hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-1", status && cn("border-transparent text-white hover:text-white", info?.active), className)}>
          {info ? <info.icon className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {info ? info.label : "Track"}
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="w-48 rounded-[14px] border-slate-200 bg-white p-1.5 shadow-xl">
        <DropdownMenuLabel className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Private pipeline</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-slate-100" />
        {PRIVATE_STATUSES.map((s) => (
          <DropdownMenuItem key={s.value} onClick={() => update(s.value)} className={cn("gap-2 rounded-lg px-2 py-2 text-[13px] focus:bg-slate-50", status === s.value && "bg-slate-50 font-semibold")}>
            <s.icon className={cn("h-4 w-4", s.color)} aria-hidden /> {s.label}
            {status === s.value && <CheckCheck className="ml-auto h-3.5 w-3.5 text-slate-400" aria-hidden />}
          </DropdownMenuItem>
        ))}
        {status && (<><DropdownMenuSeparator className="bg-slate-100" /><DropdownMenuItem onClick={stop} className="gap-2 rounded-lg px-2 py-2 text-[13px] font-medium text-red-600 focus:bg-red-50 focus:text-red-600"><Trash2 className="h-4 w-4" aria-hidden /> Stop tracking</DropdownMenuItem></>)}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
