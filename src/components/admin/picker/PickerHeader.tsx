"use client";

import { DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface PickerHeaderProps {
  title: string;
  subtitle: string;
}

export function PickerHeader({ title, subtitle }: PickerHeaderProps) {
  return (
    <div className="min-w-0 shrink-0 pr-8">
      <DialogTitle className="truncate text-lg font-bold">{title}</DialogTitle>
      <DialogDescription className="mt-1 truncate text-sm">{subtitle}</DialogDescription>
    </div>
  );
}
