import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export const jobSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  departmentId: z.string().min(1, "Department is required"),
  categoryId: z.string().min(1, "Category is required"),
  stateId: z.string().nullable().optional(),
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
})

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().nullable().optional(),
})

export const resultSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().nullable().optional(),
  departmentId: z.string().min(1, "Department is required"),
  categoryId: z.string().min(1, "Category is required"),
  jobId: z.string().nullable().optional(),
  pdfUrl: z.string().nullable().optional(),
  resultDate: z.coerce.date().nullable().optional(),
  status: z.string().nullable().optional(),
})

export const admitCardSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().nullable().optional(),
  departmentId: z.string().min(1, "Department is required"),
  categoryId: z.string().min(1, "Category is required"),
  jobId: z.string().nullable().optional(),
  examDate: z.coerce.date().nullable().optional(),
  downloadUrl: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
})

export const answerKeySchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().nullable().optional(),
  departmentId: z.string().min(1, "Department is required"),
  categoryId: z.string().min(1, "Category is required"),
  jobId: z.string().nullable().optional(),
  pdfUrl: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
})

export const admissionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().nullable().optional(),
  departmentId: z.string().min(1, "Department is required"),
  categoryId: z.string().min(1, "Category is required"),
  startDate: z.coerce.date().nullable().optional(),
  lastDate: z.coerce.date().nullable().optional(),
  applicationFee: z.string().nullable().optional(),
  pdfUrl: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
})

export const syllabusSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().nullable().optional(),
  departmentId: z.string().min(1, "Department is required"),
  categoryId: z.string().min(1, "Category is required"),
  jobId: z.string().nullable().optional(),
  pdfUrl: z.string().nullable().optional(),
  subjects: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
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
  imageUrl: z.string().url().nullable().optional(),
  captchaToken: z.string().optional(),
  captchaAnswer: z.string().optional(),
  path: z.string().max(500).optional(),
})

export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").nullable().optional(),
  image: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
})

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
export type CategoryInput = z.infer<typeof categorySchema>
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
  categoryId: z.string().nullable().optional(),
  published: z.boolean().default(false),
})

export type BlogPostInput = z.infer<typeof blogPostSchema>

export const privateJobSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    slug: z.string().min(1, "Slug is required"),
    companyId: z.string().optional(),
    companyName: z
      .preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), z.string().trim().min(1, "Company name is required").optional()),
    type: z.enum(["FULL_TIME", "PART_TIME", "INTERNSHIP", "CONTRACT"]),
    category: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    salary: z.string().nullable().optional(),
    experience: z.string().nullable().optional(),
    applicationUrl: z.string().nullable().optional(),
    applicationEmail: z.string().nullable().optional(),
    lastDate: z.coerce.date().nullable().optional(),
    status: z.enum(["ACTIVE", "EXPIRED", "UPCOMING"]).default("ACTIVE"),
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
})

export type CompanyInput = z.infer<typeof companySchema>

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

export const CONTENT_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const
export type ContentStatus = (typeof CONTENT_STATUSES)[number]

export const JOB_STATUSES = ["ACTIVE", "EXPIRED", "UPCOMING"] as const
export const PRIVATE_JOB_STATUSES = ["ACTIVE", "EXPIRED", "UPCOMING"] as const
