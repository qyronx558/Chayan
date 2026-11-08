"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { runBulk } from "@/lib/admin/bulk";
import type { BulkAction } from "@/lib/admin/permissions";
import { isSuperAdmin } from "@/lib/roles";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";

interface BulkEditDrawerProps {
  open: boolean;
  onClose: () => void;
  module: string;
  selectedIds: string[];
  queryKeysToInvalidate?: string[][];
  onDone?: () => void;
}

/**
 * SaaS bulk edit drawer: status change / approve / reject / delete across pages.
 * Uses the generic /api/admin/bulk engine with chunking + audit logging.
 */
export function BulkEditDrawer({
  open,
  onClose,
  module,
  selectedIds,
  queryKeysToInvalidate,
  onDone,
}: BulkEditDrawerProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [action, setAction] = useState<BulkAction>("publish");
  const [note, setNote] = useState("");
  const superView = isSuperAdmin(session?.user?.role);

  const mutation = useMutation({
    mutationFn: (input: { action: BulkAction; note?: string }) =>
      runBulk(api, { module, ids: selectedIds, action: input.action, note: input.note }),
    onSuccess: (res) => {
      (queryKeysToInvalidate ?? []).forEach((k) => queryClient.invalidateQueries({ queryKey: k }));
      queryClient.invalidateQueries({ queryKey: ["review-queue"] });
      queryClient.invalidateQueries({ queryKey: ["review-overview"] });
      if (res.failed > 0) {
        toast(`Bulk finished: ${res.ok} ok, ${res.failed} failed`, "destructive");
      } else {
        toast(`Bulk finished: ${res.ok} updated`, "success");
      }
      setNote("");
      onDone?.();
      onClose();
    },
    onError: (e: unknown) => {
      toast(e instanceof Error ? e.message : "Bulk action failed", "destructive");
    },
  });

  const needsNote = action === "reject";
  const canSubmit =
    selectedIds.length > 0 && !mutation.isPending && (!needsNote || note.trim().length > 0);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk edit - {selectedIds.length} selected</DialogTitle>
          <DialogDescription>
            Applies to <span className="font-semibold">{module}</span>. Ownership rules still apply:
            employees can only bulk-edit their own rows.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Action</Label>
            <Select value={action} onValueChange={(v) => setAction(v as BulkAction)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="publish">Set ACTIVE</SelectItem>
                <SelectItem value="expire">Set EXPIRED</SelectItem>
                <SelectItem value="upcoming">Set UPCOMING</SelectItem>
                {superView && <SelectItem value="approve">Approve (super only)</SelectItem>}
                {superView && <SelectItem value="reject">Reject (super only)</SelectItem>}
                <SelectItem value="delete">Delete (danger)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(action === "reject" || action === "approve") && (
            <div className="space-y-1.5">
              <Label>Review note {action === "reject" ? "(required)" : "(optional)"}</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Visible to the uploader in review history…"
                rows={3}
              />
            </div>
          )}

          {action === "delete" && (
            <p className="rounded-lg bg-paper-2 px-3 py-2 text-xs text-brick dark:bg-paper-2 dark:text-brick">
              Deleted rows are audit-logged and cannot be undone. Use filters to double-check your selection.
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button
              type="button"
              variant={action === "delete" ? "destructive" : "default"}
              disabled={!canSubmit}
              onClick={() => mutation.mutate({ action, note })}
            >
              {mutation.isPending ? "Applying…" : `Apply to ${selectedIds.length}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
