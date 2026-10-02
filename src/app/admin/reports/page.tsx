"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/toast"

interface Report { id: string; reason: string; details: string | null; status: string; createdAt: string; privateJob: { id: string; title: string; slug: string; trustScore: number; company: { name: string } } }

export default function AdminReports() {
  const [items, setItems] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetch("/api/admin/reports").then((r) => r.json()).then((d) => { if (d.success) setItems(d.data) }).finally(() => setLoading(false))
  }, [])
  const act = async (id: string, action: string) => {
    const res = await fetch(`/api/admin/reports/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) })
    const json = await res.json()
    if (json.success) { toast("Updated", "success"); setItems((prev) => prev.filter((x) => x.id !== id)) }
    else toast(json.error || "Failed", "destructive")
  }
  return (
    <div className="mx-auto max-w-5xl space-y-4 p-6">
      <h1 className="text-2xl font-bold">Job scam reports ({items.length})</h1>
      {loading ? <p className="text-sm text-gray-500">Loading…</p> : items.length === 0 ? <Card><CardContent className="py-10 text-center text-sm text-gray-500">No pending reports. 🎉</CardContent></Card> : (
        <div className="space-y-3">
          {items.map((r) => (
            <Card key={r.id}><CardContent className="space-y-1 p-4 text-sm">
              <p className="font-bold"><Link href={`/private-jobs/${r.privateJob.slug}`} className="hover:underline">{r.privateJob.title}</Link> <span className="font-normal text-gray-500">at {r.privateJob.company.name} · trust {r.privateJob.trustScore}</span></p>
              <p><Badge variant="destructive">{r.reason}</Badge></p>
              {r.details && <p className="text-gray-600">{r.details}</p>}
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => act(r.id, "RESOLVED")}>Resolve (checked OK)</Button>
                <Button size="sm" variant="destructive" onClick={() => act(r.id, "DISMISSED")}>Dismiss report</Button>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  )
}
