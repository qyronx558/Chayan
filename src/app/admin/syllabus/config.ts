"use client";

import type { ListModuleConfig } from "@/components/admin/list/types";
import { SyllabusFormDialog } from "./SyllabusFormDialog";

export interface SyllabusRow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  jobId: string | null;
  pdfUrl: string | null;
  subjects: string | null;
  status: string | null;
  createdAt: string;
  moderation?: string | null;
  reviewNote?: string | null;
  createdById?: string | null;
  createdBy?: { id: string; name: string | null; email: string; role?: string | null } | null;
  department: { id: string; name: string };
  category: { id: string; name: string };
}

export const syllabusConfig: ListModuleConfig<SyllabusRow> = {
  module: "Syllabus",
  title: "Syllabus",
  singular: "syllabus",
  plural: "Syllabus",
  newLabel: "New Syllabus",
  description: "Exam syllabi - description and subjects support plain text or styled HTML.",
  crumbs: [{ label: "Syllabus" }],
  endpoint: "/api/syllabus",
  queryKey: "admin-syllabus-list",
  auditEntity: "Syllabus",
  publicHref: (row) => `/syllabus/${row.slug}`,
  filters: [
    { key: "departmentId", label: "Department", endpoint: "/api/departments" },
    { key: "categoryId", label: "Category", endpoint: "/api/categories" },
  ],
  lookups: [
    { key: "departments", endpoint: "/api/departments" },
    { key: "categories", endpoint: "/api/categories" },
  ],
  searchPlaceholder: "Search syllabus by title, department…",
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
    subjects: row.subjects,
    status: row.status,
  }),
  FormDialog: SyllabusFormDialog,
};
