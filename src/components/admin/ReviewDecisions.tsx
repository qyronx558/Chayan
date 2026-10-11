"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface LogItem {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  details?: string | null;
  createdAt: string;
  user?: { id: string; name: string | null; email: string } | null;
}

export function auditLabel(action: string): string {
  const a = action.toUpperCase();
  if (a === "BULK_APPROVE") return "Bulk approved";
  if (a === "BULK_REJECT") return "Bulk rejected";
  if (a === "BULK_DELETE") return "Bulk deleted";
  if (a === "BULK_CREATE") return "Bulk created";
  if (a === "BULK_SUBMIT") return "Bulk submitted";
  if (a === "BULK_UPDATE") return "Bulk updated";
  if (a === "CREATE") return "Created";
  if (a === "APPROVE") return "Approved";
  if (a === "REJECT") return "Rejected";
  if (a === "DELETE") return "Deleted";
  if (a === "UPDATE") return "Updated";
  if (a === "IMPORT") return "Imported";
  if (a === "ROLE_CHANGE") return "Role changed";
  return action
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function auditTone(action: string): string {
  const a = action.toUpperCase();
  if (a.includes("APPROVE")) return "bg-emerald-600 text-white hover:bg-emerald-600";
  if (a.includes("REJECT")) return "bg-rose-100 text-rose-800 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-200";
  if (a.includes("DELETE")) return "bg-rose-600 text-white hover:bg-rose-600";
  if (a.includes("CREATE") || a.includes("IMPORT")) return "bg-teal-700 text-white hover:bg-teal-700 dark:bg-teal-600";
  if (a.includes("BULK")) return "bg-violet-600 text-white hover:bg-violet-600";
  return "";
}

interface GroupedLog {
  key: string;
  action: string;
  entity: string;
  count: number;
  ids: string[];
  summary: string | null;
  actor: string | null;
  createdAt: string;
  sampleEntityId: string;
}

function groupConsecutive(logs: LogItem[]): GroupedLog[] {
  const out: GroupedLog[] = [];
  for (const l of logs) {
    const actor = l.user?.name || l.user?.email || null;
    const prev = out[out.length - 1];
    if (
      prev &&
      prev.action === l.action &&
      prev.entity === l.entity &&
      prev.actor === actor
    ) {
      prev.count += 1;
      prev.ids.push(l.id);
      if (l.details && !prev.summary) prev.summary = l.details;
    } else {
      out.push({
        key: l.id,
        action: l.action,
        entity: l.entity,
        count: 1,
        ids: [l.id],
        summary: l.details || null,
        actor,
        createdAt: l.createdAt,
        sampleEntityId: l.entityId,
      });
    }
  }
  return out;
}

export function ReviewDecisions({ limit = 12 }: { limit?: number }) {
  const { data, isLoading } = useQuery<{ success: boolean; data: LogItem[] }>({
    queryKey: ["review-decisions", limit],
    queryFn: () => fetcher(`/api/logs?limit=${limit * 3}`),
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    );
  }

  const logs = (data?.data ?? []).filter((l) =>
    /APPROVE|REJECT|DELETE|CREATE|BULK|IMPORT|SUBMIT/i.test(l.action)
  ).slice(0, limit * 2);
  if (logs.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-400">No review decisions yet.</p>;
  }

  const groups = groupConsecutive(logs).slice(0, limit);

  return (
    <div>
      <ul className="divide-y divide-slate-100 dark:divide-white/[0.06]">
        {groups.map((g) => {
          const t = new Date(g.createdAt).getTime();
          return (
            <li key={g.key} className="flex items-start justify-between gap-3 py-2.5">
              <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                <Badge className={cn("shrink-0", auditTone(g.action))}>
                  {auditLabel(g.action)}
                  {g.count > 1 ? ` ×${g.count}` : ""}
                </Badge>
                <span className="text-[13px] font-medium text-slate-700 dark:text-slate-200">{g.entity}</span>
                {g.summary ? (
                  <span className="min-w-0 truncate text-[13px] text-slate-500 dark:text-slate-400" title={g.summary}>
                    {g.summary.slice(0, 120)}
                  </span>
                ) : (
                  <span className="font-mono text-xs text-slate-400">{g.sampleEntityId.slice(0, 8)}</span>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2 text-xs text-slate-400">
                {g.actor ? <span className="hidden max-w-[140px] truncate sm:inline">{g.actor}</span> : null}
                <span
                  className="whitespace-nowrap tabular-nums"
                  title={formatDate(g.createdAt)}
                >
                  {!Number.isNaN(t) ? formatDistanceToNow(new Date(t), { addSuffix: true }) : ""}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-slate-100 pt-2.5 dark:border-white/[0.06]">
        <Link
          href="/admin/logs"
          className="text-[13px] font-semibold text-teal-700 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300"
        >
          View full audit trail →
        </Link>
      </div>
    </div>
  );
}

export function CompactAuditList({ entity, limit = 8 }: { entity?: string; limit?: number }) {
  const params = new URLSearchParams({ limit: String(limit * 2) });
  if (entity) params.set("entity", entity);
  const { data, isLoading } = useQuery<{ success: boolean; data: LogItem[] }>({
    queryKey: ["compact-audit", entity, limit],
    queryFn: () => fetcher(`/api/logs?${params.toString()}`),
  });
  if (isLoading) return <Skeleton className="h-24 w-full" />;
  const logs = (data?.data ?? []).slice(0, limit);
  if (logs.length === 0) return <p className="text-sm text-slate-400">No audit entries yet.</p>;
  const groups = groupConsecutive(logs);
  return (
    <ul className="divide-y divide-slate-100 dark:divide-white/[0.06]">
      {groups.map((g) => (
        <li key={g.key} className="flex items-center justify-between gap-3 py-2">
          <span className="flex min-w-0 items-center gap-2">
            <Badge className={cn("shrink-0", auditTone(g.action))}>
              {auditLabel(g.action)}
              {g.count > 1 ? ` ×${g.count}` : ""}
            </Badge>
            <span className="truncate text-[13px] text-slate-500 dark:text-slate-400" title={g.summary ?? ""}>
              {g.entity} · {g.summary ? g.summary.slice(0, 100) : g.sampleEntityId.slice(0, 8)}
            </span>
          </span>
          <span className="shrink-0 text-xs text-slate-400" title={formatDate(g.createdAt)}>
            {g.actor ?? ""}
          </span>
        </li>
      ))}
    </ul>
  );
}
