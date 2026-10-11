"use client"

import { useEffect, useRef, useState } from "react"
import { DataCard } from "@/components/admin/dashboard/DataCard"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import { PROFILE_DIGESTS } from "@/lib/profile"

interface Prefs {
  [k: string]: boolean | string | undefined
}

interface NotificationMatrixProps {
  admin: boolean
  initial: Prefs | null
  loading: boolean
}

interface Row {
  key: string
  label: string
  hint: string
  emailKey: string
  smsKey: string
  telegramKey: string
}

const MEMBER_ROWS: Row[] = [
  { key: "jobs", label: "New jobs matching my preferences", hint: "Matched to your states and categories", emailKey: "jobAlerts", smsKey: "smsJobAlerts", telegramKey: "telegramJobAlerts" },
  { key: "results", label: "Results", hint: "Result declarations", emailKey: "resultAlerts", smsKey: "smsResultAlerts", telegramKey: "telegramResultAlerts" },
  { key: "admit", label: "Admit cards", hint: "Admit card releases", emailKey: "admitCardAlerts", smsKey: "smsAdmitCardAlerts", telegramKey: "telegramAdmitCardAlerts" },
  { key: "keys", label: "Answer keys", hint: "Answer key releases", emailKey: "answerKeyAlerts", smsKey: "smsAnswerKeyAlerts", telegramKey: "telegramAnswerKeyAlerts" },
  { key: "deadline", label: "Deadline reminders (3 days before)", hint: "Never miss a last date", emailKey: "emailDeadlineAlerts", smsKey: "smsDeadlineAlerts", telegramKey: "telegramDeadlineAlerts" },
]

const ADMIN_ROWS: Row[] = [
  { key: "review", label: "Items waiting for review", hint: "Content in your queue", emailKey: "emailReviewAlerts", smsKey: "smsReviewAlerts", telegramKey: "telegramReviewAlerts" },
  { key: "role", label: "Role and access changes", hint: "Team changes", emailKey: "emailRoleAlerts", smsKey: "smsRoleAlerts", telegramKey: "telegramRoleAlerts" },
  { key: "security", label: "Security alerts", hint: "Password, 2FA and sessions", emailKey: "emailSecurityAlerts", smsKey: "smsSecurityAlerts", telegramKey: "telegramSecurityAlerts" },
]

export function NotificationMatrix({ admin, initial, loading }: NotificationMatrixProps) {
  const [prefs, setPrefs] = useState<Prefs>({})
  const [saving, setSaving] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const first = useRef(true)

  useEffect(() => {
    if (initial) {
      setPrefs(initial)
      first.current = true
    }
  }, [initial])

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  async function persist(next: Prefs) {
    setSaving(true)
    try {
      const res = await fetch("/api/user/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        toast((json as { error?: string }).error || "Could not save preferences", "destructive")
        return
      }
      toast("Preferences saved", "success")
    } catch {
      toast("Could not save preferences", "destructive")
    } finally {
      setSaving(false)
    }
  }

  function update(key: string, value: boolean | string) {
    const next = { ...prefs, [key]: value }
    setPrefs(next)
    if (first.current) {
      first.current = false
      persist(next)
      return
    }
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => persist(next), 600)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    )
  }

  const rows = admin ? [...MEMBER_ROWS, ...ADMIN_ROWS] : MEMBER_ROWS

  return (
    <div className="space-y-4">
      <DataCard title="Alerts" subtitle={saving ? "Saving…" : "Changes save automatically"}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-105 text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
                <th scope="col" className="py-2 pr-3 font-medium">Alert</th>
                <th scope="col" className="w-16 px-2 py-2 text-center font-medium">Email</th>
                <th scope="col" className="w-16 px-2 py-2 text-center font-medium">SMS</th>
                <th scope="col" className="w-20 px-2 py-2 text-center font-medium">Telegram</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
              {rows.map((r) => (
                <tr key={r.key}>
                  <td className="py-3 pr-3">
                    <p className="font-medium text-slate-900 dark:text-slate-50">{r.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{r.hint}</p>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <Switch checked={prefs[r.emailKey] === true} onCheckedChange={(v) => update(r.emailKey, v)} aria-label={`${r.label} by email`} />
                  </td>
                  <td className="px-2 py-3 text-center">
                    <Switch checked={prefs[r.smsKey] === true} onCheckedChange={(v) => update(r.smsKey, v)} aria-label={`${r.label} by SMS`} />
                  </td>
                  <td className="px-2 py-3 text-center">
                    <Switch checked={prefs[r.telegramKey] === true} onCheckedChange={(v) => update(r.telegramKey, v)} aria-label={`${r.label} by Telegram`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataCard>
      <DataCard title="Delivery" subtitle="How and when to reach you">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="notify-digest">Email digest</Label>
            <Select value={(prefs["digestFrequency"] as string) ?? "INSTANT"} onValueChange={(v) => update("digestFrequency", v)}>
              <SelectTrigger id="notify-digest" className="sm:max-w-64">
                <SelectValue placeholder="Digest frequency" />
              </SelectTrigger>
              <SelectContent>
                {PROFILE_DIGESTS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <Label htmlFor="notify-quiet">Quiet hours</Label>
              <p className="text-xs text-slate-500 dark:text-slate-400">No SMS or push from 22:00 to 07:00.</p>
            </div>
            <Switch id="notify-quiet" checked={prefs["quietHoursEnabled"] === true} onCheckedChange={(v) => update("quietHoursEnabled", v)} aria-label="Quiet hours" />
          </div>
        </div>
      </DataCard>
    </div>
  )
}
