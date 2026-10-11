"use client"

import { useState } from "react"
import { ShieldCheck } from "lucide-react"
import { DataCard } from "@/components/admin/dashboard/DataCard"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/toast"

interface TwoFactorCardProps {
  enabled: boolean
  admin: boolean
  onChanged: (next: boolean) => void
}

export function TwoFactorCard({ enabled, admin, onChanged }: TwoFactorCardProps) {
  const [busy, setBusy] = useState(false)

  async function toggle(next: boolean) {
    if (!next && admin) {
      toast("Two-factor authentication is required for admins", "destructive")
      return
    }
    setBusy(true)
    try {
      const res = await fetch("/api/users/me/two-factor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast(json.error || "Could not update two-factor", "destructive")
        return
      }
      onChanged(next)
      toast(next ? "Two-factor authentication enabled" : "Two-factor authentication disabled", "success")
    } catch {
      toast("Could not update two-factor", "destructive")
    } finally {
      setBusy(false)
    }
  }

  return (
    <DataCard
      title="Two-factor authentication"
      subtitle="Authenticator app (TOTP)"
      action={<ShieldCheck className="h-4 w-4 text-teal-700 dark:text-teal-400" aria-hidden="true" />}
    >
      {admin && !enabled ? (
        <div className="mb-3 flex flex-col gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 sm:flex-row sm:items-center">
          <p className="flex-1 text-sm font-medium text-amber-800 dark:text-amber-200">Turn on two-factor authentication</p>
          <Button size="sm" disabled={busy} onClick={() => toggle(true)}>
            Enable
          </Button>
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-3">
        <div>
          <Label htmlFor="profile-2fa">Authenticator app</Label>
          <p className="text-xs text-slate-500 dark:text-slate-400">{admin ? "Required for admins." : "Recommended for all accounts."}</p>
        </div>
        <Switch id="profile-2fa" checked={enabled} disabled={busy} onCheckedChange={(v) => toggle(v)} aria-label="Two-factor authentication" />
      </div>
    </DataCard>
  )
}
