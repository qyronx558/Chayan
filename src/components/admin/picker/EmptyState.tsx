"use client";

import { SearchX, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  query: string;
  singular: string;
  onCreate: () => void;
}

export function EmptyState({ query, singular, onCreate }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-white/10 dark:text-gray-500">
        <SearchX className="h-6 w-6" />
      </span>
      <p className="mt-3 max-w-full truncate text-sm font-medium text-gray-900 dark:text-gray-100">
        No {singular.toLowerCase()} found for &lsquo;{query}&rsquo;
      </p>
      <Button type="button" onClick={onCreate} className="mt-4 max-w-full">
        <Plus className="mr-2 h-4 w-4 shrink-0" />
        <span className="truncate">Create &lsquo;{query}&rsquo;</span>
      </Button>
    </div>
  );
}
