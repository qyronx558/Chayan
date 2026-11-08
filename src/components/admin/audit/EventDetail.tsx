"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";
import { DiffView } from "./DiffView";
import type { AuditEventView } from "./types";
import { Copy, Flag, CheckCheck, History, Trash2, Link2 } from "lucide-react";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold text-muted-foreground dark:text-muted-foreground">{label}</p>
      <div className="mt-1 text-xs text-foreground break-words dark:text-muted-foreground">{children}</div>
    </div>
  );
}

export function EventDetail({
  event,
  isSuper,
  onAction,
  childrenEvents,
}: {
  event: AuditEventView;
  isSuper: boolean;
  onAction: (id: string, op: string, note?: string) => void;
  childrenEvents?: AuditEventView[];
}) {
  const [note, setNote] = useState(event.note || "");
  const device = event.userAgent ? event.userAgent.split(" ").slice(-2).join(" ") : "-";
  return (
    <div className="border-b border-rule bg-paper-2/60 px-3 py-3 sm:px-4  dark:bg-background/[0.02]">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Event ID"><span className="font-mono">{event.id}</span></Field>
        <Field label="Time">{formatDate(event.createdAt, "dd MMM yyyy HH:mm:ss")}</Field>
        <Field label="Actor">{event.actor ? `${event.actor.name || "-"} · ${event.actor.email || "-"} · ${event.actorRole || event.actor.role || "-"}` : "System"}</Field>
        <Field label="Source">{event.source}</Field>
        {isSuper ? (
          <>
            <Field label="IP and device">{`${event.ipAddress || "-"} · ${device}`}</Field>
            <Field label="Request ID"><span className="font-mono">{event.requestId || "-"}</span></Field>
          </>
        ) : null}
        <Field label="Entity">
          <span>{event.entityType} · </span>
          <span className="font-mono">{event.entityId}</span>
        </Field>
      </div>
      <div className="mt-3">
        <p className="text-[11px] font-semibold text-muted-foreground dark:text-muted-foreground">Changes</p>
        <div className="mt-1"><DiffView diff={event.diff} /></div>
      </div>
      {childrenEvents && childrenEvents.length > 0 ? (
        <div className="mt-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold text-muted-foreground dark:text-muted-foreground">Grouped events ({childrenEvents.length})</p>
            {isSuper ? (
              <Button variant="outline" className="h-[30px] px-2.5 text-xs leading-none" onClick={() => onAction(event.id, "flag-all")}>
                <Flag className="mr-1 h-3 w-3" /> Flag all
              </Button>
            ) : null}
          </div>
          <ul className="mt-1.5 space-y-1">
            {childrenEvents.map((c) => (
              <li key={c.id} className="flex items-center gap-2 rounded-lg border border-rule bg-background px-2.5 py-1.5 text-xs  dark:bg-transparent">
                <span className="shrink-0 tabular-nums text-muted-foreground">{new Date(c.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                <span className="font-mono text-[11px] text-muted-foreground">{c.entityId.slice(0, 8)}</span>
                <span className="min-w-0 flex-1 truncate text-muted-foreground dark:text-muted-foreground">{c.summary}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {isSuper ? (
        <div className="mt-3">
          <p className="text-[11px] font-semibold text-muted-foreground dark:text-muted-foreground">Internal note</p>
          <div className="mt-1 flex flex-col gap-2 sm:flex-row">
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add an internal note…" className="h-9 flex-1 bg-background " aria-label="Internal note" />
            <Button className="h-9 bg-paper-3 text-paper hover:bg-paper-3" onClick={() => { onAction(event.id, "note", note); toast("Note saved", "success"); }}>Save</Button>
          </div>
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Button
          variant="outline"
          className="h-9 px-3 text-xs leading-none"
          onClick={() => {
            const url = `${window.location.origin}/admin/logs?focus=${event.id}`;
            navigator.clipboard.writeText(url).then(() => toast("Link copied", "success")).catch(() => toast("Copy failed", "destructive"));
          }}
        >
          <Link2 className="mr-1.5 h-3.5 w-3.5" /> Copy link
        </Button>
        <Button variant="outline" className="h-9 px-3 text-xs leading-none" onClick={() => { navigator.clipboard.writeText(event.entityId).then(() => toast("Entity ID copied", "success")).catch(() => toast("Copy failed", "destructive")); }}>
          <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy ID
        </Button>
        {isSuper ? (
          <>
            <Button variant="outline" className="h-9 px-3 text-xs leading-none" onClick={() => onAction(event.id, "flag")}>
              <Flag className="mr-1.5 h-3.5 w-3.5" /> Flag for review
            </Button>
            <Button variant="outline" className="h-9 px-3 text-xs leading-none" onClick={() => onAction(event.id, "review")}>
              <CheckCheck className="mr-1.5 h-3.5 w-3.5" /> Mark reviewed
            </Button>
            {event.action === "ROLE_CHANGE" ? (
              <Button variant="outline" className="h-9 px-3 text-xs leading-none" onClick={() => onAction(event.id, "revert-role")}>
                <History className="mr-1.5 h-3.5 w-3.5" /> Revert role change
              </Button>
            ) : null}
            {event.action === "DELETE" || event.action === "BULK_DELETE" ? (
              <Button variant="outline" className="h-9 px-3 text-xs leading-none" onClick={() => onAction(event.id, "restore")}>
                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Restore items
              </Button>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
