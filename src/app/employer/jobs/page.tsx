"use client"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { privateJobSchema, type PrivateJobInput } from "@/lib/validations"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "@/components/ui/toast"
import { slugify } from "@/lib/utils"
import { ShieldCheck, Building2, BarChart3, PlusCircle, Lock } from "lucide-react"
import { EmployerVerifyPanel } from "@/components/employer/EmployerVerifyPanel"
import { EmployerLoginCTA } from "@/components/employer/EmployerLoginCTA"

interface Membership {
  companyId: string; role: string; verified: boolean
  company: { id: string; name: string; slug: string; website: string | null; verifiedStatus: string }
}
interface Row {
  id: string; title: string; slug: string; type: string; status: string; moderation: string
  location: string | null; views: number; trustScore: number
  company: { id: string; name: string }
  _count: { applications: number }
}

export default function EmployerJobsPage() {
  const { data: session, status } = useSession()
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [activeCompanyId, setActiveCompanyId] = useState("")
  const [jobs, setJobs] = useState<Row[]>([])
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)

  const form = useForm<PrivateJobInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(privateJobSchema) as any,
    defaultValues: { title: "", slug: "", companyId: "", companyName: "", type: "FULL_TIME", location: "", salary: "", description: "", applicationUrl: "", status: "ACTIVE" as never },
  })

  const load = async () => {
    setLoading(true)
    try {
      const [m, j, c] = await Promise.all([
        fetch("/api/employer/memberships").then((r) => r.json()).catch(() => null),
        fetch("/api/employer/jobs").then((r) => r.json()).catch(() => null),
        fetch("/api/companies").then((r) => r.json()).catch(() => null),
      ])
      if (m?.success) {
        setMemberships(m.data)
        setActiveCompanyId((prev) => {
          if (prev && m.data.some((x: Membership) => x.companyId === prev)) return prev
          const verifiedFirst = (m.data as Membership[]).find((x) => x.verified && x.company.verifiedStatus === "VERIFIED")
          return verifiedFirst?.companyId || m.data[0]?.companyId || ""
        })
      }
      if (j?.success) setJobs(j.data)
      if (c?.success) setCompanies(c.data)
    } finally { setLoading(false) }
  }
  useEffect(() => { if (status === "authenticated") load() }, [status])

  const activeMembership = useMemo(() => memberships.find((m) => m.companyId === activeCompanyId), [memberships, activeCompanyId])
  // Hard gate: only OTP-verified membership + VERIFIED company unlocks Studio.
  const verifiedMemberships = useMemo(
    () => memberships.filter((m) => m.verified && m.company.verifiedStatus === "VERIFIED"),
    [memberships]
  )
  const hasAccess = verifiedMemberships.length > 0
  const isVerified = !!activeMembership?.verified && activeMembership?.company.verifiedStatus === "VERIFIED"

  useEffect(() => {
    if (activeCompanyId) form.setValue("companyId", activeCompanyId)
  }, [activeCompanyId, form])

  const onVerified = async (companyId: string) => {
    await load()
    setActiveCompanyId(companyId)
  }

  const onSubmit = async (data: PrivateJobInput) => {
    if (!isVerified) { toast("Complete inbox OTP verification first", "destructive"); return }
    try {
      const payload = { ...data, companyId: activeCompanyId, companyName: undefined, slug: data.slug || slugify(data.title) || `job-${Date.now().toString(36)}` }
      const res = await fetch("/api/employer/jobs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      const json = await res.json()
      if (json.success) { toast("Job published", "success"); form.reset({ ...form.getValues(), title: "", slug: "", description: "", applicationUrl: "", location: "" }); load() }
      else toast(json.error || "Failed", "destructive")
    } catch { toast("Failed", "destructive") }
  }

  if (status === "loading" || (status === "authenticated" && loading)) {
    return <div className="container mx-auto max-w-6xl px-4 py-16 text-sm text-gray-500">Loading employer studio…</div>
  }

  if (status === "unauthenticated") {
    return (
      <div className="container mx-auto max-w-xl px-4 py-16 text-center">
        <Lock className="mx-auto mb-3 h-8 w-8 text-teal-600" />
        <h1 className="mb-2 text-3xl font-bold">Employer Studio is gated</h1>
        <p className="mb-6 text-gray-600">First sign in with your normal account, then prove your work inbox with OTP to unlock posting + monitoring.</p>
        <div className="flex justify-center gap-2">
          <EmployerLoginCTA backTo="/employer/jobs" />
          <Button variant="outline" asChild><Link href="/login">Jobseeker login</Link></Button>
        </div>
      </div>
    )
  }

  const myJobs = activeCompanyId ? jobs.filter((j) => j.company.id === activeCompanyId) : jobs
  const totalViews = myJobs.reduce((s, j) => s + (j.views || 0), 0)
  const totalApplies = myJobs.reduce((s, j) => s + (j._count?.applications || 0), 0)

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold"><Building2 className="h-7 w-7 text-teal-600" /> Employer Studio</h1>
          <p className="text-gray-600">Step 1 - inbox OTP verification → Step 2 - post + monitor everything.</p>
        </div>
        {hasAccess && (
          <Select value={activeCompanyId} onValueChange={setActiveCompanyId}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Active company" /></SelectTrigger>
            <SelectContent>
              {verifiedMemberships.map((m) => (
                <SelectItem key={m.companyId} value={m.companyId}>{m.company.name} ✓ verified</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* STEP 1 - inbox-proof gate. Typing a domain never verifies; only the inbox code does. */}
      <Card className="mb-6 border-teal-200">
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-4 w-4 text-teal-600" /> Step 1 - Verify your work inbox {hasAccess && <Badge className="bg-emerald-600">Access unlocked</Badge>}</CardTitle></CardHeader>
        <CardContent>
          {!hasAccess && <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Studio posting is locked until inbox OTP proves you own a company-domain email. No code, no posting - copy-pasting a domain is not enough.</p>}
          <EmployerVerifyPanel companies={companies} onVerified={onVerified} />
          {memberships.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {memberships.map((m) => (
                <Badge key={m.companyId} variant={m.verified && m.company.verifiedStatus === "VERIFIED" ? "default" : "outline"} className="text-xs">
                  {m.company.name} · {m.verified && m.company.verifiedStatus === "VERIFIED" ? "verified ✓" : "unverified - OTP pending"}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {!hasAccess ? (
        <Card><CardContent className="py-10 text-center text-sm text-gray-500">
          <Lock className="mx-auto mb-2 h-6 w-6 text-gray-300" />
          Complete Step 1 inbox verification above to unlock posting + monitoring dashboard.
        </CardContent></Card>
      ) : (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-4">
            {[
              { label: "Active jobs", value: myJobs.length },
              { label: "Total views", value: totalViews },
              { label: "Tracked applies", value: totalApplies },
              { label: "Avg trust", value: myJobs.length ? Math.round(myJobs.reduce((s, j) => s + (j.trustScore || 0), 0) / myJobs.length) : 0 },
            ].map((s) => (
              <Card key={s.label}><CardContent className="p-4 text-center"><p className="text-2xl font-extrabold">{s.value}</p><p className="text-xs text-gray-500">{s.label}</p></CardContent></Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><PlusCircle className="h-4 w-4" /> Post a job - {activeMembership?.company.name}</CardTitle></CardHeader><CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                  <FormField control={form.control} name="title" render={({ field }) => <FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="Senior React Developer" {...field} /></FormControl><FormMessage /></FormItem>} />
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="type" render={({ field }) => <FormItem><FormLabel>Type</FormLabel><FormControl><select className="w-full rounded-md border p-2 text-sm" {...field}><option value="FULL_TIME">Full-time</option><option value="PART_TIME">Part-time</option><option value="INTERNSHIP">Internship</option><option value="CONTRACT">Contract</option></select></FormControl><FormMessage /></FormItem>} />
                    <FormField control={form.control} name="remotePolicy" render={({ field }) => <FormItem><FormLabel>Work mode</FormLabel><FormControl><select className="w-full rounded-md border p-2 text-sm" {...field} value={field.value || ""}><option value="">-</option><option value="ONSITE">On-site</option><option value="HYBRID">Hybrid</option><option value="REMOTE">Remote</option></select></FormControl></FormItem>} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="location" render={({ field }) => <FormItem><FormLabel>Location</FormLabel><FormControl><Input placeholder="Bangalore / Remote" {...field} value={field.value || ""} /></FormControl></FormItem>} />
                    <FormField control={form.control} name="applicationUrl" render={({ field }) => <FormItem><FormLabel>Apply URL</FormLabel><FormControl><Input placeholder="https://company.com/careers/..." {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="salaryMin" render={({ field }) => <FormItem><FormLabel>Min salary</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)} /></FormControl></FormItem>} />
                    <FormField control={form.control} name="salaryMax" render={({ field }) => <FormItem><FormLabel>Max salary</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)} /></FormControl></FormItem>} />
                  </div>
                  <FormField control={form.control} name="description" render={({ field }) => <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea rows={6} {...field} value={field.value || ""} /></FormControl></FormItem>} />
                  <Button type="submit" disabled={form.formState.isSubmitting || !isVerified}>{form.formState.isSubmitting ? "Posting..." : "Publish (verified)"}</Button>
                  {!isVerified && <p className="text-xs text-amber-700">Selected company is not OTP-verified - switch to a verified company above.</p>}
                </form>
              </Form>
            </CardContent></Card>

            <div>
              <h2 className="mb-3 flex items-center gap-2 font-bold"><BarChart3 className="h-4 w-4" /> Monitoring - {activeMembership?.company.name} ({myJobs.length})</h2>
              {myJobs.length === 0 ? <Card><CardContent className="py-10 text-center text-sm text-gray-500">No jobs yet for this company.</CardContent></Card> : (
                <div className="space-y-3">
                  {myJobs.map((j) => (
                    <Card key={j.id}><CardContent className="flex items-center justify-between gap-3 p-4">
                      <div>
                        <Link href={`/private-jobs/${j.slug}`} className="font-bold hover:underline">{j.title}</Link>
                        <p className="text-xs text-gray-500">{j.views} views · {j._count.applications} tracked applies · trust {j.trustScore}</p>
                        <div className="mt-1 flex gap-1.5"><Badge variant="secondary" className="text-[10px]">{j.type}</Badge><Badge variant={j.moderation === "APPROVED" ? "default" : "outline"} className="text-[10px]">{j.moderation}</Badge></div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" asChild><Link href={`/employer/monitor/${j.id}`}>Monitor</Link></Button>
                        <Button size="sm" variant="outline" asChild><Link href={`/private-jobs/${j.slug}`}>View</Link></Button>
                      </div>
                    </CardContent></Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
      <p className="mt-6 text-center text-xs text-gray-500">Logged in as {session?.user?.email} - employer access is tied to your OTP-verified company, not a separate account. Inbox addresses are masked everywhere and codes are hashed, single-use and expiring.</p>
    </div>
  )
}
