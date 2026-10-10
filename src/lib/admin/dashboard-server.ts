import { prisma } from "@/lib/prisma"

export interface DashboardModuleClient {
  count: (args: Record<string, unknown>) => Promise<number>
  findMany: (
    args: Record<string, unknown>
  ) => Promise<
    Array<{
      id?: string
      title?: string
      createdAt: Date
      reviewedAt?: Date | null
      reviewNote?: string | null
    }>
  >
  findFirst: (args: Record<string, unknown>) => Promise<{ id: string; title: string; createdAt: Date } | null>
  groupBy: (args: Record<string, unknown>) => Promise<Array<{ moderation: string; _count: number }>>
}

export function moduleDb(): Record<string, DashboardModuleClient> {
  return prisma as unknown as Record<string, DashboardModuleClient>
}
