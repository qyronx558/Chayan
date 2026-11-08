"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EmployerVerifyPanel } from "@/components/employer/EmployerVerifyPanel"

export default function ClaimCompanyPage() {
  const router = useRouter()
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    fetch("/api/companies").then((r) => r.json()).then((d) => { if (d.success) setCompanies(d.data) }).catch(() => {})
  }, [])

  return (
    <div className="container mx-auto max-w-xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold">Claim your company</h1>
      <p className="mb-6 text-muted-foreground">
        Typing a domain never verifies you - only a 6-digit code sent to that work inbox does.
        Free inboxes (Gmail/Yahoo) are rejected. Full addresses stay private (shown masked).
      </p>
      <Card><CardHeader><CardTitle>Employer verification - inbox OTP</CardTitle></CardHeader><CardContent>
        <EmployerVerifyPanel companies={companies} onVerified={() => router.push("/employer/jobs")} />
        <div className="mt-4 border-t pt-3 text-center">
          <Button variant="ghost" size="sm" asChild><Link href="/employer/jobs">Continue to Studio →</Link></Button>
        </div>
      </CardContent></Card>
    </div>
  )
}
