"use client"

import { useEffect, useRef, useState } from "react"
import { Camera, Copy, Eye, Pencil, Trash2, X } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/toast"
import { cn, formatDate } from "@/lib/utils"
import { initialsFor, journeySentence, roleLabel, type ProfileRecord } from "@/lib/profile"
import { AvatarUpload } from "@/components/profile/AvatarUpload"
import { handFont, typeFont } from "@/components/home/fonts"
import { RubberStamp, paperShadow } from "@/components/desk/DeskKit"

interface ProfileHeaderProps {
  profile: ProfileRecord
  strengthPct: number
  onAvatarChange: (url: string | null) => Promise<void>
}

function greeting(hour: number): string {
  if (hour < 5) return "Still up"
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  if (hour < 21) return "Good evening"
  return "Good night"
}

function firstName(name: string | null, email: string): string {
  const n = name?.trim().split(/\s+/)[0]
  return n || email.split("@")[0]
}

function PaperClip() {
  return (
    <svg viewBox="0 0 24 64" className="absolute -top-5 left-6 z-10 h-16 w-6 rotate-[8deg]" fill="none" aria-hidden>
      <path
        d="M8 46 V12 a6 6 0 0 1 12 0 V50 a9 9 0 0 1 -18 0 V18"
        stroke="oklch(62% 0.01 250)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

function FillMeter({ pct }: { pct: number }) {
  const d = "M4 14 C 30 9, 52 18, 80 12 S 132 9, 156 13"
  return (
    <div className="w-full max-w-[11rem]">
      <p className={cn(handFont.className, "text-4xl leading-none text-foreground")}>
        {pct}
        <span className="text-xl">%</span>
      </p>
      <svg viewBox="0 0 160 24" className="mt-1 h-5 w-full" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Profile filled in">
        <path d={d} stroke="var(--hs-border-strong)" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path
          d={d}
          stroke="var(--hs-marigold)"
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
          pathLength={100}
          strokeDasharray="100"
          strokeDashoffset={100 - pct}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <p className={cn(typeFont.className, "mt-1 text-[11px] tracking-wider text-muted-foreground")}>OF YOUR FILE IS FILLED IN</p>
    </div>
  )
}

export function ProfileHeader({ profile, strengthPct, onAvatarChange }: ProfileHeaderProps) {
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [photoMenuOpen, setPhotoMenuOpen] = useState(false)
  const [viewerOpen, setViewerOpen] = useState(false)

  const admin = profile.role === "ADMIN" || profile.role === "SUPER_ADMIN"
  const emailVerified = !!profile.emailVerifiedAt
  const initials = initialsFor(profile.name, profile.email)
  const fileNo = profile.id.slice(-6).toUpperCase()

  async function removePhoto() {
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
      setPhotoMenuOpen(false)
    }
  }

  function copyAdminId() {
    navigator.clipboard.writeText(profile.id).then(
      () => toast("Admin ID copied", "success"),
      () => toast("Copy failed", "destructive")
    )
  }

  return (
    <>
      <section aria-label="Your file" className="relative pt-7">
        <div
          className={cn(typeFont.className, "absolute left-0 top-0 h-8 rounded-t-[8px] border border-b-0 border-[var(--hs-kraft-edge)] bg-[var(--hs-kraft-tab)] px-4 pt-1.5 text-[11px] font-bold tracking-[0.16em] text-foreground/75")}
        >
          CANDIDATE FILE · Nº {fileNo}
        </div>
        <div
          className="relative grid gap-6 rounded-[8px] rounded-tl-none border border-[var(--hs-kraft-edge)] bg-[var(--hs-kraft)] p-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:p-7 lg:grid-cols-[auto_minmax(0,1fr)_auto]"
          style={{ boxShadow: paperShadow }}
        >
          <div className="relative mx-auto w-[124px] -rotate-2 sm:mx-0" id="profile-avatar">
            <PaperClip />
            <DropdownMenu open={photoMenuOpen} onOpenChange={setPhotoMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="relative block w-full bg-[var(--hs-paper-slip)] p-[7px] pb-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brick)] focus-visible:ring-offset-2"
                  style={{ boxShadow: "0 2px 4px rgb(40 25 5 / .2)" }}
                  aria-label="Profile photo options"
                  aria-haspopup="menu"
                >
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt={profile.name || "Profile photo"} className="aspect-[4/5] w-full object-cover transition-[filter] hover:brightness-95" />
                  ) : (
                    <span className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-1 border border-dashed border-[var(--hs-border-strong)] text-muted-foreground transition-colors hover:text-foreground">
                      <Camera className="h-5 w-5" aria-hidden />
                      <span className="text-lg font-semibold">{initials}</span>
                    </span>
                  )}
                  <span className={cn(handFont.className, "absolute inset-x-0 bottom-1 text-center text-[13px] text-muted-foreground")}>
                    {profile.avatarUrl ? "tap to change" : "add a photo"}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                {profile.avatarUrl && (
                  <>
                    <DropdownMenuItem onSelect={() => setViewerOpen(true)}>
                      <Eye className="mr-2 h-3.5 w-3.5" />
                      View photo
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onSelect={() => avatarInputRef.current?.click()}>
                  <Pencil className="mr-2 h-3.5 w-3.5" />
                  {profile.avatarUrl ? "Edit & replace photo" : "Upload photo"}
                </DropdownMenuItem>
                {profile.avatarUrl && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => removePhoto()} className="text-brick focus:text-brick">
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      Remove photo
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <AvatarUpload src={profile.avatarUrl} name={profile.name ?? ""} onChange={(url) => onAvatarChange(url)} externalInputRef={avatarInputRef} />
          </div>

          <div className="min-w-0 self-center text-center sm:text-left">
            <h1 className="text-foreground">
              <span className={cn(handFont.className, "block text-lg text-muted-foreground")}>{greeting(new Date().getHours())},</span>
              <span className="block truncate text-3xl sm:text-4xl">{firstName(profile.name, profile.email)}</span>
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed text-foreground/80">
              {admin ? `Signed in as ${roleLabel(profile.role)}. Your desk and your own job search live side by side here.` : journeySentence(profile.govInterest, profile.privateInterest)}
            </p>
            <dl className={cn(typeFont.className, "mt-4 grid gap-x-6 gap-y-1 text-[12.5px] text-foreground/80 sm:grid-cols-[auto_minmax(0,1fr)]")}>
              <dt className="text-muted-foreground">EMAIL</dt>
              <dd className="truncate">{profile.email}</dd>
              <dt className="text-muted-foreground">PHONE</dt>
              <dd>{profile.phone ? <span className="tabular-nums">{profile.phone}</span> : <span className="text-muted-foreground">not added yet</span>}</dd>
              <dt className="text-muted-foreground">ON FILE SINCE</dt>
              <dd>{formatDate(new Date(profile.memberSince), "d MMM yyyy")}</dd>
              {admin ? (
                <>
                  <dt className="text-muted-foreground">ADMIN ID</dt>
                  <dd className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate">{profile.id}</span>
                    <button type="button" onClick={copyAdminId} className="shrink-0 text-muted-foreground hover:text-foreground" aria-label="Copy admin ID">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </dd>
                </>
              ) : null}
            </dl>
          </div>

          <div className="relative flex flex-col items-center justify-between gap-5 sm:col-span-2 sm:flex-row lg:col-span-1 lg:flex-col lg:items-end">
            <RubberStamp
              label={emailVerified ? "EMAIL VERIFIED" : "EMAIL NOT VERIFIED"}
              tone={emailVerified ? "oklch(50% 0.12 150)" : "oklch(58% 0.14 65)"}
              className="rotate-[-8deg]"
            />
            {admin ? <RubberStamp label={roleLabel(profile.role).toUpperCase()} tone="var(--color-brick)" className="rotate-[5deg]" /> : null}
            <FillMeter pct={strengthPct} />
          </div>
        </div>
      </section>

      {profile.avatarUrl && <PhotoViewer src={profile.avatarUrl} name={profile.name ?? ""} open={viewerOpen} onClose={() => setViewerOpen(false)} />}
    </>
  )
}

function PhotoViewer({ src, name, open, onClose }: { src: string; name: string; open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <img
          src={src}
          alt={name || "Profile photo"}
          className="max-h-[80vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
        />
        {name && (
          <p className="mt-3 text-center text-sm font-medium text-white/80">{name}</p>
        )}
      </div>
    </div>
  )
}
