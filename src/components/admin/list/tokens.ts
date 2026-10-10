"use client";

export const T_PRIMARY = "bg-teal-700 text-white shadow-sm hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500";

export const T_CARD = "overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#0b1220]";

export const T_HEAD_CELL = "text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500";

export const MOD_DOT: Record<string, string> = {
  APPROVED: "bg-emerald-500",
  PENDING: "bg-amber-500",
  REJECTED: "bg-rose-500",
};

export const MOD_LABEL: Record<string, string> = {
  APPROVED: "Published",
  PENDING: "Needs review",
  REJECTED: "Rejected",
};

export const MOD_TEXT: Record<string, string> = {
  APPROVED: "text-emerald-700 dark:text-emerald-300",
  PENDING: "text-amber-700 dark:text-amber-300",
  REJECTED: "text-rose-700 dark:text-rose-300",
};

export function modDot(moderation?: string | null): string {
  return MOD_DOT[moderation ?? ""] ?? "bg-slate-400";
}

export function modLabel(moderation?: string | null): string {
  return MOD_LABEL[moderation ?? ""] ?? (moderation || "Unknown");
}

export function modText(moderation?: string | null): string {
  return MOD_TEXT[moderation ?? ""] ?? "text-slate-500 dark:text-slate-400";
}

export function initials(name?: string | null, email?: string | null): string {
  const source = (name || email || "?").trim();
  if (!source) return "?";
  if (source.includes("@")) return source.charAt(0).toUpperCase();
  const parts = source.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
