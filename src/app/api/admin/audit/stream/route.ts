import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin, isSuperAdmin } from "@/lib/roles";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const superAdmin = isSuperAdmin(session.user.role);
  const since = new URL(request.url).searchParams.get("since") || new Date(Date.now() - 60000).toISOString();
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(`: connected\n\n`));
      const timer = setInterval(async () => {
        try {
          const rows = await prisma.log.findMany({
            where: {
              createdAt: { gt: new Date(since) },
              ...(superAdmin ? {} : { userId: session.user.id }),
            },
            include: { user: { select: { id: true, name: true, email: true } } },
            orderBy: { createdAt: "desc" },
            take: 10,
          });
          if (rows.length > 0) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ count: rows.length, events: rows.slice(0, 3) })}\n\n`));
          } else {
            controller.enqueue(encoder.encode(`: ping\n\n`));
          }
        } catch {
          controller.enqueue(encoder.encode(`: error\n\n`));
        }
      }, 8000);
      request.signal.addEventListener("abort", () => clearInterval(timer));
      setTimeout(() => {
        clearInterval(timer);
        try {
          controller.close();
        } catch {
        }
      }, 120000);
    },
  });
  return new NextResponse(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" },
  });
}
