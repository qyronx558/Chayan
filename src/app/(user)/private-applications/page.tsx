"use client"
import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, MapPin, CalendarClock, CheckCircle2 } from "lucide-react"
import { appliedOn } from "@/components/private/AppliedBadge"
import { useAppliedJobs } from "@/lib/private-jobs/applied-store"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PRIVATE_STATUSES, type PrivateStatus } from "@/components/private/PrivateTracker"
import { formatDate } from "@/lib/utils"

interface Item {
  id: string
  status: PrivateStatus
  interviewAt: string | null
  appliedAt?: string | null
  notes: string | null
  updatedAt: string
  job: { id: string; title: string; slug: string; company: string; location: string | null; salary: string | null; lastDate: string | null; type: string }
  href: string
}

export default function PrivateApplicationsPage() {
  const { status } = useSession()
  const router = useRouter()
  const [items, setItems] = useState<Item[]>([])
  const [filter, setFilter] = useState("all")
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/private-applications${filter !== "all" ? `?status=${filter}` : ""}`)
      const json = await res.json()
      if (json.success) setItems(json.data)
    } finally { setLoading(false) }
  }, [filter])

  useEffect(() => {
    if (status === "authenticated") load()
  }, [status, load])

  const move = async (privateJobId: string, next: PrivateStatus) => {
    await fetch("/api/private-applications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ privateJobId, status: next }) })
    load()
  }

  if (status === "unauthenticated") return <DeviceApplications onSignIn={() => router.push("/login?callbackUrl=/private-applications")} />
  if (status !== "authenticated" || loading) return <div className="container mx-auto flex max-w-4xl justify-center px-4 py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>

  const grouped = PRIVATE_STATUSES.map((s) => ({ ...s, items: items.filter((i) => i.status === s.value) })).filter((g) => filter === "all" ? g.items.length > 0 : true)

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">My private applications</h1>
          <p className="text-muted-foreground">Pipeline for external applies - Saved → Applied → Interview → Offer.</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All stages" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages ({items.length})</SelectItem>
            {PRIVATE_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {items.length === 0 ? (
        <Card><CardContent className="py-14 text-center">
          <p className="font-semibold">No tracked applications yet</p>
          <p className="mb-4 text-sm text-muted-foreground">Jobs you apply to from ChayanJobs show up here automatically. You can also track any job from its page.</p>
          <Button asChild><Link href="/private-jobs">Browse private jobs</Link></Button>
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {grouped.map((g) => (
            <div key={g.value}>
              <p className="mb-2 flex items-center gap-2 text-sm font-bold"><g.icon className="h-4 w-4" />{g.label} ({g.items.length})</p>
              <div className="space-y-3">
                {g.items.map((it) => (
                  <Card key={it.id}><CardContent className="p-4">
                    <Link href={it.href} className="font-bold hover:underline">{it.job.title}</Link>
                    <p className="text-xs text-muted-foreground">{it.job.company}{it.job.location ? ` · ${it.job.location}` : ""}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                      {it.job.lastDate && <span className="inline-flex items-center gap-1"><CalendarClock className="h-3 w-3" />Last: {formatDate(it.job.lastDate)}</span>}
                      {it.appliedAt && <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400"><CheckCircle2 className="h-3 w-3" />Applied {appliedOn(it.appliedAt)}</span>}
                      {it.interviewAt && <Badge variant="outline">Interview: {formatDate(it.interviewAt)}</Badge>}
                    </div>
                    {it.notes && <p className="mt-2 text-xs text-muted-foreground">“{it.notes}”</p>}
                    <div className="mt-3 flex gap-2">
                      <Select value={it.status} onValueChange={(v) => move(it.job.id, v as PrivateStatus)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{PRIVATE_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                      </Select>
                      <Button variant="ghost" size="sm" asChild><Link href={it.href}>Open</Link></Button>
                    </div>
                  </CardContent></Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="mt-6 text-xs text-muted-foreground"><MapPin className="mr-1 inline h-3 w-3" />Tip: set interview dates via tracker notes and enable private-job alerts in <Link href="/profile" className="underline">profile notifications</Link>.</p>
    </div>
  )
}

/** Signed out: the jobs applied to from this device, with a nudge to sign in and keep them. */
function DeviceApplications({ onSignIn }: { onSignIn: () => void }) {
  const applied = useAppliedJobs()
  const list = [...applied.entries()].filter(([, e]) => e.slug).sort((a, b) => b[1].at.localeCompare(a[1].at))
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold">My applications</h1>
      <p className="text-muted-foreground">Private jobs you applied to from this device.</p>
      <Card className="mt-5"><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="text-sm">Sign in to keep this list on every device and track interviews and offers.</p>
        <Button size="sm" onClick={onSignIn}>Sign in</Button>
      </CardContent></Card>
      {list.length === 0 ? (
        <Card className="mt-5"><CardContent className="py-14 text-center">
          <p className="font-semibold">No applications yet</p>
          <p className="mb-4 text-sm text-muted-foreground">Jobs you apply to from ChayanJobs show up here automatically.</p>
          <Button asChild><Link href="/private-jobs">Browse private jobs</Link></Button>
        </CardContent></Card>
      ) : (
        <ul className="mt-5 space-y-3">
          {list.map(([id, e]) => (
            <li key={id}><Card><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <Link href={`/private-jobs/${e.slug}`} className="font-bold hover:underline">{e.title || "Private job"}</Link>
                <p className="text-xs text-muted-foreground">{e.company}</p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" />Applied {appliedOn(e.at)}</span>
            </CardContent></Card></li>
          ))}
        </ul>
      )}
    </div>
  )
}
