"use client";

import { useEffect, useMemo, useState } from "react";
import { dedupeByNormalizedName, matchesQuery, type PickerItem } from "./picker-utils";

export interface PickerGroup<T extends PickerItem> {
  letter: string;
  items: T[];
}

export function useDepartmentSearch<T extends PickerItem>(items: T[], debounceMs = 150) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), debounceMs);
    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  const deduped = useMemo(() => dedupeByNormalizedName(items), [items]);

  const results = useMemo(() => {
    const filtered = deduped.filter((item) => matchesQuery(item.name, debounced));
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  }, [deduped, debounced]);

  const groups = useMemo<PickerGroup<T>[]>(() => {
    if (debounced.trim()) return [];
    const map = new Map<string, T[]>();
    for (const item of results) {
      const letter = (item.name.trim().charAt(0) || "#").toUpperCase();
      const bucket = map.get(letter) ?? [];
      bucket.push(item);
      map.set(letter, bucket);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([letter, letterItems]) => ({ letter, items: letterItems }));
  }, [results, debounced]);

  const takenNames = useMemo(() => deduped.map((item) => item.name), [deduped]);

  return {
    query,
    setQuery,
    debounced: debounced.trim(),
    searching: debounced.trim().length > 0,
    results,
    groups,
    total: deduped.length,
    takenNames,
  };
}
