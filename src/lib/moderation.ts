import { prisma } from "@/lib/prisma"
import { revalidatePublicContent } from "@/lib/cache"

export const MODERATION_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const
export type ModerationStatus = (typeof MODERATION_STATUSES)[number]

export const REVIEWABLE_ENTITIES = [
  "Job",
  "PrivateJob",
  "Result",
  "AdmitCard",
  "AnswerKey",
  "Admission",
  "Syllabus",
  "Blog",
] as const
export type ReviewableEntity = (typeof REVIEWABLE_ENTITIES)[number]

// Prisma delegate key + public revalidate key per entity
type RevalidateKind =
  | "job"
  | "private-job"
  | "result"
  | "admit-card"
  | "admission"
  | "answer-key"
  | "syllabus"
  | "blog"

export const REVIEWABLE_META: Record<
  ReviewableEntity,
  { delegate: "job" | "privateJob" | "result" | "admitCard" | "answerKey" | "admission" | "syllabus" | "blogPost"; revalidateKey: RevalidateKind; label: string }
> = {
  Job: { delegate: "job", revalidateKey: "job", label: "Gov Job" },
  PrivateJob: { delegate: "privateJob", revalidateKey: "private-job", label: "Private Job" },
  Result: { delegate: "result", revalidateKey: "result", label: "Result" },
  AdmitCard: { delegate: "admitCard", revalidateKey: "admit-card", label: "Admit Card" },
  AnswerKey: { delegate: "answerKey", revalidateKey: "answer-key", label: "Answer Key" },
  Admission: { delegate: "admission", revalidateKey: "admission", label: "Admission" },
  Syllabus: { delegate: "syllabus", revalidateKey: "syllabus", label: "Syllabus" },
  Blog: { delegate: "blogPost", revalidateKey: "blog", label: "Blog" },
}

export function isReviewableEntity(v: unknown): v is ReviewableEntity {
  return typeof v === "string" && (REVIEWABLE_ENTITIES as readonly string[]).includes(v)
}

export function isModerationStatus(v: unknown): v is ModerationStatus {
  return typeof v === "string" && (MODERATION_STATUSES as readonly string[]).includes(v)
}

/** Default moderation for newly uploaded content: admins submit for review, super-admins auto-approve. */
export function defaultModerationForRole(role?: string | null): ModerationStatus {
  return role === "SUPER_ADMIN" ? "APPROVED" : "PENDING"
}

export async function writeAuditLog(args: {
  action: string
  entity: string
  entityId: string
  userId?: string | null
  details?: string | null
}) {
  try {
    await prisma.log.create({
      data: {
        action: args.action,
        entity: args.entity,
        entityId: args.entityId,
        ...(args.userId ? { userId: args.userId } : {}),
        ...(args.details ? { details: args.details } : {}),
      },
    })
  } catch {
    // Audit logging must never break the primary mutation.
  }
}

export interface StaffActor {
  id?: string | null
  email?: string | null
  role?: string | null
}

export async function staffAudit(args: {
  action: string
  entity: string
  entityId: string
  user: StaffActor | null | undefined
  note?: string | null
}) {
  const who = args.user?.email ?? args.user?.id ?? "system"
  const role = args.user?.role ?? "UNKNOWN"
  const details = args.note
    ? `${args.note} - by ${who} (${role})`
    : `by ${who} (${role})`
  await writeAuditLog({
    action: args.action,
    entity: args.entity,
    entityId: args.entityId,
    userId: args.user?.id ?? null,
    details,
  })
}

export async function reviewContent(args: {
  entity: ReviewableEntity
  id: string
  action: "APPROVE" | "REJECT"
  note?: string | null
  reviewerId: string
  reviewerRole?: string | null
}) {
  const meta = REVIEWABLE_META[args.entity]
  const delegate = (prisma as unknown as Record<string, {
    findUnique: (a: unknown) => Promise<{ slug?: string } | null>
    update: (a: unknown) => Promise<{ slug?: string }>
  }>)[meta.delegate]
  if (!delegate) throw new Error(`Unsupported entity: ${args.entity}`)

  const existing = await delegate.findUnique({ where: { id: args.id } })
  if (!existing) {
    const err = new Error(`${meta.label} not found`)
    ;(err as Error & { status?: number }).status = 404
    throw err
  }

  const moderation: ModerationStatus = args.action === "APPROVE" ? "APPROVED" : "REJECTED"
  const updated = await delegate.update({
    where: { id: args.id },
    data: {
      moderation,
      reviewedById: args.reviewerId,
      reviewedAt: new Date(),
      reviewNote: args.note?.trim() ? args.note.trim() : null,
    },
  })

  await writeAuditLog({
    action: args.action === "APPROVE" ? "APPROVE" : "REJECT",
    entity: args.entity,
    entityId: args.id,
    userId: args.reviewerId,
    details: args.note?.trim()
      ? `${moderation} by ${args.reviewerId}${args.reviewerRole ? ` (${args.reviewerRole})` : ""}: ${args.note.trim().slice(0, 500)}`
      : `${moderation} by ${args.reviewerId}${args.reviewerRole ? ` (${args.reviewerRole})` : ""}`,
  })

  try {
    const slug = (updated as { slug?: string })?.slug
    if (slug) revalidatePublicContent(meta.revalidateKey, slug)
    else revalidatePublicContent(meta.revalidateKey)
  } catch {
    // revalidation is best-effort
  }

  return updated
}
