"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { ArrowLeft, Eye, Bookmark, Flag, Users, CheckCircle2, Circle } from "lucide-react"
import { toast } from "@/components/ui/toast"

interface Data {
  job: { id: string; title: string; slug: string; type: string; status: string; moderation: string; trustScore: number; views: number; location: string | null; remotePolicy: string | null; lastDate: string | null; createdAt: string; company: { id: string; name: string; slug: string; verifiedStatus: string } }
  viewsSeries: { date: string; views: number }[]
  funnel: { status: string; count: number }[]
  reports: { id: string; reason: string; status: string; createdAt: string }[]
  bookmarks: number
  totals: { views: number; applies: number; bookmarks: number; reports: number }
}

export default function MonitorJobPage() {
  const params = useParams<{ id: string }>()
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState("")

  const refresh = () => {
    fetch(`/api/employer/monitor/${params.id}`)
      .then((r) => r.json())
      .then((j) => { if (j.success) setData(j.data); else setError(j.error || "Failed") })
      .catch(() => setError("Failed to load"))
  }
  useEffect(refresh, [params.id])

  const checkMilestones = async () => {
    const res = await fetch("/api/employer/rewards/evaluate", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}),
    }).then((r) => r.json()).catch(() => null)
    if (res?.success) { toast(res.message, "success"); refresh() }
    else toast(res?.error || "Failed", "destructive")
  }

  const confirm = async (kind: "interview" | "hire") => {
    const res = await fetch(`/api/employer/jobs/${params.id}/confirm`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind }),
    }).then((r) => r.json()).catch(() => null)
    if (res?.success) { toast(res.message, "success"); refresh() }
    else toast(res?.error || "Failed", "destructive")
  }

  if (error) return <div className="container mx-auto max-w-4xl px-4 py-16 text-center"><p className="mb-4 text-brick">{error}</p><Button variant="outline" asChild><Link href="/employer/jobs">Back to studio</Link></Button></div>
  if (!data) return <div className="container mx-auto max-w-4xl px-4 py-16 text-sm text-muted-foreground">Loading monitoring…</div>

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <Link href="/employer/jobs" className="mb-4 inline-flex items-center gap-1 text-sm text-brick hover:underline"><ArrowLeft className="h-4 w-4" /> Back to studio</Link>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold">{data.job.title}</h1>
        <Badge variant="secondary">{data.job.type}</Badge>
        <Badge variant={data.job.moderation === "APPROVED" ? "default" : "outline"}>{data.job.moderation}</Badge>
        <Badge variant="outline">Trust {data.job.trustScore}</Badge>
        <Button size="sm" variant="outline" asChild><Link href={`/private-jobs/${data.job.slug}`}>Public view</Link></Button>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        {[
          { icon: Eye, label: "Views", value: data.totals.views },
          { icon: Users, label: "Tracked applies", value: data.totals.applies },
          { icon: Bookmark, label: "Bookmarks", value: data.totals.bookmarks },
          { icon: Flag, label: "Reports", value: data.totals.reports },
        ].map((s) => (
          <Card key={s.label}><CardContent className="flex items-center gap-3 p-4"><s.icon className="h-5 w-5 text-brick" /><div><p className="text-xl font-extrabold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div></CardContent></Card>
        ))}
      </div>

      <Card className="mb-4 border-rule"><CardHeader><CardTitle className="text-base">Coin milestones - 1,000 coins = ₹20</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {[
            ["100 coins", "Live 7+ days as a real unique job", "auto"],
            ["900 coins", "3 unique completed applications", "auto"],
            ["500 coins", "Interview confirmed by you", "interview"],
            ["500 coins", "Hire confirmed by you", "hire"],
          ].map(([amt, what, kind]) => (
            <div key={what} className="flex items-center gap-2 rounded-lg border p-2.5">
              <Circle className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1">{what}</span>
              <Badge variant="secondary">{amt}</Badge>
              {(kind === "interview" || kind === "hire") && (
                <Button size="sm" variant="outline" onClick={() => confirm(kind as "interview" | "hire")}>Confirm {kind}</Button>
              )}
            </div>
          ))}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button size="sm" onClick={checkMilestones}><CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Check milestones now</Button>
            <span className="text-xs text-muted-foreground">Auto-milestones (7-day, 3-app) submit as pending for admin review. Interview/hire need your confirmation, once per job.</span>
          </div>
        </CardContent></Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle className="text-base">Views - last 30 days</CardTitle></CardHeader><CardContent className="h-64">
          {data.viewsSeries.length === 0 ? <p className="py-16 text-center text-sm text-muted-foreground">No view data yet.</p> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.viewsSeries}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={Math.max(0, Math.floor(data.viewsSeries.length / 6) - 1)} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="views" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Application funnel</CardTitle></CardHeader><CardContent>
          {data.funnel.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">No tracked applications yet. Share the listing to get applies.</p> : (
            <div className="space-y-2">
              {data.funnel.map((f) => (
                <div key={f.status} className="flex items-center justify-between rounded-lg border p-2.5 text-sm">
                  <span className="font-semibold capitalize">{f.status}</span>
                  <Badge>{f.count}</Badge>
                </div>
              ))}
            </div>
          )}
          {data.reports.length > 0 && (
            <div className="mt-4 border-t pt-3">
              <p className="mb-2 text-sm font-bold">Scam/quality reports ({data.reports.length})</p>
              {data.reports.map((r) => (
                <p key={r.id} className="text-xs text-muted-foreground">• {r.reason} - <span className="text-muted-foreground">{r.status}</span></p>
              ))}
            </div>
          )}
        </CardContent></Card>
      </div>
    </div>
  )
}
