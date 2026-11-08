"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/toast"
import { formatINR } from "@/lib/employer-earnings"

interface Payout { id: string; amountCoins: number | null; amountPaise: number; upiMasked: string; status: string; createdAt: string; decidedAt: string | null; adminNote: string | null; user: { name: string | null; email: string } | null }
interface Referral { id: string; status: string; createdAt: string; confirmedAt: string | null; referrer: string | null; referred: string | null }
interface CoinRow { id: string; kind: string; coins: number; status: string; note: string | null; createdAt: string; user: { name: string | null; email: string } | null; company: { id: string; name: string; verifiedStatus: string } | null; job: { id: string; title: string; slug: string; status: string; moderation: string; createdAt: string } | null }

export default function AdminReferralPayouts() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [coinQueue, setCoinQueue] = useState<CoinRow[]>([])
  const [pilot, setPilot] = useState({ enrolled: 0, cap: 100, paidCoins: 0 })
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [coinNotes, setCoinNotes] = useState<Record<string, string>>({})

  const load = async () => {
    const [a, b] = await Promise.all([
      fetch("/api/admin/referral-payouts").then((r) => r.json()).catch(() => null),
      fetch("/api/admin/coin-ledger").then((r) => r.json()).catch(() => null),
    ])
    if (a?.success) { setPayouts(a.data.payouts); setReferrals(a.data.referrals) }
    if (b?.success) { setCoinQueue(b.data.pending); setPilot(b.data.pilot) }
  }
  useEffect(() => { load() }, [])

  const decideCoin = async (id: string, action: "APPROVED" | "REJECTED") => {
    const res = await fetch(`/api/admin/coin-ledger/${id}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, adminNote: coinNotes[id] || null }),
    }).then((r) => r.json()).catch(() => null)
    if (res?.success) { toast(`Coins ${action}`, "success"); load() }
    else toast(res?.error || "Failed", "destructive")
  }

  const act = async (id: string, action: "APPROVED" | "PAID" | "REJECTED") => {
    const res = await fetch(`/api/admin/referral-payouts/${id}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, adminNote: notes[id] || null }),
    }).then((r) => r.json()).catch(() => null)
    if (res?.success) { toast(`Payout ${action}`, "success"); load() }
    else toast(res?.error || "Failed", "destructive")
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-extrabold">Coin rewards & payouts (pilot)</h1>
        <p className="text-sm text-muted-foreground">1,000 coins = ₹20 · Pilot {pilot.enrolled}/{pilot.cap} companies · {pilot.paidCoins.toLocaleString("en-IN")} coins paid out. Check uniqueness, verified applicants and velocity notes before approving.</p>
      </div>

      <Card><CardHeader><CardTitle className="text-base">Coin approval queue ({coinQueue.length})</CardTitle></CardHeader>
        <CardContent>
          {coinQueue.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">Nothing pending.</p> : (
            <div className="space-y-2">
              {coinQueue.map((c) => (
                <div key={c.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-bold">+{c.coins.toLocaleString("en-IN")} coins · {c.kind.replaceAll("_", " ")} <span className="font-normal text-muted-foreground">· {c.user?.name || "?"} ({c.user?.email || "?"})</span></p>
                      <p className="text-xs text-muted-foreground">{c.company?.name || "-"} {c.company ? `(${c.company.verifiedStatus})` : ""} · {c.job ? `${c.job.title} [${c.job.moderation}/${c.job.status}]` : "no job"} · {c.note || ""}</p>
                    </div>
                    <Badge variant="outline">PENDING</Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Input placeholder="Review note (optional)" value={coinNotes[c.id] || ""} onChange={(e) => setCoinNotes({ ...coinNotes, [c.id]: e.target.value })} className="max-w-xs" />
                    <Button size="sm" onClick={() => decideCoin(c.id, "APPROVED")}>Approve</Button>
                    <Button size="sm" variant="destructive" onClick={() => decideCoin(c.id, "REJECTED")}>Reject (fraud)</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent></Card>

      <Card><CardHeader><CardTitle className="text-base">Payout queue ({payouts.length})</CardTitle></CardHeader>
        <CardContent>
          {payouts.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Queue empty.</p> : (
            <div className="space-y-2">
              {payouts.map((p) => (
                <div key={p.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-bold">{(p.amountCoins || 0).toLocaleString("en-IN")} coins ({formatINR(p.amountPaise)}) <span className="font-normal text-muted-foreground">→ {p.upiMasked}</span></p>
                      <p className="text-xs text-muted-foreground">{p.user?.name || "-"} · {p.user?.email || ""} · {new Date(p.createdAt).toLocaleDateString("en-IN")}</p>
                      {p.adminNote && <p className="text-xs text-muted-foreground">Note: {p.adminNote}</p>}
                    </div>
                    <Badge variant={p.status === "PAID" ? "default" : "outline"}>{p.status}</Badge>
                  </div>
                  {p.status === "PENDING" && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Input placeholder="Admin note (optional)" value={notes[p.id] || ""} onChange={(e) => setNotes({ ...notes, [p.id]: e.target.value })} className="max-w-xs" />
                      <Button size="sm" onClick={() => act(p.id, "APPROVED")}>Approve</Button>
                      <Button size="sm" variant="destructive" onClick={() => act(p.id, "REJECTED")}>Reject</Button>
                    </div>
                  )}
                  {p.status === "APPROVED" && (
                    <div className="mt-2"><Button size="sm" onClick={() => act(p.id, "PAID")}>Mark PAID (after UPI transfer)</Button></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent></Card>

      <Card><CardHeader><CardTitle className="text-base">Recent employer referrals ({referrals.length})</CardTitle></CardHeader>
        <CardContent>
          {referrals.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">No referrals yet.</p> : (
            <div className="space-y-2">
              {referrals.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border p-2.5 text-sm">
                  <span>{r.referrer || "?"} → {r.referred || "?"} <span className="text-muted-foreground">· {new Date(r.createdAt).toLocaleDateString("en-IN")}</span></span>
                  <Badge variant="outline">{r.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent></Card>
    </div>
  )
}
