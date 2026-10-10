"use client";

import type { ListModuleKey, ListTab } from "@/lib/admin/access";
import type { Density } from "@/lib/admin/usePageSize";

export type { ListTab, Density };

export interface UploaderInfo {
  id: string;
  name: string | null;
  email: string;
  role?: string | null;
}

export interface BaseRow {
  id: string;
  title: string;
  slug: string;
  moderation?: string | null;
  reviewNote?: string | null;
  createdAt: string;
  createdBy?: UploaderInfo | null;
  createdById?: string | null;
}

export interface FilterDef {
  key: string;
  label: string;
  endpoint: string;
  param?: string;
  valueKey?: "id" | "slug";
  lookupKey?: string;
}

export interface LookupOption {
  id: string;
  name: string;
  slug?: string;
}

export interface ListCounts {
  all: number;
  published: number;
  needsReview: number;
  draft: number;
  rejected: number;
}

export interface ListResponse<TRow> {
  success: boolean;
  data: TRow[];
  pagination: { page: number; totalPages: number; total: number };
  counts?: ListCounts;
}

export interface ListQuery {
  q: string;
  tab: ListTab;
  page: number;
  size: number;
  density: Density;
  filters: Record<string, string>;
  uploader: string;
}

export interface FormDialogProps<TRow> {
  row: TRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lookups: Record<string, LookupOption[]>;
  onSaved: () => void;
}

export interface ListModuleConfig<TRow extends BaseRow> {
  module: ListModuleKey;
  title: string;
  singular: string;
  plural: string;
  newLabel: string;
  description: string;
  crumbs: { label: string; href?: string }[];
  endpoint: string;
  queryKey: string;
  auditEntity: string;
  publicHref: (row: TRow) => string;
  filters: FilterDef[];
  lookups: { key: string; endpoint: string }[];
  searchPlaceholder: string;
  metaLine: (row: TRow) => string[];
  dateLabel: string;
  dateOf: (row: TRow) => string | null | undefined;
  uploaderOf: (row: TRow) => UploaderInfo | null;
  moderationOf: (row: TRow) => string | null | undefined;
  submittable: (row: TRow) => boolean;
  toDuplicate: (row: TRow) => Record<string, unknown>;
  FormDialog: React.ComponentType<FormDialogProps<TRow>>;
}
