"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
} from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import { api, fetcher } from "@/lib/api";
import { can, isListTab } from "@/lib/admin/access";
import { ADMIN_PAGE_SIZES, type Density } from "@/lib/admin/usePageSize";
import { exportToCsv, flattenForCsv } from "@/lib/admin-export";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "@/components/ui/toast";
import { ExportMenu } from "@/components/admin/data-table/ExportMenu";
import { TableFooter } from "@/components/admin/data-table/TableFooter";
import { ImportWizard } from "@/components/admin/data-table/ImportWizard";
import { cn } from "@/lib/utils";
import {
  StatusTabs,
  ListToolbar,
  BulkBar,
  DeleteConfirm,
  RejectDialog,
  AuditDialog,
  ActiveFilterPills,
} from "./list-parts";
import { T_CARD, T_HEAD_CELL, T_PRIMARY, initials, modDot, modLabel, modText } from "./tokens";
import type {
  BaseRow,
  ListModuleConfig,
  ListQuery,
  ListResponse,
  LookupOption,
} from "./types";
import {
  Plus,
  History,
  Upload,
  ExternalLink,
  Copy,
  Check,
  Pencil,
  Send,
  CheckCircle2,
  XCircle,
  Trash2,
  ChevronRight,
  Inbox,
} from "lucide-react";

const DENSITY_KEY = "list:density";

function parseSize(raw: string | null, fallback: number): number {
  const n = raw ? parseInt(raw, 10) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return (ADMIN_PAGE_SIZES as readonly number[]).includes(n) ? n : fallback;
}

export default function ListPage<TRow extends BaseRow>({
  config,
}: {
  config: ListModuleConfig<TRow>;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const searchRef = useRef<HTMLInputElement | null>(null);

  const role = session?.user?.role ?? null;
  const isSuper = role === "SUPER_ADMIN";
  const staff = role === "ADMIN" || isSuper;

  const sp = searchParams.toString();
  const query: ListQuery = useMemo(() => {
    const p = new URLSearchParams(sp);
    const tabRaw = p.get("tab");
    const filters: Record<string, string> = {};
    for (const f of config.filters) {
      const v = p.get(`f_${f.key}`);
      if (v) filters[f.key] = v;
    }
    return {
      q: p.get("q") ?? "",
      tab: tabRaw && isListTab(tabRaw) ? tabRaw : "all",
      page: Math.max(1, parseInt(p.get("page") ?? "1", 10) || 1),
      size: parseSize(p.get("size"), isSuper ? 25 : 10),
      density: p.get("density") === "compact" ? "compact" : "comfortable",
      filters,
      uploader: isSuper ? p.get("uploader") ?? "" : "",
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp, isSuper]);

  const setParams = useCallback(
    (patch: Record<string, string | undefined>, resetPage = true) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined || v === "") next.delete(k);
        else next.set(k, v);
      }
      if (resetPage) next.set("page", "1");
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const [input, setInput] = useState(query.q);
  useEffect(() => setInput(query.q), [query.q]);
  useEffect(() => {
    if (input === query.q) return;
    const t = setTimeout(() => setParams({ q: input }), 350);
    return () => clearTimeout(t);
  }, [input, query.q, setParams]);

  useEffect(() => {
    if (!searchParams.get("density")) {
      try {
        const stored = window.localStorage.getItem(DENSITY_KEY);
        if (stored === "compact" || stored === "comfortable") {
          const next = new URLSearchParams(searchParams.toString());
          next.set("density", stored);
          router.replace(`${pathname}?${next.toString()}`, { scroll: false });
        }
      } catch {
        /* ignore */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setDensity = useCallback(
    (d: Density) => {
      try {
        window.localStorage.setItem(DENSITY_KEY, d);
      } catch {
        /* ignore */
      }
      setParams({ density: d }, false);
    },
    [setParams]
  );

  const setSize = useCallback(
    (n: number) => {
      try {
        window.localStorage.setItem(`admin:pageSize:${config.queryKey}`, String(n));
      } catch {
        /* ignore */
      }
      setParams({ size: String(n) });
    },
    [config.queryKey, setParams]
  );

  const listUrl = useMemo(() => {
    const p = new URLSearchParams();
    p.set("scope", isSuper ? "all" : "mine");
    p.set("page", String(query.page));
    p.set("limit", String(query.size));
    if (query.q) p.set("search", query.q);
    if (query.tab !== "all") p.set("tab", query.tab);
    for (const f of config.filters) {
      const v = query.filters[f.key];
      if (v) p.set(f.param ?? f.key, v);
    }
    if (query.uploader) p.set("createdById", query.uploader);
    p.set("includeCounts", "1");
    return `${config.endpoint}?${p.toString()}`;
  }, [config.endpoint, config.filters, isSuper, query]);

  const listQuery = useQuery<ListResponse<TRow>>({
    queryKey: [config.queryKey, listUrl],
    queryFn: () => fetcher<ListResponse<TRow>>(listUrl),
    enabled: status === "authenticated" && staff,
  });

  const lookupQueries = useQueries({
    queries: config.lookups.map((l) => ({
      queryKey: ["list-lookup", l.endpoint],
      queryFn: () =>
        fetcher<{ success: boolean; data: { id: string; name?: string | null; title?: string | null }[] }>(l.endpoint),
      staleTime: 5 * 60 * 1000,
    })),
  });
  const lookups: Record<string, LookupOption[]> = useMemo(() => {
    const out: Record<string, LookupOption[]> = {};
    config.lookups.forEach((l, i) => {
      const rows = lookupQueries[i]?.data?.data ?? [];
      out[l.key] = rows.map((r) => ({
        id: r.id,
        name: r.name ?? r.title ?? r.id,
        slug: (r as { slug?: string | null }).slug ?? undefined,
      }));
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lookupQueries.map((q) => q.dataUpdatedAt).join(",")]);

  const filterLookups: Record<string, LookupOption[]> = useMemo(() => {
    const out: Record<string, LookupOption[]> = {};
    for (const f of config.filters) out[f.key] = lookups[f.lookupKey ?? f.key] ?? [];
    return out;
  }, [config.filters, lookups]);

  const uploadersQuery = useQuery<{ success: boolean; data: { admins: { adminId: string; name: string | null; email: string }[] } }>({
    queryKey: ["list-uploaders"],
    queryFn: () => fetcher("/api/admin/overview"),
    enabled: status === "authenticated" && isSuper,
    staleTime: 60 * 1000,
  });
  const uploaderOptions: LookupOption[] = useMemo(
    () =>
      (uploadersQuery.data?.data.admins ?? []).map((a) => ({
        id: a.adminId,
        name: a.name ? `${a.name} · ${a.email}` : a.email,
      })),
    [uploadersQuery.data]
  );

  const serverRows = listQuery.data?.data;
  const rows = serverRows ?? [];
  const pagination = listQuery.data?.pagination;
  const counts = listQuery.data?.counts;

  const rowCache = useRef(new Map<string, TRow>());
  useEffect(() => {
    if (!serverRows) return;
    for (const r of serverRows) rowCache.current.set(r.id, r);
  }, [serverRows]);

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const selectedIds = useMemo(
    () => Object.keys(rowSelection).filter((k) => rowSelection[k]),
    [rowSelection]
  );
  const selectedRows = useMemo(
    () => selectedIds.map((id) => rowCache.current.get(id)).filter((r): r is TRow => !!r),
    [selectedIds]
  );

  const filterSig = JSON.stringify(query.filters);
  useEffect(() => {
    setRowSelection({});
  }, [query.q, query.tab, filterSig, query.uploader]);

  useEffect(() => {
    document.getElementById("admin-main")?.scrollTo({ top: 0 });
  }, [query.q, query.tab, filterSig, query.uploader, query.page]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === "Escape") {
        setRowSelection({});
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [config.queryKey] });
  }, [config.queryKey, queryClient]);

  const [formState, setFormState] = useState<{ open: boolean; row: TRow | null }>({ open: false, row: null });
  const [importOpen, setImportOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ ids: string[]; snapshot: TRow[] } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [rejectState, setRejectState] = useState<{ ids: string[] } | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const undoDelete = useCallback(
    async (snapshot: TRow[]) => {
      let ok = 0;
      for (const row of snapshot) {
        try {
          await api.post(config.endpoint, config.toDuplicate(row));
          ok++;
        } catch {
          /* keep count of failures */
        }
      }
      invalidate();
      toast(
        ok === snapshot.length ? `Restored ${ok} ${config.singular}${ok === 1 ? "" : "s"}` : `Restored ${ok} of ${snapshot.length}`,
        ok === snapshot.length ? "success" : "destructive"
      );
    },
    [config, invalidate]
  );

  const doDelete = useCallback(
    async (ids: string[], snapshot: TRow[]) => {
      setDeleting(true);
      try {
        if (ids.length === 1) {
          await api.delete(`${config.endpoint}/${ids[0]}`);
        } else {
          await api.post("/api/admin/bulk", { module: config.module, ids, action: "delete" });
        }
        setPendingDelete(null);
        setRowSelection({});
        invalidate();
        toast(`Deleted ${ids.length} ${config.singular}${ids.length === 1 ? "" : "s"}`, "success", {
          label: "Undo",
          onClick: () => void undoDelete(snapshot),
        });
      } catch (e) {
        toast(e instanceof Error ? e.message : "Delete failed", "destructive");
      } finally {
        setDeleting(false);
      }
    },
    [config, invalidate, undoDelete]
  );

  const doVerify = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;
      setVerifying(true);
      try {
        await api.post("/api/admin/bulk", { module: config.module, ids, action: "approve" });
        setRowSelection({});
        invalidate();
        toast(`Verified ${ids.length} ${config.singular}${ids.length === 1 ? "" : "s"} - now live`, "success");
      } catch (e) {
        toast(e instanceof Error ? e.message : "Verify failed", "destructive");
      } finally {
        setVerifying(false);
      }
    },
    [config, invalidate]
  );

  const doReject = useCallback(
    async (ids: string[], note: string) => {
      setRejecting(true);
      try {
        await api.post("/api/admin/bulk", { module: config.module, ids, action: "reject", note });
        setRejectState(null);
        setRowSelection({});
        invalidate();
        toast(`Rejected ${ids.length} ${config.singular}${ids.length === 1 ? "" : "s"}`, "success");
      } catch (e) {
        toast(e instanceof Error ? e.message : "Reject failed", "destructive");
      } finally {
        setRejecting(false);
      }
    },
    [config, invalidate]
  );

  const doSubmit = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;
      setSubmitting(true);
      try {
        await api.post("/api/admin/bulk", { module: config.module, ids, action: "submit" });
        setRowSelection({});
        invalidate();
        toast(`Submitted ${ids.length} for review`, "success");
      } catch (e) {
        toast(e instanceof Error ? e.message : "Submit failed", "destructive");
      } finally {
        setSubmitting(false);
      }
    },
    [config, invalidate]
  );

  const doExportSelected = useCallback(() => {
    if (selectedRows.length === 0) return;
    exportToCsv(selectedRows.map((r) => flattenForCsv(r as unknown as Record<string, unknown>)), `${config.queryKey}-selected`);
    toast(`Exported ${selectedRows.length} rows`, "success");
  }, [config.queryKey, selectedRows]);

  const copyLink = useCallback(
    async (row: TRow) => {
      try {
        await navigator.clipboard.writeText(`${window.location.origin}${config.publicHref(row)}`);
        setCopiedId(row.id);
        toast("Public link copied", "success");
        setTimeout(() => setCopiedId(null), 2000);
      } catch {
        toast("Copy failed", "destructive");
      }
    },
    [config]
  );

  const canEdit = can(role, config.module, "edit");
  const canDelete = can(role, config.module, "delete");
  const canVerify = can(role, config.module, "verify");
  const canReject = can(role, config.module, "reject");
  const canSubmit = can(role, config.module, "submit");
  const canCreate = can(role, config.module, "create");
  const canImport = can(role, config.module, "import");
  const canExport = can(role, config.module, "export");
  const canAudit = can(role, config.module, "audit");
  const showUploaderFilter = can(role, config.module, "filterByUploader");

  const columns = useMemo<ColumnDef<TRow>[]>(() => {
    const cols: ColumnDef<TRow>[] = [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected() ? true : table.getIsSomePageRowsSelected() ? "indeterminate" : false}
            onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
            aria-label="Select all rows on this page"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(!!v)}
            aria-label={`Select ${row.original.title}`}
          />
        ),
        size: 36,
      },
      {
        id: "title",
        header: () => <span className={T_HEAD_CELL}>Title</span>,
        cell: ({ row }) => {
          const r = row.original;
          const meta = config.metaLine(r);
          return (
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-semibold text-foreground dark:text-paper" title={r.title}>
                {r.title}
              </p>
              {meta.length > 0 && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground dark:text-muted-foreground">
                  {meta.join("  •  ")}
                </p>
              )}
            </div>
          );
        },
      },
      {
        id: "status",
        header: () => <span className={T_HEAD_CELL}>Status</span>,
        cell: ({ row }) => {
          const m = config.moderationOf(row.original);
          return (
            <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap text-[13px] font-medium", modText(m))}>
              <span className={cn("h-2 w-2 shrink-0 rounded-full", modDot(m))} aria-hidden="true" />
              {modLabel(m)}
            </span>
          );
        },
        size: 130,
      },
      {
        id: "uploader",
        header: () => <span className={T_HEAD_CELL}>Uploaded by</span>,
        cell: ({ row }) => {
          const u = config.uploaderOf(row.original);
          if (!u) return <span className="text-xs text-muted-foreground">-</span>;
          return (
            <span className="flex items-center gap-2" title={u.email}>
              <Avatar className="h-7 w-7 shrink-0 border border-rule ">
                <AvatarFallback className="bg-paper-3 text-[10px] font-bold text-paper dark:bg-paper-3">
                  {initials(u.name, u.email)}
                </AvatarFallback>
              </Avatar>
              <span className="max-w-[140px] truncate text-[13px] text-muted-foreground dark:text-muted-foreground">
                {u.name || u.email}
              </span>
            </span>
          );
        },
        size: 170,
      },
      {
        id: "date",
        header: () => <span className={T_HEAD_CELL}>{config.dateLabel}</span>,
        cell: ({ row }) => {
          const d = config.dateOf(row.original);
          if (!d) return <span className="text-xs text-muted-foreground">-</span>;
          const t = new Date(d).getTime();
          if (Number.isNaN(t)) return <span className="text-xs text-muted-foreground">-</span>;
          return (
            <span className="whitespace-nowrap text-[13px] tabular-nums text-muted-foreground dark:text-muted-foreground" title={formatDate(d)}>
              {formatDistanceToNow(new Date(t), { addSuffix: true })}
            </span>
          );
        },
        size: 110,
      },
      {
        id: "actions",
        header: () => null,
        cell: ({ row }) => {
          const r = row.original;
          const moderation = config.moderationOf(r);
          const pending = moderation === "PENDING";
          return (
            <span className="flex items-center justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
              <ActionButton title="View public page" href={config.publicHref(r)}>
                <ExternalLink className="h-4 w-4" />
              </ActionButton>
              <ActionButton title={copiedId === r.id ? "Copied" : "Copy public link"} onClick={() => void copyLink(r)}>
                {copiedId === r.id ? <Check className="h-4 w-4 text-foreground" /> : <Copy className="h-4 w-4" />}
              </ActionButton>
              {canEdit && (
                <ActionButton title="Edit" onClick={() => setFormState({ open: true, row: r })}>
                  <Pencil className="h-4 w-4" />
                </ActionButton>
              )}
              {canSubmit && !isSuper && config.submittable(r) && (
                <ActionButton title="Submit for review" onClick={() => void doSubmit([r.id])}>
                  <Send className="h-4 w-4 text-brick" />
                </ActionButton>
              )}
              {canVerify && pending && (
                <ActionButton title="Verify" onClick={() => void doVerify([r.id])}>
                  <CheckCircle2 className="h-4 w-4 text-foreground" />
                </ActionButton>
              )}
              {canReject && pending && (
                <ActionButton title="Reject with note" onClick={() => setRejectState({ ids: [r.id] })}>
                  <XCircle className="h-4 w-4 text-brick" />
                </ActionButton>
              )}
              {canDelete && (
                <ActionButton title="Delete" danger onClick={() => setPendingDelete({ ids: [r.id], snapshot: [r] })}>
                  <Trash2 className="h-4 w-4" />
                </ActionButton>
              )}
            </span>
          );
        },
        size: 150,
      },
    ];
    return cols;
  }, [config, copiedId, copyLink, canEdit, canSubmit, isSuper, canVerify, canReject, canDelete, doSubmit, doVerify]);

  const table = useReactTable<TRow>({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
  });

  if (status === "loading") {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }
  if (!session || !staff) {
    router.push("/login");
    return null;
  }

  const activeFilterCount =
    Object.keys(query.filters).length + (query.uploader ? 1 : 0);

  const pills: { key: string; label: string }[] = [
    ...config.filters
      .filter((f) => query.filters[f.key])
      .map((f) => {
        const current = query.filters[f.key];
        const opt = (filterLookups[f.key] ?? []).find((o) => o.id === current || o.slug === current);
        return { key: f.key, label: `${f.label}: ${opt?.name ?? current.slice(0, 8)}` };
      }),
    ...(query.uploader
      ? [
          {
            key: "uploader",
            label: `Uploader: ${
              uploaderOptions.find((o) => o.id === query.uploader)?.name ?? query.uploader.slice(0, 8)
            }`,
          },
        ]
      : []),
  ];

  const removePill = (key: string) => {
    if (key === "uploader") setParams({ uploader: undefined });
    else setParams({ [`f_${key}`]: undefined });
  };
  const clearFilters = () => {
    const patch: Record<string, string | undefined> = { uploader: undefined };
    for (const f of config.filters) patch[`f_${f.key}`] = undefined;
    setParams(patch);
  };

  const exportRows =
    selectedRows.length > 0 ? selectedRows : rows;

  const busy = deleting || verifying || rejecting || submitting;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[12.5px] text-muted-foreground dark:text-muted-foreground">
            <Link href="/admin/dashboard" className="font-medium transition-colors hover:text-brick">
              Admin
            </Link>
            {config.crumbs.map((c) => (
              <span key={c.label} className="flex min-w-0 items-center gap-1">
                <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                {c.href ? (
                  <Link href={c.href} className="truncate font-medium transition-colors hover:text-brick">
                    {c.label}
                  </Link>
                ) : (
                  <span className="truncate font-semibold text-foreground dark:text-muted-foreground">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
          <h1 className="mt-1 truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl dark:text-paper">
            {config.title}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground dark:text-muted-foreground">{config.description}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {canAudit && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setAuditOpen(true)}>
              <History className="mr-1.5 h-3.5 w-3.5" /> Audit trail
            </Button>
          )}
          {canImport && (
            <Button type="button" variant="secondary" size="sm" onClick={() => setImportOpen(true)}>
              <Upload className="mr-1.5 h-3.5 w-3.5" /> Import
            </Button>
          )}
          {canExport && (
            <ExportMenu
              rows={exportRows as unknown as Record<string, unknown>[]}
              filename={`${config.queryKey}-export`}
              variant="secondary"
            />
          )}
          {canCreate && (
            <Button type="button" size="sm" className={T_PRIMARY} onClick={() => setFormState({ open: true, row: null })}>
              <Plus className="mr-1.5 h-4 w-4" /> {config.newLabel}
            </Button>
          )}
        </div>
      </div>

      <StatusTabs
        counts={counts}
        active={query.tab}
        onChange={(tab) => setParams({ tab: tab === "all" ? undefined : tab })}
      />

      <Card className={T_CARD}>
        <div className="space-y-2.5 border-b border-rule p-3 sm:p-4 ">
          <ListToolbar
            q={input}
            onQ={setInput}
            searchRef={searchRef}
            placeholder={config.searchPlaceholder}
            filters={{
              defs: config.filters,
              values: query.filters,
              lookups: filterLookups,
              showUploader: showUploaderFilter,
              uploaderOptions,
              uploader: query.uploader,
            }}
            onFilter={(key, value) => setParams({ [`f_${key}`]: value || undefined })}
            onUploader={(value) =>
              setParams(query.tab === "draft" ? { uploader: value || undefined, tab: undefined } : { uploader: value || undefined })
            }
            onClearFilters={clearFilters}
            activeFilterCount={activeFilterCount}
            density={query.density}
            onDensity={setDensity}
          />
          <ActiveFilterPills pills={pills} onRemove={removePill} onClear={clearFilters} />
        </div>

        <div className="overflow-x-auto saas-table-scroll">
          <Table className="saas-table" data-density={query.density}>
            <TableHeader className="sticky top-0 z-10">
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id} className="bg-paper-2/95 hover:bg-paper-2/95 ">
                  {hg.headers.map((h) => (
                    <TableHead key={h.id} style={{ width: h.getSize() === 150 ? undefined : h.getSize() }}>
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {listQuery.isLoading && rows.length === 0 ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={`sk-${i}`}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-9 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <div className="flex flex-col items-center gap-2 py-12 text-center">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-paper-3 dark:bg-background/[0.06]">
                        <Inbox className="h-6 w-6 text-muted-foreground" />
                      </span>
                      <p className="font-semibold text-foreground dark:text-muted-foreground">No {config.plural.toLowerCase()} found</p>
                      <p className="max-w-xs text-sm text-muted-foreground">
                        {query.tab !== "all" || query.q || activeFilterCount > 0
                          ? "Try a different search, tab or filter."
                          : `Get started by creating your first ${config.singular}.`}
                      </p>
                      {canCreate && query.tab === "all" && !query.q && activeFilterCount === 0 && (
                        <Button type="button" size="sm" className={cn(T_PRIMARY, "mt-1")} onClick={() => setFormState({ open: true, row: null })}>
                          <Plus className="mr-1.5 h-4 w-4" /> {config.newLabel}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((tr) => {
                  const r = tr.original;
                  const moderation = config.moderationOf(r);
                  return (
                    <TableRow
                      key={r.id}
                      data-selected={tr.getIsSelected()}
                      data-pending={moderation === "PENDING"}
                      className="group border-b border-rule transition-colors last:border-0 hover:bg-paper-3 data-[selected=true]:bg-paper-3  dark:hover:bg-background/[0.03] dark:data-[selected=true]:bg-paper-3"
                    >
                      {tr.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className={cn(query.density === "compact" && "py-2")}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {pagination && (
          <TableFooter
            page={query.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            pageSize={query.size}
            pageSizeOptions={ADMIN_PAGE_SIZES}
            onPageChange={(p) => setParams({ page: String(p) }, false)}
            onPageSizeChange={setSize}
            itemLabel={config.plural.toLowerCase()}
          />
        )}
      </Card>

      <BulkBar
        count={selectedIds.length}
        isSuper={isSuper}
        busy={busy}
        onVerify={() => void doVerify(selectedIds)}
        onReject={() => setRejectState({ ids: selectedIds })}
        onExport={doExportSelected}
        onDelete={() => setPendingDelete({ ids: selectedIds, snapshot: selectedRows })}
        onSubmit={() => void doSubmit(selectedIds)}
        onClear={() => setRowSelection({})}
      />

      <config.FormDialog
        row={formState.row}
        open={formState.open}
        onOpenChange={(open) => setFormState((s) => ({ ...s, open }))}
        lookups={lookups}
        onSaved={invalidate}
      />

      <DeleteConfirm
        open={pendingDelete !== null}
        title={`Delete ${pendingDelete && pendingDelete.ids.length > 1 ? `${pendingDelete.ids.length} ${config.plural.toLowerCase()}` : config.singular}`}
        message="This permanently removes the selected items and unlinks related records. You can undo right after deleting."
        pending={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete && void doDelete(pendingDelete.ids, pendingDelete.snapshot)}
      />

      <RejectDialog
        open={rejectState !== null}
        count={rejectState?.ids.length ?? 0}
        pending={rejecting}
        onCancel={() => setRejectState(null)}
        onConfirm={(note) => rejectState && void doReject(rejectState.ids, note)}
      />

      <AuditDialog
        open={auditOpen}
        onOpenChange={setAuditOpen}
        title={`${config.title} - audit trail`}
        entity={config.auditEntity}
        mine={!isSuper}
      />

      {canImport && (
        <ImportWizard
          open={importOpen}
          onClose={() => setImportOpen(false)}
          module={config.module}
          endpoint={config.endpoint}
          queryKey={config.queryKey}
        />
      )}
    </div>
  );
}

function ActionButton({
  title,
  onClick,
  href,
  danger,
  children,
}: {
  title: string;
  onClick?: () => void;
  href?: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  const cls =
    "inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-paper-3 hover:text-foreground dark:text-muted-foreground dark:hover:bg-background/[0.06] dark:hover:text-muted-foreground";
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" title={title} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={danger ? `${cls} hover:!bg-paper-2 hover:!text-brick dark:hover:!bg-paper-2 dark:hover:!text-brick` : cls}
    >
      {children}
    </button>
  );
}
