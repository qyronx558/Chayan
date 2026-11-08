"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { Loader2 } from "lucide-react"
import { DataCard } from "@/components/admin/dashboard/DataCard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/components/ui/toast"

interface DeleteAccountCardProps {
  admin: boolean
}

export function DeleteAccountCard({ admin }: DeleteAccountCardProps) {
  const router = useRouter()
  const [value, setValue] = useState("")
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const ready = value === "DELETE"

  async function confirmDelete() {
    setBusy(true)
    try {
      const res = await fetch("/api/users/me", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "DELETE" }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast((json as { error?: string }).error || "Could not delete account", "destructive")
        return
      }
      toast("Account deleted", "success")
      setOpen(false)
      await signOut({ callbackUrl: "/" })
      router.push("/")
    } catch {
      toast("Could not delete account", "destructive")
    } finally {
      setBusy(false)
    }
  }

  if (admin) {
    return (
      <DataCard title="Delete account" subtitle="Danger zone">
        <p className="text-sm text-muted-foreground dark:text-muted-foreground">A super admin removes admin accounts. Contact support for help.</p>
      </DataCard>
    )
  }

  return (
    <DataCard title="Delete account" subtitle="Permanently remove your account and data">
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="delete-confirm">Type DELETE to enable</Label>
          <Input id="delete-confirm" value={value} onChange={(e) => setValue(e.target.value)} placeholder="DELETE" autoComplete="off" />
        </div>
        <Button variant="destructive" size="sm" disabled={!ready} onClick={() => setOpen(true)}>
          Delete my account
        </Button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete account?</DialogTitle>
            <DialogDescription>This permanently deletes your profile, preferences and activity. This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DataCard>
  )
}
