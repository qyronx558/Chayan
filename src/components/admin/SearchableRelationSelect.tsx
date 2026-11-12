"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronsUpDown } from "lucide-react";
import { api } from "@/lib/api";
import { cn, slugify } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { LookupOption } from "@/components/admin/list/types";
import { CategoryPicker, CompanyPicker, DepartmentPicker, DistrictPicker, StatePicker } from "./picker/RelationPicker";

interface SearchableRelationSelectProps {
  value: string | null | undefined;
  onChange: (id: string | null) => void;
  options: LookupOption[];
  label: string;
  endpoint: string;
  placeholder?: string;
  searchPlaceholder?: string;
  allowCreate?: boolean;
  nullable?: boolean;
  noneLabel?: string;
  buildCreatePayload?: (name: string, slug: string) => Record<string, unknown>;
  onCreateNew?: (name: string) => void;
  invalidateKeys?: string[][];
  disabled?: boolean;
  /** Shown instead of the placeholder while disabled (e.g. "Select a state first"). */
  disabledHint?: string;
  loading?: boolean;
  /** District picker only: the parent state's name for the picker subtitle. */
  contextLabel?: string;
}

export function SearchableRelationSelect({
  value,
  onChange,
  options,
  label,
  endpoint,
  placeholder,
  searchPlaceholder,
  allowCreate = true,
  nullable = false,
  noneLabel = "None",
  buildCreatePayload,
  onCreateNew,
  invalidateKeys = [],
  disabled = false,
  disabledHint,
  loading = false,
  contextLabel,
}: SearchableRelationSelectProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => o.id === value) ?? null;
  const stale = !!value && !selected;

  const handleCreate = async (name: string) => {
    if (onCreateNew) {
      onCreateNew(name);
      return null;
    }
    const slug = slugify(name);
    const payload = buildCreatePayload
      ? buildCreatePayload(name, slug)
      : { name, slug, description: null };
    const res = await api.post<{ success: boolean; data: { id: string; name?: string | null } }>(endpoint, payload);
    const created = res?.data;
    if (!created?.id) throw new Error(`Failed to create ${label.toLowerCase()}`);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["list-lookup", endpoint] }),
      ...invalidateKeys.map((key) => queryClient.invalidateQueries({ queryKey: key })),
    ]);
    return { id: created.id, name: created.name ?? name };
  };

  const pickerProps = {
    open,
    onOpenChange: setOpen,
    value: value ?? null,
    onSelect: (id: string) => onChange(id),
    onCreate: handleCreate,
    searchPlaceholder,
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        role="combobox"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={cn(
          "h-10 w-full min-w-0 justify-between px-3 py-2 text-sm font-normal",
          !selected && !stale && "text-muted-foreground"
        )}
      >
        <span className="min-w-0 flex-1 truncate text-left">
          {disabled && disabledHint
            ? disabledHint
            : selected
              ? selected.name
              : stale
                ? loading ? "Loading…" : "Previously selected (unavailable)"
                : (placeholder ?? `Select ${label.toLowerCase()}`)}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {label === "District" ? (
        <DistrictPicker
          {...pickerProps}
          districts={options}
          loading={loading}
          stateName={contextLabel}
          allowNone={nullable}
          noneLabel={noneLabel}
          onClear={() => onChange(null)}
        />
      ) : label === "State" ? (
        <StatePicker
          {...pickerProps}
          states={options}
          allowCreate={false}
          allowNone={nullable}
          noneLabel={noneLabel}
          onClear={() => onChange(null)}
        />
      ) : label === "Category" ? (
        <CategoryPicker
          {...pickerProps}
          categories={options}
          allowCreate={allowCreate}
          onClear={() => onChange(null)}
        />
      ) : label === "Company" ? (
        <CompanyPicker
          {...pickerProps}
          companies={options}
          allowCreate={allowCreate}
          onClear={() => onChange(null)}
        />
      ) : (
        <DepartmentPicker
          {...pickerProps}
          departments={options}
          allowCreate={allowCreate}
          onClear={() => onChange(null)}
        />
      )}
    </>
  );
}
