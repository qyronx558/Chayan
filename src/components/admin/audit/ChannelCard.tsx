"use client";
import { DataCard } from "@/components/admin/dashboard/DataCard";
import { Button } from "@/components/ui/button";
import type { AuditChannelView } from "./types";

export function ChannelCard({ channels, onToggle }: { channels: AuditChannelView[]; onToggle: (type: string, connect: boolean) => void }) {
  const cards = (["Email", "Telegram", "Webhook"] as const).map((t) => channels.find((c) => c.type === t) ?? { type: t, connected: false, connectedAt: null });
  return (
    <DataCard title="Channels" subtitle="Where alerts are delivered">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.type} className="rounded-lg border border-slate-200 p-3 dark:border-white/[0.06]">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{c.type === "Webhook" ? "Webhook / SIEM" : c.type}</p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{c.connected ? `Connected${c.connectedAt ? ` · ${new Date(c.connectedAt).toLocaleDateString("en-IN")}` : ""}` : "Not connected"}</p>
            <Button
              variant={c.connected ? "outline" : "default"}
              className={c.connected ? "mt-2.5 h-[30px] px-3 text-xs leading-none" : "mt-2.5 h-[30px] bg-teal-700 px-3 text-xs leading-none text-white hover:bg-teal-800"}
              onClick={() => onToggle(c.type, !c.connected)}
            >
              {c.connected ? "Disconnect" : "Connect"}
            </Button>
          </div>
        ))}
      </div>
    </DataCard>
  );
}
