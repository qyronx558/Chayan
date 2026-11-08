"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PageSizeSelectProps {
  value: number;
  options: readonly number[];
  onChange: (n: number) => void;
  label?: string;
}

/** Rows-per-page selector shared by every admin + public list. */
export function PageSizeSelect({ value, options, onChange, label = "Rows" }: PageSizeSelectProps) {
  return (
    <label className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground dark:text-muted-foreground">
      <span className="hidden font-medium sm:inline">{label}</span>
      <Select value={String(value)} onValueChange={(v) => onChange(parseInt(v, 10))}>
        <SelectTrigger className="h-8 w-[76px] text-xs" aria-label={`${label} per page`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={String(o)}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="hidden font-medium md:inline">/ page</span>
    </label>
  );
}
