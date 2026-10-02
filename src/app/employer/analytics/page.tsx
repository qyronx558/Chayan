"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

interface JobRow {
  id: string; title: string; slug: string; type: string; status: string; moderation: string
  trustScore: number; views: number; applies: number; bookmarks: number
  clicks: { APPLY: number; EMAIL: number; DETAIL: number }; earningsCoins: number
  company: { id: string; name: string }
}

export default function EmployerAnalytics() {
  const [jobs, setJobs] = useState<JobRow[]>([])
  const [series, setSeries] = useState<{ date: string; views: number }[]>([])
  const [company, setCompany] = useState("all")
  const [sort, setSort] = useState("views")
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    fetch("/api/employer/analytics").then((r) => r.json()).then((j) => {
      if (j.success && j.data) {
        setJobs(j.data.jobs || [])
        setSeries(j.data.viewsSeries || [])
        setCompanies(j.data.companies || [])
      }
    }).catch(() => {})
  }, [])

  const filtered = jobs.filter((j) => company === "all" || j.company.id === company)
  const sorted = [...filtered].sort((a, b) =>
    sort === "views" ? b.views - a.views :
    sort === "applies" ? b.applies - a.applies :
    sort === "earnings" ? b.earningsCoins - a.earningsCoins : b.trustScore - a.trustScore
  )

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Analytics</h1>
          <p className="text-sm text-slate-500">Views, genuine clicks and applies per job - display only, coins come from milestones.</p>
        </div>
        <div className="flex gap-2">
          <Select value={company} onValueChange={setCompany}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Company" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All companies</SelectItem>
              {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Sort" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="views">Most views</SelectItem>
              <SelectItem value="applies">Most applies</SelectItem>
              <SelectItem value="earnings">Top earning</SelectItem>
              <SelectItem value="trust">Highest trust</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card><CardHeader><CardTitle className="text-base">Views - last 30 days</CardTitle></CardHeader><CardContent className="h-60">
        {series.length === 0 ? <p className="py-16 text-center text-sm text-slate-500">No view data yet.</p> : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={Math.max(0, Math.floor(series.length / 6) - 1)} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="views" fill="#0d9488" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent></Card>

      {sorted.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-slate-500">No jobs for this filter. <Link href="/employer/jobs" className="font-semibold text-teal-700 underline">Post one</Link>.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {sorted.map((j) => (
            <Card key={j.id}><CardContent className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold">{j.title} <span className="font-normal text-slate-500">· {j.company.name}</span></p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="text-[10px]">{j.type}</Badge>
                    <Badge variant={j.moderation === "APPROVED" ? "default" : "outline"} className="text-[10px]">{j.moderation}</Badge>
                    <Badge variant="outline" className="text-[10px]">Trust {j.trustScore}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {j.views} views · {j.clicks.APPLY} apply clicks · {j.clicks.EMAIL} email clicks · {j.applies} tracked applies · {j.bookmarks} saves
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-extrabold text-emerald-700">{j.earningsCoins.toLocaleString("en-IN")} coins</p>
                  <p className="text-[11px] text-slate-500">milestone coins</p>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" asChild><Link href={`/employer/monitor/${j.id}`}>Monitor</Link></Button>
                    <Button size="sm" variant="outline" asChild><Link href={`/private-jobs/${j.slug}`} target="_blank" rel="noopener noreferrer">Public</Link></Button>
                  </div>
                </div>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}
      <p className="text-xs text-slate-500">Clicks are deduped per visitor per day with salted session hashes - refreshing your own listing does not inflate earnings. Full inbox addresses and raw IPs are never stored.</p>
    </div>
  )
}
