"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/toast"

interface Referral { id: string; title: string; companyName: string; url: string; proofUrl: string | null; location: string | null; note: string | null; status: string; createdAt: string }

export default function AdminReferrals() {
  const [items, setItems] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/private-jobs/refer")
      const json = await res.json()
      if (json.success) setItems(json.data)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const act = async (id: string, action: "APPROVED" | "REJECTED") => {
    try {
      const res = await fetch(`/api/admin/referrals/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) })
      const json = await res.json()
      if (json.success) { toast(action === "APPROVED" ? "Approved - publish from Private Jobs" : "Rejected", "success"); load() }
      else toast(json.error || "Failed", "destructive")
    } catch { toast("Failed", "destructive") }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-6">
      <h1 className="text-2xl font-bold">Job referrals ({items.length})</h1>
      <p className="text-sm text-gray-500">Community-submitted openings. Approve to keep in queue, then create the Private Job from the URL.</p>
      {loading ? <p className="text-sm text-gray-500">Loading…</p> : items.length === 0 ? <Card><CardContent className="py-10 text-center text-sm text-gray-500">No pending referrals.</CardContent></Card> : (
        <div className="space-y-3">
          {items.map((r) => (
            <Card key={r.id}><CardHeader className="pb-2"><CardTitle className="text-base">{r.title} <span className="font-normal text-gray-500">at {r.companyName}</span></CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><a href={r.url} target="_blank" rel="noreferrer" className="text-teal-700 underline">{r.url}</a></p>
                {r.proofUrl && <p>Proof: <a href={r.proofUrl} target="_blank" rel="noreferrer" className="underline">{r.proofUrl}</a></p>}
                {r.location && <Badge variant="outline">{r.location}</Badge>}
                {r.note && <p className="text-gray-600">{r.note}</p>}
                <div className="flex gap-2 pt-1">
                  <Button size="sm" onClick={() => act(r.id, "APPROVED")}>Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => act(r.id, "REJECTED")}>Reject</Button>
                  <Button size="sm" variant="ghost" asChild><a href={`/admin/private-jobs?search=${encodeURIComponent(r.title)}`} target="_blank">Open private jobs</a></Button>
                </div>
              </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  )
}
