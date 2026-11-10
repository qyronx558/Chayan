"use client"

import { useEffect, useRef, useState } from "react"
import {
  Copy,
  Loader2,
  MailWarning,
  BadgeCheck,
  CalendarDays,
  Phone,
  Mail,
  Pencil,
  Trash2,
  ImagePlus,
  Eye,
  Upload,
  Camera,
  X,
  Check,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { toast } from "@/components/ui/toast"
import { cn, formatDate } from "@/lib/utils"
import { initialsFor, roleLabel, type ProfileRecord } from "@/lib/profile"
import { AvatarUpload } from "@/components/profile/AvatarUpload"

interface ProfileHeaderProps {
  profile: ProfileRecord
  strengthPct: number
  onAvatarChange: (url: string | null) => Promise<void>
}

/* ── Prebuilt banner gradients ── */
const PREBUILT_BANNERS = [
  { id: "default", label: "Default", css: "linear-gradient(135deg, var(--color-brick) 0%, color-mix(in oklch, var(--color-brick) 60%, var(--color-ink)) 50%, var(--color-ink) 100%)" },
  { id: "ocean", label: "Ocean", css: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 50%, #1e1b4b 100%)" },
  { id: "forest", label: "Forest", css: "linear-gradient(135deg, #22c55e 0%, #15803d 50%, #14532d 100%)" },
  { id: "sunset", label: "Sunset", css: "linear-gradient(135deg, #f97316 0%, #dc2626 50%, #7f1d1d 100%)" },
  { id: "purple", label: "Purple", css: "linear-gradient(135deg, #a855f7 0%, #7c3aed 50%, #2e1065 100%)" },
  { id: "midnight", label: "Midnight", css: "linear-gradient(135deg, #334155 0%, #1e293b 50%, #0f172a 100%)" },
  { id: "rose", label: "Rose", css: "linear-gradient(135deg, #fb7185 0%, #e11d48 50%, #4c0519 100%)" },
  { id: "amber", label: "Amber", css: "linear-gradient(135deg, #fbbf24 0%, #d97706 50%, #451a03 100%)" },
  { id: "teal", label: "Teal", css: "linear-gradient(135deg, #2dd4bf 0%, #0d9488 50%, #042f2e 100%)" },
]

const BANNER_KEY = "profile:bannerType"
const BANNER_URL_KEY = "profile:bannerUrl"

function getBannerState(): { type: "prebuilt"; id: string } | { type: "custom"; url: string } {
  try {
    const t = localStorage.getItem(BANNER_KEY)
    if (t === "custom") {
      const url = localStorage.getItem(BANNER_URL_KEY)
      if (url) return { type: "custom", url }
    }
    if (t && PREBUILT_BANNERS.find((b) => b.id === t)) return { type: "prebuilt", id: t }
  } catch { /* silent */ }
  return { type: "prebuilt", id: "default" }
}

function saveBanner(state: { type: "prebuilt"; id: string } | { type: "custom"; url: string }) {
  try {
    if (state.type === "prebuilt") {
      localStorage.setItem(BANNER_KEY, state.id)
      localStorage.removeItem(BANNER_URL_KEY)
    } else {
      localStorage.setItem(BANNER_KEY, "custom")
      localStorage.setItem(BANNER_URL_KEY, state.url)
    }
  } catch { /* silent */ }
}

/* ── Strength ring SVG ── */
function AvatarStrengthRing({ pct, size }: { pct: number; size: number }) {
  const sw = 4
  const r = (size - sw) / 2
  const c = 2 * Math.PI * r
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 -rotate-90" aria-label={`Profile strength ${pct}%`} role="img">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={sw} className="stroke-rule/40 dark:stroke-rule/20" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={sw} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100} className="stroke-brick transition-all duration-700" />
    </svg>
  )
}

/* ── Photo lightbox (Instagram-style) ── */
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

/* ── Banner picker dialog ── */
function BannerPicker({
  open,
  onClose,
  current,
  onSelect,
}: {
  open: boolean
  onClose: () => void
  current: ReturnType<typeof getBannerState>
  onSelect: (state: ReturnType<typeof getBannerState>) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function uploadBanner(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast("Choose an image file (JPG, PNG, WEBP)", "destructive")
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      toast("Image must be under 8MB", "destructive")
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/users/me/banner", { method: "POST", body: fd })
      const json = await res.json()
      if (!res.ok) {
        toast((json as { error?: string }).error || "Upload failed", "destructive")
        return
      }
      const url = (json as { url: string }).url
      const state = { type: "custom" as const, url }
      saveBanner(state)
      onSelect(state)
      toast("Banner updated", "success")
      onClose()
    } catch {
      toast("Upload failed", "destructive")
    } finally {
      setUploading(false)
    }
  }

  function selectPrebuilt(id: string) {
    const state = { type: "prebuilt" as const, id }
    saveBanner(state)
    onSelect(state)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-lg">
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-bold text-foreground dark:text-paper">Change banner</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">Choose a preset gradient or upload your own image.</p>
          </div>

          {/* Upload option */}
          <div
            onClick={() => fileRef.current?.click()}
            className={cn(
              "group flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-rule p-4 transition-colors hover:border-brick/50 hover:bg-paper-2/50",
              uploading && "pointer-events-none opacity-60"
            )}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-paper-3 text-muted-foreground transition-colors group-hover:text-brick dark:bg-background/10">
              {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground dark:text-paper">Upload from your device</p>
              <p className="text-xs text-muted-foreground">JPG, PNG or WEBP — max 8MB, recommended 1200×300</p>
            </div>
            {current.type === "custom" && (
              <Check className="ml-auto h-4 w-4 shrink-0 text-brick" />
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { uploadBanner(e.target.files?.[0]); e.target.value = "" }} />

          {/* Prebuilt gradients */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Prebuilt gradients</p>
            <div className="grid grid-cols-3 gap-2">
              {PREBUILT_BANNERS.map((b) => {
                const active = current.type === "prebuilt" && current.id === b.id
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => selectPrebuilt(b.id)}
                    className={cn(
                      "group relative h-16 overflow-hidden rounded-lg border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brick",
                      active ? "border-brick ring-1 ring-brick" : "border-transparent hover:border-rule"
                    )}
                  >
                    <div className="absolute inset-0" style={{ background: b.css }} />
                    <span className="absolute inset-x-0 bottom-0 bg-black/40 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                      {b.label}
                    </span>
                    {active && (
                      <div className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brick text-white">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Custom preview */}
          {current.type === "custom" && (
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">Current custom banner</p>
              <div className="relative h-16 overflow-hidden rounded-lg border border-rule">
                <img src={current.url} alt="Current banner" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    const state = { type: "prebuilt" as const, id: "default" }
                    saveBanner(state)
                    onSelect(state)
                  }}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
                  title="Remove custom banner"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ── Main ProfileHeader ── */
export function ProfileHeader({ profile, strengthPct, onAvatarChange }: ProfileHeaderProps) {
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [photoMenuOpen, setPhotoMenuOpen] = useState(false)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [bannerPickerOpen, setBannerPickerOpen] = useState(false)
  const [bannerState, setBannerState] = useState<ReturnType<typeof getBannerState>>({ type: "prebuilt", id: "default" })

  const admin = profile.role === "ADMIN" || profile.role === "SUPER_ADMIN"
  const emailVerified = !!profile.emailVerifiedAt
  const initials = initialsFor(profile.name, profile.email)

  useEffect(() => {
    setBannerState(getBannerState())
  }, [])

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
      setPhotoMenuOpen(false)
    }
  }

  function copyAdminId() {
    navigator.clipboard.writeText(profile.id).then(
      () => toast("Admin ID copied", "success"),
      () => toast("Copy failed", "destructive")
    )
  }

  const bannerBg =
    bannerState.type === "custom"
      ? undefined
      : (PREBUILT_BANNERS.find((b) => b.id === bannerState.id) ?? PREBUILT_BANNERS[0]).css

  const AVATAR_OUTER = 128
  const AVATAR_INNER = 112

  return (
    <>
      <section aria-label="Account header" className="overflow-hidden rounded-xl border border-rule bg-background">
        {/* ── Banner ── */}
        <div className="group/banner relative h-28 overflow-hidden sm:h-36">
          {bannerState.type === "custom" ? (
            <img src={bannerState.url} alt="Profile banner" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <>
              <div className="absolute inset-0" style={{ background: bannerBg }} />
              <div
                className="absolute inset-0 opacity-[0.06]"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px), radial-gradient(circle at 60% 80%, white 1px, transparent 1px)",
                  backgroundSize: "60px 60px, 80px 80px, 70px 70px",
                }}
              />
            </>
          )}

          {/* Banner edit button (shown on hover) */}
          <button
            type="button"
            onClick={() => setBannerPickerOpen(true)}
            className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-xs font-medium text-white opacity-0 backdrop-blur-sm transition-all hover:bg-black/60 group-hover/banner:opacity-100 focus-visible:opacity-100"
          >
            <ImagePlus className="h-3.5 w-3.5" />
            Edit banner
          </button>

          {/* Strength badge on banner */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/30 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
            <svg width="14" height="14" viewBox="0 0 14 14" className="-rotate-90">
              <circle cx="7" cy="7" r="5" fill="none" strokeWidth="2" className="stroke-white/30" />
              <circle
                cx="7"
                cy="7"
                r="5"
                fill="none"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 5}
                strokeDashoffset={2 * Math.PI * 5 - (2 * Math.PI * 5 * strengthPct) / 100}
                className="stroke-white"
              />
            </svg>
            {strengthPct}% complete
          </div>
        </div>

        {/* ── Avatar + Info ── */}
        <div className="relative px-4 pb-5 sm:px-6">
          <div className="relative -mt-16 mb-3 flex items-end gap-4 sm:gap-5">
            {/* Avatar container */}
            <div className="relative shrink-0" id="profile-avatar" style={{ width: AVATAR_OUTER, height: AVATAR_OUTER }}>
              <AvatarStrengthRing pct={strengthPct} size={AVATAR_OUTER} />

              {/* Clickable avatar */}
              <DropdownMenu open={photoMenuOpen} onOpenChange={setPhotoMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="absolute rounded-full bg-background p-[6px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brick focus-visible:ring-offset-2"
                    style={{
                      top: (AVATAR_OUTER - AVATAR_INNER - 4) / 2,
                      left: (AVATAR_OUTER - AVATAR_INNER - 4) / 2,
                      width: AVATAR_INNER + 4,
                      height: AVATAR_INNER + 4,
                    }}
                    aria-label="Profile photo options"
                    aria-haspopup="menu"
                  >
                    {profile.avatarUrl ? (
                      <Avatar className="h-full w-full border-2 border-background shadow-lg transition-all hover:brightness-90">
                        <AvatarImage src={profile.avatarUrl} alt={profile.name || "Profile photo"} className="object-cover" />
                        <AvatarFallback className="bg-paper-3 text-2xl font-bold text-paper">{initials}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 rounded-full border-2 border-dashed border-rule bg-paper-2 text-muted-foreground shadow-lg transition-colors hover:border-brick/50 hover:bg-paper-2/80 dark:bg-background/5">
                        <Camera className="h-6 w-6" />
                        <span className="text-xs font-semibold">{initials}</span>
                      </div>
                    )}

                    {/* Hover overlay */}
                    <div className="pointer-events-none absolute inset-[6px] flex items-center justify-center rounded-full bg-black/0 transition-all group-hover:bg-black/20">
                      {/* subtle cue */}
                    </div>
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

              {/* AvatarUpload editor — hidden trigger, modal appears on file select */}
              <AvatarUpload
                src={profile.avatarUrl}
                name={profile.name ?? ""}
                onChange={(url) => onAvatarChange(url)}
                externalInputRef={avatarInputRef}
              />
            </div>

            {/* Name + badges — desktop (inline with avatar) */}
            <div className="hidden min-w-0 flex-1 pb-1 sm:block">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-xl font-bold text-foreground dark:text-paper">{profile.name || "Your account"}</h1>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                    admin
                      ? "border-brick/30 bg-brick/10 text-brick dark:border-brick/40 dark:bg-brick/15 dark:text-brick"
                      : "border-rule bg-paper-3 text-muted-foreground dark:bg-background/10 dark:text-muted-foreground"
                  )}
                >
                  {roleLabel(profile.role)}
                </span>
                {emailVerified ? (
                  <Badge variant="secondary" className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
                    <BadgeCheck className="h-3 w-3" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1 border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
                    <MailWarning className="h-3 w-3" />
                    Unverified
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Name + badges — mobile (below avatar) */}
          <div className="mb-3 sm:hidden">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-bold text-foreground dark:text-paper">{profile.name || "Your account"}</h1>
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                  admin ? "border-brick/30 bg-brick/10 text-brick" : "border-rule bg-paper-3 text-muted-foreground"
                )}
              >
                {roleLabel(profile.role)}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {emailVerified ? (
                <Badge variant="secondary" className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
                  <BadgeCheck className="h-3 w-3" />
                  Verified
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1 border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
                  <MailWarning className="h-3 w-3" />
                  Unverified
                </Badge>
              )}
            </div>
          </div>

          {/* Meta info row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{profile.email}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              {profile.phone ? (
                <span className="tabular-nums">{profile.phone}</span>
              ) : (
                <span className="italic text-muted-foreground/60">No phone added</span>
              )}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" />
              Member since {formatDate(new Date(profile.memberSince), "MMM yyyy")}
            </span>
          </div>

          {/* Admin ID */}
          {admin && (
            <div className="mt-2.5 flex items-center gap-2 text-xs">
              <span className="font-medium text-muted-foreground">Admin ID</span>
              <code className="max-w-48 truncate rounded-md border border-rule bg-paper-2 px-2 py-0.5 font-mono text-[11px] text-foreground dark:bg-background/5 dark:text-muted-foreground">
                {profile.id}
              </code>
              <Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs text-muted-foreground hover:text-brick" onClick={copyAdminId}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Photo viewer lightbox */}
      {profile.avatarUrl && (
        <PhotoViewer src={profile.avatarUrl} name={profile.name ?? ""} open={viewerOpen} onClose={() => setViewerOpen(false)} />
      )}

      {/* Banner picker dialog */}
      <BannerPicker
        open={bannerPickerOpen}
        onClose={() => setBannerPickerOpen(false)}
        current={bannerState}
        onSelect={setBannerState}
      />
    </>
  )
}
