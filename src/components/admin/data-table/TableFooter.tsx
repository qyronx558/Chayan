"use client";

import { Pagination } from "@/components/ui/pagination";
import { PageSizeSelect } from "./PageSizeSelect";

interface TableFooterProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  pageSizeOptions: readonly number[];
  onPageChange: (p: number) => void;
  onPageSizeChange: (n: number) => void;
  itemLabel?: string;
}

/** Unified SaaS footer: range label + pagination + rows-per-page. */
export function TableFooter({
  page,
  totalPages,
  total,
  pageSize,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
  itemLabel = "rows",
}: TableFooterProps) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);
  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 p-3 sm:flex-row sm:p-4 dark:border-white/[0.06]">
      <p className="order-2 text-xs tabular-nums text-slate-500 sm:order-1 dark:text-slate-400" aria-live="polite">
        Showing {start}–{end} of {total} {itemLabel}
      </p>
      <div className="order-1 sm:order-2">
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={onPageChange} />
      </div>
      <div className="order-3">
        <PageSizeSelect value={pageSize} options={pageSizeOptions} onChange={onPageSizeChange} />
      </div>
    </div>
  );
}
