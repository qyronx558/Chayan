"use client";

import { forwardRef } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  listboxId: string;
  activeDescendantId?: string;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(function SearchBar(
  { value, onChange, placeholder, listboxId, activeDescendantId, onKeyDown },
  ref
) {
  return (
    <div className="relative w-full min-w-0 shrink-0">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={ref}
        autoFocus
        role="combobox"
        aria-expanded="true"
        aria-controls={listboxId}
        aria-activedescendant={activeDescendantId}
        aria-label={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={cn(
          "h-11 w-full min-w-0 rounded-xl border border-rule bg-paper-2 pl-10 pr-10 text-sm",
          "outline-none transition-colors placeholder:text-muted-foreground",
          "focus:border-rule focus:bg-background focus:ring-2 focus:ring-rule",
          " dark:bg-background/5 dark:focus:bg-transparent"
        )}
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-paper-3 hover:text-muted-foreground dark:hover:bg-background/10 dark:hover:text-muted-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
});
