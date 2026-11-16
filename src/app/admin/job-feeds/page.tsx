"use client"

import { useQuery } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { fetcher } from "@/lib/api"
import { isSuperAdmin } from "@/lib/roles"
import { PageHeader } from "@/components/admin/PageHeader"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OverviewTab } from "@/components/admin/job-feeds/OverviewTab"
import { SettingsTab } from "@/components/admin/job-feeds/SettingsTab"
import { SourcesTab } from "@/components/admin/job-feeds/SourcesTab"
import type { FeedsResponse, SettingsResponse } from "@/components/admin/job-feeds/types"

/** Private-job seeding control centre (super admin only; every API behind it enforces the same). */
export default function JobFeedsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const allowed = status === "authenticated" && !!session && isSuperAdmin(session.user.role)

  const feeds = useQuery({
    queryKey: ["job-feeds"],
    queryFn: () => fetcher<FeedsResponse>("/api/admin/private-feeds"),
    enabled: allowed,
    refetchInterval: 60_000,
  })
  const settings = useQuery({
    queryKey: ["job-feeds", "settings"],
    queryFn: () => fetcher<SettingsResponse>("/api/admin/private-feeds/settings"),
    enabled: allowed,
  })

  if (status === "loading") return <Skeleton className="h-96" />
  if (!allowed) {
    router.push(session ? "/admin/dashboard" : "/login")
    return null
  }

  return (
    <div className="space-y-4">
      <PageHeader
        crumbs={[{ label: "System" }, { label: "Job feeds" }]}
        title="Private job seeding"
        description="Fresh openings from company job boards and careers pages, synced on a schedule. Removed openings close on their own."
      />

      {feeds.isError ? (
        <p className="rounded-2xl border border-rule p-6 text-sm text-red-600">{(feeds.error as Error).message}</p>
      ) : !feeds.data ? (
        <Skeleton className="h-96" />
      ) : (
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sources">Sources ({feeds.data.data.length})</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-4">
            <OverviewTab feeds={feeds.data} settings={settings.data} />
          </TabsContent>
          <TabsContent value="sources" className="mt-4">
            <SourcesTab rows={feeds.data.data} missingLogos={feeds.data.summary.missingLogos} />
          </TabsContent>
          <TabsContent value="settings" className="mt-4">
            {settings.data ? <SettingsTab key={settings.data.settings.updatedAt ?? "new"} data={settings.data} /> : <Skeleton className="h-80" />}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
