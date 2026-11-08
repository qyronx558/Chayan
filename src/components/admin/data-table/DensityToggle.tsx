"use client";

import { Button } from "@/components/ui/button";
import { Rows3, AlignJustify } from "lucide-react";
import type { Density } from "@/lib/admin/usePageSize";
import { cn } from "@/lib/utils";

interface DensityToggleProps {
  value: Density;
  onChange: (d: Density) => void;
}

/** Comfortable / compact table density switch. */
export function DensityToggle({ value, onChange }: DensityToggleProps) {
  return (
    <div
      className="flex shrink-0 items-center rounded-lg border border-rule p-0.5 "
      role="group"
      aria-label="Table density"
    >
      <Button
        type="button"
        size="sm"
        variant="ghost"
        title="Comfortable density"
        aria-pressed={value === "comfortable"}
        onClick={() => onChange("comfortable")}
        className={cn(
          "h-7 px-2 text-xs",
          value === "comfortable" && "bg-paper-3 text-foreground dark:bg-background/10 dark:text-paper"
        )}
      >
        <AlignJustify className="mr-1 h-3.5 w-3.5" />
        <span className="hidden lg:inline">Comfy</span>
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        title="Compact density - more rows on screen"
        aria-pressed={value === "compact"}
        onClick={() => onChange("compact")}
        className={cn(
          "h-7 px-2 text-xs",
          value === "compact" && "bg-paper-3 text-foreground dark:bg-background/10 dark:text-paper"
        )}
      >
        <Rows3 className="mr-1 h-3.5 w-3.5" />
        <span className="hidden lg:inline">Compact</span>
      </Button>
    </div>
  );
}
