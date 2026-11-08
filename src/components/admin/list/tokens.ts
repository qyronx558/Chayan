"use client";

export const T_PRIMARY = "bg-paper-3 text-paper  hover:bg-paper-3 dark:bg-paper-3 dark:hover:bg-paper-3";

export const T_CARD = "overflow-hidden rounded-2xl border-rule bg-background   ";

export const T_HEAD_CELL = "text-[11px] font-bold text-muted-foreground dark:text-muted-foreground";

export const MOD_DOT: Record<string, string> = {
  APPROVED: "bg-paper-3",
  PENDING: "bg-paper-2",
  REJECTED: "bg-paper-2",
};

export const MOD_LABEL: Record<string, string> = {
  APPROVED: "Published",
  PENDING: "Needs review",
  REJECTED: "Rejected",
};

export const MOD_TEXT: Record<string, string> = {
  APPROVED: "text-foreground dark:text-foreground",
  PENDING: "text-brick dark:text-brick",
  REJECTED: "text-brick dark:text-brick",
};

export function modDot(moderation?: string | null): string {
  return MOD_DOT[moderation ?? ""] ?? "bg-ink-2";
}

export function modLabel(moderation?: string | null): string {
  return MOD_LABEL[moderation ?? ""] ?? (moderation || "Unknown");
}

export function modText(moderation?: string | null): string {
  return MOD_TEXT[moderation ?? ""] ?? "text-muted-foreground dark:text-muted-foreground";
}

export function initials(name?: string | null, email?: string | null): string {
  const source = (name || email || "?").trim();
  if (!source) return "?";
  if (source.includes("@")) return source.charAt(0).toUpperCase();
  const parts = source.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
