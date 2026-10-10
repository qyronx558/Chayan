"use client";

import { useCallback, useState } from "react";

export const ADMIN_PAGE_SIZES = [10, 25, 50, 100] as const;
export const PUBLIC_PAGE_SIZES = [12, 24, 48] as const;

export type Density = "comfortable" | "compact";

function readStored(key: string, fallback: number): number {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(key) : null;
    const n = raw ? parseInt(raw, 10) : NaN;
    return Number.isFinite(n) ? n : fallback;
  } catch {
    return fallback;
  }
}

function clamp(n: number, options: readonly number[]): number {
  if ((options as readonly number[]).includes(n)) return n;
  // Snap to nearest valid option instead of rejecting.
  let best = options[0];
  for (const o of options) {
    if (Math.abs(o - n) < Math.abs(best - n)) best = o;
  }
  return best;
}

/**
 * Flexible rows-per-page with per-person persistence.
 * - Admin: options 10/25/50/100. First-time default: SUPER_ADMIN 25, otherwise 10.
 * - Public: options 12/24/48, default 12 (grid-friendly).
 * Stored choice always wins over the role default.
 */
export function useAdminPageSize(moduleKey: string, isSuperAdmin: boolean) {
  const storageKey = `admin:pageSize:${moduleKey}`;
  const [pageSize, setPageSizeState] = useState(() =>
    clamp(readStored(storageKey, isSuperAdmin ? 25 : 10), ADMIN_PAGE_SIZES)
  );

  const setPageSize = useCallback(
    (n: number) => {
      const v = clamp(n, ADMIN_PAGE_SIZES);
      setPageSizeState(v);
      try {
        localStorage.setItem(storageKey, String(v));
      } catch {
        /* ignore */
      }
    },
    [storageKey]
  );

  return { pageSize, setPageSize, options: ADMIN_PAGE_SIZES };
}

export function usePublicPageSize(section: string) {
  const storageKey = `public:pageSize:${section}`;
  const [pageSize, setPageSizeState] = useState(() =>
    clamp(readStored(storageKey, 12), PUBLIC_PAGE_SIZES)
  );

  const setPageSize = useCallback(
    (n: number) => {
      const v = clamp(n, PUBLIC_PAGE_SIZES);
      setPageSizeState(v);
      try {
        localStorage.setItem(storageKey, String(v));
      } catch {
        /* ignore */
      }
    },
    [storageKey]
  );

  return { pageSize, setPageSize, options: PUBLIC_PAGE_SIZES };
}

export function useDensity(scopeKey: string, defaultDensity: Density = "comfortable") {
  const storageKey = `table:density:${scopeKey}`;
  const [density, setDensityState] = useState<Density>(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
      return raw === "compact" ? "compact" : defaultDensity;
    } catch {
      return defaultDensity;
    }
  });

  const setDensity = useCallback(
    (d: Density) => {
      setDensityState(d);
      try {
        localStorage.setItem(storageKey, d);
      } catch {
        /* ignore */
      }
    },
    [storageKey]
  );

  return { density, setDensity };
}
