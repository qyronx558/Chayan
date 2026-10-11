"use client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ACTION_LABEL } from "./types";
import type { AuditAction } from "./types";
import { Check, Copy, Pencil, ShieldAlert, ThumbsDown, Trash2, Layers, Plus, XCircle } from "lucide-react";

const TONE: Record<AuditAction, string> = {
  CREATE: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  BULK_CREATE: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  UPDATE: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200",
  APPROVE: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  BULK_APPROVE: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  REJECT: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
  DELETE: "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200",
  BULK_DELETE: "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200",
  ROLE_CHANGE: "border-purple-200 bg-purple-50 text-purple-800 dark:border-purple-900 dark:bg-purple-950 dark:text-purple-200",
  LOG_PURGE: "border-slate-300 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-200",
};

const ICON: Record<AuditAction, typeof Check> = {
  CREATE: Plus,
  BULK_CREATE: Layers,
  UPDATE: Pencil,
  APPROVE: Check,
  BULK_APPROVE: Layers,
  REJECT: XCircle,
  DELETE: Trash2,
  BULK_DELETE: Trash2,
  ROLE_CHANGE: ShieldAlert,
  LOG_PURGE: Copy,
};

export function ActionBadge({ action, count }: { action: AuditAction; count?: number }) {
  const Icon = ICON[action] ?? ThumbsDown;
  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex h-[26px] items-center gap-1 whitespace-nowrap rounded-full border px-2 text-xs font-semibold leading-none",
        TONE[action]
      )}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      <span className="leading-none">{ACTION_LABEL[action] ?? action}</span>
      {typeof count === "number" && count > 1 ? <span className="leading-none tabular-nums">×{count}</span> : null}
    </Badge>
  );
}
