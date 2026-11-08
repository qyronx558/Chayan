"use client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ACTION_LABEL } from "./types";
import type { AuditAction } from "./types";
import { Check, Copy, Pencil, ShieldAlert, ThumbsDown, Trash2, Layers, Plus, XCircle } from "lucide-react";

const TONE: Record<AuditAction, string> = {
  CREATE: "border-rule bg-paper-3 text-foreground dark:border-rule dark:bg-paper-3 dark:text-foreground",
  BULK_CREATE: "border-rule bg-paper-3 text-foreground dark:border-rule dark:bg-paper-3 dark:text-foreground",
  UPDATE: "border-rule bg-paper-3 text-brick dark:border-rule dark:bg-paper-3 dark:text-brick",
  APPROVE: "border-rule bg-paper-3 text-foreground dark:border-rule dark:bg-paper-3 dark:text-foreground",
  BULK_APPROVE: "border-rule bg-paper-3 text-foreground dark:border-rule dark:bg-paper-3 dark:text-foreground",
  REJECT: "border-rule bg-paper-2 text-brick dark:border-rule dark:bg-paper-2 dark:text-brick",
  DELETE: "border-brick bg-paper-2 text-brick dark:border-brick dark:bg-paper-2 dark:text-brick",
  BULK_DELETE: "border-brick bg-paper-2 text-brick dark:border-brick dark:bg-paper-2 dark:text-brick",
  ROLE_CHANGE: "border-rule bg-paper-3 text-brick dark:border-rule dark:bg-paper-3 dark:text-brick",
  LOG_PURGE: "border-rule bg-paper-3 text-foreground  dark:bg-background/10 dark:text-muted-foreground",
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
