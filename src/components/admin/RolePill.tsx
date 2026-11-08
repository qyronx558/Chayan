"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function RolePill({ role, className }: { role?: string | null; className?: string }) {
  const v = (role ?? "").toUpperCase();
  if (v === "SUPER_ADMIN") {
    return (
      <Badge
        className={cn(
          "border-rule bg-paper-3 font-semibold text-brick hover:bg-paper-3 dark:border-rule dark:bg-paper-3 dark:text-brick",
          className
        )}
      >
        Super admin
      </Badge>
    );
  }
  if (v === "ADMIN") {
    return (
      <Badge variant="outline" className={cn("font-semibold text-muted-foreground dark:text-muted-foreground", className)}>
        Admin
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className={cn("font-medium text-muted-foreground dark:text-muted-foreground", className)}>
      {v === "USER" ? "User" : (role ?? "Unknown")}
    </Badge>
  );
}
