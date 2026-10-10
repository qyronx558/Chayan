"use client";

import { formatDate } from "@/lib/utils";
import type { ListModuleConfig } from "@/components/admin/list/types";
import { AdmissionFormDialog } from "./AdmissionFormDialog";

export interface AdmissionRow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  pdfUrl: string | null;
  startDate: string | null;
  lastDate: string | null;
  applicationFee: string | null;
  status: string | null;
  createdAt: string;
  moderation?: string | null;
  reviewNote?: string | null;
  createdById?: string | null;
  createdBy?: { id: string; name: string | null; email: string; role?: string | null } | null;
  department: { id: string; name: string };
  category: { id: string; name: string };
}

export const admissionsConfig: ListModuleConfig<AdmissionRow> = {
  module: "Admission",
  title: "Admissions",
  singular: "admission",
  plural: "Admissions",
  newLabel: "New Admission",
  description: "Admission notices - description and fee support plain text or styled HTML.",
  crumbs: [{ label: "Admissions" }],
  endpoint: "/api/admissions",
  queryKey: "admin-admissions-list",
  auditEntity: "Admission",
  publicHref: (row) => `/admission/${row.slug}`,
  filters: [
    { key: "departmentId", label: "Department", endpoint: "/api/departments" },
    { key: "categoryId", label: "Category", endpoint: "/api/categories" },
  ],
  lookups: [
    { key: "departments", endpoint: "/api/departments" },
    { key: "categories", endpoint: "/api/categories" },
  ],
  searchPlaceholder: "Search admissions by title, department…",
  metaLine: (row) => {
    const parts = [row.department.name, row.category.name];
    const start = formatDate(row.startDate);
    const last = formatDate(row.lastDate);
    if (start || last) parts.push(`${start || "…"} → ${last || "…"}`);
    if (row.status) parts.push(row.status === "PUBLISHED" ? "Published" : row.status);
    return parts;
  },
  dateLabel: "Last date",
  dateOf: (row) => row.lastDate,
  uploaderOf: (row) => row.createdBy ?? null,
  moderationOf: (row) => row.moderation,
  submittable: (row) => row.moderation !== "APPROVED",
  toDuplicate: (row) => ({
    title: row.title,
    slug: row.slug,
    description: row.description,
    departmentId: row.department.id,
    categoryId: row.category.id,
    startDate: row.startDate,
    lastDate: row.lastDate,
    applicationFee: row.applicationFee,
    pdfUrl: row.pdfUrl,
    status: row.status,
  }),
  FormDialog: AdmissionFormDialog,
};
