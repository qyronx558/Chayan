"use client"

import { useRef, useState } from "react"
import { Camera, Check, Copy, Loader2, MailWarning, BadgeCheck } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/toast"
import { cn, formatDate } from "@/lib/utils"
import { initialsFor, roleLabel, type ProfileRecord } from "@/lib/profile"

interface ProfileHeaderProps {
  profile: ProfileRecord
  strengthPct: number
  onAvatarChange: (url: string | null) => Promise<void>
}

function StrengthRing({ pct }: { pct: number }) {
  const r = 26
  const c = 2 * Math.PI * r
  return (
    <div className="flex flex-col items-center gap-1" role="img" aria-label={`Profile strength ${pct} percent`}>
      <svg width="72" height="72" viewBox="0 0 72 72" className="shrink-0">
        <circle cx="36" cy="36" r={r} fill="none" strokeWidth="7" className="stroke-slate-200 dark:stroke-white/10" />
        <circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * pct) / 100}
          className="stroke-teal-700 transition-all dark:stroke-teal-500"
          transform="rotate(-90 36 36)"
        />
        <text x="36" y="36" textAnchor="middle" dominantBaseline="central" className="fill-slate-900 text-sm font-bold dark:fill-slate-50">
          {pct}%
        </text>
      </svg>
      <p className="max-w-24 text-center text-[11px] leading-tight text-slate-500 dark:text-slate-400">
        {pct === 100 ? "Complete" : "Keep going"}
      </p>
    </div>
  )
}

export function ProfileHeader({ profile, strengthPct, onAvatarChange }: ProfileHeaderProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const admin = profile.role === "ADMIN" || profile.role === "SUPER_ADMIN"
  const emailVerified = !!profile.emailVerifiedAt
  const initials = initialsFor(profile.name, profile.email)

  async function uploadFile(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast("Choose an image file (JPG, PNG, WEBP)", "destructive")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast("Image must be under 5MB", "destructive")
      return
    }
    setBusy(true)
    const prev = profile.avatarUrl
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/users/me/avatar", { method: "POST", body: fd })
      const json = await res.json()
      if (!res.ok) {
        toast(json.error || "Upload failed", "destructive")
        return
      }
      await onAvatarChange(json.url as string)
      toast("Profile photo updated", "success", prev ? { label: "Undo", onClick: () => onAvatarChange(prev) } : undefined)
    } catch {
      toast("Upload failed", "destructive")
    } finally {
      setBusy(false)
      setMenuOpen(false)
    }
  }

  async function removePhoto() {
    setBusy(true)
    const prev = profile.avatarUrl
    try {
      const res = await fetch("/api/users/me/avatar", { method: "DELETE" })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        toast((json as { error?: string }).error || "Could not remove photo", "destructive")
        return
      }
      await onAvatarChange(null)
      toast("Profile photo removed", "success", prev ? { label: "Undo", onClick: () => onAvatarChange(prev) } : undefined)
    } catch {
      toast("Could not remove photo", "destructive")
    } finally {
      setBusy(false)
      setMenuOpen(false)
    }
  }

  function copyAdminId() {
    navigator.clipboard.writeText(profile.id).then(
      () => toast("Admin ID copied", "success"),
      () => toast("Copy failed", "destructive")
    )
  }

  return (
    <section aria-label="Account header" className="rounded-xl border border-slate-200 bg-white dark:border-white/[0.06] dark:bg-[#0b1220]">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div className="relative shrink-0" id="profile-avatar">
            {profile.avatarUrl ? (
              <Avatar className="h-[72px] w-[72px] border border-slate-200 dark:border-white/10">
                <AvatarImage src={profile.avatarUrl} alt={profile.name || "Profile photo"} />
                <AvatarFallback className="bg-teal-700 text-xl font-semibold text-white">{initials}</AvatarFallback>
              </Avatar>
            ) : (
              <div className="flex h-[72px] w-[72px] flex-col items-center justify-center gap-1 rounded-full border border-dashed border-slate-300 bg-slate-50 text-slate-400 dark:border-white/15 dark:bg-white/5 dark:text-slate-500" role="img" aria-label="No profile photo">
                <Camera className="h-5 w-5" />
                <span className="text-[10px] font-medium">{initials}</span>
              </div>
            )}
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Photo options"
                  aria-haspopup="menu"
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-teal-700 text-white shadow ring-4 ring-white transition-colors hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 dark:ring-[#0b1220]"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                <DropdownMenuItem onSelect={() => fileRef.current?.click()}>
                  {profile.avatarUrl ? "Replace photo" : "Upload photo"}
                </DropdownMenuItem>
                {profile.avatarUrl ? (
                  <DropdownMenuItem onSelect={() => removePhoto()} className="text-red-600 focus:text-red-600">
                    Remove photo
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              aria-label="Choose profile photo"
              onChange={(e) => {
                uploadFile(e.target.files?.[0])
                e.target.value = ""
              }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-lg font-bold text-slate-900 dark:text-slate-50">{profile.name || "Your account"}</h1>
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                  admin
                    ? "border-teal-700/20 bg-teal-700/10 text-teal-700 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-300"
                    : "border-slate-200 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300"
                )}
              >
                {roleLabel(profile.role)}
              </span>
              {emailVerified ? (
                <Badge variant="secondary" className="gap-1 border-teal-700/20 bg-teal-700/10 text-teal-700 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-300">
                  <BadgeCheck className="h-3 w-3" />
                  Email verified
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                  <MailWarning className="h-3 w-3" />
                  Email not verified
                </Badge>
              )}
            </div>
            <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">{profile.email}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              {profile.phone ? <span className="tabular-nums">{profile.phone}</span> : <span>No phone added</span>}
              <span aria-hidden="true">·</span>
              <span>Member since {formatDate(new Date(profile.memberSince), "MMM yyyy")}</span>
            </div>
            {admin ? (
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="text-slate-500 dark:text-slate-400">Admin ID</span>
                <code className="max-w-40 truncate rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[11px] text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  {profile.id}
                </code>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={copyAdminId}>
                  <Copy className="h-3 w-3" />
                  <span className="sr-only">Copy Admin ID</span>
                  <span aria-hidden="true">Copy</span>
                </Button>
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:gap-1">
          <StrengthRing pct={strengthPct} />
          {emailVerified ? (
            <span className="hidden items-center gap-1 text-[11px] text-teal-700 sm:flex dark:text-teal-300">
              <Check className="h-3 w-3" /> Verified
            </span>
          ) : null}
        </div>
      </div>
    </section>
  )
}
