import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { classifyAgent, deviceFromUa, hashIp } from "@/lib/analytics/parse";

export const dynamic = "force-dynamic";

function clientIp(req: NextRequest): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() ?? null;
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return null;
}

function startOfDay(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

async function bumpEntityCounter(entityType: string | undefined, entityId: string | undefined) {
  if (!entityType || !entityId) return;
  const date = startOfDay();
  if (entityType === "JOB") {
    await prisma.jobView.upsert({
      where: { jobId_date: { jobId: entityId, date } },
      update: { views: { increment: 1 } },
      create: { jobId: entityId, date, views: 1 },
    });
  } else if (entityType === "PRIVATE_JOB") {
    await prisma.$transaction([
      prisma.privateJob.update({ where: { id: entityId }, data: { views: { increment: 1 } } }),
      prisma.privateJobView.upsert({
        where: { privateJobId_date: { privateJobId: entityId, date } },
        update: { views: { increment: 1 } },
        create: { privateJobId: entityId, date, views: 1 },
      }),
    ]);
  } else if (entityType === "BLOG") {
    await prisma.blogPost.update({ where: { id: entityId }, data: { views: { increment: 1 } } });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (req.headers.get("dnt") === "1") return new NextResponse(null, { status: 204 });
    const body = (await req.json().catch(() => ({}))) as {
      path?: string;
      entityType?: string;
      entityId?: string;
      referrer?: string;
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
      state?: string;
      sessionId?: string;
      userId?: string;
      durationMs?: number;
    };
    const path = typeof body.path === "string" && body.path.startsWith("/") ? body.path.slice(0, 500) : "/";
    const ua = req.headers.get("user-agent");
    const agentClass = classifyAgent(ua);
    const refererHeader = req.headers.get("referer");
    const url = new URL(req.url);
    const get = (k: string) => url.searchParams.get(k) ?? undefined;
    const store = prisma as unknown as { pageViewEvent: { create: (a: unknown) => Promise<unknown> } };
    const counter = agentClass === "human" ? bumpEntityCounter(body.entityType, body.entityId?.slice(0, 80)).catch(() => null) : null;
    const event = store.pageViewEvent.create({
      data: {
        path,
        entityType: body.entityType?.slice(0, 40) ?? null,
        entityId: body.entityId?.slice(0, 80) ?? null,
        referrer: (body.referrer ?? refererHeader)?.slice(0, 500) ?? null,
        utmSource: (body.utmSource ?? get("utm_source"))?.slice(0, 120) ?? null,
        utmMedium: (body.utmMedium ?? get("utm_medium"))?.slice(0, 120) ?? null,
        utmCampaign: (body.utmCampaign ?? get("utm_campaign"))?.slice(0, 120) ?? null,
        deviceType: deviceFromUa(ua),
        state: body.state?.slice(0, 80) ?? null,
        userAgent: ua?.slice(0, 500) ?? null,
        userAgentClass: agentClass,
        hashedIp: hashIp(clientIp(req)),
        sessionId: body.sessionId?.slice(0, 80) ?? null,
        userId: body.userId?.slice(0, 40) ?? null,
        durationMs: typeof body.durationMs === "number" ? Math.min(3600000, Math.max(0, Math.round(body.durationMs))) : null,
      },
    }).catch(() => null);
    await Promise.all([event, counter]);
    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}
