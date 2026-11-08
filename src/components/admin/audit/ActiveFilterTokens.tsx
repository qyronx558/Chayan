"use client";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { AuditFilters } from "./types";

export function ActiveFilterTokens({ filters, onChange }: { filters: AuditFilters; onChange: (f: AuditFilters) => void }) {
  const tokens: { key: keyof AuditFilters; label: string }[] = [];
  if (filters.action) tokens.push({ key: "action", label: `Action: ${filters.action}` });
  if (filters.entity) tokens.push({ key: "entity", label: `Section: ${filters.entity}` });
  if (filters.actor) tokens.push({ key: "actor", label: `Actor: ${filters.actor.slice(0, 8)}` });
  if (filters.from || filters.to) tokens.push({ key: "from", label: `Date: ${filters.from || "…"} → ${filters.to || "…"}` });
  if (tokens.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tokens.map((t) => (
        <span
          key={t.key}
          className="inline-flex h-[26px] items-center gap-1 rounded-full border border-rule bg-background pl-2.5 pr-1 text-xs font-medium leading-none text-foreground  dark:bg-background/5 dark:text-muted-foreground"
        >
          <span className="leading-none">{t.label}</span>
          <button
            aria-label={`Remove ${t.label}`}
            onClick={() => {
              if (t.key === "from") onChange({ ...filters, from: "", to: "" });
              else onChange({ ...filters, [t.key]: "" });
            }}
            className="inline-flex h-5 w-5 items-center justify-center rounded-full leading-none text-muted-foreground hover:bg-paper-3 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rule dark:hover:bg-background/10"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <Button
        variant="ghost"
        className="h-[26px] px-2 text-xs leading-none text-muted-foreground"
        onClick={() => onChange({ ...filters, action: "", entity: "", actor: "", from: "", to: "" })}
      >
        Clear all
      </Button>
    </div>
  );
}
