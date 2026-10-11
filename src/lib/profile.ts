export type ProfileRole = "USER" | "ADMIN" | "SUPER_ADMIN"

export interface ProfileRecord {
  id: string
  name: string | null
  email: string
  emailVerifiedAt: string | null
  phone: string | null
  phoneVerifiedAt: string | null
  avatarUrl: string | null
  resumeUrl: string | null
  resumeFileName: string | null
  resumeFileSize: number | null
  resumeUpdatedAt: string | null
  language: string
  qualification: string | null
  dateOfBirth: string | null
  preferredStates: string[]
  interestedCategories: string[]
  role: ProfileRole
  signInMethod: "Password" | "Google"
  memberSince: string
  passwordChangedAt: string | null
  twoFactorEnabled: boolean
  editableSections: string[]
  preferences: Record<string, boolean | string>
}

export interface ProfileStats {
  applications: number
  bookmarks: number
  savedJobs: number
  comments: number
  uploads: number
  approved: number
  pendingReview: number
}

export interface StrengthStep {
  key: string
  label: string
  done: boolean
  actionLabel?: string
  targetTab?: string
  targetAnchor?: string
}

export interface Milestone {
  key: string
  label: string
  unlocked: boolean
  unlockHint: string
}

export const PROFILE_LANGUAGES = ["English", "Hindi", "Tamil", "Telugu", "Bengali"] as const

export const PROFILE_QUALIFICATIONS = [
  "10th Pass",
  "12th Pass",
  "ITI",
  "Diploma",
  "Graduate",
  "Post Graduate",
  "Engineering",
  "Medical",
  "Law",
  "Other",
] as const

export const PROFILE_CATEGORIES = [
  "Central Govt",
  "State Govt",
  "Bank",
  "Railway",
  "Defence",
  "Teaching",
  "Police",
  "Engineering",
  "Medical",
  "SSC",
  "UPSC",
  "Court",
] as const

export const PROFILE_DIGESTS = [
  { value: "INSTANT", label: "Instant" },
  { value: "DAILY", label: "Daily at 8:00" },
  { value: "WEEKLY", label: "Weekly" },
] as const

export function isAdminRole(role: string | null | undefined): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN"
}

export function roleLabel(role: string | null | undefined): string {
  if (role === "SUPER_ADMIN") return "Super Admin"
  if (role === "ADMIN") return "Admin"
  return "Member"
}

export function initialsFor(name: string | null | undefined, email: string | null | undefined): string {
  if (name && name.trim().length > 0) {
    return name
      .trim()
      .split(/\s+/)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
  }
  if (email && email.length > 0) return email[0].toUpperCase()
  return "U"
}

export function buildStrengthSteps(profile: ProfileRecord | null, counts: { applications: number; bookmarks: number; comments: number }): StrengthStep[] {
  if (!profile) return []
  const hasName = !!profile.name && profile.name.trim().length >= 2
  const emailVerified = !!profile.emailVerifiedAt
  const phoneVerified = !!profile.phoneVerifiedAt
  const hasAvatar = !!profile.avatarUrl
  const hasResume = !!profile.resumeUrl || !!profile.resumeFileName
  const hasPrefs = profile.preferredStates.length > 0 || profile.interestedCategories.length > 0
  const steps: StrengthStep[] = [
    { key: "name", label: "Add your full name", done: hasName, actionLabel: "Edit", targetTab: "profile", targetAnchor: "profile-name" },
    { key: "email", label: "Verify your email", done: emailVerified, actionLabel: "Verify", targetTab: "profile", targetAnchor: "profile-email" },
    { key: "phone", label: "Verify your phone", done: phoneVerified, actionLabel: "Verify phone", targetTab: "profile", targetAnchor: "profile-phone" },
    { key: "avatar", label: "Upload a profile photo", done: hasAvatar, actionLabel: "Upload", targetTab: "profile", targetAnchor: "profile-avatar" },
    { key: "resume", label: "Upload your resume", done: hasResume, actionLabel: "Upload", targetTab: "resume", targetAnchor: "resume-card" },
  ]
  if (!isAdminRole(profile.role)) {
    steps.push({ key: "prefs", label: "Set job preferences", done: hasPrefs, actionLabel: "Set up", targetTab: "profile", targetAnchor: "job-preferences" })
  }
  steps.push({ key: "tracker", label: "Track one application", done: counts.applications >= 1, actionLabel: "View jobs", targetTab: "profile", targetAnchor: "profile-strength" })
  return steps
}

export function strengthFromSteps(steps: StrengthStep[]): { pct: number; done: number; total: number } {
  const total = steps.length
  const done = steps.filter((s) => s.done).length
  return { pct: total === 0 ? 0 : Math.round((done / total) * 100), done, total }
}

export function buildMilestones(profile: ProfileRecord | null, counts: { applications: number; bookmarks: number; comments: number }): Milestone[] {
  const emailDone = !!profile?.emailVerifiedAt
  const trackerDone = counts.applications >= 1
  const bookmarkerDone = counts.bookmarks >= 1
  const resumeDone = !!profile?.resumeUrl || !!profile?.resumeFileName
  const voiceDone = counts.comments >= 1
  return [
    { key: "email", label: "Verified email", unlocked: emailDone, unlockHint: "Verify your email from the Profile tab to unlock." },
    { key: "tracker", label: "Career tracker", unlocked: trackerDone, unlockHint: "Track one application from any job page to unlock." },
    { key: "bookmarker", label: "Bookmarker", unlocked: bookmarkerDone, unlockHint: "Bookmark one job to unlock." },
    { key: "resume", label: "Resume ready", unlocked: resumeDone, unlockHint: "Upload a PDF or DOCX resume under 5 MB to unlock." },
    { key: "voice", label: "Community voice", unlocked: voiceDone, unlockHint: "Post one comment to unlock." },
  ]
}

export function normalizeProfileResponse(raw: Record<string, unknown>): ProfileRecord | null {
  if (!raw || typeof raw !== "object") return null
  const get = (k: string): unknown => (raw as Record<string, unknown>)[k]
  const str = (v: unknown): string | null => (typeof v === "string" && v.length > 0 ? v : null)
  const strArr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [])
  const email = typeof get("email") === "string" ? (get("email") as string) : ""
  if (!email) return null
  const emailVerifiedAt = str(get("emailVerifiedAt")) ?? str(get("emailVerified"))
  const phoneVerifiedAt = str(get("phoneVerifiedAt"))
  const avatarUrl = str(get("avatarUrl")) ?? str(get("image"))
  const resumeUrl = str(get("resumeUrl"))
  const resume = get("resume") as Record<string, unknown> | null | undefined
  return {
    id: typeof get("id") === "string" ? (get("id") as string) : "",
    name: typeof get("name") === "string" ? (get("name") as string) : null,
    email,
    emailVerifiedAt,
    phone: typeof get("phone") === "string" ? (get("phone") as string) : null,
    phoneVerifiedAt,
    avatarUrl,
    resumeUrl: resumeUrl ?? (resume && typeof resume["url"] === "string" ? (resume["url"] as string) : null),
    resumeFileName: str(get("resumeFileName")) ?? (resume && typeof resume["fileName"] === "string" ? (resume["fileName"] as string) : null),
    resumeFileSize: typeof get("resumeFileSize") === "number" ? (get("resumeFileSize") as number) : resume && typeof resume["fileSize"] === "number" ? (resume["fileSize"] as number) : null,
    resumeUpdatedAt: str(get("resumeUpdatedAt")) ?? (resume && typeof resume["updatedAt"] === "string" ? (resume["updatedAt"] as string) : null),
    language: typeof get("language") === "string" && (get("language") as string).length > 0 ? (get("language") as string) : "English",
    qualification: typeof get("qualification") === "string" ? (get("qualification") as string) : null,
    dateOfBirth: str(get("dateOfBirth")),
    preferredStates: strArr(get("preferredStates")),
    interestedCategories: strArr(get("interestedCategories")),
    role: get("role") === "ADMIN" || get("role") === "SUPER_ADMIN" ? (get("role") as ProfileRole) : "USER",
    signInMethod: get("signInMethod") === "Google" ? "Google" : "Password",
    memberSince: typeof get("memberSince") === "string" ? (get("memberSince") as string) : typeof get("createdAt") === "string" ? (get("createdAt") as string) : new Date().toISOString(),
    passwordChangedAt: str(get("passwordChangedAt")),
    twoFactorEnabled: get("twoFactorEnabled") === true,
    editableSections: strArr(get("editableSections")),
    preferences: typeof get("preferences") === "object" && get("preferences") !== null ? (get("preferences") as Record<string, boolean | string>) : {},
  }
}
