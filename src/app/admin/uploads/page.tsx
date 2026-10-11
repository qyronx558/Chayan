"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { fetcher } from "@/lib/api";
import { isSuperAdmin } from "@/lib/roles";
import { ADMIN_PAGE_SIZES, type Density } from "@/lib/admin/usePageSize";
import { formatDate, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusDot } from "@/components/admin/dashboard/StatusDot";
import { TableFooter } from "@/components/admin/data-table/TableFooter";
import { DensityToggle } from "@/components/admin/data-table/DensityToggle";
import { ExportMenu } from "@/components/admin/data-table/ExportMenu";
import { AuditDialog, ActiveFilterPills } from "@/components/admin/list/list-parts";
import { T_CARD, T_HEAD_CELL, initials } from "@/components/admin/list/tokens";
import { AdminIdBadge } from "@/components/admin/AdminIdBadge";
import { Search, SlidersHorizontal, X, History, Eye, Lock, Inbox } from "lucide-react";

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

const DENSITY_KEY = "list:density:uploads";
const SIZE_KEY = "admin:pageSize:uploads";

export default function AdminUploads() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement | null>(null);

  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [module, setModule] = useState("");
  const [adminId, setAdminId] = useState("");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(25);
  const [density, setDensity] = useState<Density>("comfortable");
  const [popOpen, setPopOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [preview, setPreview] = useState<QueueRow | null>(null);

  useEffect(() => {
    try {
      const d = window.localStorage.getItem(DENSITY_KEY);
      if (d === "compact" || d === "comfortable") setDensity(d);
      const s = parseInt(window.localStorage.getItem(SIZE_KEY) || "25", 10);
      if ((ADMIN_PAGE_SIZES as readonly number[]).includes(s)) setSize(s);
    } catch {
      
    }
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
    p.set("page", String(page));
    p.set("limit", String(size));
    if (q) p.set("search", q);
    if (module) p.set("module", module);
    if (adminId) p.set("createdById", adminId);
    return `/api/admin/queue?${p.toString()}`;
  }, [page, size, q, module, adminId]);

  const queueQuery = useQuery<QueueResponse>({
    queryKey: ["admin-uploads-v2", listUrl],
    queryFn: () => fetcher<QueueResponse>(listUrl),
    enabled: status === "authenticated" && !!session && isSuperAdmin(session.user.role),
  });

  const uploadersQuery = useQuery<{ success: boolean; data: { admins: { adminId: string; name: string | null; email: string; total: number }[] } }>({
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
  const modules = queueQuery.data?.modules ?? [];
  const admins = uploadersQuery.data?.data.admins ?? [];
  const activeFilterCount = (module ? 1 : 0) + (adminId ? 1 : 0);

  const pills = [
    ...(module ? [{ key: "module", label: `Module: ${modules.find((m) => m.key === module)?.label ?? module}` }] : []),
    ...(adminId
      ? [{ key: "uploader", label: `Admin: ${admins.find((a) => a.adminId === adminId)?.email ?? adminId.slice(0, 8)}` }]
      : []),
  ];

  const clearFilters = () => {
    setModule("");
    setAdminId("");
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        crumbs={[{ label: "Manage" }, { label: "Admin uploads" }]}
        title="Admin uploads"
        badge={
          <Badge variant="secondary" className="gap-1 font-semibold">
            <Lock className="h-3 w-3" /> View only
          </Badge>
        }
        description="Every admin upload in one place - read-only. Use Content verification for moderation."
        actions={
          <>
            <Button type="button" variant="ghost" size="sm" onClick={() => setAuditOpen(true)}>
              <History className="mr-1.5 h-3.5 w-3.5" /> Audit trail
            </Button>
            <ExportMenu rows={rows as unknown as Record<string, unknown>[]} filename="admin-uploads" variant="secondary" />
          </>
        }
      />

      <Card className={T_CARD}>
        <div className="space-y-2.5 border-b border-slate-100 p-3 sm:p-4 dark:border-white/[0.06]">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-52 flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                ref={searchRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Search by title or slug…"
                className="bg-white pl-8 pr-10 dark:bg-white/[0.03]"
                aria-label="Search uploads"
              />
              <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] font-semibold text-slate-400 sm:block dark:border-white/10 dark:bg-white/[0.05]">
                /
              </kbd>
            </div>
            <Select value={module || "ALL"} onValueChange={(v) => { setModule(v === "ALL" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="All modules" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All modules</SelectItem>
                {modules.map((m) => (
                  <SelectItem key={m.key} value={m.key}>
                    {m.label} ({m.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={adminId || "ALL"} onValueChange={(v) => { setAdminId(v === "ALL" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-[210px]">
                <SelectValue placeholder="All admins" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All admins</SelectItem>
                {admins.map((a) => (
                  <SelectItem key={a.adminId} value={a.adminId}>
                    {a.name || a.email} · {a.total}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Popover open={popOpen} onOpenChange={setPopOpen}>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="relative">
                  <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" /> Filters
                  {activeFilterCount > 0 && (
                    <span className="ml-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-700 px-1 text-[11px] font-bold text-white dark:bg-teal-600">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Admin ID (cuid)</Label>
                  <Input
                    value={adminId}
                    onChange={(e) => { setAdminId(e.target.value.trim()); setPage(1); }}
                    placeholder="Paste admin cuid…"
                    className="font-mono text-xs"
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="button" variant="ghost" size="sm" onClick={() => { clearFilters(); setPopOpen(false); }}>
                    <X className="mr-1 h-3.5 w-3.5" /> Clear all
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            <div className="ml-auto">
              <DensityToggle value={density} onChange={setDensityPersist} />
            </div>
          </div>
          <ActiveFilterPills
            pills={pills}
            onRemove={(key) => {
              if (key === "module") setModule("");
              else setAdminId("");
              setPage(1);
            }}
            onClear={clearFilters}
          />
        </div>

        <div className="overflow-x-auto saas-table-scroll">
          <Table className="saas-table" data-density={density}>
            <TableHeader className="sticky top-0 z-10">
              <TableRow className="bg-slate-50/95 backdrop-blur hover:bg-slate-50/95 dark:bg-[#0b1220]/95">
                <TableHead><span className={T_HEAD_CELL}>Title</span></TableHead>
                <TableHead><span className={T_HEAD_CELL}>Uploaded by</span></TableHead>
                <TableHead><span className={T_HEAD_CELL}>Status</span></TableHead>
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
                      <p className="font-semibold text-slate-700 dark:text-slate-200">No uploads found</p>
                      <p className="max-w-xs text-sm text-slate-400">
                        {q || module || adminId ? "Try a different search or filter." : "Admin uploads will appear here."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => {
                  const t = new Date(r.createdAt).getTime();
                  return (
                    <TableRow
                      key={`${r.module}-${r.id}`}
                      className="group border-b border-slate-100 transition-colors last:border-0 hover:bg-teal-50/40 dark:border-white/[0.06] dark:hover:bg-white/[0.03]"
                    >
                      <TableCell className={cn(density === "compact" && "py-2")}>
                        <div className="min-w-0 max-w-[380px]">
                          <p className="truncate text-[13.5px] font-semibold text-slate-900 dark:text-slate-100" title={r.title}>
                            {r.title}
                          </p>
                          <p className="mt-0.5 truncate font-mono text-xs text-slate-400 dark:text-slate-500" title={`/${r.slug}`}>
                            /{r.slug} · {r.moduleLabel}
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
                          <span className="min-w-0">
                            <span className="block max-w-[150px] truncate text-[13px] font-medium text-slate-700 dark:text-slate-200">
                              {r.createdBy?.name || "Unknown"}
                            </span>
                            <span className="block max-w-[150px] truncate text-xs text-slate-400">
                              {r.createdBy?.email ?? ""}
                            </span>
                          </span>
                        </span>
                      </TableCell>
                      <TableCell className={cn(density === "compact" && "py-2")}>
                        <StatusDot value={r.moderation ?? "PENDING"} />
                      </TableCell>
                      <TableCell className={cn(density === "compact" && "py-2")}>
                        <span className="whitespace-nowrap text-[13px] tabular-nums text-slate-600 dark:text-slate-300" title={formatDate(r.createdAt)}>
                          {Number.isNaN(t) ? "-" : formatDistanceToNow(new Date(t), { addSuffix: true })}
                        </span>
                      </TableCell>
                      <TableCell className={cn("text-right", density === "compact" && "py-2")}>
                        <span className="flex items-center justify-end opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                          <button
                            type="button"
                            title="View"
                            onClick={() => setPreview(r)}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium text-slate-400 transition-colors hover:bg-slate-100 hover:text-teal-700 dark:text-slate-500 dark:hover:bg-white/[0.06] dark:hover:text-teal-300"
                          >
                            <Eye className="h-4 w-4" /> View
                          </button>
                        </span>
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
            itemLabel="uploads"
          />
        )}
      </Card>

      <Dialog open={!!preview} onOpenChange={(o) => { if (!o) setPreview(null); }}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Read-only preview</DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="space-y-3 text-sm">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{preview.title}</h3>
                <p className="font-mono text-xs text-slate-400">/{preview.slug} · {preview.moduleLabel}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusDot value={preview.moderation ?? "PENDING"} />
                <span className="text-xs text-slate-500">
                  by {preview.createdBy?.name || "Unknown"} ({preview.createdBy?.email || preview.createdById})
                </span>
                <AdminIdBadge id={preview.createdBy?.id || preview.createdById} />
                <span className="text-xs text-slate-400">{formatDate(preview.createdAt)}</span>
              </div>
              {preview.reviewNote && (
                <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                  <span className="font-semibold">Reviewer note: </span>{preview.reviewNote}
                </div>
              )}
              <p className="text-xs text-slate-400">Read-only - no edits, approvals, or deletions can be made from this page.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AuditDialog
        open={auditOpen}
        onOpenChange={setAuditOpen}
        title="Admin uploads - audit trail"
        entity=""
        mine={false}
      />
    </div>
  );
}
