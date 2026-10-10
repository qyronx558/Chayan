"use client";

import { formatDate } from "@/lib/utils";
import type { ListModuleConfig } from "@/components/admin/list/types";
import { AdmitCardFormDialog } from "./AdmitCardFormDialog";

export interface AdmitCardRow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  jobId: string | null;
  examDate: string | null;
  downloadUrl: string | null;
  status: string | null;
  createdAt: string;
  moderation?: string | null;
  reviewNote?: string | null;
  createdById?: string | null;
  createdBy?: { id: string; name: string | null; email: string; role?: string | null } | null;
  department: { id: string; name: string };
  category: { id: string; name: string };
}

export const admitCardsConfig: ListModuleConfig<AdmitCardRow> = {
  module: "AdmitCard",
  title: "Admit Cards",
  singular: "admit card",
  plural: "Admit Cards",
  newLabel: "New Admit Card",
  description: "Exam admit cards - description supports plain text or styled HTML with live preview.",
  crumbs: [{ label: "Admit Cards" }],
  endpoint: "/api/admit-cards",
  queryKey: "admin-admit-cards-list",
  auditEntity: "AdmitCard",
  publicHref: (row) => `/admit-card/${row.slug}`,
  filters: [
    { key: "departmentId", label: "Department", endpoint: "/api/departments" },
    { key: "categoryId", label: "Category", endpoint: "/api/categories" },
  ],
  lookups: [
    { key: "departments", endpoint: "/api/departments" },
    { key: "categories", endpoint: "/api/categories" },
  ],
  searchPlaceholder: "Search admit cards by title, department…",
  metaLine: (row) => {
    const parts = [row.department.name, row.category.name];
    const d = formatDate(row.examDate);
    if (d) parts.push(`Exam ${d}`);
    if (row.status) parts.push(row.status === "PUBLISHED" ? "Published" : row.status);
    return parts;
  },
  dateLabel: "Exam date",
  dateOf: (row) => row.examDate,
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
    examDate: row.examDate,
    downloadUrl: row.downloadUrl,
    status: row.status,
  }),
  FormDialog: AdmitCardFormDialog,
};
