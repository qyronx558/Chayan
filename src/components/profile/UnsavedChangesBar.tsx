"use client"

import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface UnsavedChangesBarProps {
  visible: boolean
  saving: boolean
  canSave: boolean
  onDiscard: () => void
  onSave: () => void
}

export function UnsavedChangesBar({ visible, saving, canSave, onDiscard, onSave }: UnsavedChangesBarProps) {
  if (!visible) return null
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 sm:px-6 sm:pb-4" role="status" aria-live="polite">
      <div className="mx-auto flex max-w-3xl flex-col gap-2 rounded-xl border border-rule bg-background/95 p-3  sm:flex-row sm:items-center  ">
        <p className="flex-1 text-sm font-medium text-foreground dark:text-muted-foreground">You have unsaved changes</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onDiscard} disabled={saving}>
            Discard
          </Button>
          <Button size="sm" onClick={onSave} disabled={saving || !canSave}>
            {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
            Save changes
          </Button>
        </div>
      </div>
    </div>
  )
}
