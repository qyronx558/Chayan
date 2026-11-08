"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/toast"
import { Copy, Check, Share2, Gift, Users } from "lucide-react"

interface Data {
  code: string; link: string; invites: number; confirmed: number; earnedCoins: number
  recent: { id: string; status: string; createdAt: string; confirmedAt: string | null }[]
}

export default function EmployerReferrals() {
  const [d, setD] = useState<Data | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch("/api/employer/referral").then((r) => r.json()).then((j) => { if (j.success) setD(j.data) }).catch(() => {})
  }, [])

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast("Referral link copied", "success")
      setTimeout(() => setCopied(false), 2000)
    } catch { toast("Copy failed", "destructive") }
  }

  const share = async () => {
    if (!d) return
    const text = `Hiring? Post free jobs on ChayanJobsJobs Employer Studio - earn 1,000 coins (₹20 per 1,000) when companies you invite reach 3 applications: ${d.link}`
    if (navigator.share) {
      try { await navigator.share({ title: "ChayanJobsJobs Employer Referral", text, url: d.link }) } catch { /* dismissed */ }
    } else copy(d.link)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-extrabold">Referrals - earn 1,000 coins each</h1>
        <p className="text-sm text-muted-foreground">Invite HR friends and companies. When a company you invited gets <strong>3 unique, completed applications</strong> on its rewarded job, you earn <strong>1,000 coins (≈₹20)</strong>. Pilot: first 100 new companies, one rewarded job each.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { icon: Users, label: "Invites started", value: d?.invites ?? "-" },
          { icon: Check, label: "Rewarded (3-app milestone)", value: d?.confirmed ?? "-" },
          { icon: Gift, label: "Referral coins earned", value: d ? `${d.earnedCoins.toLocaleString("en-IN")} coins` : "-" },
        ].map((s) => (
          <Card key={s.label}><CardContent className="flex items-center gap-3 p-4">
            <s.icon className="h-6 w-6 text-brick" />
            <div><p className="text-xl font-extrabold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
          </CardContent></Card>
        ))}
      </div>

      <Card className="border-rule"><CardHeader><CardTitle className="text-base">Your referral link</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {d ? (
            <>
              <div className="flex gap-2">
                <Input readOnly value={d.link} className="font-mono text-sm" />
                <Button onClick={() => copy(d.link)}>{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</Button>
                <Button variant="outline" onClick={share}><Share2 className="mr-1 h-4 w-4" /> Share</Button>
              </div>
              <p className="text-xs text-muted-foreground">Code <strong>{d.code}</strong> · First-touch attribution (60 days) - self-invites blocked, one reward per company, paid only at the 3-application milestone (not on signup). Coins start pending, withdrawable after admin review.</p>
            </>
          ) : <p className="text-sm text-muted-foreground">Loading your link…</p>}
        </CardContent></Card>

      <Card><CardHeader><CardTitle className="text-base">Simple reward rules</CardTitle></CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          {[
            ["100 coins", "real unique job live 7+ days"],
            ["900 coins", "3 unique completed applications"],
            ["500 coins", "employer-confirmed interview"],
            ["500 coins", "employer-confirmed hire"],
            ["1,000 coins", "per invited company at 3 applications"],
            ["1,000 coins = ₹20", "cash withdrawal from 1,000 coins"],
          ].map(([amt, what]) => (
            <div key={what} className="flex items-center justify-between rounded-lg border p-2.5">
              <span className="font-extrabold text-foreground">{amt}</span>
              <span className="text-xs text-muted-foreground">{what}</span>
            </div>
          ))}
        </CardContent></Card>

      <Card><CardHeader><CardTitle className="text-base">Recent invites</CardTitle></CardHeader>
        <CardContent>
          {!d || d.recent.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">No invites yet - share your link to start earning.</p> : (
            <div className="space-y-2">
              {d.recent.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border p-2.5 text-sm">
                  <span className="text-muted-foreground">Invite · {new Date(r.createdAt).toLocaleDateString("en-IN")}</span>
                  <Badge variant={r.status === "REWARDED" || r.status === "CONFIRMED" ? "default" : "outline"}>{r.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent></Card>
    </div>
  )
}
