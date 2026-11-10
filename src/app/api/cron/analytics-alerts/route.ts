import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAnalytics } from "@/lib/analytics/service";

export const dynamic = "force-dynamic";

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  return req.headers.get("authorization") === `Bearer ${secret}` || new URL(req.url).searchParams.get("secret") === secret;
}

async function notify(channels: string[], title: string, body: string) {
  if (channels.includes("Email") && process.env.RESEND_API_KEY) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.RESEND_FROM_EMAIL ?? "noreply@chayanjobs.com", to: process.env.ALERT_EMAIL ?? "admin@chayanjobs.com", subject: title, text: body }),
    }).catch(() => null);
  }
  if (channels.includes("Telegram") && process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text: `${title}\n${body}` }),
    }).catch(() => null);
  }
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const store = prisma as unknown as {
    alertRule: { findMany: (a: unknown) => Promise<Array<{ id: string; metric: string; threshold: number; channels: string[]; enabled: boolean }>> };
    alertEvent: { create: (a: unknown) => Promise<unknown> };
  };
  try {
    const rules = await store.alertRule.findMany({ where: { enabled: true } }).catch(() => []);
    if (rules.length === 0) return NextResponse.json({ success: true, evaluated: 0 });
    const a = await getAnalytics("7D");
    const errRate = typeof a.monitoring.kpis[2]?.value === "number" ? (a.monitoring.kpis[2].value as number) : 0;
    const latency = a.monitoring.kpis[1]?.value ?? 0;
    const botShare = a.monitoring.perf[0]?.botShare ?? 0;
    const viewsDrop = a.overview.trend[0]?.deltaPct ?? 0;
    const values: Record<string, number> = {
      error_rate: errRate,
      latency_p95: typeof latency === "number" ? latency : 0,
      bot_share: botShare,
      views_drop: viewsDrop,
      open_issues: a.monitoring.openIssues,
    };
    let fired = 0;
    for (const r of rules) {
      const v = values[r.metric];
      if (v === undefined) continue;
      const breach = r.metric === "views_drop" ? v < -Math.abs(r.threshold) : v > r.threshold;
      if (!breach) continue;
      await store.alertEvent.create({ data: { ruleId: r.id, metric: r.metric, value: v, threshold: r.threshold, channels: r.channels } }).catch(() => null);
      await notify(r.channels, `ChayanJobs alert: ${r.metric}`, `Value ${v} breached threshold ${r.threshold}.`);
      fired += 1;
    }
    return NextResponse.json({ success: true, evaluated: rules.length, fired });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Alert run failed" }, { status: 500 });
  }
}
