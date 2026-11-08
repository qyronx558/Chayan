"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface ConfirmDeleteDialogProps {
  open: boolean
  title: string
  itemLabel?: string
  onCancel: () => void
  onConfirm: () => void
  pending?: boolean
}

export function ConfirmDeleteDialog({ open, title, itemLabel, onCancel, onConfirm, pending }: ConfirmDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-paper-2 text-brick dark:bg-paper-2">
              <AlertTriangle className="h-4 w-4" />
            </span>
            {title}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {itemLabel ? (
            <>Delete <span className="font-medium text-foreground dark:text-muted-foreground">“{itemLabel}”</span>? This action cannot be undone.</>
          ) : (
            "Are you sure? This action cannot be undone."
          )}
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={pending}>
            {pending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
