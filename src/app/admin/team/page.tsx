"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { fetcher } from "@/lib/api";
import { isSuperAdmin } from "@/lib/roles";
import { ADMIN_PAGE_SIZES, type Density } from "@/lib/admin/usePageSize";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PageHeader } from "@/components/admin/PageHeader";
import { RolePill } from "@/components/admin/RolePill";
import { AdminIdBadge } from "@/components/admin/AdminIdBadge";
import { TableFooter } from "@/components/admin/data-table/TableFooter";
import { DensityToggle } from "@/components/admin/data-table/DensityToggle";
import { ExportMenu } from "@/components/admin/data-table/ExportMenu";
import { AuditDialog } from "@/components/admin/list/list-parts";
import { T_CARD, T_HEAD_CELL, initials } from "@/components/admin/list/tokens";
import { Search, History, Inbox, Users, UploadCloud, Clock } from "lucide-react";

type RangeKey = "7D" | "30D" | "90D";

interface PerfRow {
  id: string;
  name: string | null;
  email: string;
  role: string;
  total: number;
  pendingTotal: number;
  byType: Record<string, number>;
}

interface PerfResponse {
  success: boolean;
  data: PerfRow[];
  meta: { range: string; days: number; modules: number; employees: number; totalUploads: number; pending: number };
}

const MIX: { key: string; label: string; color: string }[] = [
  { key: "job", label: "Jobs", color: "bg-teal-600" },
  { key: "result", label: "Results", color: "bg-emerald-500" },
  { key: "admitCard", label: "Admit cards", color: "bg-sky-500" },
  { key: "answerKey", label: "Answer keys", color: "bg-amber-500" },
  { key: "admission", label: "Admissions", color: "bg-violet-500" },
  { key: "syllabus", label: "Syllabus", color: "bg-rose-400" },
];

const DENSITY_KEY = "list:density:team";
const SIZE_KEY = "admin:pageSize:team";

export default function AdminTeam() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement | null>(null);

  const [range, setRange] = useState<RangeKey>("30D");
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(25);
  const [density, setDensity] = useState<Density>("comfortable");
  const [auditOpen, setAuditOpen] = useState(false);

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
      setQ(input.toLowerCase());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [input, q]);

  const perfQuery = useQuery<PerfResponse>({
    queryKey: ["team-performance-v2", range],
    queryFn: () => fetcher<PerfResponse>(`/api/admin/team-performance?range=${range}`),
    enabled: status === "authenticated" && !!session && isSuperAdmin(session.user.role),
  });

  const allRows = useMemo(() => perfQuery.data?.data ?? [], [perfQuery.data]);
  const meta = perfQuery.data?.meta;
  const maxUploads = useMemo(() => allRows.reduce((m, r) => Math.max(m, r.total), 1), [allRows]);

  const filtered = useMemo(() => {
    if (!q) return allRows;
    return allRows.filter(
      (r) =>
        (r.name ?? "").toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
    );
  }, [allRows, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / size));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * size, safePage * size);

  if (status === "loading") {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }
  if (!session || !isSuperAdmin(session.user.role)) {
    router.push("/admin/dashboard");
    return null;
  }

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

  const pending = meta?.pending ?? 0;

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <PageHeader
          crumbs={[{ label: "Manage" }, { label: "Team performance" }]}
          title="Team performance"
          badge={
            <Badge variant="secondary" className="font-semibold tabular-nums">
              {meta?.employees ?? allRows.length} employee{(meta?.employees ?? allRows.length) === 1 ? "" : "s"}
            </Badge>
          }
          description={`Who ships what — uploads across ${meta?.modules ?? 6} modules in the last ${meta?.days ?? 30} days.`}
          actions={
            <>
              <Button type="button" variant="ghost" size="sm" onClick={() => setAuditOpen(true)}>
                <History className="mr-1.5 h-3.5 w-3.5" /> Audit trail
              </Button>
              <ExportMenu rows={filtered as unknown as Record<string, unknown>[]} filename={`team-${range}`} variant="secondary" />
            </>
          }
        />

        <div className="grid gap-3 sm:grid-cols-3">
          <Card className={cn(T_CARD, "p-4")}>
            <div className="flex items-center gap-2 text-[13px] font-medium text-slate-500 dark:text-slate-400">
              <Users className="h-4 w-4 text-teal-700 dark:text-teal-400" /> Employees
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
              {perfQuery.isLoading ? "…" : (meta?.employees ?? 0)}
            </p>
          </Card>
          <Card className={cn(T_CARD, "p-4")}>
            <div className="flex items-center gap-2 text-[13px] font-medium text-slate-500 dark:text-slate-400">
              <UploadCloud className="h-4 w-4 text-teal-700 dark:text-teal-400" /> Total uploads (across {meta?.modules ?? 6} modules)
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
              {perfQuery.isLoading ? "…" : (meta?.totalUploads ?? 0)}
            </p>
          </Card>
          <Card className={cn(T_CARD, "p-4")}>
            <div className="flex items-center gap-2 text-[13px] font-medium text-slate-500 dark:text-slate-400">
              <Clock className="h-4 w-4 text-teal-700 dark:text-teal-400" /> Pending review
            </div>
            <p className={cn("mt-1 text-2xl font-bold tabular-nums", pending > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-900 dark:text-slate-50")}>
              {perfQuery.isLoading ? "…" : pending}
            </p>
          </Card>
        </div>

        <Card className={T_CARD}>
          <div className="space-y-2.5 border-b border-slate-100 p-3 sm:p-4 dark:border-white/[0.06]">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-52 flex-1">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  ref={searchRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Search employees…"
                  className="bg-white pl-8 dark:bg-white/[0.03]"
                  aria-label="Search employees"
                />
              </div>
              <div className="flex shrink-0 items-center rounded-lg border border-slate-200 p-0.5 dark:border-white/10" role="group" aria-label="Date range">
                {(["7D", "30D", "90D"] as RangeKey[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    aria-pressed={range === r}
                    onClick={() => { setRange(r); setPage(1); }}
                    className={cn(
                      "h-7 rounded-md px-2.5 text-xs font-semibold transition-colors",
                      range === r
                        ? "bg-teal-700 text-white dark:bg-teal-600"
                        : "text-slate-500 hover:text-teal-700 dark:text-slate-400 dark:hover:text-teal-300"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <div className="ml-auto">
                <DensityToggle value={density} onChange={setDensityPersist} />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5" aria-label="Content mix legend">
              {MIX.map((m) => (
                <span key={m.key} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <span className={cn("h-2 w-2 rounded-full", m.color)} aria-hidden="true" />
                  {m.label}
                </span>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto saas-table-scroll">
            <Table className="saas-table" data-density={density}>
              <TableHeader className="sticky top-0 z-10">
                <TableRow className="bg-slate-50/95 backdrop-blur hover:bg-slate-50/95 dark:bg-[#0b1220]/95">
                  <TableHead className="w-12"><span className={T_HEAD_CELL}>Rank</span></TableHead>
                  <TableHead><span className={T_HEAD_CELL}>Employee</span></TableHead>
                  <TableHead><span className={T_HEAD_CELL}>Role</span></TableHead>
                  <TableHead><span className={T_HEAD_CELL}>Uploads</span></TableHead>
                  <TableHead><span className={T_HEAD_CELL}>Pending</span></TableHead>
                  <TableHead className="min-w-[220px]"><span className={T_HEAD_CELL}>Content mix</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {perfQuery.isLoading && pageRows.length === 0 ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={`sk-${i}`}>
                      <TableCell colSpan={6}><Skeleton className="h-9 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : pageRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <div className="flex flex-col items-center gap-2 py-12 text-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/[0.06]">
                          <Inbox className="h-6 w-6 text-slate-400" />
                        </span>
                        <p className="font-semibold text-slate-700 dark:text-slate-200">No employees yet</p>
                        <p className="max-w-xs text-sm text-slate-400">
                          {q ? "Try a different search." : `No uploads in the last ${meta?.days ?? 30} days.`}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  pageRows.map((r, i) => {
                    const rank = (safePage - 1) * size + i + 1;
                    const pct = Math.max(4, Math.round((r.total / maxUploads) * 100));
                    const mixTotal = MIX.reduce((s, m) => s + (r.byType[m.key] ?? 0), 0);
                    return (
                      <TableRow
                        key={r.id}
                        className="border-b border-slate-100 transition-colors last:border-0 hover:bg-teal-50/40 dark:border-white/[0.06] dark:hover:bg-white/[0.03]"
                      >
                        <TableCell className={cn("text-sm font-bold tabular-nums text-slate-400", density === "compact" && "py-2")}>
                          {rank}
                        </TableCell>
                        <TableCell className={cn(density === "compact" && "py-2")}>
                          <span className="flex items-center gap-2.5">
                            <Avatar className="h-8 w-8 shrink-0 border border-slate-200 dark:border-white/10">
                              <AvatarFallback className="bg-teal-700 text-[11px] font-bold text-white dark:bg-teal-600">
                                {initials(r.name, r.email)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="min-w-0">
                              <span className="block max-w-[190px] truncate text-[13.5px] font-semibold text-slate-900 dark:text-slate-100">
                                {r.name || r.email}
                              </span>
                              <span className="block max-w-[190px] truncate text-xs text-slate-400" title={r.email}>
                                {r.email}
                              </span>
                              <AdminIdBadge id={r.id} />
                            </span>
                          </span>
                        </TableCell>
                        <TableCell className={cn(density === "compact" && "py-2")}>
                          <RolePill role={r.role} />
                        </TableCell>
                        <TableCell className={cn(density === "compact" && "py-2")}>
                          <span className="block text-[13px] font-bold tabular-nums text-slate-900 dark:text-slate-100">
                            {r.total}
                          </span>
                          <span className="mt-1 block h-1.5 w-28 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10" aria-hidden="true">
                            <span className="block h-full rounded-full bg-teal-600 dark:bg-teal-500" style={{ width: `${pct}%` }} />
                          </span>
                        </TableCell>
                        <TableCell className={cn(density === "compact" && "py-2")}>
                          {r.pendingTotal > 0 ? (
                            <Badge className="bg-amber-100 font-semibold tabular-nums text-amber-800 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-200">
                              {r.pendingTotal}
                            </Badge>
                          ) : (
                            <span className="text-[13px] tabular-nums text-slate-400">0</span>
                          )}
                        </TableCell>
                        <TableCell className={cn(density === "compact" && "py-2")}>
                          {mixTotal === 0 ? (
                            <span className="text-xs text-slate-400">—</span>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="flex h-2.5 w-full min-w-[160px] max-w-[280px] cursor-default overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                                  {MIX.map((m) => {
                                    const v = r.byType[m.key] ?? 0;
                                    if (v === 0) return null;
                                    return (
                                      <span
                                        key={m.key}
                                        className={cn("h-full", m.color)}
                                        style={{ width: `${(v / mixTotal) * 100}%` }}
                                      />
                                    );
                                  })}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="space-y-0.5 text-xs tabular-nums">
                                  {MIX.map((m) => (
                                    <p key={m.key}>
                                      {m.label}: <span className="font-bold">{r.byType[m.key] ?? 0}</span>
                                    </p>
                                  ))}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <TableFooter
            page={safePage}
            totalPages={totalPages}
            total={filtered.length}
            pageSize={size}
            pageSizeOptions={ADMIN_PAGE_SIZES}
            onPageChange={(p) => setPage(p)}
            onPageSizeChange={setSizePersist}
            itemLabel="employees"
          />
        </Card>

        <AuditDialog
          open={auditOpen}
          onOpenChange={setAuditOpen}
          title="Team performance — audit trail"
          entity=""
          mine={false}
        />
      </div>
    </TooltipProvider>
  );
}
