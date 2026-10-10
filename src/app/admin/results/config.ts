"use client";

import { formatDate } from "@/lib/utils";
import type { ListModuleConfig } from "@/components/admin/list/types";
import { ResultFormDialog } from "./ResultFormDialog";

export interface ResultRow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  jobId: string | null;
  pdfUrl: string | null;
  resultDate: string | null;
  status: string | null;
  createdAt: string;
  moderation?: string | null;
  reviewNote?: string | null;
  createdById?: string | null;
  createdBy?: { id: string; name: string | null; email: string; role?: string | null } | null;
  department: { id: string; name: string };
  category: { id: string; name: string };
}

export const resultsConfig: ListModuleConfig<ResultRow> = {
  module: "Result",
  title: "Results",
  singular: "result",
  plural: "Results",
  newLabel: "New Result",
  description: "Exam results - description supports plain text or styled HTML with live preview.",
  crumbs: [{ label: "Results" }],
  endpoint: "/api/results",
  queryKey: "admin-results-list",
  auditEntity: "Result",
  publicHref: (row) => `/result/${row.slug}`,
  filters: [
    { key: "departmentId", label: "Department", endpoint: "/api/departments" },
    { key: "categoryId", label: "Category", endpoint: "/api/categories" },
  ],
  lookups: [
    { key: "departments", endpoint: "/api/departments" },
    { key: "categories", endpoint: "/api/categories" },
  ],
  searchPlaceholder: "Search results by title, department…",
  metaLine: (row) => {
    const parts = [row.department.name, row.category.name];
    const d = formatDate(row.resultDate);
    if (d) parts.push(`Declared ${d}`);
    if (row.status) parts.push(row.status === "PUBLISHED" ? "Published" : row.status);
    return parts;
  },
  dateLabel: "Result date",
  dateOf: (row) => row.resultDate,
  uploaderOf: (row) => row.createdBy ?? null,
  moderationOf: (row) => row.moderation,
  submittable: (row) => row.moderation !== "APPROVED",
  toDuplicate: (row) => ({
    title: row.title,
    slug: row.slug,
    description: row.description,
    departmentId: row.department.id,
    categoryId: row.category.id,
    jobId: row.jobId,
    pdfUrl: row.pdfUrl,
    resultDate: row.resultDate,
    status: row.status,
  }),
  FormDialog: ResultFormDialog,
};
