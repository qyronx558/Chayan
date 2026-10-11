"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bookmark,
  Download,
  Eye,
  FileDown,
  Printer,
  RefreshCw,
  Plus,
  Search,
  ExternalLink,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { fetcher } from "@/lib/api";
import { cn, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataCard } from "@/components/admin/dashboard/DataCard";
import { Sparkline } from "@/components/admin/dashboard/Sparkline";
import { KpiStrip } from "@/components/admin/analytics/KpiStrip";
import { TrendChart } from "@/components/admin/analytics/TrendChart";
import { Donut } from "@/components/admin/analytics/Donut";
import { BarList } from "@/components/admin/analytics/BarList";
import { Funnel } from "@/components/admin/analytics/Funnel";
import { Heatmap } from "@/components/admin/analytics/Heatmap";
import { HealthCheckList } from "@/components/admin/analytics/HealthCheckList";
import { AlertRuleList } from "@/components/admin/analytics/AlertRuleList";
import { InsightsRow } from "@/components/admin/analytics/InsightsRow";
import { PerfChart } from "@/components/admin/analytics/PerfChart";
import { AnalyticsSkeleton } from "@/components/admin/analytics/Skeletons";
import type { AnalyticsPayload, AnalyticsRangeKey, MinePayload } from "@/lib/analytics/types";

type Tab = "overview" | "audience" | "content" | "acquisition" | "monitoring";

const RANGES: AnalyticsRangeKey[] = ["7D", "30D", "90D", "1Y"];
const TABS: Array<{ key: Tab; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "audience", label: "Audience" },
  { key: "content", label: "Content" },
  { key: "acquisition", label: "Acquisition" },
  { key: "monitoring", label: "Monitoring" },
];

function useRangeParam(): [AnalyticsRangeKey, (r: AnalyticsRangeKey) => void] {
  const params = useSearchParams();
  const router = useRouter();
  const raw = (params?.get("range") ?? "7D").toUpperCase();
  const range: AnalyticsRangeKey = raw === "30D" ? "30D" : raw === "90D" ? "90D" : raw === "1Y" ? "1Y" : "7D";
  const set = (r: AnalyticsRangeKey) => {
    const sp = new URLSearchParams(params?.toString() ?? "");
    sp.set("range", r);
    router.replace(`?${sp.toString()}`, { scroll: false });
  };
  return [range, set];
}

function useTabParam(): [Tab, (t: Tab) => void] {
  const params = useSearchParams();
  const router = useRouter();
  const raw = (params?.get("tab") ?? "overview").toLowerCase();
  const tab: Tab = raw === "audience" || raw === "content" || raw === "acquisition" || raw === "monitoring" ? (raw as Tab) : "overview";
  const set = (t: Tab) => {
    const sp = new URLSearchParams(params?.toString() ?? "");
    sp.set("tab", t);
    router.replace(`?${sp.toString()}`, { scroll: false });
  };
  return [tab, set];
}

function MineView({ range }: { range: AnalyticsRangeKey }) {
  const mine = useQuery({
    queryKey: ["analytics-mine", range],
    queryFn: () => fetcher<{ success: boolean; data: MinePayload }>(`/api/admin/analytics/mine?range=${range}`),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
  const d = mine.data?.data;
  if (mine.isLoading && !d) return <AnalyticsSkeleton />;
  if (!d) return <p className="py-10 text-center text-sm text-slate-500">Could not load your analytics.</p>;
  return (
    <div className="space-y-4">
      <KpiStrip items={d.kpis} range={range} />
      <TrendChart series={d.trend} title="My upload trend" subtitle={`Your uploads · last ${range}`} />
      <div className="grid gap-4 lg:grid-cols-2">
        <DataCard title="My top jobs" subtitle="Your most-viewed postings" className="h-full">
          {d.topJobs.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">No uploads yet.</p> : (
            <ul className="divide-y divide-slate-100 dark:divide-white/[0.06]">
              {d.topJobs.map((j) => (
                <li key={j.id} className="flex items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                  <Link href={j.href} className="min-w-0 flex-1 truncate text-sm font-medium hover:text-teal-700">{j.title}</Link>
                  <span className="flex items-center gap-1 text-xs tabular-nums text-slate-500"><Eye className="h-3 w-3" />{j.views}</span>
                </li>
              ))}
            </ul>
          )}
        </DataCard>
        <DataCard title="Reviewer feedback" subtitle="Fix and resubmit" className="h-full">
          {d.feedback.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">No rejections — your uploads are clearing review.</p> : (
            <ul className="divide-y divide-slate-100 dark:divide-white/[0.06]">
              {d.feedback.map((f) => (
                <li key={f.id} className="py-2.5 first:pt-0 last:pb-0">
                  <p className="truncate text-sm font-medium">{f.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{f.reason}</p>
                </li>
              ))}
            </ul>
          )}
        </DataCard>
      </div>
    </div>
  );
}

function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [range, setRange] = useRangeParam();
  const [tab, setTab] = useTabParam();
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [healthRunning, setHealthRunning] = useState(false);
  const [connectKey, setConnectKey] = useState<string | null>(null);
  const [connectVal, setConnectVal] = useState("");
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const role = session?.user?.role;
  const isSuper = role === "SUPER_ADMIN";
  const isStaff = role === "ADMIN" || isSuper;

  const q = useQuery({
    queryKey: ["admin-analytics", range],
    queryFn: () => fetcher<{ success: boolean; data: AnalyticsPayload }>(`/api/admin/analytics?range=${range}`),
    enabled: status === "authenticated" && isSuper,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });

  const data = q.data?.data;
  const openIssues = data?.monitoring.openIssues ?? 0;

  useEffect(() => {
    if (status === "authenticated" && !isStaff) router.push("/");
  }, [status, isStaff, router]);

  const updatedAt = q.dataUpdatedAt;
  const mins = updatedAt ? Math.max(0, Math.floor((nowTick - updatedAt) / 60000)) : 0;
  const updatedLabel = !updatedAt ? "—" : mins < 1 ? "just now" : mins === 1 ? "1 min ago" : `${mins} min ago`;

  const refresh = () => {
    q.refetch();
    setNowTick(Date.now());
  };

  const exportCsv = async () => {
    try {
      const res = await fetch(`/api/admin/analytics/export?range=${range}`);
      if (!res.ok) throw new Error("export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-${range.toLowerCase()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast("CSV exported", "success");
    } catch {
      toast("Export failed", "destructive");
    }
  };

  const exportPdf = () => {
    toast("Opening print view — choose Save as PDF", "success");
    setTimeout(() => window.print(), 300);
  };

  const runHealth = async () => {
    setHealthRunning(true);
    try {
      const res = await fetch("/api/admin/analytics/health", { method: "POST" });
      if (!res.ok) throw new Error("run failed");
      await queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
      toast("Health checks refreshed", "success");
    } catch {
      toast("Health run failed", "destructive");
    } finally {
      setHealthRunning(false);
    }
  };

  const toggleRule = async (id: string, enabled: boolean, prev: boolean) => {
    queryClient.setQueryData(["admin-analytics", range], (old: { success: boolean; data: AnalyticsPayload } | undefined) => {
      if (!old) return old;
      return {
        ...old,
        data: {
          ...old.data,
          monitoring: { ...old.data.monitoring, alerts: old.data.monitoring.alerts.map((r) => (r.id === id ? { ...r, enabled } : r)) },
        },
      };
    });
    try {
      const res = await fetch(`/api/admin/analytics/alerts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) throw new Error("toggle failed");
    } catch {
      queryClient.setQueryData(["admin-analytics", range], (old: { success: boolean; data: AnalyticsPayload } | undefined) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            monitoring: { ...old.data.monitoring, alerts: old.data.monitoring.alerts.map((r) => (r.id === id ? { ...r, enabled: prev } : r)) },
          },
        };
      });
      toast("Toggle failed", "destructive");
    }
  };

  const createRule = async (input: { metric: string; threshold: number; channels: Array<"Email" | "Telegram"> }) => {
    const res = await fetch("/api/admin/analytics/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("create failed");
    await queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
  };

  const deleteRule = async (id: string) => {
    await fetch(`/api/admin/analytics/alerts/${id}`, { method: "DELETE" }).catch(() => null);
    await queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
    toast("Rule removed", "success");
  };

  const connectIntegration = async () => {
    if (!connectKey) return;
    setConnecting(true);
    try {
      const config = connectKey === "telegram" ? { channel: connectVal } : { id: connectVal };
      const res = await fetch("/api/admin/analytics/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: connectKey, config }),
      });
      if (!res.ok) throw new Error("connect failed");
      setConnectKey(null);
      setConnectVal("");
      await queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
      toast("Integration connected", "success");
    } catch {
      toast("Connect failed — run DB migration", "destructive");
    } finally {
      setConnecting(false);
    }
  };

  const disconnectIntegration = async (key: string) => {
    await fetch(`/api/admin/analytics/integrations?key=${key}`, { method: "DELETE" }).catch(() => null);
    await queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
    toast("Integration disconnected", "success");
  };

  const headerActions = useMemo(() => (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5 dark:border-white/10 dark:bg-white/[0.03]" role="tablist" aria-label="Date range">
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            role="tab"
            aria-selected={range === r}
            onClick={() => setRange(r)}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-semibold transition-colors",
              range === r ? "bg-teal-700 text-white dark:bg-teal-600" : "text-slate-500 hover:text-teal-700 dark:text-slate-400"
            )}
          >
            {r}
          </button>
        ))}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline"><Download className="mr-1 h-4 w-4" /> Export <ChevronDown className="ml-1 h-3.5 w-3.5" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={exportCsv}><FileDown className="mr-2 h-4 w-4" /> CSV</DropdownMenuItem>
          <DropdownMenuItem onClick={exportPdf}><Printer className="mr-2 h-4 w-4" /> PDF (print)</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [range]);

  if (status === "loading") return <AnalyticsSkeleton />;
  if (!session || !isStaff) return null;
  if (!isSuper) {
    return (
      <div className="space-y-4" id="analytics-print-area">
        <PageHeader
          crumbs={[{ label: "Analytics" }]}
          title="My content analytics"
          description="How your uploads are performing across ChayanJobs."
          actions={
            <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5 dark:border-white/10 dark:bg-white/[0.03]" role="tablist" aria-label="Date range">
              {RANGES.map((r) => (
                <button key={r} type="button" role="tab" aria-selected={range === r} onClick={() => setRange(r)}
                  className={cn("rounded-md px-3 py-1 text-xs font-semibold", range === r ? "bg-teal-700 text-white" : "text-slate-500")}>{r}</button>
              ))}
            </div>
          }
        />
        <MineView range={range} />
      </div>
    );
  }

  return (
    <div className="space-y-4" id="analytics-print-area">
      <PageHeader
        crumbs={[{ label: "Analytics" }]}
        title="Analytics"
        description="Traffic, content and system health for ChayanJobs."
        badge={
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Live
          </span>
        }
        actions={headerActions}
      />

      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="tabular-nums">Updated {updatedLabel}</span>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={refresh} title="Refresh analytics" aria-label="Refresh analytics">
          <RefreshCw className={cn("h-3.5 w-3.5", q.isFetching && "animate-spin")} />
        </Button>
        {q.isError ? <span className="text-rose-600">Could not refresh — showing cached data.</span> : null}
      </div>

      <div className="border-b border-slate-200 dark:border-white/[0.06]" role="tablist" aria-label="Analytics sections">
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-semibold transition-colors",
                tab === t.key
                  ? "border-teal-700 text-teal-800 dark:border-teal-400 dark:text-teal-200"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
              )}
            >
              {t.label}
              {t.key === "monitoring" && openIssues > 0 ? (
                <Badge variant="destructive" className="rounded-full px-1.5 text-[11px]">{openIssues}</Badge>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {q.isLoading && !data ? <AnalyticsSkeleton /> : !data ? (
        <DataCard title="Analytics unavailable" subtitle="Could not load analytics.">
          <Button size="sm" variant="outline" onClick={refresh}>Retry</Button>
        </DataCard>
      ) : (
        <>
          {tab === "overview" ? (
            <div className="space-y-4">
              <KpiStrip items={data.overview.kpis} range={range} />
              <InsightsRow items={data.overview.insights} onSelect={setTab} />
              <TrendChart series={data.overview.trend} title="Traffic & publishing trend" subtitle={`Views, visitors and jobs · last ${range} vs previous period`} />
              <div className="grid gap-4 lg:grid-cols-5">
                <div className="lg:col-span-2"><Donut title="Jobs by status" slices={data.overview.statusDonut} /></div>
                <div className="lg:col-span-3">
                  <BarList
                    title="Jobs by category"
                    subtitle="Sorted descending · flagged where names look duplicated"
                    rows={data.overview.categories.map((c) => ({ id: c.id, label: c.name, value: c.jobs, warn: c.suspectDuplicate, sub: `${c.views} views` }))}
                  />
                </div>
              </div>
              <DataCard title="Popular jobs" subtitle="Most viewed in range" className="h-full">
                {data.overview.popular.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">No popular jobs in this period.</p> : (
                  <ul className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                    {data.overview.popular.map((j) => (
                      <li key={j.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                        <div className="min-w-0">
                          <Link href={j.href} className="block truncate text-sm font-medium hover:text-teal-700">{j.title}</Link>
                          <p className="truncate text-xs text-slate-500">{j.department}</p>
                        </div>
                        <div className="flex shrink-0 gap-3 text-xs tabular-nums text-slate-500">
                          <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{j.views}</span>
                          <span className="flex items-center gap-1"><Bookmark className="h-3 w-3" />{j.bookmarks}</span>
                          <span className="hidden sm:inline">{j.comments} comments</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </DataCard>
            </div>
          ) : null}

          {tab === "audience" ? (
            <div className="space-y-4">
              <KpiStrip items={data.audience.kpis} range={range} />
              <div className="grid gap-4 lg:grid-cols-2">
                <Donut title="Traffic quality" subtitle="Human vs search engines vs unknown bots — bots are filtered from visitor counts" slices={data.audience.quality.map((s, i) => ({ key: String(i), label: s.label, value: s.value }))} />
                <Donut title="Devices" subtitle="Sessions by device class" slices={data.audience.devices} />
              </div>
              <Funnel steps={data.audience.funnel} />
              <div className="grid gap-4 lg:grid-cols-2">
                <BarList title="Top states" subtitle="Sessions with a recorded state" rows={data.audience.states.map((s) => ({ id: s.name, label: s.name, value: s.visitors }))} maxRows={8} />
                <Heatmap cells={data.audience.heatmap} />
              </div>
            </div>
          ) : null}

          {tab === "content" ? (
            <div className="space-y-4">
              <DataCard title="Module performance" subtitle="Live items, tracked views and views per item">
                <div className="overflow-x-auto">
                  <table className="saas-table w-full min-w-[560px] text-sm" aria-label="Module performance">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-xs text-slate-500 dark:border-white/[0.06]">
                        <th className="py-2 pr-2 font-semibold">Module</th>
                        <th className="py-2 pr-2 text-right font-semibold">Items</th>
                        <th className="py-2 pr-2 text-right font-semibold">Views</th>
                        <th className="py-2 pr-2 text-right font-semibold">Per item</th>
                        <th className="w-28 py-2 font-semibold">Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.content.modules.map((m) => (
                        <tr key={m.module} className="border-b border-slate-100 last:border-0 dark:border-white/[0.04]">
                          <td className="py-2 pr-2 font-medium">{m.label}</td>
                          <td className="py-2 pr-2 text-right tabular-nums">{m.items.toLocaleString("en-IN")}</td>
                          <td className="py-2 pr-2 text-right tabular-nums">{m.views.toLocaleString("en-IN")}</td>
                          <td className="py-2 pr-2 text-right tabular-nums">{m.viewsPerItem}</td>
                          <td className="py-1"><Sparkline data={m.spark.length > 0 ? m.spark : [0]} id={`mod-${m.module}-${range}`} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </DataCard>
              <DataCard title="Demand versus supply" subtitle="Share of jobs vs share of views per category">
                <div className="overflow-x-auto">
                  <table className="saas-table w-full min-w-[620px] text-sm" aria-label="Demand versus supply">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-xs text-slate-500 dark:border-white/[0.06]">
                        <th className="py-2 pr-2 font-semibold">Category</th>
                        <th className="py-2 pr-2 text-right font-semibold">Jobs</th>
                        <th className="py-2 pr-2 text-right font-semibold">Job share</th>
                        <th className="py-2 pr-2 text-right font-semibold">View share</th>
                        <th className="py-2 pr-2 text-right font-semibold">Gap</th>
                        <th className="py-2 font-semibold">Signal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.content.demand.map((d) => (
                        <tr key={d.categoryId} className="border-b border-slate-100 last:border-0 dark:border-white/[0.04]">
                          <td className="py-2 pr-2 font-medium">{d.category}</td>
                          <td className="py-2 pr-2 text-right tabular-nums">{d.jobs.toLocaleString("en-IN")}</td>
                          <td className="py-2 pr-2 text-right tabular-nums">{d.jobShare}%</td>
                          <td className="py-2 pr-2 text-right tabular-nums">{d.viewShare}%</td>
                          <td className="py-2 pr-2 text-right tabular-nums">{d.gap > 0 ? "+" : ""}{d.gap}pp</td>
                          <td className="py-2">
                            {d.signal === "under" ? <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Under-supplied</Badge>
                              : d.signal === "over" ? <Badge variant="secondary">Over-supplied</Badge>
                                : <span className="text-xs text-slate-400">Balanced</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 text-xs text-slate-400">Under-supplied above +3pp · Over-supplied below −3pp.</p>
              </DataCard>
              <div className="grid gap-4 lg:grid-cols-2">
                <DataCard title="Top searches" subtitle="Most frequent terms in range" className="h-full">
                  {data.content.topSearches.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">No searches recorded yet.</p> : (
                    <ul className="space-y-2">
                      {data.content.topSearches.map((s) => (
                        <li key={s.term} className="flex items-center justify-between gap-2 text-sm">
                          <span className="flex min-w-0 items-center gap-1.5"><Search className="h-3.5 w-3.5 shrink-0 text-slate-400" /><span className="truncate font-medium">{s.term}</span></span>
                          <span className="shrink-0 text-xs tabular-nums text-slate-500">{s.count}× · {s.results} results</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </DataCard>
                <DataCard title="Searches with zero results" subtitle="Create content to fill these gaps" className="h-full">
                  {data.content.zeroSearches.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">No zero-result searches — coverage looks good.</p> : (
                    <ul className="space-y-2">
                      {data.content.zeroSearches.map((s) => (
                        <li key={s.term} className="flex items-center justify-between gap-2 text-sm">
                          <span className="min-w-0 truncate font-medium">{s.term}</span>
                          <Button size="sm" variant="outline" asChild className="shrink-0">
                            <Link href="/admin/jobs"><Plus className="mr-1 h-3.5 w-3.5" /> Create</Link>
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </DataCard>
              </div>
            </div>
          ) : null}

          {tab === "acquisition" ? (
            <div className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <BarList
                  title="Traffic sources"
                  subtitle="Organic, direct, WhatsApp/Telegram and referral from UTM + referrer"
                  rows={data.acquisition.sources.map((s) => ({ id: s.key, label: s.label, value: s.visitors }))}
                  maxRows={4}
                />
                <DataCard title="Top landing pages" subtitle="Entry paths by views" className="h-full">
                  {data.acquisition.landing.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">No landing data yet.</p> : (
                    <ul className="space-y-2.5">
                      {data.acquisition.landing.map((l) => (
                        <li key={l.path} className="flex items-center justify-between gap-2 text-sm">
                          <span className="min-w-0 truncate font-mono text-[13px]">{l.path}</span>
                          <span className="shrink-0 text-xs tabular-nums text-slate-500">{l.views.toLocaleString("en-IN")} views · {l.visitors.toLocaleString("en-IN")} visitors</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </DataCard>
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                {data.acquisition.integrations.map((g) => (
                  <DataCard key={g.key} title={g.title} subtitle={g.description} className="h-full">
                    {g.connected ? (
                      <div className="space-y-2">
                        <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300">Connected</Badge>
                        {g.summary ? <p className="text-sm tabular-nums text-slate-600 dark:text-slate-300">{g.summary}</p> : null}
                        <div><Button size="sm" variant="ghost" onClick={() => disconnectIntegration(g.key)}>Disconnect</Button></div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Badge variant="secondary">Not connected</Badge>
                        <div><Button size="sm" variant="outline" onClick={() => { setConnectKey(g.key); setConnectVal(""); }}>Connect</Button></div>
                      </div>
                    )}
                  </DataCard>
                ))}
              </div>
            </div>
          ) : null}

          {tab === "monitoring" ? (
            <div className="space-y-4">
              <KpiStrip items={data.monitoring.kpis} range={range} />
              <div className="grid gap-4 lg:grid-cols-5">
                <div className="lg:col-span-3"><HealthCheckList items={data.monitoring.health} onRunAll={runHealth} running={healthRunning} /></div>
                <div className="lg:col-span-2"><PerfChart points={data.monitoring.perf} /></div>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <DataCard
                  title="Security & admin activity"
                  subtitle="Spikes, failed logins and bulk actions"
                  className="h-full"
                  action={<Button size="sm" variant="ghost" asChild><Link href="/admin/logs">Audit trail <ExternalLink className="ml-1 h-3.5 w-3.5" /></Link></Button>}
                >
                  {data.monitoring.activity.length === 0 ? (
                    <p className="flex items-center gap-2 py-6 text-sm text-slate-500"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Quiet period — no security events.</p>
                  ) : (
                    <ul className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                      {data.monitoring.activity.map((e) => (
                        <li key={e.id} className="py-2.5 first:pt-0 last:pb-0">
                          <p className="truncate text-sm font-medium">{e.title}</p>
                          {e.detail ? <p className="line-clamp-1 text-xs text-slate-500">{e.detail}</p> : null}
                          <p className="text-[11px] tabular-nums text-slate-400">{timeAgo(e.createdAt)}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </DataCard>
                <AlertRuleList rules={data.monitoring.alerts} onToggle={toggleRule} onCreate={createRule} onDelete={deleteRule} />
              </div>
            </div>
          ) : null}
        </>
      )}

      <Dialog open={connectKey !== null} onOpenChange={(o) => { if (!o) setConnectKey(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Connect {connectKey === "gsc" ? "Search Console" : connectKey === "adsense" ? "AdSense" : "Telegram bot"}</DialogTitle></DialogHeader>
          <label className="block text-xs font-medium">
            {connectKey === "telegram" ? "Channel or chat ID" : connectKey === "adsense" ? "Publisher ID (ca-pub-…)" : "Property / site URL"}
            <Input className="mt-1" value={connectVal} onChange={(e) => setConnectVal(e.target.value)} placeholder={connectKey === "telegram" ? "@chayanjobs_alerts" : "…"} />
          </label>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConnectKey(null)}>Cancel</Button>
            <Button onClick={connectIntegration} disabled={connecting || !connectVal.trim()} className="bg-teal-700 hover:bg-teal-800">{connecting ? "Connecting…" : "Connect"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {q.isFetching && data ? (
        <div className="flex items-center gap-2 text-xs text-slate-400" aria-live="polite"><Skeleton className="h-3 w-24" /> Refreshing…</div>
      ) : null}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}
