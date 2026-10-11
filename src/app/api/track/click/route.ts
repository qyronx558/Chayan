import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { jobId?: string; targetUrl?: string; sessionId?: string; userId?: string };
    if (!body.targetUrl || !/^https?:\/\//.test(body.targetUrl)) {
      return NextResponse.json({ success: false, error: "Invalid URL" }, { status: 400 });
    }
    const store = prisma as unknown as { outboundClick: { create: (a: unknown) => Promise<unknown> } };
    await store.outboundClick.create({
      data: {
        jobId: body.jobId?.slice(0, 40) ?? null,
        targetUrl: body.targetUrl.slice(0, 1000),
        sessionId: body.sessionId?.slice(0, 80) ?? null,
        userId: body.userId?.slice(0, 40) ?? null,
      },
    }).catch(() => null);
    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}
