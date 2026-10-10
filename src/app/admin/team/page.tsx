"use client";
import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/api";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminIdBadge } from "@/components/admin/AdminIdBadge";
import { isSuperAdmin } from "@/lib/roles";

interface PerfRow {
  id: string;
  name: string | null;
  email: string;
  role: string;
  total: number;
  pendingTotal: number;
  byType: Record<string, number>;
}

export default function AdminTeam() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data, isLoading } = useQuery<{ success: boolean; data: PerfRow[] }>({
    queryKey: ["team-performance"],
    queryFn: () => fetcher("/api/admin/team-performance"),
    enabled: status === "authenticated",
  });

  if (status === "loading" || isLoading) {
    return <div className="space-y-3"><Skeleton className="h-10" /><Skeleton className="h-64" /></div>;
  }
  if (!session || !isSuperAdmin(session.user.role)) {
    router.push("/admin/dashboard");
    return null;
  }

  const rows = data?.data ?? [];
  const totals = rows.reduce((s, r) => s + r.total, 0);
  const pending = rows.reduce((s, r) => s + r.pendingTotal, 0);

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Team Performance"
        description={`${rows.length} employees • ${totals} uploads • ${pending} pending review. Ownership model: employees see only their own content everywhere else.`}
      />
      <div className="grid gap-3 md:grid-cols-3">
        <Card><CardHeader><CardTitle className="text-sm">Employees</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{rows.length}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Total uploads (6 modules)</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{totals}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Pending review</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-amber-600">{pending}</CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Employee leaderboard</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Uploads</TableHead>
                <TableHead className="text-right">Pending</TableHead>
                <TableHead>Mix (job/result/admit/key/admission/syllabus)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-medium">{r.name || r.email}</div>
                    <div className="text-xs text-slate-500">{r.email}</div>
                    <AdminIdBadge id={r.id} />
                  </TableCell>
                  <TableCell><Badge variant={r.role === "SUPER_ADMIN" ? "default" : "secondary"}>{r.role}</Badge></TableCell>
                  <TableCell className="text-right font-bold">{r.total}</TableCell>
                  <TableCell className="text-right">{r.pendingTotal > 0 ? <Badge className="bg-amber-500 text-white">{r.pendingTotal}</Badge> : "0"}</TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {["job", "result", "admitCard", "answerKey", "admission", "syllabus"].map((k) => `${k}:${r.byType[k] ?? 0}`).join(" • ")}
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-slate-500">No employees yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
