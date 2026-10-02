"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/toast"
import { formatCoins, formatINR, coinsToPaise } from "@/lib/employer-earnings"
import { Wallet, ArrowDownToLine, Landmark, Eye } from "lucide-react"

interface LedgerRow { id: string; kind: string; coins: number; rupees: string; status: string; note: string | null; createdAt: string }
interface Payout { id: string; amountCoins: number | null; amountPaise: number; upiMasked: string; status: string; adminNote: string | null; createdAt: string }

export default function EmployerEarnings() {
  const [coins, setCoins] = useState({ approved: 0, pending: 0, withdrawable: 0 })
  const [rupees, setRupees] = useState({ approved: "₹0", withdrawable: "₹0" })
  const [metrics, setMetrics] = useState({ views: 0, applyClicks: 0, emailClicks: 0, partialApps: 0 })
  const [rules, setRules] = useState({ live7d: 100, threeApps: 900, interview: 500, hire: 500, referral: 1000 })
  const [ledger, setLedger] = useState<LedgerRow[]>([])
  const [canWithdraw, setCanWithdraw] = useState(false)
  const [minWithdraw, setMinWithdraw] = useState(1000)
  const [account, setAccount] = useState<{ upiMasked: string } | null>(null)
  const [requests, setRequests] = useState<Payout[]>([])
  const [upi, setUpi] = useState("")
  const [amount, setAmount] = useState("")

  const load = async () => {
    const [e, p] = await Promise.all([
      fetch("/api/employer/earnings").then((r) => r.json()).catch(() => null),
      fetch("/api/employer/payouts").then((r) => r.json()).catch(() => null),
    ])
    if (e?.success) {
      setCoins(e.data.coins)
      setRupees(e.data.rupees)
      setMetrics(e.data.metrics)
      setRules(e.data.rules)
      setLedger(e.data.ledger)
      setCanWithdraw(e.data.canWithdraw)
      setMinWithdraw(e.data.minWithdrawCoins)
    }
    if (p?.success) {
      setAccount(p.data.account)
      setRequests(p.data.requests)
    }
  }
  useEffect(() => { load() }, [])

  const saveAccount = async () => {
    const res = await fetch("/api/employer/payouts", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ upiId: upi.trim() }) })
    const json = await res.json()
    if (json.success) { toast("Payout account saved", "success"); setUpi(""); load() }
    else toast(json.error || "Failed", "destructive")
  }

  const requestPayout = async () => {
    const c = Math.round(parseFloat(amount))
    if (!c || c <= 0) { toast("Enter coins to withdraw", "destructive"); return }
    const res = await fetch("/api/employer/payouts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amountCoins: c }) })
    const json = await res.json()
    if (json.success) { toast("Withdrawal requested - admin approval next", "success"); setAmount(""); load() }
    else toast(json.error || "Failed", "destructive")
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-extrabold">Coins & cash</h1>
        <p className="text-sm text-slate-500">1,000 coins = ₹20. Cash withdrawal unlocks at 1,000 coins. Milestone coins start as pending, become withdrawable after admin review.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-emerald-200 bg-emerald-50/60"><CardContent className="p-4 text-center">
          <Wallet className="mx-auto mb-1 h-5 w-5 text-emerald-600" />
          <p className="text-2xl font-extrabold text-emerald-700">{coins.withdrawable.toLocaleString("en-IN")} coins</p>
          <p className="text-xs text-slate-500">withdrawable ({rupees.withdrawable})</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-extrabold">{coins.pending.toLocaleString("en-IN")} coins</p>
          <p className="text-xs text-slate-500">pending review</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-extrabold">{formatCoins(coins.approved).split(" (")[0]}</p>
          <p className="text-xs text-slate-500">total approved ({rupees.approved})</p>
        </CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle className="text-base">How coins are earned (pilot)</CardTitle></CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          {[
            [`${rules.live7d} coins`, "real unique job live 7+ days"],
            [`${rules.threeApps} coins`, "3 unique completed applications"],
            [`${rules.interview} coins`, "employer-confirmed interview"],
            [`${rules.hire} coins`, "employer-confirmed hire"],
            [`${rules.referral} coins`, "each invited company hitting 3 applications"],
          ].map(([amt, what]) => (
            <div key={what} className="flex items-center justify-between rounded-lg border p-2.5">
              <span className="font-extrabold text-emerald-700">{amt}</span>
              <span className="text-xs text-slate-500">{what}</span>
            </div>
          ))}
        </CardContent></Card>

      <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Eye className="h-4 w-4" /> Shown, never paid</CardTitle></CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-3">
          {[
            [`${metrics.views}`, "job views"],
            [`${metrics.applyClicks + metrics.emailClicks}`, "apply clicks"],
            [`${metrics.partialApps}`, "partial (saved-only) applications"],
          ].map(([v, label]) => (
            <div key={label} className="flex items-center justify-between rounded-lg border border-dashed p-2.5">
              <span className="font-extrabold">{v}</span><span className="text-xs text-slate-500">{label} - display only</span>
            </div>
          ))}
        </CardContent></Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Landmark className="h-4 w-4" /> Cash withdrawal (UPI)</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {account ? <p className="text-sm">Saved: <strong>{account.upiMasked}</strong> <span className="text-slate-400">(masked for privacy)</span></p> : <p className="text-sm text-slate-500">No UPI saved yet.</p>}
            <div className="flex gap-2">
              <Input placeholder="name@okbank" value={upi} onChange={(e) => setUpi(e.target.value)} />
              <Button onClick={saveAccount}>Save</Button>
            </div>
            <div className="flex gap-2 border-t pt-3">
              <Input placeholder={`Coins (min ${minWithdraw})`} value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" />
              <Button onClick={requestPayout} disabled={!canWithdraw}><ArrowDownToLine className="mr-1 h-4 w-4" /> Withdraw</Button>
            </div>
            {!canWithdraw && <p className="text-xs text-amber-700">Withdrawals unlock at {minWithdraw.toLocaleString("en-IN")} withdrawable coins (≈{formatINR(coinsToPaise(minWithdraw))}).</p>}
          </CardContent></Card>

        <Card><CardHeader><CardTitle className="text-base">Withdrawal history</CardTitle></CardHeader>
          <CardContent>
            {requests.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">No withdrawals yet.</p> : (
              <div className="space-y-2">
                {requests.map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-lg border p-2.5 text-sm">
                    <div><p className="font-bold">{(r.amountCoins || 0).toLocaleString("en-IN")} coins <span className="font-normal text-slate-400">→ {r.upiMasked}</span></p>
                    <p className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString("en-IN")}{r.adminNote ? ` · ${r.adminNote}` : ""}</p></div>
                    <Badge variant={r.status === "PAID" ? "default" : "outline"}>{r.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle className="text-base">Coin ledger</CardTitle></CardHeader>
        <CardContent>
          {ledger.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">No coin entries yet - milestones appear here as pending first.</p> : (
            <div className="space-y-2">
              {ledger.map((l) => (
                <div key={l.id} className="flex items-center justify-between rounded-lg border p-2.5 text-sm">
                  <div><p className="font-semibold">{l.kind.replaceAll("_", " ")}</p><p className="text-xs text-slate-400">{l.note || ""} · {new Date(l.createdAt).toLocaleDateString("en-IN")}</p></div>
                  <div className="text-right"><p className="font-extrabold text-emerald-700">+{l.coins.toLocaleString("en-IN")}</p><Badge variant="outline" className="text-[10px]">{l.status}</Badge></div>
                </div>
              ))}
            </div>
          )}
        </CardContent></Card>
    </div>
  )
}
