"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

export interface PageCrumb {
  label: string;
  href?: string;
}

export function PageHeader({
  crumbs,
  title,
  badge,
  description,
  actions,
}: {
  crumbs: PageCrumb[];
  title: string;
  badge?: ReactNode;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[12.5px] text-slate-400 dark:text-slate-500">
          <Link href="/admin/dashboard" className="font-medium transition-colors hover:text-teal-600">
            Admin
          </Link>
          {crumbs.map((c) => (
            <span key={c.label} className="flex min-w-0 items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
              {c.href ? (
                <Link href={c.href} className="truncate font-medium transition-colors hover:text-teal-600">
                  {c.label}
                </Link>
              ) : (
                <span className="truncate font-semibold text-slate-700 dark:text-slate-200">{c.label}</span>
              )}
            </span>
          ))}
        </nav>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h1 className="truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-slate-50">
            {title}
          </h1>
          {badge}
        </div>
        {description ? (
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
