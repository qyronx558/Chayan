"use client"
import { isAdmin, isSuperAdmin } from "@/lib/roles";

/** SaaS module registry - single source of truth for all 6 core modules. */
export const ADMIN_MODULES = [
  { key: "Job", label: "Gov Jobs", plural: "Gov Jobs", endpoint: "/api/jobs", adminHref: "/admin/jobs", publicPrefix: "/jobs", queryKey: "admin-jobs" },
  { key: "Result", label: "Result", plural: "Results", endpoint: "/api/results", adminHref: "/admin/results", publicPrefix: "/results", queryKey: "admin-results" },
  { key: "AdmitCard", label: "Admit Card", plural: "Admit Cards", endpoint: "/api/admit-cards", adminHref: "/admin/admit-cards", publicPrefix: "/admit-cards", queryKey: "admin-admit-cards" },
  { key: "AnswerKey", label: "Answer Key", plural: "Answer Keys", endpoint: "/api/answer-keys", adminHref: "/admin/answer-keys", publicPrefix: "/answer-keys", queryKey: "admin-answer-keys" },
  { key: "Admission", label: "Admission", plural: "Admissions", endpoint: "/api/admissions", adminHref: "/admin/admissions", publicPrefix: "/admissions", queryKey: "admin-admissions" },
  { key: "Syllabus", label: "Syllabus", plural: "Syllabus", endpoint: "/api/syllabus", adminHref: "/admin/syllabus", publicPrefix: "/syllabus", queryKey: "admin-syllabus" },
] as const;

export type AdminModuleKey = (typeof ADMIN_MODULES)[number]["key"];

export function moduleMeta(key: string) {
  return ADMIN_MODULES.find((m) => m.key === key);
}

export type BulkAction =
  | "publish"
  | "unpublish"
  | "expire"
  | "upcoming"
  | "approve"
  | "reject"
  | "delete"
  | "submit";

export const BULK_ACTIONS: { value: BulkAction; label: string; superOnly?: boolean; danger?: boolean }[] = [
  { value: "publish", label: "Set ACTIVE" },
  { value: "expire", label: "Set EXPIRED" },
  { value: "upcoming", label: "Set UPCOMING" },
  { value: "approve", label: "Approve", superOnly: true },
  { value: "reject", label: "Reject", superOnly: true },
  { value: "delete", label: "Delete", danger: true },
];

export function canBulk(_role?: string | null) {
  return isAdmin(_role);
}

export function canApprove(role?: string | null) {
  return isSuperAdmin(role);
}

export function canImport(role?: string | null) {
  return isAdmin(role);
}

export function canSeeAll(role?: string | null) {
  return isSuperAdmin(role);
}

/** Quality helpers shared across modules. */
export function isExpiredRow(lastDate?: string | null, status?: string | null) {
  if (!lastDate) return false;
  const d = new Date(lastDate);
  if (Number.isNaN(d.getTime())) return false;
  return d.getTime() < Date.now() && status !== "EXPIRED";
}

export function isExpiringSoon(lastDate?: string | null, days = 7) {
  if (!lastDate) return false;
  const d = new Date(lastDate);
  if (Number.isNaN(d.getTime())) return false;
  const diff = d.getTime() - Date.now();
  return diff > 0 && diff < days * 86400000;
}

export function missingFieldsScore(row: Record<string, unknown>, required: string[]) {
  return required.filter((k) => {
    const v = row[k];
    return v === null || v === undefined || (typeof v === "string" && v.trim() === "");
  });
}

export function isProbablyBrokenUrl(url?: string | null) {
  if (!url) return false;
  const u = url.trim();
  if (u.startsWith("/")) return false;
  return !/^https?:\/\/.+\..+/.test(u);
}
