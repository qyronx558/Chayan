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
        <circle cx="36" cy="36" r={r} fill="none" strokeWidth="7" className="stroke-rule" />
        <circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * pct) / 100}
          className="stroke-brick transition-all"
          transform="rotate(-90 36 36)"
        />
        <text x="36" y="36" textAnchor="middle" dominantBaseline="central" className="fill-foreground text-sm font-bold">
          {pct}%
        </text>
      </svg>
      <p className="max-w-24 text-center text-[11px] leading-tight text-muted-foreground dark:text-muted-foreground">
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
    <section aria-label="Account header" className="rounded-xl border border-rule bg-background  ">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div className="relative shrink-0" id="profile-avatar">
            {profile.avatarUrl ? (
              <Avatar className="h-[72px] w-[72px] border border-rule ">
                <AvatarImage src={profile.avatarUrl} alt={profile.name || "Profile photo"} />
                <AvatarFallback className="bg-paper-3 text-xl font-semibold text-paper">{initials}</AvatarFallback>
              </Avatar>
            ) : (
              <div className="flex h-[72px] w-[72px] flex-col items-center justify-center gap-1 rounded-full border border-dashed border-rule bg-paper-2 text-muted-foreground  dark:bg-background/5 dark:text-muted-foreground" role="img" aria-label="No profile photo">
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
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-ink text-paper ring-4 ring-background transition-colors hover:bg-ink-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rule focus-visible:ring-offset-2"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                <DropdownMenuItem onSelect={() => fileRef.current?.click()}>
                  {profile.avatarUrl ? "Replace photo" : "Upload photo"}
                </DropdownMenuItem>
                {profile.avatarUrl ? (
                  <DropdownMenuItem onSelect={() => removePhoto()} className="text-brick focus:text-brick">
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
              <h1 className="truncate text-lg font-bold text-foreground dark:text-paper">{profile.name || "Your account"}</h1>
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                  admin
                    ? "border-rule bg-paper-3 text-brick dark:border-rule dark:bg-paper-3 dark:text-brick"
                    : "border-rule bg-paper-3 text-muted-foreground  dark:bg-background/10 dark:text-muted-foreground"
                )}
              >
                {roleLabel(profile.role)}
              </span>
              {emailVerified ? (
                <Badge variant="secondary" className="gap-1 border-rule bg-paper-3 text-brick dark:border-rule dark:bg-paper-3 dark:text-brick">
                  <BadgeCheck className="h-3 w-3" />
                  Email verified
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1 border-rule bg-paper-2 text-brick dark:text-brick">
                  <MailWarning className="h-3 w-3" />
                  Email not verified
                </Badge>
              )}
            </div>
            <p className="mt-1 truncate text-sm text-muted-foreground dark:text-muted-foreground">{profile.email}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground dark:text-muted-foreground">
              {profile.phone ? <span className="tabular-nums">{profile.phone}</span> : <span>No phone added</span>}
              <span aria-hidden="true">·</span>
              <span>Member since {formatDate(new Date(profile.memberSince), "MMM yyyy")}</span>
            </div>
            {admin ? (
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="text-muted-foreground dark:text-muted-foreground">Admin ID</span>
                <code className="max-w-40 truncate rounded border border-rule bg-paper-2 px-1.5 py-0.5 font-mono text-[11px] text-foreground  dark:bg-background/5 dark:text-muted-foreground">
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
            <span className="hidden items-center gap-1 text-[11px] text-brick sm:flex dark:text-brick">
              <Check className="h-3 w-3" /> Verified
            </span>
          ) : null}
        </div>
      </div>
    </section>
  )
}
