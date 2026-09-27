"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export interface FormTab {
  id: string
  label: string
  content: React.ReactNode
}

export function AdminFormDialog({
  open,
  onOpenChange,
  title,
  description,
  tabs,
  onSubmit,
  saving,
  submitLabel,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  tabs: FormTab[]
  onSubmit: () => void
  saving?: boolean
  submitLabel?: string
}) {
  const [active, setActive] = useState(tabs[0]?.id ?? "basic")

  // Always start on the first tab whenever the dialog is opened
  const handleOpenChange = (next: boolean) => {
    if (next && tabs[0]) setActive(tabs[0].id)
    onOpenChange(next)
  }

  const idx = tabs.findIndex((t) => t.id === active)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="!flex !max-h-[95vh] !max-w-[95vw] flex-col gap-0 p-0 md:!max-w-6xl">
        <DialogHeader className="flex shrink-0 flex-row items-center justify-between border-b px-6 py-4">
          <div>
            <DialogTitle className="text-xl">{title}</DialogTitle>
            <DialogDescription>
              {description ?? "Fill each section. Required fields are marked with *."}
            </DialogDescription>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={onSubmit} disabled={saving}>
              {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              {submitLabel ?? "Save"}
            </Button>
          </div>
        </DialogHeader>

        <Tabs value={active} onValueChange={setActive} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 border-b bg-gray-50 px-6 py-2">
            <TabsList>
              {tabs.map((t, i) => (
                <TabsTrigger key={t.id} value={t.id}>
                  <span className="mr-1.5 hidden h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-[11px] font-semibold sm:inline-flex">
                    {i + 1}
                  </span>
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {tabs.map((t) => (
              <TabsContent key={t.id} value={t.id} className="mx-auto max-w-4xl space-y-4 px-6 py-6">
                {t.content}
              </TabsContent>
            ))}
          </div>
          <div className="flex shrink-0 items-center justify-between border-t bg-white px-6 py-3">
            <p className="text-xs text-gray-500">
              Step {idx + 1} of {tabs.length}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={idx <= 0}
                onClick={() => setActive(tabs[idx - 1].id)}
              >
                Back
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={idx >= tabs.length - 1}
                onClick={() => setActive(tabs[idx + 1].id)}
              >
                Next
              </Button>
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
