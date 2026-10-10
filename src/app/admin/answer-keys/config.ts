"use client";

import type { ListModuleConfig } from "@/components/admin/list/types";
import { AnswerKeyFormDialog } from "./AnswerKeyFormDialog";

export interface AnswerKeyRow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  jobId: string | null;
  pdfUrl: string | null;
  status: string | null;
  createdAt: string;
  moderation?: string | null;
  reviewNote?: string | null;
  createdById?: string | null;
  createdBy?: { id: string; name: string | null; email: string; role?: string | null } | null;
  department: { id: string; name: string };
  category: { id: string; name: string };
}

export const answerKeysConfig: ListModuleConfig<AnswerKeyRow> = {
  module: "AnswerKey",
  title: "Answer Keys",
  singular: "answer key",
  plural: "Answer Keys",
  newLabel: "New Answer Key",
  description: "Provisional and final keys - plain text or styled HTML with live preview.",
  crumbs: [{ label: "Answer Keys" }],
  endpoint: "/api/answer-keys",
  queryKey: "admin-answer-keys-list",
  auditEntity: "AnswerKey",
  publicHref: (row) => `/answer-key/${row.slug}`,
  filters: [
    { key: "departmentId", label: "Department", endpoint: "/api/departments" },
    { key: "categoryId", label: "Category", endpoint: "/api/categories" },
  ],
  lookups: [
    { key: "departments", endpoint: "/api/departments" },
    { key: "categories", endpoint: "/api/categories" },
  ],
  searchPlaceholder: "Search answer keys by title, department…",
  metaLine: (row) => {
    const parts = [row.department.name, row.category.name];
    if (row.status) parts.push(row.status === "PUBLISHED" ? "Published" : row.status);
    return parts;
  },
  dateLabel: "Created",
  dateOf: (row) => row.createdAt,
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
    status: row.status,
  }),
  FormDialog: AnswerKeyFormDialog,
};
