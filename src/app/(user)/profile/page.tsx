"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion } from "framer-motion"
import { z } from "zod"
import {
  Loader2,
  User,
  Shield,
  Bell,
  Eye,
  EyeOff,
  BadgeCheck,
  Mail,
  Phone,
  CalendarDays,
  ClipboardList,
  Bookmark,
  MessageSquare,
  Briefcase,
  ArrowRight,
  KeyRound,
  CheckCircle2,
  Lock,
  FileText,
  Upload,
  Award,
  CheckCircle,
  Circle,
  Sparkles,
  TrendingUp,
  UserCheck,
} from "lucide-react"
import { cn, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import { Badge } from "@/components/ui/badge"
import { AvatarUpload } from "@/components/profile/AvatarUpload"

const profileEditSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
})

const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type ProfileEditInput = z.infer<typeof profileEditSchema>
type PasswordChangeInput = z.infer<typeof passwordChangeSchema>

interface UserStats {
  totalBookmarks: number
  totalComments: number
  savedJobs: number
  totalApplications: number
}

interface ResumeInfo {
  fileName: string
  fileType: string
  fileSize: number
  skills: string[]
  education: string | null
  experience: string | null
  locations: string[]
  updatedAt: string
}

interface NotificationPrefs {
  jobAlerts: boolean
  resultAlerts: boolean
  admitCardAlerts: boolean
  privateJobAlerts: boolean
  admissionAlerts: boolean
  blogAlerts: boolean
  syllabusAlerts: boolean
  answerKeyAlerts: boolean
  generalAlerts: boolean
}

const PREFS_META: { key: keyof NotificationPrefs; label: string; description: string }[] = [
  { key: "jobAlerts", label: "Job Alerts", description: "Get notified about new job postings" },
  { key: "privateJobAlerts", label: "Private Job Alerts", description: "Get notified about new private company jobs" },
  { key: "resultAlerts", label: "Result Alerts", description: "Get notified when results are announced" },
  { key: "admitCardAlerts", label: "Admit Card Alerts", description: "Get notified when admit cards are released" },
  { key: "admissionAlerts", label: "Admission Alerts", description: "Get notified about new admission notifications" },
  { key: "syllabusAlerts", label: "Syllabus Alerts", description: "Get notified when new syllabi are published" },
  { key: "answerKeyAlerts", label: "Answer Key Alerts", description: "Get notified when answer keys are released" },
  { key: "blogAlerts", label: "Blog Alerts", description: "Get notified about new blog posts" },
  { key: "generalAlerts", label: "General Announcements", description: "Get notified about general site announcements" },
]

function roleLabelFor(role: string | null | undefined): string {
  if (role === "SUPER_ADMIN") return "Administrator"
  if (role === "ADMIN") return "Admin"
  return "User"
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [stats, setStats] = useState<UserStats>({
    totalBookmarks: 0,
    totalComments: 0,
    savedJobs: 0,
    totalApplications: 0,
  })
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>({
    jobAlerts: true,
    resultAlerts: true,
    admitCardAlerts: false,
    privateJobAlerts: true,
    admissionAlerts: true,
    blogAlerts: true,
    syllabusAlerts: true,
    answerKeyAlerts: true,
    generalAlerts: true,
  })
  const [prefsLoaded, setPrefsLoaded] = useState(false)
  const [accountInfo, setAccountInfo] = useState<{
    role?: string
    createdAt?: string
    emailVerified?: string | null
    password: boolean
    image: string | null
  } | null>(null)
  const [resume, setResume] = useState<ResumeInfo | null>(null)
  const [resumeLoading, setResumeLoading] = useState(true)
  const [uploadingResume, setUploadingResume] = useState(false)

  const profileForm = useForm<ProfileEditInput>({
    resolver: zodResolver(profileEditSchema),
    values: {
      name: session?.user?.name || "",
      email: session?.user?.email || "",
      phone: "",
    },
  })

  const passwordForm = useForm<PasswordChangeInput>({
    resolver: zodResolver(passwordChangeSchema),
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }
    if (status === "authenticated") {
      setIsLoading(false)
      setAvatarUrl(session?.user?.image || null)
      fetchStats()
      loadNotificationPrefs()
      fetchAccountInfo()
      fetchResume()
    }
  }, [status, router, session?.user?.image])

  async function fetchStats() {
    try {
      const res = await fetch("/api/stats")
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data) {
          setStats((prev) => ({ ...prev, ...json.data.userStats }))
        }
      }
    } catch {
    }
  }

  async function fetchAccountInfo() {
    try {
      const res = await fetch("/api/users/me")
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data) {
          setAccountInfo(json.data)
          profileForm.setValue("phone", json.data.phone || "")
        }
      }
    } catch {
    }
  }

  async function fetchResume() {
    try {
      const res = await fetch("/api/user/resume")
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data) {
          setResume(json.data)
        }
      }
    } catch {
    } finally {
      setResumeLoading(false)
    }
  }

  async function onUploadResume(file: File | undefined) {
    if (!file) return
    setUploadingResume(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/user/resume", { method: "POST", body: formData })
      const json = await res.json()
      if (!res.ok) {
        toast(json.error || "Failed to upload resume", "destructive")
        return
      }
      setResume(json.data)
      toast("Resume uploaded and analyzed", "success")
    } catch {
      toast("Failed to upload resume", "destructive")
    } finally {
      setUploadingResume(false)
    }
  }

  async function loadNotificationPrefs() {
    try {
      const res = await fetch("/api/user/notifications/preferences")
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data) {
          setNotificationPrefs({
            jobAlerts: json.data.jobAlerts,
            resultAlerts: json.data.resultAlerts,
            admitCardAlerts: json.data.admitCardAlerts,
            privateJobAlerts: json.data.privateJobAlerts,
            admissionAlerts: json.data.admissionAlerts,
            blogAlerts: json.data.blogAlerts,
            syllabusAlerts: json.data.syllabusAlerts,
            answerKeyAlerts: json.data.answerKeyAlerts,
            generalAlerts: json.data.generalAlerts,
          })
        }
      }
    } catch {
    } finally {
      setPrefsLoaded(true)
    }
  }

  async function saveNotificationPrefs() {
    try {
      const res = await fetch("/api/user/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notificationPrefs),
      })
      if (res.ok) {
        toast("Notification preferences saved", "success")
      } else {
        toast("Failed to save preferences", "destructive")
      }
    } catch {
      toast("Failed to save preferences", "destructive")
    }
  }

  async function onSaveProfile(data: ProfileEditInput) {
    setIsSaving(true)
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        toast(err.error || "Failed to update profile", "destructive")
        return
      }
      await update({ name: data.name })
      toast("Profile updated successfully", "success")
    } catch {
      toast("Failed to update profile", "destructive")
    } finally {
      setIsSaving(false)
    }
  }

  async function onChangePassword(data: PasswordChangeInput) {
    setIsChangingPassword(true)
    try {
      const res = await fetch("/api/users/me/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast(json.error || "Failed to change password", "destructive")
        return
      }
      toast("Password changed successfully", "success")
      passwordForm.reset()
    } catch {
      toast("Failed to change password", "destructive")
    } finally {
      setIsChangingPassword(false)
    }
  }

  async function onAvatarChange(url: string | null) {
    setAvatarUrl(url)
    await update({ image: url })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <Skeleton className="mb-8 h-40 rounded-xl" />
        <div className="grid gap-8 md:grid-cols-[300px_1fr]">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    )
  }

  const initials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U"

  const roleLabel = roleLabelFor(accountInfo?.role || session?.user?.role)

  const completionChecks = [
    { label: "Profile photo", done: !!avatarUrl },
    { label: "Full name", done: !!session?.user?.name && session.user.name.trim().length >= 2 },
    { label: "Phone number", done: !!profileForm.watch("phone") },
    { label: "Email verified", done: !!accountInfo?.emailVerified },
    { label: "Resume uploaded", done: !!resume },
  ]
  const completedCount = completionChecks.filter((c) => c.done).length
  const completionPct = Math.round((completedCount / completionChecks.length) * 100)

  const badges = [
    {
      label: "Verified Email",
      done: !!accountInfo?.emailVerified,
      icon: BadgeCheck,
      color: "text-emerald-600",
    },
    {
      label: "Career Tracker",
      done: stats.totalApplications >= 1,
      icon: TrendingUp,
      color: "text-teal-600",
    },
    {
      label: "Bookmarker",
      done: stats.totalBookmarks >= 1,
      icon: Bookmark,
      color: "text-amber-600",
    },
    {
      label: "Resume Ready",
      done: !!resume,
      icon: FileText,
      color: "text-sky-600",
    },
    {
      label: "Community Voice",
      done: stats.totalComments >= 1,
      icon: MessageSquare,
      color: "text-violet-600",
    },
  ]
  const unlockedBadges = badges.filter((b) => b.done).length

  const statCards = [
    {
      label: "Applications",
      value: stats.totalApplications,
      icon: ClipboardList,
      href: "/applications",
      color: "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
    },
    {
      label: "Bookmarks",
      value: stats.totalBookmarks,
      icon: Bookmark,
      href: "/bookmarks",
      color: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    },
    {
      label: "Saved Jobs",
      value: stats.savedJobs,
      icon: Briefcase,
      href: "/bookmarks",
      color: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
    },
    {
      label: "Comments",
      value: stats.totalComments,
      icon: MessageSquare,
      href: "/blog",
      color: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
    },
  ]

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="relative mb-16 overflow-hidden rounded-2xl bg-gradient-to-r from-teal-900 via-teal-700 to-emerald-600">
          <div className="absolute -left-10 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-20 right-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="relative px-6 py-10">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="flex items-end gap-5">
                <div className="relative -mb-14">
                  <Avatar className="h-28 w-28 border-4 border-white shadow-lg">
                    <AvatarImage src={avatarUrl || undefined} />
                    <AvatarFallback className="bg-teal-800 text-3xl text-white">{initials}</AvatarFallback>
                  </Avatar>
                  <AvatarUpload src={avatarUrl} name={session?.user?.name || ""} onChange={onAvatarChange} />
                </div>
                <div className="pb-1 text-white">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold">{session?.user?.name}</h1>
                    {accountInfo?.emailVerified && <BadgeCheck className="h-5 w-5 text-teal-200" />}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-teal-100">
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      {session?.user?.email}
                    </span>
                    {profileForm.watch("phone") && (
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" />
                        {profileForm.watch("phone")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Badge className="bg-white/20 px-3 py-1.5 text-white backdrop-blur hover:bg-white/30">
                <Shield className="mr-1.5 h-3.5 w-3.5" />
                {roleLabel}
              </Badge>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 md:grid-cols-[300px_1fr]">
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  {statCards.map((stat) => (
                    <Link
                      key={stat.label}
                      href={stat.href}
                      className="group rounded-xl border border-gray-100 p-4 transition-colors hover:border-teal-200 hover:bg-teal-50/50 dark:border-gray-800 dark:hover:border-teal-900 dark:hover:bg-teal-950/40"
                    >
                      <div className={cn("mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg", stat.color)}>
                        <stat.icon className="h-4.5 w-4.5" />
                      </div>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                      <p className="text-xs text-gray-500">{stat.label}</p>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Profile Strength
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-gray-900 dark:text-white">{completionPct}% complete</span>
                  <span className="text-xs text-gray-500">{completedCount}/{completionChecks.length} steps</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <motion.div
                    className={cn(
                      "h-full rounded-full bg-gradient-to-r transition-all",
                      completionPct === 100 ? "from-emerald-500 to-teal-500" : "from-amber-400 to-orange-500"
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${completionPct}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
                <div className="space-y-2 pt-1">
                  {completionChecks.map((check) => (
                    <div key={check.label} className="flex items-center gap-2 text-sm">
                      {check.done ? (
                        <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                      ) : (
                        <Circle className="h-4 w-4 shrink-0 text-gray-300 dark:text-gray-600" />
                      )}
                      <span className={cn(check.done ? "text-gray-700 dark:text-gray-300" : "text-gray-400")}>
                        {check.label}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Award className="h-4 w-4 text-amber-500" />
                  Achievements
                </CardTitle>
                <CardDescription>
                  {unlockedBadges}/{badges.length} unlocked
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {badges.map((badge) => (
                  <div
                    key={badge.label}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm",
                      badge.done
                        ? "border-amber-200 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/40"
                        : "border-gray-100 bg-gray-50/50 opacity-60 dark:border-gray-800 dark:bg-gray-900/40"
                    )}
                  >
                    <badge.icon className={cn("h-4 w-4 shrink-0", badge.done ? badge.color : "text-gray-400")} />
                    <span className={cn("font-medium", badge.done ? "text-gray-900 dark:text-white" : "text-gray-400")}>
                      {badge.label}
                    </span>
                    {badge.done && <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-emerald-500" />}
                    {!badge.done && <Lock className="ml-auto h-3.5 w-3.5 shrink-0 text-gray-300 dark:text-gray-600" />}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Account Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Account type</span>
                  <span className="font-medium text-gray-900 dark:text-white">{roleLabel}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Sign-in method</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {accountInfo?.password ? "Password" : "Google"}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Email status</span>
                  <span className="inline-flex items-center gap-1 font-medium text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Verified
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-gray-500">
                    <CalendarDays className="h-4 w-4" />
                    Member since
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {accountInfo?.createdAt
                      ? formatDate(new Date(accountInfo.createdAt), "MMM yyyy")
                      : formatDate(new Date(), "MMM yyyy")}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="mb-6 w-full justify-start overflow-x-auto">
              <TabsTrigger value="profile">
                <User className="mr-2 h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="resume">
                <FileText className="mr-2 h-4 w-4" />
                Resume
              </TabsTrigger>
              <TabsTrigger value="security">
                <Shield className="mr-2 h-4 w-4" />
                Security
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="profile-name">Full Name</Label>
                      <Input
                        id="profile-name"
                        {...profileForm.register("name")}
                        className={cn(profileForm.formState.errors.name && "border-red-500")}
                      />
                      {profileForm.formState.errors.name && (
                        <p className="text-sm font-medium text-red-500">
                          {profileForm.formState.errors.name.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profile-email">Email</Label>
                      <Input
                        id="profile-email"
                        type="email"
                        disabled
                        {...profileForm.register("email")}
                      />
                      <p className="text-xs text-gray-400">Email cannot be changed</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profile-phone">Phone Number</Label>
                      <Input
                        id="profile-phone"
                        type="tel"
                        placeholder="+91 9876543210"
                        {...profileForm.register("phone")}
                      />
                      <p className="text-xs text-gray-400">
                        Used for SMS reminders on application deadlines
                      </p>
                    </div>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="resume">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-teal-600" />
                    My Resume
                  </CardTitle>
                  <CardDescription>
                    Upload your resume and Chayan analyzes it to power job recommendations and application insights.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                    className="hidden"
                    id="resume-upload-input"
                    onChange={(e) => {
                      onUploadResume(e.target.files?.[0])
                      e.target.value = ""
                    }}
                  />
                  {resumeLoading ? (
                    <Skeleton className="h-28 rounded-lg" />
                  ) : resume ? (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-teal-200 bg-teal-50/60 p-4 dark:border-teal-900 dark:bg-teal-950/40">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-gray-900 dark:text-white">{resume.fileName}</p>
                            <p className="text-xs text-gray-500">
                              {(resume.fileSize / 1024).toFixed(1)} KB · updated{" "}
                              {formatDate(new Date(resume.updatedAt), "dd MMM yyyy")}
                            </p>
                          </div>
                        </div>
                        <label htmlFor="resume-upload-input" className="cursor-pointer">
                          <Button type="button" variant="outline" size="sm" asChild>
                            <span className="flex items-center">
                              <Upload className="mr-1.5 h-4 w-4" />
                              Replace
                            </span>
                          </Button>
                        </label>
                      </div>

                      {resume.skills.length > 0 && (
                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Extracted Skills</p>
                          <div className="flex flex-wrap gap-1.5">
                            {resume.skills.slice(0, 12).map((skill) => (
                              <Badge key={skill} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {resume.skills.length > 12 && (
                              <Badge variant="secondary" className="text-xs text-gray-400">
                                +{resume.skills.length - 12} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-lg border border-gray-100 p-3 dark:border-gray-800">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Experience</p>
                          <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                            {resume.experience || "Not detected"}
                          </p>
                        </div>
                        <div className="rounded-lg border border-gray-100 p-3 dark:border-gray-800">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Education</p>
                          <p className="mt-1 line-clamp-2 text-sm font-medium text-gray-900 dark:text-white">
                            {resume.education || "Not detected"}
                          </p>
                        </div>
                        <div className="rounded-lg border border-gray-100 p-3 dark:border-gray-800">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Locations</p>
                          <p className="mt-1 line-clamp-2 text-sm font-medium text-gray-900 dark:text-white">
                            {resume.locations.length > 0 ? resume.locations.slice(0, 4).join(", ") : "Not detected"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center rounded-xl border border-dashed border-gray-300 py-10 text-center dark:border-gray-700">
                      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-teal-600 dark:bg-teal-950">
                        <Upload className="h-6 w-6" />
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white">No resume uploaded yet</p>
                      <p className="mt-1 max-w-sm text-sm text-gray-500">
                        Upload a PDF, DOCX or TXT file (max 5MB). Your data stays private and is only used to personalize
                        your experience.
                      </p>
                      <label htmlFor="resume-upload-input" className="mt-5 cursor-pointer">
                        <Button type="button" disabled={uploadingResume} asChild>
                          <span className="flex items-center">
                            {uploadingResume ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Analyzing...
                              </>
                            ) : (
                              <>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Resume
                              </>
                            )}
                          </span>
                        </Button>
                      </label>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <KeyRound className="h-5 w-5 text-teal-600" />
                    Change Password
                  </CardTitle>
                  <CardDescription>Update your account password</CardDescription>
                </CardHeader>
                <CardContent>
                  {accountInfo && !accountInfo.password ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                      Your account uses Google sign-in and has no password set. Sign in with Google to access your
                      account.
                    </div>
                  ) : (
                    <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <div className="relative">
                          <Input
                            id="current-password"
                            type={showCurrentPassword ? "text" : "password"}
                            {...passwordForm.register("currentPassword")}
                            className={cn(
                              passwordForm.formState.errors.currentPassword && "border-red-500",
                              "pr-10"
                            )}
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {passwordForm.formState.errors.currentPassword && (
                          <p className="text-sm font-medium text-red-500">
                            {passwordForm.formState.errors.currentPassword.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <div className="relative">
                          <Input
                            id="new-password"
                            type={showNewPassword ? "text" : "password"}
                            {...passwordForm.register("newPassword")}
                            className={cn(
                              passwordForm.formState.errors.newPassword && "border-red-500",
                              "pr-10"
                            )}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {passwordForm.formState.errors.newPassword && (
                          <p className="text-sm font-medium text-red-500">
                            {passwordForm.formState.errors.newPassword.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <div className="relative">
                          <Input
                            id="confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            {...passwordForm.register("confirmPassword")}
                            className={cn(
                              passwordForm.formState.errors.confirmPassword && "border-red-500",
                              "pr-10"
                            )}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {passwordForm.formState.errors.confirmPassword && (
                          <p className="text-sm font-medium text-red-500">
                            {passwordForm.formState.errors.confirmPassword.message}
                          </p>
                        )}
                      </div>
                      <Button type="submit" disabled={isChangingPassword}>
                        {isChangingPassword ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Changing...
                          </>
                        ) : (
                          "Change Password"
                        )}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Choose what notifications you want to receive</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {PREFS_META.map((pref, index) => (
                    <div key={pref.key}>
                      {index > 0 && <Separator className="mb-6" />}
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base">{pref.label}</Label>
                          <p className="text-sm text-gray-500">{pref.description}</p>
                        </div>
                        <Switch
                          checked={notificationPrefs[pref.key]}
                          onCheckedChange={(checked) =>
                            setNotificationPrefs((prev) => ({ ...prev, [pref.key]: checked }))
                          }
                        />
                      </div>
                    </div>
                  ))}
                  <Button onClick={saveNotificationPrefs} disabled={!prefsLoaded}>
                    Save Preferences
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
    </div>
  )
}