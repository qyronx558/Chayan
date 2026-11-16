"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Sparkles } from "lucide-react"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/toast"
import { T_PRIMARY } from "@/components/admin/list/tokens"
import { PROVIDER_LABEL, type Provider } from "./types"

const PLACEHOLDER: Record<Provider, string> = {
  GREENHOUSE: "boards.greenhouse.io/acme or acme",
  LEVER: "jobs.lever.co/acme or acme",
  ASHBY: "jobs.ashbyhq.com/acme or acme",
  SMARTRECRUITERS: "careers.smartrecruiters.com/Acme or Acme",
  WORKABLE: "apply.workable.com/acme or acme",
  RECRUITEE: "acme.recruitee.com or acme",
  PERSONIO: "acme.jobs.personio.de or acme",
  BREEZY: "acme.breezy.hr or acme",
  CAREER_PAGE: "https://acme.com/careers",
}

const HELP: Record<Provider, string> = {
  GREENHOUSE: "Exact data from the company's Greenhouse board.",
  LEVER: "Exact data from the company's Lever board.",
  ASHBY: "Exact data from the company's Ashby board.",
  SMARTRECRUITERS: "Exact data from the company's SmartRecruiters board (the company identifier is case-sensitive).",
  WORKABLE: "Exact data from the company's Workable board.",
  RECRUITEE: "Exact data from the company's Recruitee careers site.",
  PERSONIO: "Exact data from the company's Personio job feed.",
  BREEZY: "Exact data from the company's Breezy HR board.",
  CAREER_PAGE:
    "Any careers page. Structured data or an embedded board is used when the page has one; otherwise Gemini reads the page and every job is checked against the page text.",
}

export function AddSourceDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const qc = useQueryClient()
  const [provider, setProvider] = useState<Provider>("CAREER_PAGE")
  const [board, setBoard] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [companyWebsite, setCompanyWebsite] = useState("")
  const [indiaOnly, setIndiaOnly] = useState(false)

  const create = useMutation({
    mutationFn: () =>
      api.post<{ preview: { fetched: number; inScope: number; provider: Provider; note: string | null } }>("/api/admin/private-feeds", {
        provider,
        board,
        companyName,
        companyWebsite,
        indiaOnly,
      }),
    onSuccess: ({ preview }) => {
      const via = preview.provider !== provider ? ` (saved as its ${PROVIDER_LABEL[preview.provider]} board)` : ""
      toast(`Source added${via} - ${preview.inScope} of ${preview.fetched} openings will be imported on the next run.`, "success")
      qc.invalidateQueries({ queryKey: ["job-feeds"] })
      setBoard("")
      setCompanyName("")
      setCompanyWebsite("")
      onOpenChange(false)
    },
    onError: (e: Error) => toast(e.message, "destructive"),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a company source</DialogTitle>
          <DialogDescription>The source is read live before it is saved, so you see right away what it yields.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div role="radiogroup" aria-label="Source type" className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {(Object.keys(PROVIDER_LABEL) as Provider[]).map((p) => (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={provider === p}
                onClick={() => setProvider(p)}
                className={cn(
                  "flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-xs font-semibold transition-colors",
                  provider === p ? "border-foreground bg-foreground text-background" : "border-rule hover:bg-muted"
                )}
              >
                {p === "CAREER_PAGE" && <Sparkles className="h-3.5 w-3.5" />}
                {p === "CAREER_PAGE" ? "Careers page" : PROVIDER_LABEL[p]}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{HELP[provider]}</p>

          <Input value={board} onChange={(e) => setBoard(e.target.value)} placeholder={PLACEHOLDER[provider]} aria-label="Source URL or token" />
          <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Company name" aria-label="Company name" />
          <Input
            value={companyWebsite}
            onChange={(e) => setCompanyWebsite(e.target.value)}
            placeholder="Company website (optional, improves trust score)"
            aria-label="Company website"
          />
          <label className="flex items-center justify-between gap-3 rounded-xl border border-rule px-3 py-2.5 text-sm">
            <span>
              <span className="font-medium">India &amp; remote only</span>
              <span className="block text-xs text-muted-foreground">Skip openings located outside India.</span>
            </span>
            <Switch checked={indiaOnly} onCheckedChange={setIndiaOnly} />
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className={T_PRIMARY} disabled={!board.trim() || !companyName.trim() || create.isPending} onClick={() => create.mutate()}>
            {create.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            {create.isPending ? (provider === "CAREER_PAGE" ? "Reading page…" : "Checking…") : "Check & add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
