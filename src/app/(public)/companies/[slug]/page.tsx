import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, ExternalLink, MapPin, IndianRupee } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { TrustBadge } from "@/components/private/TrustBadge"
import { formatSalaryRange } from "@/lib/private-jobs-trust"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const c = await prisma.company.findUnique({ where: { slug } })
  if (!c) return { title: "Company not found" }
  return { title: `${c.name} Jobs & Careers`, description: `All active private jobs at ${c.name}. Verified openings with trust scores.` }
}

export const dynamic = "force-dynamic"

export default async function CompanyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const company = await prisma.company.findUnique({
    where: { slug },
    include: {
      privateJob: { where: { status: "ACTIVE" }, orderBy: { createdAt: "desc" }, take: 50 },
      members: { where: { verified: true }, take: 1 },
    },
  })
  if (!company) notFound()
  const verified = company.verifiedStatus === "VERIFIED"

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold"><Building2 className="h-7 w-7 text-brick" />{company.name}</h1>
          <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
            {company.industry && <Badge variant="secondary">{company.industry}</Badge>}
            {company.size && <Badge variant="outline">{company.size}</Badge>}
            {company.hq && <Badge variant="outline">{company.hq}</Badge>}
            {verified ? <Badge className="bg-paper-3">Verified employer</Badge> : <Badge variant="outline">Unverified</Badge>}
          </div>
          {company.description && <p className="mt-3 max-w-2xl text-muted-foreground">{company.description}</p>}
          <div className="mt-3 flex gap-3">
            {company.website && <a href={company.website.startsWith("http") ? company.website : `https://${company.website}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-brick hover:underline"><ExternalLink className="h-3.5 w-3.5" /> Website</a>}
            <Link href="/companies/claim" className="text-sm font-semibold text-muted-foreground hover:underline">Claim this profile</Link>
          </div>
        </div>
        <Card className="w-48"><CardContent className="p-4 text-center">
          <p className="text-3xl font-extrabold">{company.privateJob.length}</p>
          <p className="text-xs text-muted-foreground">active openings</p>
        </CardContent></Card>
      </div>

      {company.privateJob.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No active jobs right now. Check back soon.</CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {company.privateJob.map((j) => (
            <Link key={j.id} href={`/private-jobs/${j.slug}`}>
              <Card className="h-full transition hover:">
                <CardContent className="p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Badge variant="secondary" className="text-[11px]">{j.type.replace("_", " ")}</Badge>
                    <TrustBadge score={j.trustScore} size="sm" />
                  </div>
                  <p className="font-bold text-foreground">{j.title}</p>
                  <p className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {j.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{j.location}</span>}
                    {(j.salaryMin || j.salaryMax || j.salary) && <span className="inline-flex items-center gap-1"><IndianRupee className="h-3 w-3" />{formatSalaryRange(j.salaryMin, j.salaryMax, j.salary)}</span>}
                    {j.lastDate && <span>Last: {formatDate(j.lastDate)}</span>}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
      <div className="mt-8 text-center"><Button variant="outline" asChild><Link href="/private-jobs">Browse all private jobs</Link></Button></div>
    </div>
  )
}
