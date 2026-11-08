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
    return <p className="text-sm text-muted-foreground">No audit entries yet. Creates, updates, approvals and bulk actions appear here.</p>;
  }

  const color = (a: string) => {
    if (/APPROVE/i.test(a)) return "bg-paper-3 text-paper";
    if (/REJECT/i.test(a)) return "bg-paper-2 text-paper";
    if (/DELETE/i.test(a)) return "bg-paper-2 text-brick dark:bg-paper-2 dark:text-brick";
    if (/CREATE|CLONE|IMPORT/i.test(a)) return "bg-paper-3 text-paper";
    if (/BULK/i.test(a)) return "bg-paper-3 text-paper";
    return undefined;
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold">{title} ({logs.length})</h4>
      <ol className="relative space-y-3 border-l border-rule pl-4 ">
        {logs.map((l) => (
          <li key={l.id} className="text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge className={color(l.action)}>{l.action}</Badge>
              <span className="font-medium">{l.entity}</span>
              <span className="text-muted-foreground">{formatDate(l.createdAt)}</span>
            </div>
            <p className="mt-0.5 text-muted-foreground dark:text-muted-foreground">
              {l.details || `${l.entityId}`}
            </p>
            {l.user && (
              <p className="text-muted-foreground">by {l.user.name || l.user.email}</p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
