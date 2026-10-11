export type AuditAction =
  | "CREATE"
  | "BULK_CREATE"
  | "UPDATE"
  | "APPROVE"
  | "BULK_APPROVE"
  | "REJECT"
  | "DELETE"
  | "BULK_DELETE"
  | "ROLE_CHANGE"
  | "LOG_PURGE";

export type AuditSource = "ADMIN_UI" | "API" | "BULK_IMPORT" | "CRAWLER";

export type AuditActorRole = "ADMIN" | "SUPER_ADMIN" | "SYSTEM";

export interface AuditDiff {
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}

export interface AuditActor {
  id: string;
  name: string | null;
  email: string | null;
  role?: string | null;
}

export interface AuditEventView {
  id: string;
  createdAt: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  actorId: string | null;
  actorRole: string | null;
  actor: AuditActor | null;
  summary: string;
  diff: AuditDiff | null;
  source: AuditSource;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
  flagged: boolean;
  reviewedAt: string | null;
  reviewedById: string | null;
  note: string | null;
  hash: string | null;
  sensitive: boolean;
}

export type AuditSavedView =
  | "all"
  | "needs-review"
  | "sensitive"
  | "deletions"
  | "approvals"
  | "role-changes"
  | "imports"
  | "flagged";

export interface AuditFilters {
  q: string;
  action: string;
  entity: string;
  actor: string;
  from: string;
  to: string;
  view: AuditSavedView;
}

export type RowDensity = "comfy" | "compact";

export interface AuditKpi {
  key: string;
  label: string;
  value: number;
  deltaPct: number | null;
  sub: string;
  needsAction: boolean;
  reviewCount?: number;
}

export interface AuditPattern {
  key: string;
  title: string;
  detail: string;
  severity: "critical" | "warning" | "info";
  filter: Partial<AuditFilters>;
}

export interface AuditDayBucket {
  date: string;
  count: number;
  anomaly: boolean;
}

export interface AuditInsights {
  patterns: AuditPattern[];
  daily: AuditDayBucket[];
  byAction: { action: string; count: number; pct: number }[];
  topActors: { actorId: string; name: string; email: string | null; count: number }[];
  bySection: { entityType: string; count: number; pct: number }[];
  generatedAt: string;
}

export interface RetentionState {
  keepDays: number | null;
  archiveBeforeDelete: boolean;
  legalHold: boolean;
  storageUsedMb: number;
  storageQuotaMb: number;
  updatedAt: string | null;
}

export interface ExportScheduleState {
  enabled: boolean;
  frequency: string;
  format: "CSV" | "JSON";
  recipients: string[];
}

export interface IntegrityState {
  ok: boolean;
  checked: number;
  lastVerifiedAt: string | null;
  firstMismatchId: string | null;
}

export interface AuditAlertRuleView {
  id: string;
  name: string;
  condition: Record<string, unknown>;
  severity: "Critical" | "Warning";
  channels: string[];
  enabled: boolean;
}

export interface AuditChannelView {
  type: "Email" | "Telegram" | "Webhook";
  connected: boolean;
  connectedAt: string | null;
}

export const AUDIT_ACTIONS: AuditAction[] = [
  "CREATE",
  "BULK_CREATE",
  "UPDATE",
  "APPROVE",
  "BULK_APPROVE",
  "REJECT",
  "DELETE",
  "BULK_DELETE",
  "ROLE_CHANGE",
  "LOG_PURGE",
];

export const AUDIT_ENTITIES = [
  "Job",
  "PrivateJob",
  "Result",
  "AdmitCard",
  "AnswerKey",
  "Syllabus",
  "Admission",
  "Blog",
  "User",
  "Log",
  "RetentionPolicy",
  "AlertRule",
] as const;

export const SENSITIVE_ACTIONS: AuditAction[] = ["ROLE_CHANGE", "DELETE", "BULK_DELETE", "LOG_PURGE"];

export function isSensitiveAction(action: string): boolean {
  return (SENSITIVE_ACTIONS as string[]).includes(action);
}

export const ACTION_LABEL: Record<AuditAction, string> = {
  CREATE: "Created",
  BULK_CREATE: "Bulk created",
  UPDATE: "Updated",
  APPROVE: "Approved",
  BULK_APPROVE: "Bulk approved",
  REJECT: "Rejected",
  DELETE: "Deleted",
  BULK_DELETE: "Bulk deleted",
  ROLE_CHANGE: "Role change",
  LOG_PURGE: "Log purge",
};

export const SAVED_VIEWS: { key: AuditSavedView; label: string }[] = [
  { key: "all", label: "All" },
  { key: "needs-review", label: "Needs review" },
  { key: "sensitive", label: "Sensitive" },
  { key: "deletions", label: "Deletions" },
  { key: "approvals", label: "Approvals" },
  { key: "role-changes", label: "Role changes" },
  { key: "imports", label: "Imports" },
  { key: "flagged", label: "Flagged" },
];

export function viewToActions(view: AuditSavedView): AuditAction[] {
  switch (view) {
    case "sensitive":
      return ["ROLE_CHANGE", "DELETE", "BULK_DELETE", "LOG_PURGE"];
    case "deletions":
      return ["DELETE", "BULK_DELETE"];
    case "approvals":
      return ["APPROVE", "BULK_APPROVE"];
    case "role-changes":
      return ["ROLE_CHANGE"];
    case "imports":
      return ["BULK_CREATE", "CREATE"];
    default:
      return [];
  }
}

export function initials(name: string | null | undefined, email: string | null | undefined): string {
  const src = (name ?? "").trim() || (email ?? "").trim();
  if (!src) return "SY";
  const parts = src.replace(/@.*$/, "").split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
