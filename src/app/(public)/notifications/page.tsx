import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { existingNotificationHrefs } from "@/lib/notifications"
import { NotificationsClient } from "./notifications-client"
import { DataVersionProvider } from "@/components/providers/DataVersion"
import { renderVersion } from "@/lib/data-version"
import { getCategoryList } from "@/lib/taxonomy"

export const metadata: Metadata = {
  title: "Notifications",
  description: "Latest government job notifications, trending updates and category-wise alerts.",
  alternates: { canonical: `${process.env.NEXT_PUBLIC_APP_URL || "https://chayanjobs.com"}/notifications` },
  twitter: { card: "summary_large_image", title: "Notifications | ChayanJobs", description: "Latest government job notifications and trending updates." },
}

export const revalidate = 21600

export default async function NotificationsPage() {
  const [notifications, categories] = await Promise.all([
    prisma.notification.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    getCategoryList(),
  ])

  const hrefs = await existingNotificationHrefs(notifications)
  const items = notifications.map((n) => ({ ...n, href: hrefs.get(n.slug) || null }))

  return (
    <DataVersionProvider version={renderVersion()}>
      <NotificationsClient notifications={JSON.parse(JSON.stringify(items))} categories={JSON.parse(JSON.stringify(categories))} />
    </DataVersionProvider>
  )
}
