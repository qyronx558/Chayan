import { z } from "zod"

// Radix Select cannot use "" as an item value, so admin forms historically
// used " " / "none" / "__none" / "__draft" sentinels for "None"/"Draft".
// Normalize all of those (plus any whitespace-only string) to null so they
// never reach `prisma.xxx.connect({ id })` and cause P2025
// ("No 'State' record(s) … was found for a nested connect").
const emptyToNull = (v: unknown) => {
  if (v === null || v === undefined) return v
  if (typeof v !== "string") return v
  const t = v.trim()
  if (!t) return null
  const low = t.toLowerCase()
  if (low === "none" || t === "__none" || t === "__draft") return null
  return t
}

const optionalId = z.preprocess(emptyToNull, z.string().nullable().optional())
const optionalText = z.preprocess(emptyToNull, z.string().nullable().optional())
const requiredId = z.preprocess(
  (v: unknown) => (typeof v === "string" ? v.trim() : v),
  z.string().min(1, "Selection is required")
)

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters").max(200, "Password is too long"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

const jobLevelField = z.preprocess(
  (v: unknown) => (typeof v === "string" ? (v.trim() ? v.trim().toUpperCase() : undefined) : v ?? undefined),
  z.enum(["CENTRAL", "STATE", "DISTRICT"], { message: "Job level must be Central, State or District" }).optional()
)

export const jobSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  departmentId: requiredId,
  categoryId: requiredId,
  // Omitted level ⇒ derived from state/district (see resolveJobLocation).
  jobLevel: jobLevelField,
  stateId: optionalId,
  districtId: optionalId,
  // Bulk import only: district typed by name, resolved server-side within the state.
  districtName: optionalText,
  advertisementNo: z.string().nullable().optional(),
  totalVacancies: z.coerce.number().int().positive().nullable().optional(),
  salary: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  ageLimit: z.string().nullable().optional(),
  ageRelaxation: z.string().nullable().optional(),
  education: z.string().nullable().optional(),
  selectionProcess: z.string().nullable().optional(),
  applicationFee: z.string().nullable().optional(),
  importantDates: z.any().nullable().optional(),
  documentsRequired: z.string().nullable().optional(),
  howToApply: z.string().nullable().optional(),
  officialNotification: z.string().nullable().optional(),
  officialWebsite: z.string().nullable().optional(),
  applyLink: z.string().nullable().optional(),
  status: z.enum(["ACTIVE", "EXPIRED", "UPCOMING"]).default("ACTIVE"),
  experience: z.string().nullable().optional(),
  startDate: z.coerce.date().nullable().optional(),
  lastDate: z.coerce.date().nullable().optional(),
}).superRefine((v, ctx) => {
  if ((v.jobLevel === "STATE" || v.jobLevel === "DISTRICT") && !v.stateId) {
    ctx.addIssue({ code: "custom", path: ["stateId"], message: "State is required for state and district level jobs" })
  }
  if (v.jobLevel === "DISTRICT" && !v.districtId && !v.districtName) {
    ctx.addIssue({ code: "custom", path: ["districtId"], message: "District is required for district level jobs" })
  }
})

const locationName = z.string().trim().min(2, "Name is required").max(100, "Name is too long")
const locationSlug = z.preprocess(
  emptyToNull,
  z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug may only contain lowercase letters, numbers and hyphens").nullable().optional()
)

export const stateSchema = z.object({
  name: locationName,
  slug: locationSlug,
  type: z.enum(["STATE", "UNION_TERRITORY"]).default("STATE"),
})

export const districtSchema = z.object({
  name: locationName,
  slug: locationSlug,
})

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().nullable().optional(),
})

export const departmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().nullable().optional(),
})

export const resultSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().nullable().optional(),
  departmentId: requiredId,
  categoryId: requiredId,
  jobId: optionalId,
  pdfUrl: z.string().nullable().optional(),
  resultDate: z.coerce.date().nullable().optional(),
  status: optionalText,
})

export const admitCardSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().nullable().optional(),
  departmentId: requiredId,
  categoryId: requiredId,
  jobId: optionalId,
  examDate: z.coerce.date().nullable().optional(),
  downloadUrl: z.string().nullable().optional(),
  status: optionalText,
})

export const answerKeySchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().nullable().optional(),
  departmentId: requiredId,
  categoryId: requiredId,
  jobId: optionalId,
  pdfUrl: z.string().nullable().optional(),
  status: optionalText,
})

export const admissionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().nullable().optional(),
  departmentId: requiredId,
  categoryId: requiredId,
  startDate: z.coerce.date().nullable().optional(),
  lastDate: z.coerce.date().nullable().optional(),
  applicationFee: z.string().nullable().optional(),
  pdfUrl: z.string().nullable().optional(),
  status: optionalText,
})

export const syllabusSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().nullable().optional(),
  departmentId: requiredId,
  categoryId: requiredId,
  jobId: optionalId,
  pdfUrl: z.string().nullable().optional(),
  subjects: z.string().nullable().optional(),
  status: optionalText,
})

export const notificationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  content: z.string().nullable().optional(),
  categoryId: z.string().min(1, "Category is required"),
  type: z.string().nullable().optional(),
  officialUrl: z
    .union([z.string().url("Enter a valid URL (https://...)"), z.string().min(1).regex(/^\/.*/, "URL must start with https:// or /")])
    .nullable()
    .optional(),
  isTrending: z.boolean().default(false),
})

export const POST_TYPES = [
  "JOB",
  "PRIVATE_JOB",
  "RESULT",
  "ADMIT_CARD",
  "ANSWER_KEY",
  "SYLLABUS",
  "ADMISSION",
  "BLOG",
] as const

export const postTypeSchema = z.enum(POST_TYPES)

export const discussionCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(5000, "Comment is too long"),
  postType: postTypeSchema,
  postId: z.string().min(1, "postId is required"),
  parentId: z.string().nullable().optional(),
  kind: z.enum(["GENERAL", "QUESTION", "ANSWER"]).default("GENERAL"),
  imageUrl: z
    .string()
    .url()
    .max(1000)
    .refine((v) => /^https:\/\/res\.cloudinary\.com\//i.test(v), "Image must be uploaded through the comment box")
    .nullable()
    .optional(),
  captchaToken: z.string().optional(),
  captchaAnswer: z.string().optional(),
  path: z.string().max(500).optional(),
})

export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").nullable().optional(),
  image: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
})

export const roleUpdateSchema = z.object({
  role: z.enum(["USER", "ADMIN"]),
})

export type RoleUpdateInput = z.infer<typeof roleUpdateSchema>

export const reviewActionSchema = z.object({
  entity: z.enum([
    "Job",
    "PrivateJob",
    "Result",
    "AdmitCard",
    "AnswerKey",
    "Admission",
    "Syllabus",
    "Blog",
  ]),
  id: z.string().min(1, "Content id is required"),
  action: z.enum(["APPROVE", "REJECT"]),
  note: z.string().max(2000).nullable().optional(),
}).refine((d) => d.action !== "REJECT" || (d.note && d.note.trim().length > 0), {
  message: "Rejection requires a review note",
  path: ["note"],
})

export type ReviewActionInput = z.infer<typeof reviewActionSchema>

export const moderationStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED"])

export const bookmarkSchema = z.object({
  jobId: z.string().nullable().optional(),
  resultId: z.string().nullable().optional(),
  admitCardId: z.string().nullable().optional(),
  privateJobId: z.string().nullable().optional(),
  syllabusId: z.string().nullable().optional(),
})

export const applicationSchema = z.object({
  jobId: z.string().min(1, "jobId is required"),
  type: z.enum(["job", "admission"]).default("job"),
  status: z.enum(["interested", "applied", "admit_card", "exam_done", "result_out"]).default("interested"),
})

export const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  department: z.string().optional(),
  state: z.string().optional(),
  status: z.enum(["ACTIVE", "EXPIRED", "UPCOMING"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type JobInput = z.infer<typeof jobSchema>
export type StateInput = z.input<typeof stateSchema>
export type DistrictInput = z.input<typeof districtSchema>
export type CategoryInput = z.infer<typeof categorySchema>
export type DepartmentInput = z.infer<typeof departmentSchema>
export type ResultInput = z.infer<typeof resultSchema>
export type AdmitCardInput = z.infer<typeof admitCardSchema>
export type AnswerKeyInput = z.infer<typeof answerKeySchema>
export type AdmissionInput = z.infer<typeof admissionSchema>
export type SyllabusInput = z.infer<typeof syllabusSchema>
export type NotificationInput = z.infer<typeof notificationSchema>
export type CommentInput = z.infer<typeof discussionCommentSchema>
export type ProfileInput = z.infer<typeof profileSchema>
export type BookmarkInput = z.infer<typeof bookmarkSchema>
export type ApplicationInput = z.infer<typeof applicationSchema>
export const blogPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  excerpt: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  author: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  tags: z.string().nullable().optional(),
  categoryId: optionalId,
  published: z.boolean().default(false),
})

export type BlogPostInput = z.infer<typeof blogPostSchema>

export const privateJobSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    slug: z.string().min(1, "Slug is required"),
    companyId: optionalId,
    companyName: z
      .preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : typeof v === "string" ? v.trim() || undefined : v), z.string().trim().min(1, "Company name is required").optional()),
    type: z.enum(["FULL_TIME", "PART_TIME", "INTERNSHIP", "CONTRACT"]),
    category: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    salary: z.string().nullable().optional(),
    salaryMin: z.coerce.number().int().nonnegative().nullable().optional(),
    salaryMax: z.coerce.number().int().nonnegative().nullable().optional(),
    experience: z.string().nullable().optional(),
    expMin: z.coerce.number().int().min(0).max(30).nullable().optional(),
    expMax: z.coerce.number().int().min(0).max(30).nullable().optional(),
    qualification: z.string().nullable().optional(),
    skills: z.array(z.string().trim().min(1).max(60)).max(30).nullable().optional(),
    remotePolicy: z.enum(["ONSITE", "HYBRID", "REMOTE"]).nullable().optional(),
    vacancies: z.coerce.number().int().positive().nullable().optional(),
    applicationUrl: z.string().nullable().optional(),
    applicationEmail: z.string().nullable().optional(),
    lastDate: z.coerce.date().nullable().optional(),
    status: z.enum(["ACTIVE", "EXPIRED"]).default("ACTIVE"),
    isFresherFriendly: z.boolean().nullable().optional(),
    isWalkIn: z.boolean().nullable().optional(),
    walkInVenue: z.string().nullable().optional(),
    walkInDate: z.coerce.date().nullable().optional(),
    proofUrl: z.string().nullable().optional(),
  })
  .refine((data) => Boolean(data.companyId) !== Boolean(data.companyName), {
    message: "Select an existing company or enter a new company name",
    path: ["companyId"],
  })

export type PrivateJobInput = z.infer<typeof privateJobSchema>

export const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  slug: z.string().min(1, "Slug is required"),
  logo: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  size: z.string().nullable().optional(),
  hq: z.string().nullable().optional(),
  verifiedStatus: z.enum(["UNVERIFIED", "PENDING", "VERIFIED"]).optional(),
  claimEmailDomain: z.string().nullable().optional(),
})

export type CompanyInput = z.infer<typeof companySchema>

export const privateApplicationSchema = z.object({
  privateJobId: z.string().min(1, "privateJobId is required"),
  status: z.enum(["saved", "applied", "shortlisted", "interview", "offer", "joined", "rejected", "withdrawn"]).default("saved"),
  interviewAt: z.coerce.date().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
})

export type PrivateApplicationInput = z.infer<typeof privateApplicationSchema>

export const jobReferralSchema = z.object({
  title: z.string().min(4, "Job title is required").max(200),
  companyName: z.string().min(2, "Company name is required").max(120),
  url: z.string().url("Enter a valid application URL (https://...)"),
  proofUrl: z.string().url().nullable().optional().or(z.literal("")),
  location: z.string().max(120).nullable().optional(),
  note: z.string().max(1000).nullable().optional(),
})

export type JobReferralInput = z.infer<typeof jobReferralSchema>

export const jobReportSchema = z.object({
  reason: z.string().min(4, "Reason is required").max(120),
  details: z.string().max(2000).nullable().optional(),
})

export type JobReportInput = z.infer<typeof jobReportSchema>

export const companyClaimSchema = z.object({
  companyId: z.string().min(1, "companyId is required"),
  workEmail: z.string().email("Enter your work email"),
  note: z.string().max(1000).nullable().optional(),
})

export type CompanyClaimInput = z.infer<typeof companyClaimSchema>

export const companyOtpSendSchema = z.object({
  companyId: z.string().min(1).optional(),
  name: z.string().trim().min(2).max(120).optional(),
  domain: z.string().trim().min(3).max(200).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  workEmail: z.string().trim().email("Enter your work email"),
}).refine((d) => !!d.companyId || (!!d.name && !!d.domain), {
  message: "Select a company or enter new company name + domain",
  path: ["companyId"],
})

export type CompanyOtpSendInput = z.infer<typeof companyOtpSendSchema>

export const companyOtpVerifySchema = z.object({
  challengeId: z.string().min(1, "challengeId is required"),
  otp: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code"),
})

export type CompanyOtpVerifyInput = z.infer<typeof companyOtpVerifySchema>

export type SearchInput = z.infer<typeof searchSchema>

export const featuredItemTypes = [
  "JOB",
  "PRIVATE_JOB",
  "RESULT",
  "ADMIT_CARD",
  "ANSWER_KEY",
  "NOTIFICATION",
  "ADMISSION",
  "EVENT",
  "OTHER",
] as const

export const featuredCtaLabels = [
  "Apply Online",
  "View Result",
  "Download",
  "View Details",
  "Enroll Now",
  "Read More",
] as const

export const featuredItemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.enum(featuredItemTypes),
  badge: z.string().trim().optional(),
  organization: z.string().trim().optional(),
  info: z.string().trim().optional(),
  dateText: z.string().trim().optional(),
  image: z.string().trim().optional(),
  ctaLabel: z.enum(featuredCtaLabels).default("View Details"),
  ctaUrl: z.string().trim().optional(),
  linkUrl: z.string().min(1, "Link URL is required"),
  isActive: z.boolean().default(true),
  isPinned: z.boolean().default(false),
  startDate: z.coerce.date().nullable().optional(),
  endDate: z.coerce.date().nullable().optional(),
})

export type FeaturedItemInput = z.infer<typeof featuredItemSchema>
