"use client";

import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface LogItem {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  details?: string | null;
  createdAt: string;
  user?: { id: string; name: string | null; email: string } | null;
}

interface AuditTimelineProps {
  entity?: string;
  entityId?: string;
  limit?: number;
  title?: string;
  mine?: boolean;
}

/** Reusable audit trail - reads the existing /api/logs trail, no schema change. */
export function AuditTimeline({ entity, entityId, limit = 20, title = "Activity", mine = false }: AuditTimelineProps) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (entity) params.set("entity", entity);
  if (entityId) params.set("search", entityId);
  if (mine) params.set("mine", "1");

  const { data, isLoading } = useQuery<{ success: boolean; data: LogItem[] }>({
    queryKey: ["audit-timeline", entity, entityId, limit, mine],
    queryFn: () => fetcher(`/api/logs?${params.toString()}`),
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
    );
  }

  const logs = data?.data ?? [];
  if (logs.length === 0) {
    return <p className="text-sm text-slate-500">No audit entries yet. Creates, updates, approvals and bulk actions appear here.</p>;
  }

  const color = (a: string) => {
    if (/APPROVE/i.test(a)) return "bg-green-600 text-white";
    if (/REJECT/i.test(a)) return "bg-red-600 text-white";
    if (/DELETE/i.test(a)) return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
    if (/CREATE|CLONE|IMPORT/i.test(a)) return "bg-blue-600 text-white";
    if (/BULK/i.test(a)) return "bg-purple-600 text-white";
    return undefined;
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold">{title} ({logs.length})</h4>
      <ol className="relative space-y-3 border-l border-slate-200 pl-4 dark:border-white/10">
        {logs.map((l) => (
          <li key={l.id} className="text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge className={color(l.action)}>{l.action}</Badge>
              <span className="font-medium">{l.entity}</span>
              <span className="text-slate-400">{formatDate(l.createdAt)}</span>
            </div>
            <p className="mt-0.5 text-slate-600 dark:text-slate-300">
              {l.details || `${l.entityId}`}
            </p>
            {l.user && (
              <p className="text-slate-400">by {l.user.name || l.user.email}</p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
