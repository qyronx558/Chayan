"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { api, fetcher } from "@/lib/api";
import { isSuperAdmin } from "@/lib/roles";
import { ADMIN_PAGE_SIZES, type Density } from "@/lib/admin/usePageSize";
import { formatDate, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusDot } from "@/components/admin/dashboard/StatusDot";
import { TableFooter } from "@/components/admin/data-table/TableFooter";
import { ExportMenu } from "@/components/admin/data-table/ExportMenu";
import {
  ListToolbar,
  AuditDialog,
  RejectDialog,
  ActiveFilterPills,
} from "@/components/admin/list/list-parts";
import { T_CARD, T_PRIMARY, T_HEAD_CELL, initials } from "@/components/admin/list/tokens";
import { ReviewDecisions } from "@/components/admin/ReviewDecisions";
import {
  CheckCircle2,
  XCircle,
  History,
  Inbox,
  ArrowRight,
} from "lucide-react";

type QueueTab = "PENDING" | "APPROVED" | "REJECTED";

interface QueueRow {
  id: string;
  title: string;
  slug: string;
  moderation: string | null;
  reviewNote: string | null;
  createdAt: string;
  createdById: string | null;
  createdBy: { id: string; name: string | null; email: string } | null;
  module: string;
  moduleLabel: string;
}

interface QueueResponse {
  success: boolean;
  data: QueueRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  counts: { pending: number; approved: number; rejected: number };
  modules: { key: string; label: string; count: number }[];
}

const DENSITY_KEY = "list:density:review";
const SIZE_KEY = "admin:pageSize:review";

function readDensity(): Density {
  try {
    return window.localStorage.getItem(DENSITY_KEY) === "compact" ? "compact" : "comfortable";
  } catch {
    return "comfortable";
  }
}

function readSize(): number {
  try {
    const n = parseInt(window.localStorage.getItem(SIZE_KEY) || "25", 10);
    return (ADMIN_PAGE_SIZES as readonly number[]).includes(n) ? n : 25;
  } catch {
    return 25;
  }
}

export default function AdminReview() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchRef = useRef<HTMLInputElement | null>(null);

  const [tab, setTab] = useState<QueueTab>("PENDING");
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [module, setModule] = useState("");
  const [adminId, setAdminId] = useState("");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(25);
  const [density, setDensity] = useState<Density>("comfortable");
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [rejectIds, setRejectIds] = useState<string[] | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [working, setWorking] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);

  useEffect(() => {
    setDensity(readDensity());
    setSize(readSize());
  }, []);

  useEffect(() => {
    if (input === q) return;
    const t = setTimeout(() => {
      setQ(input);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [input, q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === "Escape") {
        setSelection(new Set());
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const setDensityPersist = (d: Density) => {
    setDensity(d);
    try {
      window.localStorage.setItem(DENSITY_KEY, d);
    } catch {
      
    }
  };

  const setSizePersist = (n: number) => {
    setSize(n);
    setPage(1);
    try {
      window.localStorage.setItem(SIZE_KEY, String(n));
    } catch {
      
    }
  };

  const listUrl = useMemo(() => {
    const p = new URLSearchParams();
    p.set("moderation", tab);
    p.set("page", String(page));
    p.set("limit", String(size));
    if (q) p.set("search", q);
    if (module) p.set("module", module);
    if (adminId) p.set("createdById", adminId);
    return `/api/admin/queue?${p.toString()}`;
  }, [tab, page, size, q, module, adminId]);

  const queueQuery = useQuery<QueueResponse>({
    queryKey: ["review-queue-v2", listUrl],
    queryFn: () => fetcher<QueueResponse>(listUrl),
    enabled: status === "authenticated" && !!session && isSuperAdmin(session.user.role),
  });

  const uploadersQuery = useQuery<{ success: boolean; data: { admins: { adminId: string; name: string | null; email: string }[] } }>({
    queryKey: ["list-uploaders"],
    queryFn: () => fetcher("/api/admin/overview"),
    enabled: status === "authenticated" && !!session && isSuperAdmin(session.user.role),
    staleTime: 60 * 1000,
  });

  if (status === "loading") {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }
  if (!session || !isSuperAdmin(session.user.role)) {
    router.push("/login");
    return null;
  }

  const rows = queueQuery.data?.data ?? [];
  const pagination = queueQuery.data?.pagination;
  const counts = queueQuery.data?.counts;
  const modules = queueQuery.data?.modules ?? [];
  const pendingTotal = counts?.pending ?? 0;

  const uploaderOptions = (uploadersQuery.data?.data.admins ?? []).map((a) => ({
    id: a.adminId,
    name: a.name ? `${a.name} · ${a.email}` : a.email,
  }));

  const moduleOptions = modules.map((m) => ({ id: m.key, name: `${m.label} (${m.count})` }));

  const activeFilterCount = (module ? 1 : 0) + (adminId ? 1 : 0);
  const pills = [
    ...(module ? [{ key: "module", label: `Module: ${modules.find((m) => m.key === module)?.label ?? module}` }] : []),
    ...(adminId
      ? [{ key: "uploader", label: `Admin: ${uploaderOptions.find((o) => o.id === adminId)?.name ?? adminId.slice(0, 8)}` }]
      : []),
  ];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["review-queue-v2"] });
    queryClient.invalidateQueries({ queryKey: ["review-decisions"] });
  };

  const undoToPending = async (ids: string[], mod: string) => {
    try {
      await api.post("/api/admin/bulk", { module: mod, ids, action: "submit" });
      invalidate();
      toast("Moved back to pending", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Undo failed", "destructive");
    }
  };

  const doApprove = async (targets: QueueRow[]) => {
    if (targets.length === 0) return;
    setWorking(true);
    try {
      const byModule = new Map<string, string[]>();
      for (const t of targets) {
        const arr = byModule.get(t.module) ?? [];
        arr.push(t.id);
        byModule.set(t.module, arr);
      }
      let ok = 0;
      for (const [mod, ids] of byModule) {
        const res = await api.post("/api/admin/bulk", { module: mod, ids, action: "approve" });
        ok += (res as { data?: { updated?: number } })?.data?.updated ?? ids.length;
      }
      setSelection(new Set());
      invalidate();
      const firstMod = targets[0].module;
      toast(`Approved ${ok} item${ok === 1 ? "" : "s"} — now live`, "success", {
        label: "Undo",
        onClick: () => void undoToPending(targets.map((t) => t.id), firstMod),
      });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Approve failed", "destructive");
    } finally {
      setWorking(false);
    }
  };

  const doReject = async (ids: string[], note: string) => {
    const targets = rows.filter((r) => ids.includes(r.id));
    if (targets.length === 0) return;
    setRejecting(true);
    try {
      const byModule = new Map<string, string[]>();
      for (const t of targets) {
        const arr = byModule.get(t.module) ?? [];
        arr.push(t.id);
        byModule.set(t.module, arr);
      }
      let ok = 0;
      for (const [mod, mIds] of byModule) {
        const res = await api.post("/api/admin/bulk", { module: mod, ids: mIds, action: "reject", note });
        ok += (res as { data?: { updated?: number } })?.data?.updated ?? mIds.length;
      }
      setRejectIds(null);
      setSelection(new Set());
      invalidate();
      const firstMod = targets[0].module;
      toast(`Rejected ${ok} item${ok === 1 ? "" : "s"}`, "success", {
        label: "Undo",
        onClick: () => void undoToPending(targets.map((t) => t.id), firstMod),
      });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Reject failed", "destructive");
    } finally {
      setRejecting(false);
    }
  };

  const selectedRows = rows.filter((r) => selection.has(r.id));

  const reviewNext = () => {
    if (rows.length === 0) {
      toast("Queue is clear — nothing pending", "success");
      return;
    }
    const first = rows[0];
    setSelection(new Set([first.id]));
    document.getElementById("review-table")?.scrollIntoView({ behavior: "smooth", block: "start" });
    toast(`Selected “${first.title.slice(0, 60)}” for review`, "default");
  };

  const toggleAll = () => {
    setSelection((prev) => (prev.size === rows.length && rows.length > 0 ? new Set() : new Set(rows.map((r) => r.id))));
  };

  const toggleOne = (id: string) => {
    setSelection((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const badge =
    pendingTotal > 0 ? (
      <Badge className="bg-amber-100 font-semibold text-amber-800 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-200">
        {pendingTotal} pending
      </Badge>
    ) : (
      <Badge className="bg-emerald-100 font-semibold text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-200">
        All clear
      </Badge>
    );

  const tabs: { key: QueueTab; label: string; count: number | undefined }[] = [
    { key: "PENDING", label: "Pending", count: counts?.pending },
    { key: "APPROVED", label: "Approved", count: counts?.approved },
    { key: "REJECTED", label: "Rejected", count: counts?.rejected },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        crumbs={[{ label: "Manage" }, { label: "Content verification" }]}
        title="Content verification"
        badge={badge}
        description="Admin uploads only — approve to publish, reject with feedback."
        actions={
          <>
            <Button type="button" variant="ghost" size="sm" onClick={() => setAuditOpen(true)}>
              <History className="mr-1.5 h-3.5 w-3.5" /> Audit trail
            </Button>
            <ExportMenu rows={rows as unknown as Record<string, unknown>[]} filename="verification-queue" variant="secondary" />
            <Button type="button" size="sm" className={T_PRIMARY} onClick={reviewNext}>
              Review next <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Status filter">
        {tabs.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setTab(t.key);
                setPage(1);
                setSelection(new Set());
              }}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors",
                active
                  ? "border-teal-700 bg-teal-700 text-white shadow-sm dark:border-teal-600 dark:bg-teal-600"
                  : "border-slate-200 bg-white text-slate-600 hover:border-teal-600/40 hover:text-teal-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300 dark:hover:text-teal-300"
              )}
            >
              {t.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-px text-[11px] font-bold tabular-nums",
                  active ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400"
                )}
              >
                {t.count ?? "…"}
              </span>
            </button>
          );
        })}
      </div>

      {modules.length > 0 && (
        <div className="flex flex-wrap gap-1.5" aria-label="Module filter">
          <button
            type="button"
            onClick={() => {
              setModule("");
              setPage(1);
            }}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              !module
                ? "border-teal-700 bg-teal-700/10 text-teal-800 dark:border-teal-500/40 dark:text-teal-200"
                : "border-slate-200 bg-white text-slate-500 hover:border-teal-600/40 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400"
            )}
          >
            All modules
          </button>
          {modules.map((m) => {
            const active = module === m.key;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => {
                  setModule(active ? "" : m.key);
                  setPage(1);
                }}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs font-medium tabular-nums transition-colors",
                  active
                    ? "border-teal-700 bg-teal-700/10 text-teal-800 dark:border-teal-500/40 dark:text-teal-200"
                    : "border-slate-200 bg-white text-slate-500 hover:border-teal-600/40 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400"
                )}
              >
                {m.label} · {m.count}
              </button>
            );
          })}
        </div>
      )}

      <Card className={T_CARD}>
        <div className="space-y-2.5 border-b border-slate-100 p-3 sm:p-4 dark:border-white/[0.06]">
          <ListToolbar
            q={input}
            onQ={setInput}
            searchRef={searchRef}
            placeholder="Search by title or slug…"
            filters={{
              defs: [{ key: "module", label: "Module", endpoint: "/api/admin/queue" }],
              values: module ? { module } : {},
              lookups: { module: moduleOptions },
              showUploader: true,
              uploaderOptions,
              uploader: adminId,
            }}
            onFilter={(key, value) => {
              if (key === "module") setModule(value);
              setPage(1);
            }}
            onUploader={(value) => {
              setAdminId(value);
              setPage(1);
            }}
            onClearFilters={() => {
              setModule("");
              setAdminId("");
              setPage(1);
            }}
            activeFilterCount={activeFilterCount}
            density={density}
            onDensity={setDensityPersist}
          />
          <ActiveFilterPills
            pills={pills}
            onRemove={(key) => {
              if (key === "module") setModule("");
              else setAdminId("");
              setPage(1);
            }}
            onClear={() => {
              setModule("");
              setAdminId("");
              setPage(1);
            }}
          />
        </div>

        <div id="review-table" className="overflow-x-auto saas-table-scroll">
          <Table className="saas-table" data-density={density}>
            <TableHeader className="sticky top-0 z-10">
              <TableRow className="bg-slate-50/95 backdrop-blur hover:bg-slate-50/95 dark:bg-[#0b1220]/95">
                <TableHead className="w-10">
                  <Checkbox
                    checked={rows.length > 0 && selection.size === rows.length ? true : selection.size > 0 ? "indeterminate" : false}
                    onCheckedChange={toggleAll}
                    aria-label="Select all rows on this page"
                  />
                </TableHead>
                <TableHead><span className={T_HEAD_CELL}>Item</span></TableHead>
                <TableHead><span className={T_HEAD_CELL}>Uploaded by</span></TableHead>
                <TableHead><span className={T_HEAD_CELL}>Created</span></TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queueQuery.isLoading && rows.length === 0 ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={`sk-${i}`}>
                    <TableCell colSpan={5}><Skeleton className="h-9 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <div className="flex flex-col items-center gap-2 py-12 text-center">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/[0.06]">
                        <Inbox className="h-6 w-6 text-slate-400" />
                      </span>
                      <p className="font-semibold text-slate-700 dark:text-slate-200">
                        {tab === "PENDING" ? "Queue is clear" : tab === "APPROVED" ? "No approved items" : "No rejected items"}
                      </p>
                      <p className="max-w-xs text-sm text-slate-400">
                        {q || module || adminId
                          ? "Try a different search or filter."
                          : tab === "PENDING"
                            ? "Every admin upload has been reviewed."
                            : "Items will appear here after review decisions."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => {
                  const selected = selection.has(r.id);
                  const t = new Date(r.createdAt).getTime();
                  return (
                    <TableRow
                      key={r.id}
                      data-selected={selected}
                      className="group border-b border-slate-100 transition-colors last:border-0 hover:bg-teal-50/40 data-[selected=true]:bg-teal-50/70 dark:border-white/[0.06] dark:hover:bg-white/[0.03] dark:data-[selected=true]:bg-teal-950/40"
                    >
                      <TableCell className={cn(density === "compact" && "py-2")}>
                        <Checkbox checked={selected} onCheckedChange={() => toggleOne(r.id)} aria-label={`Select ${r.title}`} />
                      </TableCell>
                      <TableCell className={cn(density === "compact" && "py-2")}>
                        <div className="min-w-0 max-w-[420px]">
                          <p className="truncate text-[13.5px] font-semibold text-slate-900 dark:text-slate-100" title={r.title}>
                            {r.title}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-slate-400 dark:text-slate-500">
                            {r.moduleLabel}
                            {r.reviewNote ? `  •  ${r.reviewNote}` : ""}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className={cn(density === "compact" && "py-2")}>
                        <span className="flex items-center gap-2" title={r.createdBy?.email ?? ""}>
                          <Avatar className="h-7 w-7 shrink-0 border border-slate-200 dark:border-white/10">
                            <AvatarFallback className="bg-teal-700 text-[10px] font-bold text-white dark:bg-teal-600">
                              {initials(r.createdBy?.name, r.createdBy?.email)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="max-w-[140px] truncate text-[13px] text-slate-600 dark:text-slate-300">
                            {r.createdBy?.name || r.createdBy?.email || "Unknown"}
                          </span>
                        </span>
                      </TableCell>
                      <TableCell className={cn(density === "compact" && "py-2")}>
                        <span className="whitespace-nowrap text-[13px] tabular-nums text-slate-600 dark:text-slate-300" title={formatDate(r.createdAt)}>
                          {Number.isNaN(t) ? "-" : formatDistanceToNow(new Date(t), { addSuffix: true })}
                        </span>
                      </TableCell>
                      <TableCell className={cn("text-right", density === "compact" && "py-2")}>
                        {tab === "PENDING" ? (
                          <span className="flex items-center justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                            <button
                              type="button"
                              title="Approve"
                              disabled={working}
                              onClick={() => void doApprove([r])}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-emerald-700 dark:text-slate-500 dark:hover:bg-white/[0.06]"
                            >
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            </button>
                            <button
                              type="button"
                              title="Reject with note"
                              disabled={working}
                              onClick={() => setRejectIds([r.id])}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-amber-700 dark:text-slate-500 dark:hover:bg-white/[0.06]"
                            >
                              <XCircle className="h-4 w-4 text-amber-600" />
                            </button>
                          </span>
                        ) : (
                          <StatusDot value={r.moderation ?? tab} className="justify-end" />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {pagination && (
          <TableFooter
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            pageSize={size}
            pageSizeOptions={ADMIN_PAGE_SIZES}
            onPageChange={(p) => setPage(p)}
            onPageSizeChange={setSizePersist}
            itemLabel="items"
          />
        )}
      </Card>

      {selection.size > 0 && (
        <div className="fixed bottom-5 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white/95 px-3 py-2.5 shadow-xl backdrop-blur dark:border-white/10 dark:bg-[#0b1220]/95">
          <span className="mr-1 text-[13px] font-semibold tabular-nums text-slate-700 dark:text-slate-200">
            {selection.size} selected
          </span>
          <Button type="button" size="sm" disabled={working} onClick={() => void doApprove(selectedRows)} className="bg-emerald-600 text-white hover:bg-emerald-700">
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Approve
          </Button>
          <Button type="button" size="sm" variant="outline" disabled={working} onClick={() => setRejectIds(selectedRows.map((r) => r.id))}>
            <XCircle className="mr-1.5 h-3.5 w-3.5" /> Reject
          </Button>
          <Button type="button" size="sm" variant="ghost" disabled={working} onClick={() => setSelection(new Set())}>
            Clear
          </Button>
        </div>
      )}

      <Card className={cn(T_CARD, "p-4 sm:p-5")}>
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Recent review decisions</h2>
        <div className="mt-2">
          <ReviewDecisions limit={10} />
        </div>
      </Card>

      <RejectDialog
        open={rejectIds !== null}
        count={rejectIds?.length ?? 0}
        pending={rejecting}
        onCancel={() => setRejectIds(null)}
        onConfirm={(note) => rejectIds && void doReject(rejectIds, note)}
      />

      <AuditDialog
        open={auditOpen}
        onOpenChange={setAuditOpen}
        title="Content verification — audit trail"
        entity=""
        mine={false}
      />
    </div>
  );
}
