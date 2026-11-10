"use client"

import { useState } from "react"
import Link from "next/link"
import { Download, ExternalLink, Loader2, ShieldCheck, Unlink, Link2 } from "lucide-react"
import { DataCard } from "@/components/admin/dashboard/DataCard"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/toast"
import { cn, formatDate } from "@/lib/utils"
import type { ProfileRecord, ProfileStats } from "@/lib/profile"

interface DataPrivacyTabProps {
  profile: ProfileRecord
  stats: ProfileStats
  prefs: Record<string, boolean | string> | null
  onPrefsChange: (key: string, value: boolean | string) => void
}

interface DataRow {
  label: string
  value: string
  status: "collected" | "not-set"
}

export function DataPrivacyTab({ profile, stats, prefs, onPrefsChange }: DataPrivacyTabProps) {
  const [exporting, setExporting] = useState(false)

  const hasGoogle = profile.signInMethod === "Google"
  const hasPassword = profile.signInMethod === "Password"

  async function handleExport() {
    setExporting(true)
    try {
      const res = await fetch("/api/users/me/export")
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        toast((json as { error?: string }).error || "Export failed", "destructive")
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `profile-export-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast("Data exported successfully", "success")
    } catch {
      toast("Export failed", "destructive")
    } finally {
      setExporting(false)
    }
  }

  const dataRows: DataRow[] = [
    { label: "Full name", value: profile.name ?? "Not set", status: profile.name ? "collected" : "not-set" },
    { label: "Email", value: profile.email, status: "collected" },
    { label: "Phone", value: profile.phone ?? "Not set", status: profile.phone ? "collected" : "not-set" },
    { label: "Date of birth", value: profile.dateOfBirth ? formatDate(new Date(profile.dateOfBirth), "dd MMM yyyy") : "Not set", status: profile.dateOfBirth ? "collected" : "not-set" },
    { label: "Qualification", value: profile.qualification ?? "Not set", status: profile.qualification ? "collected" : "not-set" },
    { label: "Preferred states", value: profile.preferredStates.length > 0 ? `${profile.preferredStates.length} selected` : "Not set", status: profile.preferredStates.length > 0 ? "collected" : "not-set" },
    { label: "Interested categories", value: profile.interestedCategories.length > 0 ? `${profile.interestedCategories.length} selected` : "Not set", status: profile.interestedCategories.length > 0 ? "collected" : "not-set" },
    { label: "Resume", value: profile.resumeFileName ?? "Not uploaded", status: profile.resumeFileName ? "collected" : "not-set" },
    { label: "Profile photo", value: profile.avatarUrl ? "Uploaded" : "Not set", status: profile.avatarUrl ? "collected" : "not-set" },
  ]

  const activitySummary = [
    { label: "Applications tracked", value: stats.applications },
    { label: "Bookmarks", value: stats.bookmarks },
    { label: "Saved jobs", value: stats.savedJobs },
    { label: "Comments posted", value: stats.comments },
  ]

  return (
    <div className="space-y-4">
      <DataCard title="Connected accounts" subtitle="Manage how you sign in">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-rule p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-paper-3 dark:bg-paper-3">
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground dark:text-paper">Google</p>
                <p className="text-xs text-muted-foreground">
                  {hasGoogle ? "Connected for sign-in" : "Not connected"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasGoogle ? (
                <span className="flex items-center gap-1 text-xs font-medium text-brick dark:text-brick">
                  <Link2 className="h-3 w-3" />
                  Linked
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Unlink className="h-3 w-3" />
                  Not linked
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg border border-rule p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-paper-3 text-foreground dark:bg-paper-3 dark:text-paper">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground dark:text-paper">Password</p>
                <p className="text-xs text-muted-foreground">
                  {hasPassword ? "Password is set" : "No password set"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasPassword ? (
                <span className="flex items-center gap-1 text-xs font-medium text-brick dark:text-brick">
                  <Link2 className="h-3 w-3" />
                  Active
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Unlink className="h-3 w-3" />
                  Not set
                </span>
              )}
            </div>
          </div>
        </div>
      </DataCard>

      <DataCard title="Your data summary" subtitle="What information we store about you">
        <div className="space-y-1">
          {dataRows.map((row, i) => (
            <div key={row.label}>
              <div className="flex items-center justify-between gap-3 py-2">
                <span className="text-sm text-muted-foreground dark:text-muted-foreground">{row.label}</span>
                <span
                  className={cn(
                    "max-w-48 truncate text-right text-sm font-medium",
                    row.status === "collected" ? "text-foreground dark:text-paper" : "text-muted-foreground/60"
                  )}
                >
                  {row.value}
                </span>
              </div>
              {i < dataRows.length - 1 ? <Separator /> : null}
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-lg border border-rule bg-paper-2 p-3 dark:bg-background/5">
          <p className="text-xs font-medium text-foreground dark:text-paper">Activity on this account</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {activitySummary.map((item) => (
              <div key={item.label} className="text-xs">
                <span className="text-muted-foreground">{item.label}: </span>
                <span className="font-semibold tabular-nums text-foreground dark:text-paper">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </DataCard>

      <DataCard title="Export your data" subtitle="Download a copy of everything we store">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
            Download a JSON file containing your profile, applications, bookmarks, comments, resume details, and notification preferences.
          </p>
          <Button onClick={handleExport} disabled={exporting} variant="outline">
            {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Export all data
          </Button>
        </div>
      </DataCard>

      <DataCard title="Communication preferences" subtitle="Control how we contact you">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Label htmlFor="marketing-consent">Promotional emails</Label>
              <p className="text-xs text-muted-foreground dark:text-muted-foreground">Receive tips, job market updates, and feature announcements.</p>
            </div>
            <Switch
              id="marketing-consent"
              checked={prefs?.["marketingEmails"] === true}
              onCheckedChange={(v) => onPrefsChange("marketingEmails", v)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-3">
            <div>
              <Label htmlFor="weekly-digest-consent">Weekly digest</Label>
              <p className="text-xs text-muted-foreground dark:text-muted-foreground">A summary of new jobs and deadlines every Monday.</p>
            </div>
            <Switch
              id="weekly-digest-consent"
              checked={prefs?.["weeklyDigest"] === true}
              onCheckedChange={(v) => onPrefsChange("weeklyDigest", v)}
            />
          </div>
        </div>
      </DataCard>

      <DataCard title="Legal" subtitle="Your rights and our policies">
        <div className="flex flex-wrap gap-3">
          <Link href="/privacy" className="inline-flex items-center gap-1 text-sm font-medium text-brick underline-offset-4 hover:underline dark:text-brick">
            Privacy policy <ExternalLink className="h-3 w-3" />
          </Link>
          <Link href="/terms" className="inline-flex items-center gap-1 text-sm font-medium text-brick underline-offset-4 hover:underline dark:text-brick">
            Terms of service <ExternalLink className="h-3 w-3" />
          </Link>
          <Link href="/cookie-policy" className="inline-flex items-center gap-1 text-sm font-medium text-brick underline-offset-4 hover:underline dark:text-brick">
            Cookie policy <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </DataCard>
    </div>
  )
}
