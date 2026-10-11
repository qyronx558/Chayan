import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }), session: null };
  }
  if (session.user.role !== "SUPER_ADMIN") {
    return { error: NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 }), session: null };
  }
  return { error: null, session };
}

export async function requireStaff() {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }), session: null };
  }
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return { error: NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 }), session: null };
  }
  return { error: null, session };
}

const cache = new Map<string, { at: number; body: unknown }>();

export function cached<T>(key: string, ttlMs: number, build: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return Promise.resolve(hit.body as T);
  return build().then((body) => {
    if (cache.size > 200) cache.clear();
    cache.set(key, { at: Date.now(), body });
    return body;
  });
}

export function cacheHeaders(): Record<string, string> {
  return { "Cache-Control": "private, max-age=60, stale-while-revalidate=60" };
}
