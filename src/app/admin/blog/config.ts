"use client";

import { formatViews } from "@/lib/utils";
import type { ListModuleConfig } from "@/components/admin/list/types";
import { BlogFormDialog } from "./BlogFormDialog";

export interface BlogRow {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  author: string | null;
  image: string | null;
  tags: string | null;
  categoryId: string | null;
  category: { id: string; name: string; slug: string; color: string | null } | null;
  published: boolean;
  views: number;
  createdAt: string;
  moderation?: string | null;
  reviewNote?: string | null;
  createdById?: string | null;
  createdBy?: { id: string; name: string | null; email: string; role?: string | null } | null;
}

export const blogConfig: ListModuleConfig<BlogRow> = {
  module: "Blog",
  title: "Blog Posts",
  singular: "post",
  plural: "Posts",
  newLabel: "New Post",
  description: "Long-form content with a full editor - title, rich body and publishing sidebar.",
  crumbs: [{ label: "Blog Posts" }],
  endpoint: "/api/blog",
  queryKey: "admin-blog-list",
  auditEntity: "Blog",
  publicHref: (row) => `/blog/${row.slug}`,
  filters: [
    { key: "category", label: "Category", endpoint: "/api/blog-categories", param: "category", valueKey: "slug", lookupKey: "categories" },
  ],
  lookups: [{ key: "categories", endpoint: "/api/blog-categories" }],
  searchPlaceholder: "Search posts by title, excerpt, tags…",
  metaLine: (row) => {
    const parts = [row.category?.name ?? "Uncategorized", row.author || "ChayanJobs", formatViews(row.views)];
    if (row.tags) parts.push(row.tags.split(",").slice(0, 3).map((t) => t.trim()).filter(Boolean).join(", "));
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
    excerpt: row.excerpt,
    content: row.content,
    author: row.author,
    image: row.image,
    tags: row.tags,
    categoryId: row.categoryId,
    published: row.published,
  }),
  FormDialog: BlogFormDialog,
};
