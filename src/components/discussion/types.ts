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

export type PostType = (typeof POST_TYPES)[number]

export interface DiscussionUser {
  id: string
  name: string
  image: string | null
  helpfulCount: number
}

export interface CommentDTO {
  id: string
  content: string
  imageUrl: string | null
  kind: "GENERAL" | "QUESTION" | "ANSWER"
  status: "APPROVED" | "PENDING_REVIEW" | "DELETED"
  isPinned: boolean
  isOfficial: boolean
  isBestAnswer: boolean
  upvoteCount: number
  replyCount: number
  flaggedReasons: string[]
  parentId: string | null
  editedAt: string | Date | null
  createdAt: string | Date
  user: DiscussionUser
  hasUpvoted: boolean
  isOwn: boolean
  canEdit?: boolean
  replies?: CommentDTO[]
  visibleReplyCount?: number
}

export interface ThreadMeta {
  total: number
  locked: boolean
  following: boolean
  isAdmin: boolean
  pinnedComment: CommentDTO | null
}

export type SortKey = "top" | "newest" | "controversial"

export type FilterKey = "all" | "questions" | "answers" | "announcements"
