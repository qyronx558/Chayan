import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ALLOWED = new Set(["LCP", "INP", "CLS", "FCP", "TTFB", "time-on-page"]);

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { metric?: string; value?: number; path?: string; sessionId?: string };
    if (!body.metric || !ALLOWED.has(body.metric)) {
      return NextResponse.json({ success: false, error: "Invalid metric" }, { status: 400 });
    }
    if (typeof body.value !== "number" || !isFinite(body.value)) {
      return NextResponse.json({ success: false, error: "Invalid value" }, { status: 400 });
    }
    const store = prisma as unknown as { webVitalEvent: { create: (a: unknown) => Promise<unknown> } };
    await store.webVitalEvent.create({
      data: {
        metric: body.metric,
        value: Math.max(0, Math.min(3600000, body.value)),
        path: body.path?.slice(0, 500) ?? null,
        sessionId: body.sessionId?.slice(0, 80) ?? null,
      },
    }).catch(() => null);
    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}
