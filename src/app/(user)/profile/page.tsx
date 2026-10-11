"use client"

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Bell, FileText, ListChecks, Shield, User } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"
import {
  buildMilestones,
  buildStrengthSteps,
  isAdminRole,
  normalizeProfileResponse,
  strengthFromSteps,
  type ProfileRecord,
  type ProfileStats,
} from "@/lib/profile"
import { profileUpdateSchema, type ProfileUpdateInput } from "@/lib/profile-schemas"
import { ProfileHeader } from "@/components/profile/ProfileHeader"
import { StatsStrip } from "@/components/profile/StatsStrip"
import { PersonalInfoForm } from "@/components/profile/PersonalInfoForm"
import { JobPreferences } from "@/components/profile/JobPreferences"
import { RoleAccessCard } from "@/components/profile/RoleAccessCard"
import { ProfileStrengthCard } from "@/components/profile/ProfileStrengthCard"
import { AccountDetailsCard } from "@/components/profile/AccountDetailsCard"
import { MilestonesCard } from "@/components/profile/MilestonesCard"
import { ResumeCard, type ResumeState } from "@/components/profile/ResumeCard"
import { PasswordForm } from "@/components/profile/PasswordForm"
import { SessionList, type SessionItem, type SignInItem } from "@/components/profile/SessionList"
import { NotificationMatrix } from "@/components/profile/NotificationMatrix"
import { UnsavedChangesBar } from "@/components/profile/UnsavedChangesBar"
import { TwoFactorCard } from "@/components/profile/TwoFactorCard"
import { DeleteAccountCard } from "@/components/profile/DeleteAccountCard"
import { ActivityList, type ActivityEvent } from "@/components/profile/ActivityList"

type TabKey = "profile" | "resume" | "security" | "notifications" | "activity"

const VALID_TABS: TabKey[] = ["profile", "resume", "security", "notifications", "activity"]

function ProfilePageInner() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const activeTab: TabKey = tabParam && (VALID_TABS as string[]).includes(tabParam) ? (tabParam as TabKey) : "profile"

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<ProfileRecord | null>(null)
  const [counts, setCounts] = useState({ applications: 0, bookmarks: 0, savedJobs: 0, comments: 0 })
  const [adminStats, setAdminStats] = useState({ uploads: 0, approved: 0, pendingReview: 0 })
  const [resume, setResume] = useState<ResumeState | null>(null)
  const [resumeLoading, setResumeLoading] = useState(true)
  const [prefs, setPrefs] = useState<Record<string, boolean | string> | null>(null)
  const [prefsLoading, setPrefsLoading] = useState(true)
  const [twoFactor, setTwoFactor] = useState(false)
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [signIns, setSignIns] = useState<SignInItem[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)

  const form = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    mode: "onChange",
    defaultValues: { name: "", language: "English", phone: "", qualification: "", dateOfBirth: "", preferredStates: [], interestedCategories: [] },
  })
  const { reset, handleSubmit, formState } = form
  const dirty = formState.isDirty
  const canSave = formState.isValid

  const admin = isAdminRole(profile?.role ?? session?.user?.role)

  const stats: ProfileStats = useMemo(
    () => ({
      applications: counts.applications,
      bookmarks: counts.bookmarks,
      savedJobs: counts.savedJobs,
      comments: counts.comments,
      uploads: adminStats.uploads,
      approved: adminStats.approved,
      pendingReview: adminStats.pendingReview,
    }),
    [counts, adminStats]
  )

  const steps = useMemo(() => buildStrengthSteps(profile, counts), [profile, counts])
  const strength = useMemo(() => strengthFromSteps(steps), [steps])
  const milestones = useMemo(() => buildMilestones(profile, counts), [profile, counts])

  function setTab(next: TabKey) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", next)
    router.replace(`/profile?${params.toString()}`, { scroll: false })
  }

  function applyProfile(p: ProfileRecord, c: { applications: number; bookmarks: number; savedJobs: number; comments: number }) {
    setProfile(p)
    setCounts(c)
    reset(
      {
        name: p.name ?? "",
        language: (p.language as ProfileUpdateInput["language"]) ?? "English",
        phone: p.phone ?? "",
        qualification: p.qualification ?? "",
        dateOfBirth: p.dateOfBirth ? p.dateOfBirth.slice(0, 10) : "",
        preferredStates: p.preferredStates ?? [],
        interestedCategories: p.interestedCategories ?? [],
      },
      { keepDirty: false }
    )
  }

  const fetchMe = useCallback(async () => {
    const res = await fetch("/api/users/me")
    const json = await res.json()
    if (!res.ok || !json.success) throw new Error(json.error || "Failed to load profile")
    const p = normalizeProfileResponse(json.data as Record<string, unknown>)
    if (!p) throw new Error("Invalid profile response")
    const c = (json.data as { counts?: { applications?: number; bookmarks?: number; savedJobs?: number; comments?: number } }).counts
    const a = (json.data as { adminStats?: { uploads?: number; approved?: number; pendingReview?: number } }).adminStats
    const nextCounts = {
      applications: c?.applications ?? 0,
      bookmarks: c?.bookmarks ?? 0,
      savedJobs: c?.savedJobs ?? 0,
      comments: c?.comments ?? 0,
    }
    if (a) setAdminStats({ uploads: a.uploads ?? 0, approved: a.approved ?? 0, pendingReview: a.pendingReview ?? 0 })
    applyProfile(p, nextCounts)
    const r = (json.data as { resume?: { fileName?: string; fileType?: string; fileSize?: number; updatedAt?: string } | null }).resume
    if (r?.fileName) {
      setResume({ fileName: r.fileName, fileType: r.fileType ?? "application/pdf", fileSize: r.fileSize ?? 0, updatedAt: (r.updatedAt as string) ?? new Date().toISOString() })
    }
    setResumeLoading(false)
    return p
  }, [reset])

  const fetchPrefs = useCallback(async () => {
    try {
      const res = await fetch("/api/user/notifications/preferences")
      const json = await res.json()
      if (res.ok && json.success) setPrefs(json.data as Record<string, boolean | string>)
    } catch { undefined } finally {
      setPrefsLoading(false)
    }
  }, [])

  const fetchTwoFactor = useCallback(async () => {
    try {
      const res = await fetch("/api/users/me/two-factor")
      const json = await res.json()
      if (res.ok && json.success) setTwoFactor((json.data as { enabled?: boolean }).enabled === true)
    } catch { undefined }
  }, [])

  const fetchSessions = useCallback(async () => {
    setSessionsLoading(true)
    try {
      const [s, a] = await Promise.all([fetch("/api/users/me/sessions"), fetch("/api/users/me/activity")])
      const sj = await s.json().catch(() => ({}))
      if (s.ok && (sj as { success?: boolean }).success) setSessions((sj as { data?: SessionItem[] }).data ?? [])
      const aj = await a.json().catch(() => ({}))
      if (a.ok && (aj as { success?: boolean }).success) {
        const d = (aj as { data?: { events?: ActivityEvent[]; signIns?: SignInItem[] } }).data
        setEvents(d?.events ?? [])
        setSignIns(d?.signIns ?? [])
      }
    } catch { undefined } finally {
      setSessionsLoading(false)
      setEventsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }
    if (status !== "authenticated") return
    let cancelled = false
    setEventsLoading(true)
    Promise.all([fetchMe().catch(() => null), fetchPrefs(), fetchTwoFactor(), fetchSessions()]).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [status, router, fetchMe, fetchPrefs, fetchTwoFactor, fetchSessions])

  useEffect(() => {
    const emailVerify = searchParams.get("emailVerify")
    const emailConfirm = searchParams.get("emailConfirm")
    if (emailVerify) {
      fetch("/api/users/me/email-verify", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: emailVerify }) })
        .then((r) => r.json())
        .then((j) => {
          if (j.success) {
            toast("Email verified", "success")
            fetchMe().catch(() => undefined)
          } else toast(j.error || "Verification failed", "destructive")
        })
        .catch(() => toast("Verification failed", "destructive"))
    }
    if (emailConfirm) {
      fetch("/api/users/me/email-change", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: emailConfirm }) })
        .then((r) => r.json())
        .then((j) => {
          if (j.success) {
            toast("Email changed", "success")
            fetchMe().catch(() => undefined)
          } else toast(j.error || "Email change failed", "destructive")
        })
        .catch(() => toast("Email change failed", "destructive"))
    }
  }, [searchParams, fetchMe])

  useEffect(() => {
    if (!dirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [dirty])

  async function onAvatarChange(url: string | null) {
    if (!profile) return
    setProfile({ ...profile, avatarUrl: url })
    await update({ image: url }).catch(() => undefined)
  }

  async function onSave(data: ProfileUpdateInput) {
    setSaving(true)
    try {
      const res = await fetch("/api/users", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
      const json = await res.json()
      if (!res.ok) {
        toast(json.error || "Failed to save changes", "destructive")
        return
      }
      await update({ name: data.name }).catch(() => undefined)
      await fetchMe().catch(() => undefined)
      toast("Changes saved", "success")
    } catch {
      toast("Failed to save changes", "destructive")
    } finally {
      setSaving(false)
    }
  }

  function onDiscard() {
    if (!profile) return
    reset(
      {
        name: profile.name ?? "",
        language: (profile.language as ProfileUpdateInput["language"]) ?? "English",
        phone: profile.phone ?? "",
        qualification: profile.qualification ?? "",
        dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.slice(0, 10) : "",
        preferredStates: profile.preferredStates ?? [],
        interestedCategories: profile.interestedCategories ?? [],
      },
      { keepDirty: false }
    )
  }

  const pendingJump = useRef<{ tab: TabKey; anchor: string } | null>(null)

  function scrollToAnchor(anchor: string): boolean {
    const el = document.getElementById(anchor)
    if (!el) return false
    el.scrollIntoView({ behavior: "smooth", block: "center" })
    const input = el.querySelector("input, select, button") as HTMLElement | null
    ;(input ?? (el as HTMLElement)).focus?.()
    return true
  }

  function onJump(step: { targetTab?: string; targetAnchor?: string }) {
    if (!step.targetAnchor) return
    if (step.targetTab && (VALID_TABS as string[]).includes(step.targetTab)) {
      const next = step.targetTab as TabKey
      if (next !== activeTab) {
        pendingJump.current = { tab: next, anchor: step.targetAnchor }
        setTab(next)
        return
      }
    }
    if (!scrollToAnchor(step.targetAnchor)) {
      pendingJump.current = { tab: activeTab, anchor: step.targetAnchor }
    }
  }

  useEffect(() => {
    const pending = pendingJump.current
    if (!pending || pending.tab !== activeTab) return
    let attempts = 0
    let raf = 0
    const tick = () => {
      attempts += 1
      if (scrollToAnchor(pending.anchor) || attempts >= 12) {
        if (attempts >= 12 && !document.getElementById(pending.anchor)) {
          toast("That section is not available for your account", "default")
        }
        pendingJump.current = null
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [activeTab])

  async function handleEmailVerify() {
    const res = await fetch("/api/users/me/email-verify", { method: "POST" })
    const json = await res.json()
    if (!res.ok) {
      toast(json.error || "Could not send verification email", "destructive")
      return
    }
    toast("Verification link sent to your email", "success")
  }

  async function handleSendPhoneCode(): Promise<{ sent: boolean; devCode: string | null }> {
    const phone = form.getValues("phone") ?? ""
    if (!phone) {
      toast("Enter your mobile number first", "destructive")
      return { sent: false, devCode: null }
    }
    const res = await fetch("/api/auth/phone-verify/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone }) })
    const json = await res.json()
    if (!res.ok) {
      toast(json.error || "Could not send code", "destructive")
      return { sent: false, devCode: null }
    }
    toast("Code sent by SMS", "success")
    return { sent: true, devCode: typeof json.devCode === "string" ? json.devCode : null }
  }

  async function handleConfirmPhoneCode(code: string): Promise<boolean> {
    const res = await fetch("/api/auth/phone-verify/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ otp: code }) })
    const json = await res.json()
    if (!res.ok) {
      toast(json.error || "Invalid code", "destructive")
      return false
    }
    toast("Phone verified", "success")
    await fetchMe().catch(() => undefined)
    return true
  }

  async function handleChangeEmail(next: string) {
    const res = await fetch("/api/users/me/email-change", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ newEmail: next }) })
    const json = await res.json()
    if (!res.ok) {
      toast(json.error || "Could not request email change", "destructive")
      return
    }
    toast(`Confirmation link sent to ${next}`, "success")
  }

  if (loading || !profile) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-6">
        <Skeleton className="h-36 rounded-xl" />
        <Skeleton className="mt-4 h-24 rounded-xl" />
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
          <Skeleton className="h-96 rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  const tabs: { key: TabKey; label: string; icon: typeof User; dot?: boolean }[] = [
    { key: "profile", label: "Profile", icon: User },
    { key: "resume", label: "Resume", icon: FileText },
    { key: "security", label: "Security", icon: Shield, dot: !twoFactor },
    { key: "notifications", label: "Notifications", icon: Bell },
    ...(admin ? [{ key: "activity" as TabKey, label: "Activity", icon: ListChecks }] : []),
  ]

  return (
    <div className="mx-auto w-full max-w-5xl min-w-0 px-4 py-6 pb-24">
      <ProfileHeader profile={profile} strengthPct={strength.pct} onAvatarChange={onAvatarChange} />
      <div className="mt-4">
        <StatsStrip admin={admin} stats={stats} />
      </div>
      <Tabs value={activeTab} onValueChange={(v) => setTab(v as TabKey)} className="mt-4 w-full">
        <TabsList className="no-scrollbar flex h-auto w-full items-center justify-start gap-1 overflow-x-auto rounded-none border-b border-slate-200 bg-transparent p-0 dark:border-white/10">
          {tabs.map((t) => (
            <TabsTrigger
              key={t.key}
              value={t.key}
              className={cn(
                "relative shrink-0 rounded-none border-b-2 border-transparent bg-transparent px-3 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 data-[state=active]:border-teal-700 data-[state=active]:bg-transparent data-[state=active]:text-teal-700 data-[state=active]:shadow-none dark:text-slate-400 dark:data-[state=active]:text-teal-300"
              )}
            >
              <span className="flex items-center gap-1.5">
                <t.icon className="h-4 w-4" aria-hidden="true" />
                {t.label}
                {t.dot ? <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-label="Action needed" /> : null}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="profile" className="mt-4">
          <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 space-y-4">
              <PersonalInfoForm
                form={form}
                email={profile.email}
                emailVerified={!!profile.emailVerifiedAt}
                phoneVerified={!!profile.phoneVerifiedAt}
                onRequestEmailVerify={handleEmailVerify}
                onSendPhoneCode={handleSendPhoneCode}
                onConfirmPhoneCode={handleConfirmPhoneCode}
                onChangeEmail={handleChangeEmail}
              />
              {!admin ? <JobPreferences form={form} /> : <RoleAccessCard role={profile.role} sections={profile.editableSections} />}
            </div>
            <div className="min-w-0 space-y-4">
              <ProfileStrengthCard pct={strength.pct} done={strength.done} total={strength.total} steps={steps} onJump={onJump} />
              <AccountDetailsCard accountType={profile.role} signInMethod={profile.signInMethod} emailVerified={!!profile.emailVerifiedAt} memberSince={profile.memberSince} />
              {!admin ? <MilestonesCard milestones={milestones} /> : null}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="resume" className="mt-4">
          <ResumeCard
            resume={resume}
            loading={resumeLoading}
            onChanged={(next) => {
              setResume(next)
              fetchMe().catch(() => undefined)
            }}
          />
        </TabsContent>
        <TabsContent value="security" className="mt-4">
          <div className="space-y-4">
            <TwoFactorCard enabled={twoFactor} admin={admin} onChanged={setTwoFactor} />
            <PasswordForm passwordChangedAt={profile.passwordChangedAt} hasPassword={profile.signInMethod === "Password"} onChanged={() => fetchMe().catch(() => undefined)} />
            <SessionList sessions={sessions} signIns={signIns} loading={sessionsLoading} onRefresh={fetchSessions} />
            <DeleteAccountCard admin={admin} />
          </div>
        </TabsContent>
        <TabsContent value="notifications" className="mt-4">
          <NotificationMatrix admin={admin} initial={prefs} loading={prefsLoading} />
        </TabsContent>
        {admin ? (
          <TabsContent value="activity" className="mt-4">
            <ActivityList events={events} loading={eventsLoading} userId={profile.id} />
          </TabsContent>
        ) : null}
      </Tabs>
      <UnsavedChangesBar visible={dirty} saving={saving} canSave={canSave} onDiscard={onDiscard} onSave={handleSubmit(onSave)} />
    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="mx-auto w-full max-w-5xl px-4 py-6"><Skeleton className="h-36 rounded-xl" /></div>}>
      <ProfilePageInner />
    </Suspense>
  )
}
