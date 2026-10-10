"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { runBulk } from "@/lib/admin/bulk";
import { toast } from "@/components/ui/toast";

/** Shared clone + bulk-delete + quick-approve logic for all 6 modules. */
export function useSaaSModule(module: string, queryKey: string) {
  const queryClient = useQueryClient();
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [cloningId, setCloningId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [bulkApproving, setBulkApproving] = useState(false);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [queryKey] });
    queryClient.invalidateQueries({ queryKey: ["review-queue"] });
    queryClient.invalidateQueries({ queryKey: ["review-overview"] });
  };

  const cloneMutation = useMutation({
    mutationFn: (id: string) => api.post("/api/admin/clone", { module, id }),
    onMutate: (id) => setCloningId(id),
    onSuccess: () => {
      invalidate();
      toast(`${module} duplicated`, "success");
    },
    onError: (e: unknown) => toast(e instanceof Error ? e.message : "Clone failed", "destructive"),
    onSettled: () => setCloningId(null),
  });

  const quickApprove = async (id: string) => {
    setApprovingId(id);
    try {
      const res = await runBulk(api, { module, ids: [id], action: "approve" });
      if (res.failed > 0) toast("Approve failed (super admin only?)", "destructive");
      else {
        toast("Approved & live", "success");
        invalidate();
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : "Approve failed", "destructive");
    } finally {
      setApprovingId(null);
    }
  };

  const bulkApprove = async (ids: string[]) => {
    if (ids.length === 0) return;
    setBulkApproving(true);
    try {
      const res = await runBulk(api, { module, ids, action: "approve" });
      if (res.failed > 0) toast(`Approved ${res.ok}, failed ${res.failed}`, "destructive");
      else toast(`Approved ${res.ok} items`, "success");
      invalidate();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Bulk approve failed", "destructive");
    } finally {
      setBulkApproving(false);
    }
  };

  return {
    bulkEditOpen, setBulkEditOpen,
    importOpen, setImportOpen,
    cloningId, approvingId, bulkApproving,
    clone: (id: string) => cloneMutation.mutate(id),
    quickApprove, bulkApprove,
    invalidate,
  };
}
