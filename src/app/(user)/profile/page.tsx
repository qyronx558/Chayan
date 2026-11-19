"use client"

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Bell, Database, FileText, ListChecks, Settings, Shield, User } from "lucide-react"
import "@/app/home.css"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import {
  buildMilestones,
  buildStrengthSteps,
  isAdminRole,
  normalizeProfileResponse,
  strengthFromSteps,
  type ProfileCounts,
  type ProfileRecord,
  type ProfileStats,
} from "@/lib/profile"
import { profileUpdateSchema, type ProfileUpdateInput } from "@/lib/profile-schemas"
import { ProfileHeader } from "@/components/profile/ProfileHeader"
import { StatsStrip } from "@/components/profile/StatsStrip"
import { QuickActions } from "@/components/profile/QuickActions"
import { ProfileSidebar, ProfileMobileTabs, type SidebarItem } from "@/components/profile/ProfileSidebar"
import { PersonalInfoForm } from "@/components/profile/PersonalInfoForm"
import { CareerPaths } from "@/components/profile/CareerPaths"
import { TrackerShelf } from "@/components/profile/TrackerShelf"
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
import { DataPrivacyTab } from "@/components/profile/DataPrivacyTab"
import { SettingsTab } from "@/components/profile/SettingsTab"

const EMPTY_COUNTS: ProfileCounts = { applications: 0, privateApplications: 0, bookmarks: 0, savedJobs: 0, comments: 0 }

function toFormValues(p: ProfileRecord): ProfileUpdateInput {
  return {
    name: p.name ?? "",
    language: (p.language as ProfileUpdateInput["language"]) ?? "English",
    phone: p.phone ?? "",
    qualification: p.qualification ?? "",
    dateOfBirth: p.dateOfBirth ? p.dateOfBirth.slice(0, 10) : "",
    preferredStates: p.preferredStates,
    interestedCategories: p.interestedCategories,
    govInterest: p.govInterest,
    privateInterest: p.privateInterest,
    headline: p.headline ?? "",
    experienceYears: p.experienceYears,
    expectedSalary: p.expectedSalary,
    skills: p.skills,
    preferredCities: p.preferredCities,
    workModes: p.workModes as ProfileUpdateInput["workModes"],
    jobTypes: p.jobTypes as ProfileUpdateInput["jobTypes"],
  }
}

type TabKey = "profile" | "resume" | "security" | "notifications" | "settings" | "data" | "activity"

const VALID_TABS: TabKey[] = ["profile", "resume", "security", "notifications", "settings", "data", "activity"]

function ProfilePageInner() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const activeTab: TabKey = tabParam && (VALID_TABS as string[]).includes(tabParam) ? (tabParam as TabKey) : "profile"

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<ProfileRecord | null>(null)
  const [counts, setCounts] = useState<ProfileCounts>(EMPTY_COUNTS)
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
    defaultValues: {
      name: "",
      language: "English",
      phone: "",
      qualification: "",
      dateOfBirth: "",
      preferredStates: [],
      interestedCategories: [],
      govInterest: null,
      privateInterest: null,
      headline: "",
      experienceYears: null,
      expectedSalary: null,
      skills: [],
      preferredCities: [],
      workModes: [],
      jobTypes: [],
    },
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

  function applyProfile(p: ProfileRecord, c: ProfileCounts) {
    setProfile(p)
    setCounts(c)
    reset(toFormValues(p), { keepDirty: false })
  }

  const fetchMe = useCallback(async () => {
    const res = await fetch("/api/users/me")
    const json = await res.json()
    if (!res.ok || !json.success) throw new Error(json.error || "Failed to load profile")
    const p = normalizeProfileResponse(json.data as Record<string, unknown>)
    if (!p) throw new Error("Invalid profile response")
    const c = (json.data as { counts?: Partial<ProfileCounts> }).counts
    const a = (json.data as { adminStats?: { uploads?: number; approved?: number; pendingReview?: number } }).adminStats
    const nextCounts: ProfileCounts = {
      applications: c?.applications ?? 0,
      privateApplications: c?.privateApplications ?? 0,
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
    } catch { /* ignore */ } finally {
      setPrefsLoading(false)
    }
  }, [])

  const fetchTwoFactor = useCallback(async () => {
    try {
      const res = await fetch("/api/users/me/two-factor")
      const json = await res.json()
      if (res.ok && json.success) setTwoFactor((json.data as { enabled?: boolean }).enabled === true)
    } catch { /* ignore */ }
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
    } catch { /* ignore */ } finally {
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
    reset(toFormValues(profile), { keepDirty: false })
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

  function handlePrefsChange(key: string, value: boolean | string) {
    const next = { ...prefs, [key]: value }
    setPrefs(next)
    fetch("/api/user/notifications/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    })
      .then(async (res) => {
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          toast((json as { error?: string }).error || "Could not save preference", "destructive")
        }
      })
      .catch(() => toast("Could not save preference", "destructive"))
  }

  if (loading || !profile) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        <Skeleton className="h-36 rounded-xl" />
        <Skeleton className="mt-4 h-16 rounded-xl" />
        <div className="mt-4 grid gap-4 lg:grid-cols-[220px_1fr]">
          <Skeleton className="hidden h-64 rounded-xl lg:block" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    )
  }

  const sidebarItems: SidebarItem[] = [
    { key: "profile", label: "Profile", icon: User },
    { key: "resume", label: "Resume", icon: FileText },
    { key: "security", label: "Security", icon: Shield, dot: !twoFactor },
    { key: "notifications", label: "Notifications", icon: Bell },
    { key: "settings", label: "Settings", icon: Settings },
    { key: "data", label: "Data & Privacy", icon: Database },
    ...(admin ? [{ key: "activity" as TabKey, label: "Activity", icon: ListChecks }] : []),
  ]

  const p = profile!

  function renderContent() {
    switch (activeTab) {
      case "profile":
        return (
          <div className="min-w-0 space-y-8">
            {!admin ? <CareerPaths form={form} /> : null}
            <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
              <div className="min-w-0 space-y-6">
                <PersonalInfoForm
                  form={form}
                  email={p.email}
                  emailVerified={!!p.emailVerifiedAt}
                  phoneVerified={!!p.phoneVerifiedAt}
                  onRequestEmailVerify={handleEmailVerify}
                  onSendPhoneCode={handleSendPhoneCode}
                  onConfirmPhoneCode={handleConfirmPhoneCode}
                  onChangeEmail={handleChangeEmail}
                />
                {admin ? <RoleAccessCard role={p.role} sections={p.editableSections} /> : null}
              </div>
              <div className="min-w-0 space-y-6">
                <ProfileStrengthCard pct={strength.pct} done={strength.done} total={strength.total} steps={steps} onJump={onJump} />
                <AccountDetailsCard accountType={p.role} signInMethod={p.signInMethod} emailVerified={!!p.emailVerifiedAt} memberSince={p.memberSince} />
                {!admin ? <MilestonesCard milestones={milestones} /> : null}
              </div>
            </div>
          </div>
        )
      case "resume":
        return (
          <ResumeCard
            resume={resume}
            loading={resumeLoading}
            onChanged={(next) => {
              setResume(next)
              fetchMe().catch(() => undefined)
            }}
          />
        )
      case "security":
        return (
          <div className="space-y-4">
            <TwoFactorCard enabled={twoFactor} admin={admin} onChanged={setTwoFactor} />
            <PasswordForm passwordChangedAt={p.passwordChangedAt} hasPassword={p.signInMethod === "Password"} onChanged={() => fetchMe().catch(() => undefined)} />
            <SessionList sessions={sessions} signIns={signIns} loading={sessionsLoading} onRefresh={fetchSessions} />
            <DeleteAccountCard admin={admin} />
          </div>
        )
      case "notifications":
        return <NotificationMatrix admin={admin} initial={prefs} loading={prefsLoading} />
      case "settings":
        return (
          <SettingsTab
            prefs={prefs}
            onPrefsChange={handlePrefsChange}
          />
        )
      case "data":
        return (
          <DataPrivacyTab
            profile={p}
            stats={stats}
            prefs={prefs}
            onPrefsChange={handlePrefsChange}
          />
        )
      case "activity":
        return admin ? <ActivityList events={events} loading={eventsLoading} userId={p.id} /> : null
      default:
        return null
    }
  }

  return (
    <div className="home-saas mx-auto w-full max-w-6xl min-w-0 px-4 py-6 pb-24">
      <ProfileHeader profile={profile} strengthPct={strength.pct} onAvatarChange={onAvatarChange} />

      <div className="mt-6">
        {admin ? (
          <div className="space-y-3">
            <StatsStrip admin stats={stats} />
            <QuickActions admin counts={counts} />
          </div>
        ) : (
          <TrackerShelf counts={counts} />
        )}
      </div>

      <div className="mt-8">
        <ProfileMobileTabs items={sidebarItems} active={activeTab} onSelect={(k) => setTab(k as TabKey)} />
      </div>

      <div className="mt-4 grid min-w-0 gap-6 lg:mt-8 lg:grid-cols-[190px_minmax(0,1fr)] lg:gap-8">
        <ProfileSidebar items={sidebarItems} active={activeTab} onSelect={(k) => setTab(k as TabKey)} />
        <div className="min-w-0">{renderContent()}</div>
      </div>

      <UnsavedChangesBar visible={dirty} saving={saving} canSave={canSave} onDiscard={onDiscard} onSave={handleSubmit(onSave)} />
    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="mx-auto w-full max-w-6xl px-4 py-6"><Skeleton className="h-36 rounded-xl" /></div>}>
      <ProfilePageInner />
    </Suspense>
  )
}
