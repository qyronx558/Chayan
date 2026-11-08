"use client";
export const dynamic = "force-dynamic";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, fetcher } from "@/lib/api";
import { isSuperAdmin, isAdmin } from "@/lib/roles";
import { useAdminPageSize, useDensity } from "@/lib/admin/usePageSize";
import { PageHeader } from "@/components/admin/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DataCard } from "@/components/admin/dashboard/DataCard";
import { KpiStrip } from "@/components/admin/dashboard/KpiStrip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/components/ui/toast";
import { TableFooter } from "@/components/admin/data-table/TableFooter";
import { EventToolbar } from "@/components/admin/audit/EventToolbar";
import { FilterPanel } from "@/components/admin/audit/FilterPanel";
import { ActiveFilterTokens } from "@/components/admin/audit/ActiveFilterTokens";
import { SavedViews } from "@/components/admin/audit/SavedViews";
import { EventList } from "@/components/admin/audit/EventList";
import { InsightsPanel } from "@/components/admin/audit/InsightsPanel";
import { RetentionPolicyCard, ScheduleCard, IntegrityCard } from "@/components/admin/audit/RetentionPolicyCard";
import { PurgeDangerZone } from "@/components/admin/audit/PurgeDangerZone";
import { AlertRuleList } from "@/components/admin/audit/AlertRuleList";
import { ChannelCard } from "@/components/admin/audit/ChannelCard";
import type {
  AuditAlertRuleView,
  AuditChannelView,
  AuditEventView,
  AuditFilters,
  AuditInsights,
  AuditKpi,
  ExportScheduleState,
  IntegrityState,
  RetentionState,
  RowDensity,
} from "@/components/admin/audit/types";
import { Activity, Users, ShieldAlert, XCircle, Download, Radio, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type TabKey = "events" | "insights" | "retention" | "alerts";

function useUrlState() {
  const sp = useSearchParams();
  const router = useRouter();
  const get = useCallback(() => ({
    q: sp.get("q") || "",
    action: sp.get("action") || "",
    entity: sp.get("entity") || "",
    actor: sp.get("actor") || "",
    from: sp.get("from") || "",
    to: sp.get("to") || "",
    view: (sp.get("view") || "all") as AuditFilters["view"],
    page: Math.max(1, parseInt(sp.get("page") || "1", 10) || 1),
    tab: (sp.get("tab") || "events") as TabKey,
    focus: sp.get("focus") || "",
  }), [sp]);
  const set = useCallback((patch: Record<string, string>) => {
    const cur = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (!v) cur.delete(k);
      else cur.set(k, v);
    }
    router.replace(`?${cur.toString()}`, { scroll: false });
  }, [sp, router]);
  return { get, set };
}

function AuditPageInner() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { get: getUrl, set: setUrl } = useUrlState();
  const url = getUrl();
  const superView = isSuperAdmin(session?.user?.role);
  const { pageSize, setPageSize, options: pageSizeOptions } = useAdminPageSize("audit-logs", superView);
  const { density: storedDensity, setDensity: setStoredDensity } = useDensity("audit-logs");
  const density: RowDensity = storedDensity === "compact" ? "compact" : "comfy";
  const [filters, setFilters] = useState<AuditFilters>({ q: url.q, action: url.action, entity: url.entity, actor: url.actor, from: url.from, to: url.to, view: superView ? (url.view as AuditFilters["view"]) : "all" });
  const [page, setPage] = useState(url.page);
  const [tab, setTab] = useState<TabKey>(superView ? (["events", "insights", "retention", "alerts"].includes(url.tab) ? url.tab : "events") : "events");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [grouped, setGrouped] = useState(() => {
    try {
      return localStorage.getItem("audit:grouped") === "1";
    } catch {
      return false;
    }
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(url.focus || null);
  const [groupOpen, setGroupOpen] = useState<Set<string>>(new Set());
  const [live, setLive] = useState(false);
  const [liveIds, setLiveIds] = useState<Set<string>>(new Set());
  const [days, setDays] = useState(30);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [purging, setPurging] = useState(false);
  const [exporting, setExporting] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const patch: Record<string, string> = {
      q: filters.q, action: filters.action, entity: filters.entity, from: filters.from, to: filters.to,
      view: filters.view, page: String(page), tab,
    };
    if (superView) patch.actor = filters.actor;
    const t = setTimeout(() => setUrl(patch), 250);
    return () => clearTimeout(t);
  }, [filters, page, tab, superView, setUrl]);

  useEffect(() => {
    try {
      localStorage.setItem("audit:grouped", grouped ? "1" : "0");
    } catch {
    }
  }, [grouped]);

  const eventsUrl = useMemo(() => {
    const p = new URLSearchParams({ page: String(page), limit: String(pageSize) });
    if (filters.q) p.set("q", filters.q);
    if (filters.action) p.set("action", filters.action);
    if (filters.entity) p.set("entity", filters.entity);
    if (superView && filters.actor) p.set("actor", filters.actor);
    if (filters.from) p.set("from", filters.from);
    if (filters.to) p.set("to", filters.to);
    if (superView && filters.view !== "all") p.set("view", filters.view);
    return `/api/admin/audit/events?${p.toString()}`;
  }, [page, pageSize, filters, superView]);

  const { data: eventsData, isLoading: eventsLoading } = useQuery<{ success: boolean; data: AuditEventView[]; pagination: { total: number; totalPages: number }; role: string }>({
    queryKey: ["audit-events", eventsUrl],
    queryFn: () => fetcher(eventsUrl),
    enabled: status === "authenticated",
  });

  const { data: kpiData } = useQuery<{ success: boolean; data: { kpis: AuditKpi[]; total: number } }>({
    queryKey: ["audit-kpis"],
    queryFn: () => fetcher("/api/admin/audit/kpis?days=30"),
    enabled: status === "authenticated" && superView && tab === "events",
  });

  const { data: integrityData } = useQuery<{ success: boolean; data: IntegrityState }>({
    queryKey: ["audit-integrity"],
    queryFn: () => fetcher("/api/admin/audit/integrity"),
    enabled: status === "authenticated" && superView,
  });

  const { data: insightsData, isLoading: insightsLoading } = useQuery<{ success: boolean; data: AuditInsights }>({
    queryKey: ["audit-insights", days],
    queryFn: () => fetcher(`/api/admin/audit/insights?days=${days}`),
    enabled: status === "authenticated" && superView && tab === "insights",
  });

  const { data: retentionData } = useQuery<{ success: boolean; data: RetentionState }>({
    queryKey: ["audit-retention"],
    queryFn: () => fetcher("/api/admin/audit/retention"),
    enabled: status === "authenticated" && superView && tab === "retention",
  });

  const { data: scheduleData } = useQuery<{ success: boolean; data: ExportScheduleState }>({
    queryKey: ["audit-schedule"],
    queryFn: () => fetcher("/api/admin/audit/schedule"),
    enabled: status === "authenticated" && superView && tab === "retention",
  });

  const { data: alertsData } = useQuery<{ success: boolean; data: { rules: AuditAlertRuleView[]; channels: AuditChannelView[]; onCount: number } }>({
    queryKey: ["audit-alerts"],
    queryFn: () => fetcher("/api/admin/audit/alerts"),
    enabled: status === "authenticated" && superView && tab === "alerts",
  });

  useEffect(() => {
    if (!live || status !== "authenticated") return;
    const src = new EventSource("/api/admin/audit/stream");
    src.onmessage = (ev) => {
      try {
        const payload = JSON.parse(ev.data) as { count?: number };
        if (payload.count && payload.count > 0) {
          queryClient.invalidateQueries({ queryKey: ["audit-events"] });
          queryClient.invalidateQueries({ queryKey: ["audit-kpis"] });
        }
      } catch {
      }
    };
    return () => src.close();
  }, [live, status, queryClient]);

  useEffect(() => {
    if (eventsData?.data && eventsData.data.length > 0 && live) {
      const newest = eventsData.data[0].id;
      setLiveIds((prev) => {
        if (prev.has(newest)) return prev;
        const next = new Set(prev);
        next.add(newest);
        setTimeout(() => {
          setLiveIds((p) => {
            const n = new Set(p);
            n.delete(newest);
            return n;
          });
        }, 4000);
        return next;
      });
    }
  }, [eventsData, live]);

  const eventAction = useMutation({
    mutationFn: ({ id, op, note }: { id: string; op: string; note?: string }) =>
      api.patch<{ success: boolean }>(`/api/admin/audit/events/${id}`, op === "note" ? { op, note } : { op }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["audit-events"] });
      if (vars.op === "review") {
        toast("Marked reviewed", "success", { label: "Undo", onClick: () => eventAction.mutate({ id: vars.id, op: "flag" }) });
      } else if (vars.op === "flag" || vars.op === "flag-all") {
        toast(vars.op === "flag-all" ? "Group flagged for review" : "Flagged for review", "success");
      } else if (vars.op === "revert-role") {
        toast("Role change reverted and logged", "success");
      } else if (vars.op === "restore") {
        toast("Items restored from trash and logged", "success");
      }
    },
    onError: (err: Error) => toast(err.message, "destructive"),
  });

  if (status === "loading") return <Skeleton className="h-96 rounded-xl" />;
  if (!session || !isAdmin(session.user.role)) {
    router.push("/login");
    return null;
  }

  const events = eventsData?.data || [];
  const total = eventsData?.pagination.total || 0;
  const totalPages = eventsData?.pagination.totalPages || 1;
  const activeCount = [filters.action, filters.entity, superView ? filters.actor : "", filters.from || filters.to ? "date" : ""].filter(Boolean).length;
  const counts: Record<string, number> = {
    all: total,
    "needs-review": kpiData?.data.kpis.find((k) => k.key === "sensitive")?.reviewCount ?? 0,
    sensitive: kpiData?.data.kpis.find((k) => k.key === "sensitive")?.value ?? 0,
    deletions: 0, approvals: 0, "role-changes": 0, imports: 0, flagged: kpiData?.data.kpis.find((k) => k.key === "sensitive")?.reviewCount ?? 0,
  };
  const kpis = (kpiData?.data.kpis || []).map((k) => ({
    key: k.key, label: k.label, value: k.value, sub: k.sub, deltaPct: k.deltaPct,
    spark: [k.value], needsAction: k.needsAction,
  }));

  async function doExport(format: "CSV" | "JSON", onlySelected: boolean) {
    setExporting(true);
    try {
      const p = new URLSearchParams({ format });
      if (filters.q) p.set("q", filters.q);
      if (filters.action) p.set("action", filters.action);
      if (filters.entity) p.set("entity", filters.entity);
      if (superView && filters.actor) p.set("actor", filters.actor);
      if (filters.from) p.set("from", filters.from);
      if (filters.to) p.set("to", filters.to);
      if (onlySelected && selected.size > 0) p.set("ids", [...selected].join(","));
      if (format === "JSON") {
        const res = await api.get<{ success: boolean; data: AuditEventView[]; count: number }>(`/api/admin/audit/export?${p.toString()}`);
        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `audit-events-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
        toast(`Exported ${res.count} events`, "success");
      } else {
        const res = await fetch(`/api/admin/audit/export?${p.toString()}`);
        if (!res.ok) throw new Error("Export failed");
        const text = await res.text();
        const blob = new Blob([text], { type: "text/csv" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `audit-events-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
        toast("Exported CSV", "success");
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Export failed", "destructive");
    } finally {
      setExporting(false);
    }
  }

  function onFiltersChange(f: AuditFilters) {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    setFilters(f);
    setPage(1);
  }

  const tabs: { key: TabKey; label: string; badge?: number }[] = superView
    ? [
        { key: "events", label: "Events" },
        { key: "insights", label: "Insights" },
        { key: "retention", label: "Retention and archive" },
        { key: "alerts", label: "Alert rules", badge: alertsData?.data.onCount },
      ]
    : [{ key: "events", label: "My activity" }];

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-4">
      <PageHeader
        crumbs={[{ label: "System" }, { label: "System logs" }]}
        title="System logs"
        badge={
          superView ? (
            <Badge variant="outline" className="inline-flex h-[26px] items-center gap-1.5 rounded-full border-rule bg-paper-3 px-2.5 text-xs font-semibold leading-none text-foreground dark:border-rule dark:bg-paper-3 dark:text-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-paper-3" aria-hidden />
              <span className="leading-none">{integrityData?.data.ok === false ? "Integrity issue" : "Integrity verified"}</span>
            </Badge>
          ) : (
            <Badge variant="secondary" className="inline-flex h-[26px] items-center rounded-full px-2.5 text-xs font-semibold leading-none">Read only</Badge>
          )
        }
        description="Append-only audit trail of every admin action. Tamper-evident, never edited or deleted inline."
        actions={
          <>
            <Button
              variant="ghost"
              className="h-9 px-3 text-sm leading-none"
              aria-pressed={live}
              onClick={() => setLive(!live)}
            >
              <span className={cn("mr-2 h-2 w-2 rounded-full", live ? "animate-pulse bg-paper-3" : "bg-paper-3 dark:bg-background/20")} aria-hidden />
              <Radio className="mr-1.5 h-4 w-4" />
              <span className="leading-none">Live tail</span>
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-9 border-rule bg-background px-3 text-sm leading-none  " disabled={exporting}>
                  <Download className="mr-1.5 h-4 w-4" />
                  <span className="leading-none">{superView ? "Export" : "Export my activity"}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-44 p-1.5" align="end">
                <button onClick={() => doExport("CSV", false)} className="flex h-9 w-full items-center rounded-md px-2.5 text-sm leading-none hover:bg-paper-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rule dark:hover:bg-background/5">Export CSV</button>
                <button onClick={() => doExport("JSON", false)} className="flex h-9 w-full items-center rounded-md px-2.5 text-sm leading-none hover:bg-paper-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rule dark:hover:bg-background/5">Export JSON</button>
              </PopoverContent>
            </Popover>
          </>
        }
      />

      <Tabs value={tab} onValueChange={(v) => { setTab(v as TabKey); setPage(1); }}>
        <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-none border-b border-rule bg-transparent p-0 ">
          {tabs.map((t) => (
            <TabsTrigger
              key={t.key}
              value={t.key}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-none border-b-2 border-transparent px-3 text-sm font-medium leading-none text-muted-foreground data-[state=active]:border-rule data-[state=active]:bg-transparent data-[state=active]:text-brick data-[state=active]: dark:text-muted-foreground dark:data-[state=active]:text-brick"
            >
              <span className="leading-none">{t.label}</span>
              {typeof t.badge === "number" ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-paper-3 px-1 text-[11px] font-bold leading-none tabular-nums text-muted-foreground dark:bg-background/10 dark:text-muted-foreground">{t.badge} on</span>
              ) : null}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="events" className="mt-4 space-y-3">
          {superView && kpis.length > 0 ? (
            <KpiStrip kpis={kpis} icons={[Activity, Users, ShieldAlert, XCircle]} range={30} />
          ) : null}
          {!superView ? (
            <div className="flex items-start gap-2 rounded-xl border border-rule bg-background p-3 text-xs text-muted-foreground   dark:text-muted-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-brick dark:text-brick" aria-hidden />
              <span>You can see your own activity only.</span>
            </div>
          ) : null}

          <EventToolbar
            filters={filters}
            onFilters={onFiltersChange}
            activeCount={activeCount}
            filtersOpen={filtersOpen}
            onFiltersOpen={setFiltersOpen}
            density={density}
            onDensity={(d) => setStoredDensity(d === "compact" ? "compact" : "comfortable")}
            grouped={grouped}
            onGrouped={setGrouped}
            showActor={superView}
            resultCount={total}
          />

          {filtersOpen ? (
            <div className="sm:hidden">
              <FilterPanel filters={filters} onChange={onFiltersChange} showActor={superView} resultCount={total} onClose={() => setFiltersOpen(false)} />
            </div>
          ) : null}

          <ActiveFilterTokens filters={filters} onChange={(f) => { setFilters(f); setPage(1); }} />

          {superView ? (
            <SavedViews value={filters.view} onChange={(v) => { setFilters({ ...filters, view: v }); setPage(1); }} counts={counts} />
          ) : null}

          {selected.size > 0 ? (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-rule bg-background px-3 py-2  " role="toolbar" aria-label="Bulk actions">
              <span className="text-xs font-semibold tabular-nums text-foreground dark:text-muted-foreground">{selected.size} selected</span>
              <span className="flex-1" />
              <Button variant="outline" className="h-[30px] px-2.5 text-xs leading-none" onClick={() => doExport("CSV", true)}>Export selected</Button>
              {superView ? (
                <Button
                  variant="outline"
                  className="h-[30px] px-2.5 text-xs leading-none"
                  onClick={() => {
                    [...selected].forEach((id) => eventAction.mutate({ id, op: "flag" }));
                    setSelected(new Set());
                  }}
                >
                  Flag
                </Button>
              ) : null}
              <Button variant="ghost" className="h-[30px] px-2.5 text-xs leading-none" onClick={() => setSelected(new Set())}>Clear</Button>
            </div>
          ) : null}

          <EventList
            events={events}
            total={total}
            loading={eventsLoading}
            density={density}
            grouped={superView && grouped}
            selected={selected}
            onSelect={(id, v) => {
              setSelected((prev) => {
                const next = new Set(prev);
                if (v) next.add(id);
                else next.delete(id);
                return next;
              });
            }}
            onSelectAll={(v) => setSelected(v ? new Set(events.map((e) => e.id)) : new Set())}
            expandedId={expandedId}
            onToggle={setExpandedId}
            isSuper={superView}
            groupOpen={groupOpen}
            onGroupOpen={(key) => {
              setGroupOpen((prev) => {
                const next = new Set(prev);
                if (next.has(key)) next.delete(key);
                else next.add(key);
                return next;
              });
            }}
            onAction={(id, op, note) => eventAction.mutate({ id, op, note })}
            onClearFilters={() => {
              setFilters({ q: "", action: "", entity: "", actor: "", from: "", to: "", view: "all" });
              setPage(1);
            }}
            liveIds={liveIds}
          />

          <TableFooter
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            pageSizeOptions={pageSizeOptions}
            onPageChange={setPage}
            onPageSizeChange={(n) => { setPageSize(n); setPage(1); }}
            itemLabel="events"
          />
        </TabsContent>

        {superView ? (
          <TabsContent value="insights" className="mt-4">
            <InsightsPanel
              data={insightsData?.data || null}
              loading={insightsLoading}
              days={days}
              onDays={setDays}
              onReview={(f) => {
                setFilters({
                  q: f.q || "", action: f.action || "", entity: f.entity || "",
                  actor: f.actor || "", from: f.from || "", to: f.to || "", view: "all",
                });
                setTab("events");
                setPage(1);
              }}
            />
          </TabsContent>
        ) : null}

        {superView ? (
          <TabsContent value="retention" className="mt-4">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {retentionData?.data ? (
                <RetentionPolicyCard
                  policy={retentionData.data}
                  saving={savingPolicy}
                  onSave={async (p) => {
                    setSavingPolicy(true);
                    try {
                      await api.put("/api/admin/audit/retention", p);
                      queryClient.invalidateQueries({ queryKey: ["audit-retention"] });
                      toast("Retention policy saved and logged", "success");
                    } catch (err) {
                      toast(err instanceof Error ? err.message : "Save failed", "destructive");
                    } finally {
                      setSavingPolicy(false);
                    }
                  }}
                />
              ) : (
                <DataCard title="Retention policy" subtitle="Loading"><Skeleton className="h-40" /></DataCard>
              )}
              {scheduleData?.data ? (
                <ScheduleCard
                  schedule={scheduleData.data}
                  saving={savingSchedule}
                  onSave={async (s) => {
                    setSavingSchedule(true);
                    try {
                      await api.put("/api/admin/audit/schedule", s);
                      queryClient.invalidateQueries({ queryKey: ["audit-schedule"] });
                      toast("Export schedule saved and logged", "success");
                    } catch (err) {
                      toast(err instanceof Error ? err.message : "Save failed", "destructive");
                    } finally {
                      setSavingSchedule(false);
                    }
                  }}
                />
              ) : (
                <DataCard title="Scheduled export" subtitle="Loading"><Skeleton className="h-40" /></DataCard>
              )}
              <IntegrityCard
                state={integrityData?.data || null}
                verifying={verifying}
                onVerify={async () => {
                  setVerifying(true);
                  try {
                    const res = await api.post<{ success: boolean; data: IntegrityState }>("/api/admin/audit/integrity");
                    queryClient.invalidateQueries({ queryKey: ["audit-integrity"] });
                    toast(res.data.ok ? `Chain verified (${res.data.checked} events)` : `Mismatch at ${res.data.firstMismatchId}`, res.data.ok ? "success" : "destructive");
                  } catch (err) {
                    toast(err instanceof Error ? err.message : "Verify failed", "destructive");
                  } finally {
                    setVerifying(false);
                  }
                }}
              />
              <PurgeDangerZone
                legalHold={retentionData?.data.legalHold ?? false}
                working={purging}
                onCount={async (d) => {
                  const res = await api.get<{ success: boolean; data: { affected: number } }>(`/api/admin/audit/purge?days=${d}`);
                  return res.data.affected;
                }}
                onPurge={async (d) => {
                  setPurging(true);
                  try {
                    const res = await api.post<{ success: boolean; data: { deleted: number } }>("/api/admin/audit/purge", { days: d, confirm: "DELETE", archive: retentionData?.data.archiveBeforeDelete ?? true });
                    queryClient.invalidateQueries({ queryKey: ["audit-events"] });
                    queryClient.invalidateQueries({ queryKey: ["audit-retention"] });
                    toast(`Purged ${res.data.deleted} events. Purge was logged.`, "success");
                  } catch (err) {
                    toast(err instanceof Error ? err.message : "Purge failed", "destructive");
                  } finally {
                    setPurging(false);
                  }
                }}
              />
            </div>
          </TabsContent>
        ) : null}

        {superView ? (
          <TabsContent value="alerts" className="mt-4">
            <div className="grid grid-cols-1 gap-3">
              <AlertRuleList
                rules={alertsData?.data.rules || []}
                onToggle={async (id, enabled) => {
                  const prev = alertsData?.data.rules;
                  queryClient.setQueryData(["audit-alerts"], (old: unknown) => {
                    const o = old as { success: boolean; data: { rules: AuditAlertRuleView[]; channels: AuditChannelView[]; onCount: number } };
                    if (!o?.data) return o;
                    return { ...o, data: { ...o.data, rules: o.data.rules.map((r) => (r.id === id ? { ...r, enabled } : r)) } };
                  });
                  try {
                    await api.post("/api/admin/audit/alerts", { toggleId: id, enabled });
                    queryClient.invalidateQueries({ queryKey: ["audit-alerts"] });
                    if (!enabled) toast("Rule disabled", "success", { label: "Undo", onClick: () => api.post("/api/admin/audit/alerts", { toggleId: id, enabled: true }).then(() => queryClient.invalidateQueries({ queryKey: ["audit-alerts"] })) });
                    else toast("Rule enabled", "success");
                  } catch {
                    queryClient.setQueryData(["audit-alerts"], (old: unknown) => {
                      const o = old as { success: boolean; data: { rules: AuditAlertRuleView[] } };
                      void prev;
                      return o;
                    });
                    toast("Toggle failed", "destructive");
                  }
                }}
                onCreate={async (r) => {
                  try {
                    await api.post("/api/admin/audit/alerts", r);
                    queryClient.invalidateQueries({ queryKey: ["audit-alerts"] });
                    toast("Alert rule created and logged", "success");
                  } catch (err) {
                    toast(err instanceof Error ? err.message : "Create failed", "destructive");
                  }
                }}
              />
              <ChannelCard
                channels={alertsData?.data.channels || []}
                onToggle={async (type, connect) => {
                  try {
                    await api.post("/api/admin/audit/alerts", { channelType: type, connect });
                    queryClient.invalidateQueries({ queryKey: ["audit-alerts"] });
                    toast(`${type} ${connect ? "connected" : "disconnected"}`, "success");
                  } catch (err) {
                    toast(err instanceof Error ? err.message : "Channel update failed", "destructive");
                  }
                }}
              />
            </div>
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}

export default function AdminAuditLogsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 rounded-xl" />}>
      <AuditPageInner />
    </Suspense>
  );
}
