"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Users, Wallet, ArrowRight, ShieldCheck, Lock, CheckCircle2, Circle } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { EmployerLoginCTA } from "@/components/employer/EmployerLoginCTA"

interface Analytics {
  jobs: { id: string; title: string; slug: string; views: number; applies: number }[]
  viewsSeries: { date: string; views: number }[]
  totals: { views: number; applies: number; bookmarks: number; earningsCoins: number }
  companies: { id: string; name: string; verifiedStatus: string }[]
}

export default function EmployerOverview() {
  const { data: session, status } = useSession()
  const [a, setA] = useState<Analytics | null>(null)
  const [coins, setCoins] = useState({ withdrawable: 0, pending: 0 })

  useEffect(() => {
    if (status !== "authenticated") return
    fetch("/api/employer/analytics").then((r) => r.json()).then((j) => { if (j.success) setA(j.data) }).catch(() => {})
    fetch("/api/employer/earnings").then((r) => r.json()).then((j) => { if (j.success) setCoins(j.data.coins) }).catch(() => {})
  }, [status])

  if (status === "unauthenticated") {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <Lock className="mx-auto mb-3 h-8 w-8 text-teal-600" />
        <h1 className="mb-2 text-3xl font-bold text-slate-900">Employer Studio</h1>
        <p className="mb-6 text-slate-600">Sign in, verify your work inbox with OTP, then post free jobs and earn coins for real hiring milestones.</p>
        <EmployerLoginCTA backTo="/employer" />
      </div>
    )
  }

  const verified = (a?.companies || []).some((c) => c.verifiedStatus === "VERIFIED")

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Good day{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}</h1>
          <p className="text-sm text-slate-500">Post free jobs, hit hiring milestones, earn coins - 1,000 coins = ₹20.</p>
        </div>
        {!verified ? (
          <Button asChild><Link href="/employer/jobs">Verify company to unlock →</Link></Button>
        ) : (
          <Button asChild><Link href="/employer/jobs">+ Post a job</Link></Button>
        )}
      </div>

      {!verified && (
        <p className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"><ShieldCheck className="h-4 w-4" /> No verified company yet - complete inbox OTP in Jobs to unlock posting, milestones and earnings.</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: Eye, label: "Job views (display only)", value: a?.totals?.views ?? "-" },
          { icon: Users, label: "Tracked applies", value: a?.totals?.applies ?? "-" },
          { icon: Wallet, label: "Withdrawable coins", value: `${coins.withdrawable.toLocaleString("en-IN")}` },
          { icon: Wallet, label: "Pending coins", value: `${coins.pending.toLocaleString("en-IN")}` },
        ].map((s) => (
          <Card key={s.label}><CardContent className="flex items-center gap-3 p-4">
            <s.icon className="h-6 w-6 text-teal-600" />
            <div><p className="text-xl font-extrabold">{s.value}</p><p className="text-xs text-slate-500">{s.label}</p></div>
          </CardContent></Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle className="text-base">Views - last 30 days (not paid)</CardTitle></CardHeader><CardContent className="h-60">
          {!a || !a.viewsSeries || a.viewsSeries.length === 0 ? <p className="py-16 text-center text-sm text-slate-500">Publish a verified job to start collecting views.</p> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={a.viewsSeries}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={Math.max(0, Math.floor(a.viewsSeries.length / 6) - 1)} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="views" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent></Card>

        <Card><CardHeader><CardTitle className="text-base">Milestone path - one rewarded job per company</CardTitle></CardHeader>
          <CardContent className="space-y-2.5 text-sm">
            {[
              ["100 coins", "Real unique job stays live 7 days"],
              ["900 coins", "3 unique completed applications"],
              ["500 coins", "Confirmed interview (you confirm)"],
              ["500 coins", "Confirmed hire (you confirm)"],
            ].map(([amt, what], i) => (
              <div key={what} className="flex items-center gap-2.5 rounded-lg border p-2.5">
                {i === 0 ? <CheckCircle2 className="h-4 w-4 text-slate-300" /> : <Circle className="h-4 w-4 text-slate-300" />}
                <span className="flex-1">{what}</span>
                <Badge variant="secondary">{amt}</Badge>
              </div>
            ))}
            <p className="text-xs text-slate-500">Progress per job is tracked in <Link href="/employer/analytics" className="font-semibold text-teal-700 hover:underline">Analytics</Link> and confirmed in <span className="font-semibold">Monitor</span>. Views, clicks and saved-only applications are shown but never paid.</p>
          </CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle className="flex items-center justify-between text-base">Top jobs <Link href="/employer/analytics" className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:underline">All analytics <ArrowRight className="h-3 w-3" /></Link></CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {!a || !a.jobs || a.jobs.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">No jobs yet.</p> : a.jobs.slice(0, 5).map((j) => (
            <div key={j.id} className="flex items-center justify-between gap-2 rounded-lg border p-2.5 text-sm">
              <div className="min-w-0"><p className="truncate font-semibold">{j.title}</p><p className="text-xs text-slate-500">{j.views} views · {j.applies} applies</p></div>
              <Button size="sm" variant="outline" asChild><Link href={`/employer/monitor/${j.id}`}>Monitor</Link></Button>
            </div>
          ))}
        </CardContent></Card>

      <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="font-extrabold text-emerald-900">Refer & earn 1,000 coins</p>
            <p className="text-sm text-emerald-700">For every invited company that reaches 3 applications. Pilot: 100 companies, one rewarded job each.</p>
          </div>
          <div className="flex gap-2">
            <Button asChild><Link href="/employer/referrals">Get my referral link</Link></Button>
            <Button variant="outline" asChild><Link href="/employer/earnings">Open wallet</Link></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
