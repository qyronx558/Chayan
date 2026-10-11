"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function RolePill({ role, className }: { role?: string | null; className?: string }) {
  const v = (role ?? "").toUpperCase();
  if (v === "SUPER_ADMIN") {
    return (
      <Badge
        className={cn(
          "border-teal-700/20 bg-teal-700/10 font-semibold text-teal-800 hover:bg-teal-700/15 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-200",
          className
        )}
      >
        Super admin
      </Badge>
    );
  }
  if (v === "ADMIN") {
    return (
      <Badge variant="outline" className={cn("font-semibold text-slate-600 dark:text-slate-300", className)}>
        Admin
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className={cn("font-medium text-slate-500 dark:text-slate-400", className)}>
      {v === "USER" ? "User" : (role ?? "Unknown")}
    </Badge>
  );
}
