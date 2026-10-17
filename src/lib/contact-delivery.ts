import { getChannelTopic } from "@/lib/channels"
import { sendContactAutoReply, sendContactEmail } from "@/lib/email"
import { prisma } from "@/lib/prisma"

export async function deliverContactTicket(id: string): Promise<boolean> {
  const now = new Date()
  const lease = await prisma.contactTicket.updateMany({
    where: { id, nextAttemptAt: { lte: now }, deliveryAttempts: { lt: 10 },
      createdAt: { gt: new Date(now.getTime() - 23 * 60 * 60 * 1000) },
      OR: [{ notifiedAt: null }, { autoRepliedAt: null }] },
    data: { nextAttemptAt: new Date(now.getTime() + 5 * 60 * 1000), deliveryAttempts: { increment: 1 } },
  })
  if (!lease.count) return true
  const ticket = await prisma.contactTicket.findUniqueOrThrow({ where: { id } })
  const channel = getChannelTopic(ticket.topic)
  if (!channel) throw new Error("Unknown contact channel")
  try {
    if (!ticket.notifiedAt) {
      const result = await sendContactEmail(ticket.name, ticket.email, ticket.subject, ticket.message,
        { to: channel.email, topicLabel: channel.label, reference: id })
      if (!result.success) throw new Error("Team notification failed")
      await prisma.contactTicket.update({ where: { id }, data: { notifiedAt: new Date() } })
    }
    if (!ticket.autoRepliedAt) {
      const result = await sendContactAutoReply(ticket.email, ticket.name, id, channel.label, channel.reply)
      if (!result.success) throw new Error("Acknowledgment failed")
      await prisma.contactTicket.update({ where: { id }, data: { autoRepliedAt: new Date() } })
    }
    return true
  } catch {
    await prisma.contactTicket.update({ where: { id }, data: { nextAttemptAt: new Date(Date.now() + 15 * 60 * 1000) } })
    console.error("[contact] Email delivery needs retry", { reference: id })
    return false
  }
}
