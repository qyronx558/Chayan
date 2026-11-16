"use client";

import { formatDate } from "@/lib/utils";
import { formatSalaryRange } from "@/lib/private-jobs-trust";
import type { ListModuleConfig } from "@/components/admin/list/types";
import { PrivateJobFormDialog } from "./PrivateJobFormDialog";

export interface PrivateJobRow {
  id: string;
  title: string;
  slug: string;
  type: string;
  category: string | null;
  description: string | null;
  location: string | null;
  country?: string | null;
  city?: string | null;
  salary: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  experience: string | null;
  expMin: number | null;
  expMax: number | null;
  qualification: string | null;
  skills: string[];
  remotePolicy: string | null;
  vacancies: number | null;
  applicationUrl: string | null;
  applicationEmail: string | null;
  proofUrl: string | null;
  lastDate: string | null;
  status: string;
  isFresherFriendly: boolean | null;
  isWalkIn: boolean | null;
  walkInVenue: string | null;
  walkInDate: string | null;
  trustScore: number;
  views: number;
  createdAt: string;
  moderation?: string | null;
  reviewNote?: string | null;
  createdById?: string | null;
  createdBy?: { id: string; name: string | null; email: string; role?: string | null } | null;
  company: { id: string; name: string };
}

const typeLabels: Record<string, string> = {
  FULL_TIME: "Full-Time",
  PART_TIME: "Part-Time",
  INTERNSHIP: "Internship",
  CONTRACT: "Contract",
};

export const privateJobsConfig: ListModuleConfig<PrivateJobRow> = {
  module: "PrivateJob",
  title: "Private Jobs",
  singular: "private job",
  plural: "Private Jobs",
  newLabel: "New Private Job",
  description: "Private-sector listings - rich description supports plain text or styled HTML with live preview.",
  crumbs: [{ label: "Private Jobs" }],
  endpoint: "/api/private-jobs",
  queryKey: "admin-private-jobs-list",
  auditEntity: "PrivateJob",
  publicHref: (row) => `/private-jobs/${row.slug}`,
  filters: [
    { key: "companyId", label: "Company", endpoint: "/api/companies" },
  ],
  lookups: [
    { key: "companies", endpoint: "/api/companies" },
  ],
  searchPlaceholder: "Search private jobs by title, company…",
  metaLine: (row) => {
    const parts = [row.company.name, typeLabels[row.type] ?? row.type];
    const salary = formatSalaryRange(row.salaryMin, row.salaryMax, row.salary);
    if (salary) parts.push(salary);
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
    companyId: row.company.id,
    type: row.type,
    category: row.category,
    description: row.description,
    location: row.location,
    salary: row.salary,
    salaryMin: row.salaryMin,
    salaryMax: row.salaryMax,
    experience: row.experience,
    expMin: row.expMin,
    expMax: row.expMax,
    qualification: row.qualification,
    skills: row.skills ?? [],
    remotePolicy: row.remotePolicy,
    vacancies: row.vacancies,
    applicationUrl: row.applicationUrl,
    applicationEmail: row.applicationEmail,
    proofUrl: row.proofUrl,
    lastDate: row.lastDate,
    status: row.status,
    isFresherFriendly: row.isFresherFriendly ?? false,
    isWalkIn: row.isWalkIn ?? false,
    walkInVenue: row.walkInVenue,
    walkInDate: row.walkInDate,
  }),
  FormDialog: PrivateJobFormDialog,
};
