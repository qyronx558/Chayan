import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { term?: string; resultCount?: number; userId?: string };
    const term = (body.term ?? "").trim().slice(0, 200);
    if (!term) return NextResponse.json({ success: false, error: "Empty term" }, { status: 400 });
    const store = prisma as unknown as { searchQuery: { create: (a: unknown) => Promise<unknown> } };
    await store.searchQuery.create({
      data: {
        term: term.toLowerCase(),
        resultCount: typeof body.resultCount === "number" ? Math.max(0, Math.min(100000, Math.round(body.resultCount))) : 0,
        userId: body.userId?.slice(0, 40) ?? null,
      },
    }).catch(() => null);
    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}
