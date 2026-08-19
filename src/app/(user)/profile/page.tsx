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
  Camera,
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

export default function ProfilePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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
  const [accountInfo, setAccountInfo] = useState<{ createdAt?: string; password: boolean; image: string | null } | null>(null)

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
      fetchStats()
      loadNotificationPrefs()
      fetchAccountInfo()
    }
  }, [status, router])

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

  const roleLabel = session?.user?.role === "SUPER_ADMIN" ? "Administrator" : "Member"

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
                    <AvatarImage src={session?.user?.image || undefined} />
                    <AvatarFallback className="bg-teal-800 text-3xl text-white">{initials}</AvatarFallback>
                  </Avatar>
                  <button
                    className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-white text-teal-700 shadow-md transition-transform hover:scale-105 dark:bg-gray-900 dark:text-teal-300"
                    title="Change avatar (coming soon)"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
                <div className="pb-1 text-white">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold">{session?.user?.name}</h1>
                    <BadgeCheck className="h-5 w-5 text-teal-200" />
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

            <Card className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/60 dark:to-emerald-950/60">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Track your applications</p>
                    <p className="mt-1 text-sm text-gray-500">
                      Stay on top of deadlines, admit cards and results for every job you apply to.
                    </p>
                    <Link href="/applications">
                      <Button variant="outline" size="sm" className="mt-3 border-teal-600 text-teal-700 hover:bg-teal-600 hover:text-white dark:text-teal-300">
                        My Applications
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
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