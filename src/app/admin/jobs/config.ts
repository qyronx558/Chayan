"use client";

import { formatDate } from "@/lib/utils";
import { jobLocationLabel } from "@/lib/locations";
import type { ListModuleConfig } from "@/components/admin/list/types";
import { JobFormDialog } from "./JobFormDialog";

export interface JobRow {
  id: string;
  title: string;
  slug: string;
  status: string;
  advertisementNo: string | null;
  totalVacancies: number | null;
  salary: string | null;
  location: string | null;
  ageLimit: string | null;
  ageRelaxation: string | null;
  education: string | null;
  selectionProcess: string | null;
  applicationFee: string | null;
  importantDates: Record<string, string> | null;
  documentsRequired: string | null;
  howToApply: string | null;
  officialNotification: string | null;
  officialWebsite: string | null;
  applyLink: string | null;
  experience: string | null;
  summary?: string | null;
  startDate: string | null;
  lastDate: string | null;
  createdAt: string;
  moderation?: string | null;
  reviewNote?: string | null;
  createdById?: string | null;
  createdBy?: { id: string; name: string | null; email: string; role?: string | null } | null;
  department: { id: string; name: string };
  category: { id: string; name: string };
  jobLevel?: "CENTRAL" | "STATE" | "DISTRICT" | null;
  state: { id: string; name: string; slug?: string } | null;
  district?: { id: string; name: string; slug?: string } | null;
}

export const jobsConfig: ListModuleConfig<JobRow> = {
  module: "Job",
  title: "Gov Jobs",
  singular: "job",
  plural: "Jobs",
  newLabel: "New Job",
  description: "Government job postings - plain text or styled HTML, previewed exactly as readers see it.",
  crumbs: [{ label: "Gov Jobs" }],
  endpoint: "/api/jobs",
  queryKey: "admin-jobs-list",
  auditEntity: "Job",
  publicHref: (row) => `/apply/${row.slug}`,
  filters: [
    { key: "departmentId", label: "Department", endpoint: "/api/departments" },
    { key: "categoryId", label: "Category", endpoint: "/api/categories" },
    {
      key: "level",
      label: "Job level",
      endpoint: "",
      options: [
        { id: "central", name: "Central (All India)" },
        { id: "state", name: "State" },
        { id: "district", name: "District" },
      ],
    },
    { key: "stateId", label: "State", endpoint: "/api/states" },
  ],
  lookups: [
    { key: "departments", endpoint: "/api/departments" },
    { key: "categories", endpoint: "/api/categories" },
    { key: "states", endpoint: "/api/states" },
  ],
  searchPlaceholder: "Search jobs by title, department…",
  metaLine: (row) => {
    const parts = [row.department.name, row.category.name, jobLocationLabel(row)];
    if (row.totalVacancies) parts.push(`${row.totalVacancies} vacancies`);
    const last = formatDate(row.lastDate);
    if (last) parts.push(`Last date ${last}`);
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
    departmentId: row.department.id,
    categoryId: row.category.id,
    jobLevel: row.jobLevel ?? (row.state ? "STATE" : "CENTRAL"),
    stateId: row.state?.id ?? null,
    districtId: row.district?.id ?? null,
    advertisementNo: row.advertisementNo,
    totalVacancies: row.totalVacancies,
    salary: row.salary,
    location: row.location,
    ageLimit: row.ageLimit,
    ageRelaxation: row.ageRelaxation,
    education: row.education,
    selectionProcess: row.selectionProcess,
    applicationFee: row.applicationFee,
    importantDates: row.importantDates,
    documentsRequired: row.documentsRequired,
    howToApply: row.howToApply,
    officialNotification: row.officialNotification,
    officialWebsite: row.officialWebsite,
    applyLink: row.applyLink,
    status: row.status,
    experience: row.experience,
    summary: row.summary ?? null,
    startDate: row.startDate,
    lastDate: row.lastDate,
  }),
  FormDialog: JobFormDialog,
};
