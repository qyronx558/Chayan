"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Calendar, MapPin, IndianRupee, Briefcase, ExternalLink, ArrowLeft, Mail, Building2, Flag, Wifi } from "lucide-react"
import { BookmarkButton } from "@/components/layout/BookmarkButton"
import { formatDate } from "@/lib/utils"
import { BLOG_PROSE_CLASSES, renderRichHtml } from "@/lib/blog-prose"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { PrivateInsightStrip } from "@/components/private/PrivateInsightStrip"
import { PrivateTracker } from "@/components/private/PrivateTracker"
import { EmployerMonitorButton } from "@/components/private/EmployerMonitorButton"
import { PrepKit } from "@/components/private/PrepKit"
import { MatchScoreBar } from "@/components/private/MatchScoreBar"
import { TrustBadge } from "@/components/private/TrustBadge"
import { computeTrustScore, formatSalaryRange } from "@/lib/private-jobs-trust"

interface Company {
  id: string; name: string; slug?: string; logo?: string | null; website?: string | null; description?: string | null; verifiedStatus?: string
}

interface PrivateJob {
  id: string; title: string; slug: string; type: string; category?: string | null
  description?: string | null; location?: string | null; salary?: string | null
  salaryMin?: number | null; salaryMax?: number | null
  experience?: string | null; expMin?: number | null; expMax?: number | null
  qualification?: string | null; skills?: string[]; remotePolicy?: string | null
  vacancies?: number | null; views?: number | null; trustScore?: number | null
  isFresherFriendly?: boolean; isWalkIn?: boolean; walkInVenue?: string | null; walkInDate?: string | null
  proofUrl?: string | null
  applicationUrl?: string | null
  applicationEmail?: string | null; lastDate?: string | null; status: string
  company: Company; createdAt: string
}

const typeLabels: Record<string, string> = {
  FULL_TIME: "Full-Time", PART_TIME: "Part-Time", INTERNSHIP: "Internship", CONTRACT: "Contract",
}

export function PrivateJobDetail({ job }: { job: PrivateJob }) {
  const { data: session } = useSession()
  const [reportOpen, setReportOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [details, setDetails] = useState("")
  const [reporting, setReporting] = useState(false)

  useEffect(() => {
    fetch(`/api/private-jobs/${job.id}/view`, { method: "POST" }).catch(() => {})
  }, [job.id])

  const trackClick = (kind: "APPLY" | "EMAIL") => {
    fetch(`/api/private-jobs/${job.id}/click`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind }),
    }).catch(() => {})
  }

  const trust = computeTrustScore({
    applicationUrl: job.applicationUrl,
    applicationEmail: job.applicationEmail,
    proofUrl: job.proofUrl,
    companyWebsite: job.company.website,
    companyVerified: job.company.verifiedStatus === "VERIFIED",
    description: job.description,
  })
  const score = job.trustScore ?? trust.score
  const salary = formatSalaryRange(job.salaryMin, job.salaryMax, job.salary)

  const submitReport = async () => {
    if (!reason.trim()) { toast("Enter a reason", "destructive"); return }
    setReporting(true)
    try {
      const res = await fetch(`/api/private-jobs/${job.id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, details }),
      })
      const json = await res.json()
      if (json.success) { toast("Reported - our team will review", "success"); setReportOpen(false); setReason(""); setDetails("") }
      else toast(json.error || "Failed", "destructive")
    } catch { toast("Failed", "destructive") } finally { setReporting(false) }
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Link href="/private-jobs" className="mb-6 inline-flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700">
        <ArrowLeft className="h-4 w-4" /> Back to Private Jobs
      </Link>

      <div className="mb-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-sm">{typeLabels[job.type] || job.type}</Badge>
          {job.category && <Badge variant="secondary" className="text-sm">{job.category}</Badge>}
          {job.remotePolicy && <Badge variant="outline" className="text-sm"><Wifi className="mr-1 h-3 w-3" />{job.remotePolicy}</Badge>}
          {job.isFresherFriendly && <Badge className="bg-emerald-600 text-sm">Fresher friendly</Badge>}
          {job.isWalkIn && <Badge className="bg-amber-500 text-sm">Walk-in</Badge>}
          <Badge variant={job.status === "ACTIVE" ? "default" : "secondary"}>
            {job.status === "ACTIVE" ? "Active" : "Expired"}
          </Badge>
          <TrustBadge score={score} reasons={trust.reasons} />
        </div>
        <h1 className="mb-2 text-3xl font-bold text-gray-900">{job.title}</h1>
        <div className="flex flex-wrap items-center gap-2 text-lg text-teal-700">
          <Building2 className="h-5 w-5" />
          {job.company.slug ? (
            <Link href={`/companies/${job.company.slug}`} className="font-semibold hover:underline">{job.company.name}</Link>
          ) : (
            <span className="font-semibold">{job.company.name}</span>
          )}
          {job.company.verifiedStatus === "VERIFIED" && <Badge variant="outline" className="text-[11px] text-emerald-700">Verified employer</Badge>}
        </div>
      </div>

      <div className="mb-6"><PrivateInsightStrip lastDate={job.lastDate} salaryMin={job.salaryMin} salaryMax={job.salaryMax} salaryText={job.salary} location={job.location} remotePolicy={job.remotePolicy} vacancies={job.vacancies} views={job.views} trustScore={score} /></div>
      <div className="mb-6"><MatchScoreBar privateJobId={job.id} /></div>

      <div className="mb-8 flex flex-wrap gap-6 text-sm text-gray-600">
        {job.location && (
          <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-gray-400" />{job.location}</span>
        )}
        {salary && (
          <span className="flex items-center gap-1.5"><IndianRupee className="h-4 w-4 text-gray-400" />{salary}</span>
        )}
        {job.experience && (
          <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4 text-gray-400" />{job.experience}</span>
        )}
        {job.expMin !== null && job.expMin !== undefined && (
          <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4 text-gray-400" />{job.expMin}-{job.expMax ?? job.expMin} yrs</span>
        )}
        {job.lastDate && (
          <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-gray-400" />Last Date: {formatDate(job.lastDate)}</span>
        )}
      </div>

      {(job.skills?.length || job.qualification) && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {(job.skills || []).map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
          {job.qualification && <span className="text-xs text-gray-500">Qualification: {job.qualification}</span>}
        </div>
      )}

      {job.isWalkIn && (
        <Card className="mb-6 border-amber-200 bg-amber-50/60"><CardContent className="p-4 text-sm">
          <p className="font-bold text-amber-800">Walk-in {job.walkInDate ? `on ${formatDate(job.walkInDate)}` : ""}</p>
          {job.walkInVenue && <p className="text-amber-700">Venue: {job.walkInVenue}</p>}
        </CardContent></Card>
      )}

      <div className="mb-2 flex flex-wrap items-center gap-3">
        <BookmarkButton privateJobId={job.id} />
        <PrivateTracker privateJobId={job.id} />
        {job.applicationUrl && (
          <Button asChild>
            <Link href={`/private-jobs/${job.slug}/apply`} onClick={() => trackClick("APPLY")}>
              <ExternalLink className="mr-2 h-4 w-4" /> Apply Now
            </Link>
          </Button>
        )}
        {job.applicationEmail && (
          <Button variant="outline" asChild>
            <a href={`mailto:${job.applicationEmail}`} onClick={() => trackClick("EMAIL")}>
              <Mail className="mr-2 h-4 w-4" /> Apply via Email
            </a>
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => setReportOpen(!reportOpen)} className="text-gray-500"><Flag className="mr-1 h-3.5 w-3.5" /> Report</Button>
      </div>
      <div className="mb-8">
        <EmployerMonitorButton privateJobId={job.id} />
      </div>

      {reportOpen && (
        <Card className="mb-6 border-red-200"><CardContent className="space-y-2 p-4">
          <p className="text-sm font-bold">Report this job (fake, fee-asking, wrong info?)</p>
          <Input placeholder="Reason e.g. Asks for registration fee" value={reason} onChange={(e) => setReason(e.target.value)} />
          <Textarea placeholder="Details (optional)" value={details} onChange={(e) => setDetails(e.target.value)} rows={3} />
          <Button size="sm" variant="destructive" disabled={reporting} onClick={submitReport}>{reporting ? "Submitting..." : "Submit report"}</Button>
        </CardContent></Card>
      )}

      {job.description && (
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Job Description</h2>
            <div className={`${BLOG_PROSE_CLASSES}`}>
              <div dangerouslySetInnerHTML={{ __html: renderRichHtml(job.description) }} />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">Get hired faster</h2>
        <PrepKit title={job.title} company={job.company.name} description={job.description} skills={job.skills} category={job.category} experience={job.experience} applicationEmail={job.applicationEmail} applicantName={session?.user?.name} />
      </div>

      {(job.company.description || job.company.website) && (
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">About {job.company.name}</h2>
            {job.company.description && <p className="text-gray-600">{job.company.description}</p>}
            <div className="mt-3 flex gap-3">
              {job.company.website && (
                <a
                  href={job.company.website.startsWith("http") ? job.company.website : `https://${job.company.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-700"
                >
                  <ExternalLink className="h-4 w-4" /> Visit {job.company.name} Website
                </a>
              )}
              {job.company.slug && (
                <Link href={`/companies/${job.company.slug}`} className="text-sm font-semibold text-teal-700 hover:underline">All jobs at {job.company.name} →</Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
