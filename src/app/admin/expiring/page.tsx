"use client";
import { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { fetcher } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

const MODULES = [
  { key: "Job", label: "Gov Jobs", endpoint: "/api/jobs?scope=all&limit=100", href: "/admin/jobs", dateKey: "lastDate" },
  { key: "Admission", label: "Admissions", endpoint: "/api/admissions?scope=all&limit=100", href: "/admin/admissions", dateKey: "lastDate" },
] as const;

interface Row {
  id: string;
  title: string;
  slug: string;
  status?: string | null;
  lastDate?: string | null;
}

/** SaaS expiry radar: mismatched status, expiring in 7 days, already past last-date. */
export default function AdminExpiring() {
  const queries = useQueries({
    queries: MODULES.map((m) => ({
      queryKey: ["expiring", m.key],
      queryFn: () => fetcher<{ success: boolean; data: Row[] }>(m.endpoint),
    })),
  });

  const loading = queries.some((q) => q.isLoading);
  const [now] = useState(() => Date.now());
  if (loading) return <div className="space-y-3"><Skeleton className="h-10" /><Skeleton className="h-64" /></div>;
  const sections = MODULES.map((m, i) => {
    const rows: Row[] = queries[i].data?.data ?? [];
    const enriched = rows
      .map((r) => {
        const t = r.lastDate ? new Date(r.lastDate).getTime() : NaN;
        const diff = t - now;
        const expired = !Number.isNaN(t) && diff < 0 && r.status !== "EXPIRED";
        const soon = !Number.isNaN(t) && diff > 0 && diff < 7 * 86400000;
        return { ...r, expired, soon, diff };
      })
      .filter((r) => r.expired || r.soon)
      .sort((a, b) => (a.diff ?? 0) - (b.diff ?? 0))
      .slice(0, 50);
    return { ...m, rows: enriched };
  });

  const total = sections.reduce((s, x) => s + x.rows.length, 0);

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Expiring Soon" description={`${total} items need attention - past last-date but still ACTIVE, or expiring within 7 days. Bulk-fix from each module with the new Bulk edit drawer.`} />
      {sections.map((s) => (
        <Card key={s.key}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{s.label} ({s.rows.length})</CardTitle>
            <Link href={s.href} className="text-xs font-semibold text-teal-700 hover:underline">Open {s.label} →</Link>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Status</TableHead><TableHead>Last date</TableHead><TableHead>Signal</TableHead></TableRow></TableHeader>
              <TableBody>
                {s.rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.title}</TableCell>
                    <TableCell><Badge variant="secondary">{r.status ?? "-"}</Badge></TableCell>
                    <TableCell>{r.lastDate ? formatDate(r.lastDate) : "-"}</TableCell>
                    <TableCell>{r.expired ? <Badge variant="destructive">past last-date</Badge> : <Badge className="bg-amber-500 text-white">expiring soon</Badge>}</TableCell>
                  </TableRow>
                ))}
                {s.rows.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-slate-500">All clear - nothing expiring.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
