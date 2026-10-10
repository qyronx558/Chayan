"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import {
  AlertTriangle,
  Award,
  Briefcase,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  DatabaseZap,
  Download,
  GraduationCap,
  IdCard,
  Inbox,
  KeyRound,
  Pencil,
  Plus,
  RefreshCw,
  ShieldAlert,
  UploadCloud,
  Users,
  Wrench,
  XCircle,
  type LucideIcon,
} from "lucide-react"
import { fetcher } from "@/lib/api"
import { exportToCsv } from "@/lib/admin-export"
import { cn, timeAgo } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { DataCard } from "@/components/admin/dashboard/DataCard"
import { KpiStrip } from "@/components/admin/dashboard/KpiStrip"
import { TrendChart } from "@/components/admin/dashboard/TrendChart"
import { AttentionList, type AttentionRow, type AttentionTone } from "@/components/admin/dashboard/AttentionList"
import { StatusDot } from "@/components/admin/dashboard/StatusDot"
import { PipelineBar } from "@/components/admin/dashboard/PipelineBar"
import { Timeline, type TimelineItem } from "@/components/admin/dashboard/Timeline"
import { DashboardSkeleton } from "@/components/admin/dashboard/skeletons"
import type {
  DashboardPayload,
  DashboardRange,
  FeedbackItem,
  LibraryPayload,
} from "@/components/admin/dashboard/types"

type RecentTab = "all" | "pending" | "published"

const RANGES: Array<{ value: DashboardRange; label: string }> = [
  { value: 7, label: "7D" },
  { value: 30, label: "30D" },
  { value: 90, label: "90D" },
]

const SUPER_KPI_ICONS: LucideIcon[] = [Briefcase, Award, Users, ClipboardCheck]
const ADMIN_KPI_ICONS: LucideIcon[] = [UploadCloud, CheckCircle2, Clock, AlertTriangle]

const SUPER_ATTENTION: Record<string, { icon: LucideIcon; tone: AttentionTone }> = {
  "pending-verification": { icon: ClipboardCheck, tone: "amber" },
  "scam-reports": { icon: ShieldAlert, tone: "red" },
  "closing-soon": { icon: CalendarClock, tone: "sky" },
  "failed-imports": { icon: DatabaseZap, tone: "teal" },
}

const ADMIN_ATTENTION: Record<string, { icon: LucideIcon; tone: AttentionTone }> = {
  "needs-changes": { icon: XCircle, tone: "red" },
  drafts: { icon: Pencil, tone: "sky" },
  waiting: { icon: Clock, tone: "amber" },
  "closing-soon": { icon: CalendarClock, tone: "teal" },
}

const QUICK_CREATE: Array<{ label: string; href: string; icon: LucideIcon }> = [
  { label: "Gov job", href: "/admin/jobs", icon: Briefcase },
  { label: "Private job", href: "/admin/private-jobs", icon: Building2 },
  { label: "Result", href: "/admin/results", icon: Award },
  { label: "Admit card", href: "/admin/admit-cards", icon: IdCard },
  { label: "Answer key", href: "/admin/answer-keys", icon: KeyRound },
  { label: "Admission", href: "/admin/admissions", icon: GraduationCap },
]

function greetingFor(hour: number): string {
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

function activityDot(action: string): string {
  const a = action.toUpperCase()
  if (a.includes("APPROVE")) return "bg-emerald-500"
  if (a.includes("REJECT")) return "bg-rose-500"
  if (a.includes("BULK") || a.includes("IMPORT") || a.includes("CLONE")) return "bg-teal-600"
  if (a.includes("CREATE") || a.includes("SUBMIT")) return "bg-sky-500"
  if (a.includes("DELETE")) return "bg-slate-400"
  if (a.includes("LOGIN")) return "bg-violet-500"
  return "bg-slate-300 dark:bg-slate-600"
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [range, setRange] = useState<DashboardRange>(7)
  const [tab, setTab] = useState<RecentTab>("all")
  const [nowTick, setNowTick] = useState(() => Date.now())

  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 30000)
    return () => clearInterval(t)
  }, [])

  const role = session?.user?.role
  const isSuper = role === "SUPER_ADMIN"

  const dashboardQuery = useQuery({
    queryKey: ["admin-dashboard", range],
    queryFn: () => fetcher<{ success: boolean; data: DashboardPayload }>(`/api/admin/dashboard?range=${range}`),
    enabled: status === "authenticated",
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  })
  const libraryQuery = useQuery({
    queryKey: ["admin-dashboard-library"],
    queryFn: () => fetcher<{ success: boolean; data: LibraryPayload }>("/api/admin/dashboard/library"),
    enabled: status === "authenticated" && isSuper,
    staleTime: 120_000,
    refetchOnWindowFocus: false,
  })
  const feedbackQuery = useQuery({
    queryKey: ["admin-dashboard-feedback"],
    queryFn: () => fetcher<{ success: boolean; data: FeedbackItem[] }>("/api/admin/dashboard/feedback"),
    enabled: status === "authenticated" && role === "ADMIN",
    staleTime: 120_000,
    refetchOnWindowFocus: false,
  })

  const data = dashboardQuery.data?.data
  const library = libraryQuery.data?.data
  const feedback = useMemo(() => feedbackQuery.data?.data ?? [], [feedbackQuery.data])

  const attentionRows: AttentionRow[] = useMemo(() => {
    const map = isSuper ? SUPER_ATTENTION : ADMIN_ATTENTION
    return (data?.attention ?? []).map((a) => ({
      ...a,
      icon: map[a.key]?.icon ?? ClipboardCheck,
      tone: map[a.key]?.tone ?? "teal",
    }))
  }, [data, isSuper])

  const visibleRecent = useMemo(() => {
    const list = data?.recent ?? []
    if (tab === "pending") return list.filter((j) => j.moderation === "PENDING")
    if (tab === "published") return list.filter((j) => j.moderation === "APPROVED")
    return list
  }, [data, tab])

  const activityItems: TimelineItem[] = useMemo(
    () =>
      (library?.activity ?? []).map((e) => ({
        id: e.id,
        title: `${e.action} · ${e.entity}`,
        sub: e.text,
        meta: `${e.actor} · ${timeAgo(e.createdAt)}`,
        dot: activityDot(e.action),
      })),
    [library]
  )

  if (status === "loading" || (dashboardQuery.isLoading && !data)) {
    return <DashboardSkeleton />
  }
  if (!session || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
    router.push("/login")
    return null
  }

  const firstName = (session.user.name ?? session.user.email ?? "").split(" ")[0]
  const hour = new Date().getHours()
  const updatedAt = dashboardQuery.dataUpdatedAt
  const mins = updatedAt ? Math.max(0, Math.floor((nowTick - updatedAt) / 60000)) : 0
  const updatedLabel = !updatedAt ? "-" : mins < 1 ? "just now" : mins === 1 ? "1 min ago" : `${mins} min ago`

  const handleRefresh = () => {
    dashboardQuery.refetch()
    if (isSuper) libraryQuery.refetch()
    else feedbackQuery.refetch()
    setNowTick(Date.now())
  }

  const handleExport = () => {
    if (!data) return
    const rows: Array<{ section: string; label: string; value: string | number; extra: string | number }> = [
      ...data.kpis.map((k) => ({
        section: "kpi",
        label: k.label,
        value: k.value,
        extra: k.deltaPct === null ? "" : `${k.deltaPct}%`,
      })),
      ...data.pipeline.segments.map((s) => ({
        section: "pipeline",
        label: s.label,
        value: s.count,
        extra: `${s.pct}%`,
      })),
      ...data.recent.map((r) => ({ section: "recent", label: r.title, value: r.moderation, extra: r.createdAt })),
    ]
    exportToCsv(rows, `dashboard-${range}d`)
    toast(`Exported ${rows.length} rows`, "success")
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {format(new Date(), "EEEE, d MMMM yyyy")}
          </p>
          <h1 className="mt-0.5 truncate text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-2xl">
            {greetingFor(hour)}, {firstName}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {isSuper
              ? "Everything happening across ChayanJobs, in one view."
              : "How your uploads are performing across ChayanJobs."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm" className="bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500">
            <Link href="/admin/jobs">
              <Plus className="mr-1 h-4 w-4" /> Add job
            </Link>
          </Button>
          <Button size="sm" variant="outline" onClick={handleExport}>
            <Download className="mr-1 h-4 w-4" /> Export
          </Button>
          {isSuper ? (
            <Button size="sm" variant="ghost" asChild>
              <Link href="/admin/categories">
                <Plus className="mr-1 h-4 w-4" /> Add category
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Live
          </span>
          <span className="tabular-nums">Updated {updatedLabel}</span>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={handleRefresh}
            title="Refresh dashboard"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", dashboardQuery.isFetching && "animate-spin")} />
          </Button>
        </div>
        <div
          className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5 dark:border-white/10 dark:bg-white/[0.03]"
          role="tablist"
          aria-label="Date range"
        >
          {RANGES.map((r) => (
            <button
              key={r.value}
              type="button"
              role="tab"
              aria-selected={range === r.value}
              onClick={() => setRange(r.value)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-semibold transition-colors",
                range === r.value
                  ? "bg-teal-700 text-white dark:bg-teal-600"
                  : "text-slate-500 hover:text-teal-700 dark:text-slate-400 dark:hover:text-teal-300"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {dashboardQuery.isError && !data ? (
        <DataCard title="Dashboard unavailable" subtitle="Could not load dashboard data.">
          <div className="flex items-center gap-2">
            <p className="text-sm text-slate-500 dark:text-slate-400">Something went wrong on our side.</p>
            <Button size="sm" variant="outline" onClick={handleRefresh}>
              Retry
            </Button>
          </div>
        </DataCard>
      ) : null}

      {data ? (
        <>
          <KpiStrip kpis={data.kpis} icons={isSuper ? SUPER_KPI_ICONS : ADMIN_KPI_ICONS} range={range} />

          <div className="grid gap-4 lg:grid-cols-5 xl:gap-5">
            <div className="lg:col-span-3">
              <TrendChart
                trend={data.trend}
                title={isSuper ? "Publishing trend" : "Upload trend"}
                subtitle={
                  isSuper
                    ? `Approved content published · last ${range} days vs previous period`
                    : `Your uploads · last ${range} days vs previous period`
                }
              />
            </div>
            <div className="lg:col-span-2">
              <AttentionList
                title="Needs attention"
                subtitle={isSuper ? "Queues that need a super-admin" : "Your personal action queue"}
                items={attentionRows}
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-5 xl:gap-5">
            <div className="lg:col-span-3">
              <DataCard
                title={isSuper ? "Recent jobs" : "My recent uploads"}
                subtitle={
                  isSuper ? "Latest govt job postings across the team" : "Your latest uploads, including rejected items"
                }
                className="h-full"
                action={
                  <div className="flex items-center gap-0.5 rounded-lg bg-slate-100 p-0.5 dark:bg-white/[0.06]">
                    {(
                      [
                        { value: "all", label: "All" },
                        { value: "pending", label: "Pending" },
                        { value: "published", label: "Published" },
                      ] as Array<{ value: RecentTab; label: string }>
                    ).map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setTab(t.value)}
                        className={cn(
                          "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
                          tab === t.value
                            ? "bg-white text-slate-900 shadow-sm dark:bg-white/10 dark:text-slate-100"
                            : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                        )}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                }
              >
                {visibleRecent.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                    <Inbox className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No jobs found</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {tab === "all" ? "New uploads will appear here." : "Nothing in this state right now."}
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                    {visibleRecent.map((job) => (
                      <li key={job.id}>
                        <Link href={job.href} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                              {job.title}
                            </span>
                            <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                              {job.org}
                              {isSuper && job.uploader ? ` · ${job.uploader}` : ""}
                            </span>
                          </span>
                          <StatusDot value={job.moderation} />
                          <span className="w-16 shrink-0 text-right text-xs tabular-nums text-slate-400 dark:text-slate-500">
                            {timeAgo(job.createdAt)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </DataCard>
            </div>
            <div className="lg:col-span-2">
              <DataCard
                title="Review pipeline"
                subtitle={isSuper ? "All content by moderation status" : "Your uploads by moderation status"}
                className="h-full"
              >
                <PipelineBar pipeline={data.pipeline} />
              </DataCard>
            </div>
          </div>

          {isSuper ? (
            <div className="grid gap-4 lg:grid-cols-2 xl:gap-5">
              <DataCard
                title="Content library"
                subtitle="Live items per module"
                className="h-full"
                action={
                  <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold tabular-nums text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                    {(library?.total ?? 0).toLocaleString("en-IN")} total
                  </span>
                }
              >
                {!library ? (
                  <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">Loading library…</p>
                ) : (
                  <ul className="space-y-2.5">
                    {library.modules.map((m) => {
                      const pct = library.total > 0 ? (m.count / library.total) * 100 : 0
                      return (
                        <li key={m.key}>
                          <Link href={m.href} className="group block">
                            <span className="flex items-baseline justify-between gap-2 text-sm">
                              <span className="truncate font-medium text-slate-700 group-hover:text-teal-700 dark:text-slate-200 dark:group-hover:text-teal-300">
                                {m.label}
                              </span>
                              <span className="shrink-0 font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                                {m.count.toLocaleString("en-IN")}
                              </span>
                            </span>
                            <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                              <span
                                className="block h-full rounded-full bg-teal-600 dark:bg-teal-500"
                                style={{ width: `${m.count > 0 ? Math.max(pct, 2) : 0}%` }}
                              />
                            </span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </DataCard>
              <DataCard
                title="Recent activity"
                subtitle="Publishes, reviews and imports"
                className="h-full"
              >
                {libraryQuery.isLoading && activityItems.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">Loading activity…</p>
                ) : (
                  <Timeline
                    items={activityItems}
                    emptyText="No audit entries yet. Creates, approvals and imports will appear here."
                    footer={{ label: "View audit trail", href: "/admin/logs" }}
                  />
                )}
              </DataCard>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2 xl:gap-5">
              <DataCard
                title="Reviewer feedback"
                subtitle="Why items were sent back - fix and resubmit"
                className="h-full"
              >
                {feedbackQuery.isLoading && feedback.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">Loading feedback…</p>
                ) : feedback.length === 0 ? (
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-3 text-sm text-slate-500 dark:border-white/[0.06] dark:text-slate-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    No rejections - your uploads are clearing review.
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                    {feedback.map((f) => (
                      <li key={f.id} className="py-2.5 first:pt-0 last:pb-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                            {f.title}
                          </p>
                          <Button size="sm" variant="outline" asChild className="shrink-0">
                            <Link href={f.href}>
                              <Wrench className="mr-1 h-3.5 w-3.5" /> Fix
                            </Link>
                          </Button>
                        </div>
                        <p className="mt-0.5 text-[11px] tabular-nums text-slate-400 dark:text-slate-500">
                          {f.module} · {timeAgo(f.createdAt)}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{f.reason}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </DataCard>
              <DataCard title="Quick create" subtitle="Start a new upload in any module" className="h-full">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {QUICK_CREATE.map((q) => {
                    const Icon = q.icon
                    return (
                      <Button key={q.href} variant="outline" asChild className="h-auto flex-col gap-1.5 py-3.5">
                        <Link href={q.href}>
                          <Icon className="h-4 w-4 text-teal-700 dark:text-teal-400" />
                          <span className="text-xs">{q.label}</span>
                        </Link>
                      </Button>
                    )
                  })}
                </div>
              </DataCard>
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}
