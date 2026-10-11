"use client"

import { useState } from "react"
import { Loader2, MonitorSmartphone } from "lucide-react"
import { DataCard } from "@/components/admin/dashboard/DataCard"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import { formatDate } from "@/lib/utils"

export interface SessionItem {
  id: string
  device: string
  location: string
  lastActiveAt: string
  current: boolean
}

export interface SignInItem {
  id: string
  success: boolean
  device: string
  createdAt: string
}

interface SessionListProps {
  sessions: SessionItem[]
  signIns: SignInItem[]
  loading: boolean
  onRefresh: () => void
}

export function SessionList({ sessions, signIns, loading, onRefresh }: SessionListProps) {
  const [busyId, setBusyId] = useState<string | null>(null)
  const [busyAll, setBusyAll] = useState(false)

  async function signOutOne(id: string) {
    const prev = sessions
    setBusyId(id)
    try {
      const res = await fetch("/api/users/me/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        toast((json as { error?: string }).error || "Could not sign out session", "destructive")
        return
      }
      onRefresh()
      const removed = prev.find((s) => s.id === id)
      toast("Session signed out", "success", removed ? { label: "Undo", onClick: () => onRefresh() } : undefined)
    } catch {
      toast("Could not sign out session", "destructive")
    } finally {
      setBusyId(null)
    }
  }

  async function signOutOthers() {
    setBusyAll(true)
    try {
      const res = await fetch("/api/users/me/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exceptCurrent: true }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        toast((json as { error?: string }).error || "Could not sign out sessions", "destructive")
        return
      }
      onRefresh()
      toast("Other sessions signed out", "success")
    } catch {
      toast("Could not sign out sessions", "destructive")
    } finally {
      setBusyAll(false)
    }
  }

  return (
    <div className="space-y-4">
      <DataCard
        title="Active sessions"
        subtitle="Devices signed in to this account"
        action={
          sessions.length > 1 ? (
            <Button variant="outline" size="sm" disabled={busyAll} onClick={signOutOthers}>
              {busyAll ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              Sign out others
            </Button>
          ) : undefined
        }
      >
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-14 rounded-lg" />
            <Skeleton className="h-14 rounded-lg" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500 dark:text-slate-400">No other sessions.</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-white/[0.06]">
            {sessions.map((s) => (
              <li key={s.id} className="flex items-center gap-3 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-700/10 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300" aria-hidden="true">
                  <MonitorSmartphone className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-medium text-slate-900 dark:text-slate-50">{s.device}</span>
                    {s.current ? <Badge variant="secondary" className="text-[11px]">This device</Badge> : null}
                  </span>
                  <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                    {s.location} · last active {formatDate(new Date(s.lastActiveAt), "dd MMM, HH:mm")}
                  </span>
                </span>
                {!s.current ? (
                  <Button variant="ghost" size="sm" disabled={busyId === s.id} onClick={() => signOutOne(s.id)} className="shrink-0 text-xs">
                    {busyId === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Sign out"}
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </DataCard>
      <DataCard title="Recent sign-ins" subtitle="Success and failed attempts">
        {loading ? (
          <Skeleton className="h-20 rounded-lg" />
        ) : signIns.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500 dark:text-slate-400">No recent sign-in activity.</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-white/[0.06]">
            {signIns.map((s) => (
              <li key={s.id} className="flex items-center gap-2.5 py-2.5 text-sm">
                <span className={s.success ? "h-2 w-2 shrink-0 rounded-full bg-teal-600" : "h-2 w-2 shrink-0 rounded-full bg-amber-500"} aria-label={s.success ? "Success" : "Failed"} />
                <span className="min-w-0 flex-1 truncate text-slate-700 dark:text-slate-300">{s.device}</span>
                <span className="shrink-0 text-xs tabular-nums text-slate-500 dark:text-slate-400">{formatDate(new Date(s.createdAt), "dd MMM, HH:mm")}</span>
              </li>
            ))}
          </ul>
        )}
      </DataCard>
    </div>
  )
}
