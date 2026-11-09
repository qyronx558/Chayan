import { prisma } from "@/lib/prisma"

export type JourneyKey = "notification" | "syllabus" | "admit-card" | "answer-key" | "result"

export interface JourneyStage {
  key: JourneyKey
  label: string
  /** null = not released yet. */
  href: string | null
  title: string | null
  current: boolean
}

/**
 * Recruitment journey for one job: Notification -> Syllabus -> Admit card -> Answer key -> Result.
 * Built only from real linked records (jobId). A stage with no approved record is "not released yet" -
 * nothing is invented. Returns null when there is no job to anchor on.
 */
export async function getJourney(
  jobId: string | null | undefined,
  current: JourneyKey,
): Promise<JourneyStage[] | null> {
  if (!jobId) return null
  const pick = { select: { slug: true, title: true }, where: { moderation: "APPROVED" as const }, orderBy: { createdAt: "desc" as const }, take: 1 }
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      slug: true,
      title: true,
      syllabus: pick,
      admitCard: pick,
      answerKey: pick,
      result: pick,
    },
  })
  if (!job) return null

  const stage = (key: JourneyKey, label: string, base: string, rec?: { slug: string; title: string }): JourneyStage => ({
    key,
    label,
    href: rec ? `${base}/${rec.slug}` : null,
    title: rec?.title ?? null,
    current: key === current,
  })

  const stages: JourneyStage[] = [
    { key: "notification", label: "Notification", href: `/apply/${job.slug}`, title: job.title, current: current === "notification" },
    stage("syllabus", "Syllabus", "/syllabus", job.syllabus[0]),
    stage("admit-card", "Admit card", "/admit-card", job.admitCard[0]),
    stage("answer-key", "Answer key", "/answer-key", job.answerKey[0]),
    stage("result", "Result", "/result", job.result[0]),
  ]
  // Nothing beyond the page you're on - a one-node journey is noise.
  return stages.filter((s) => s.href).length >= 2 ? stages : null
}
