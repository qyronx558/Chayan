import { createHash } from "crypto";

export type AgentClass = "human" | "search_bot" | "unknown_bot";

const SEARCH_TOKENS = ["googlebot", "bingbot", "slurp", "duckduckbot", "baiduspider", "yandexbot", "sogou", "exabot", "facebot", "ia_archiver"];

const BOT_TOKENS = ["bot", "crawl", "spider", "slurp", "mediapartners", "headless", "phantomjs", "python-requests", "curl", "wget", "ahrefs", "semrush", "mj12bot", "dotbot", "petalbot"];

export function classifyAgent(ua: string | null | undefined): AgentClass {
  const s = (ua ?? "").toLowerCase();
  if (!s) return "unknown_bot";
  if (SEARCH_TOKENS.some((t) => s.includes(t))) return "search_bot";
  if (BOT_TOKENS.some((t) => s.includes(t))) return "unknown_bot";
  if (!s.includes("mozilla")) return "unknown_bot";
  return "human";
}

export function deviceFromUa(ua: string | null | undefined): string {
  const s = (ua ?? "").toLowerCase();
  if (s.includes("mobile") || s.includes("android") || s.includes("iphone")) {
    if (s.includes("tablet") || s.includes("ipad")) return "tablet";
    return "mobile";
  }
  if (s.includes("tablet") || s.includes("ipad")) return "tablet";
  return "desktop";
}

export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const salt = process.env.ANALYTICS_IP_SALT ?? "chayanjobs-analytics";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

export type SourceKey = "organic" | "direct" | "messaging" | "referral";

export function sourceFromEvent(input: { referrer?: string | null; utmSource?: string | null; utmMedium?: string | null }): SourceKey {
  const ref = (input.referrer ?? "").toLowerCase();
  const utm = (input.utmSource ?? "").toLowerCase();
  const med = (input.utmMedium ?? "").toLowerCase();
  const combined = `${utm} ${med} ${ref}`;
  if (combined.includes("whatsapp") || combined.includes("telegram") || combined.includes("t.me") || combined.includes("wa.me")) return "messaging";
  if (!ref && !utm) return "direct";
  if (ref.includes("google.") || ref.includes("bing.") || ref.includes("yahoo.") || ref.includes("duckduckgo.") || utm.includes("google") || utm.includes("bing") || med.includes("organic") || med.includes("cpc")) return "organic";
  return "referral";
}

export function sourceLabel(key: SourceKey): string {
  if (key === "organic") return "Organic search";
  if (key === "direct") return "Direct";
  if (key === "messaging") return "WhatsApp & Telegram";
  return "Referral";
}

export function normalizeCategory(name: string): string {
  let s = name.trim().toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
  if (s.endsWith("ies") && s.length > 4) s = `${s.slice(0, -3)}y`;
  else if (s.endsWith("ses") || s.endsWith("xes") || s.endsWith("zes")) s = s.slice(0, -2);
  else if (s.endsWith("s") && s.length > 3 && !s.endsWith("ss")) s = s.slice(0, -1);
  return s;
}

export function findDuplicateGroups(names: string[]): string[][] {
  const buckets = new Map<string, string[]>();
  for (const n of names) {
    const k = normalizeCategory(n);
    const list = buckets.get(k) ?? [];
    list.push(n);
    buckets.set(k, list);
  }
  return [...buckets.values()].filter((g) => g.length > 1);
}

export function bucketSizeForRange(days: number): number {
  if (days <= 30) return 1;
  if (days <= 90) return 3;
  return 14;
}

export function bucketCountForRange(days: number): number {
  if (days <= 30) return days;
  if (days <= 90) return Math.ceil(days / 3);
  return Math.ceil(days / 14);
}

export async function verifySearchBot(host: string | null | undefined, ip: string | null | undefined): Promise<boolean> {
  if (!host || !ip) return false;
  const h = host.toLowerCase();
  if (h.endsWith(".googlebot.com") || h.endsWith(".google.com")) return true;
  if (h.endsWith(".search.msn.com") || h.endsWith(".bing.com")) return true;
  return false;
}
