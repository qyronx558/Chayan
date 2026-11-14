"use client"

import { useQuery } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { fetcher } from "@/lib/api"
import { isSuperAdmin } from "@/lib/roles"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/admin/PageHeader"
import { ActivityTab } from "@/components/admin/content-bot/ActivityTab"
import { OverviewTab } from "@/components/admin/content-bot/OverviewTab"
import { SettingsTab } from "@/components/admin/content-bot/SettingsTab"
import { SourcesTab } from "@/components/admin/content-bot/SourcesTab"
import type { SettingsResponse } from "@/components/admin/content-bot/types"

export default function ContentBotPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const allowed = status === "authenticated" && !!session && isSuperAdmin(session.user.role)
  const settings = useQuery({
    queryKey: ["content-bot", "settings"],
    queryFn: () => fetcher<SettingsResponse>("/api/admin/content-bot/settings"),
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
        crumbs={[{ label: "System" }, { label: "Content bot" }]}
        title="Content bot"
        description="Finds new official notices across India and sends them to Content verification. Changes apply from the next run."
      />
      {settings.isLoading || !settings.data ? (
        settings.error ? <p className="text-sm text-brick">{(settings.error as Error).message}</p> : <Skeleton className="h-96" />
      ) : (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="flex w-full justify-start overflow-x-auto sm:w-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sources">Sources</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          <TabsContent value="overview"><OverviewTab settings={settings.data} /></TabsContent>
          <TabsContent value="sources"><SourcesTab /></TabsContent>
          <TabsContent value="settings"><SettingsTab key={settings.data.settings.updatedAt ?? "env"} settings={settings.data} /></TabsContent>
          <TabsContent value="activity"><ActivityTab /></TabsContent>
        </Tabs>
      )}
    </div>
  )
}
