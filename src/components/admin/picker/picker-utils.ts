export interface PickerItem {
  id: string;
  name: string;
}

const ACRONYM_RE = /\s*\(([^()]*)\)\s*$/;

export function normalizeName(value: string): string {
  return value.toLowerCase().replace(/\([^()]*\)/g, "").replace(/\s+/g, " ").trim();
}

export function normalizeQuery(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export function extractAcronym(name: string): { text: string; acronym: string | null } {
  const match = name.match(ACRONYM_RE);
  if (!match) return { text: name.trim(), acronym: null };
  return { text: name.slice(0, match.index).trim(), acronym: match[1].trim() || null };
}

export function initialsFor(name: string): string {
  const words = normalizeName(name).split(" ").filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

const AVATAR_THEMES = [
  "bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200",
  "bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200",
  "bg-violet-100 text-violet-800 dark:bg-violet-900/60 dark:text-violet-200",
  "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200",
  "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200",
  "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200",
  "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200",
  "bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-200",
];

export function avatarThemeFor(name: string): string {
  const key = normalizeName(name);
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return AVATAR_THEMES[hash % AVATAR_THEMES.length];
}

export function dedupeByNormalizedName<T extends PickerItem>(items: T[]): T[] {
  const byKey = new Map<string, T>();
  for (const item of items) {
    const key = normalizeName(item.name);
    if (!key) continue;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, item);
      continue;
    }
    const existingHasAcronym = extractAcronym(existing.name).acronym !== null;
    const nextHasAcronym = extractAcronym(item.name).acronym !== null;
    if (!existingHasAcronym && nextHasAcronym) byKey.set(key, item);
  }
  return [...byKey.values()];
}

export function matchesQuery(name: string, query: string): boolean {
  if (!query) return true;
  const q = normalizeQuery(query);
  const { text, acronym } = extractAcronym(name);
  const compact = q.replace(/\s+/g, "");
  return (
    normalizeName(text).includes(q) ||
    (acronym !== null && acronym.toLowerCase().includes(compact))
  );
}
