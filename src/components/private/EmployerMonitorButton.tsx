"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Shown just below the tracker/bookmark row on private job detail -
 * only to users who can monitor this job (owner / company member / admin).
 */
export function EmployerMonitorButton({ privateJobId }: { privateJobId: string }) {
 const { data: session } = useSession()
 const [allowedId, setAllowedId] = useState<string | null>(null)

 useEffect(() => {
  if (!session?.user) return
  let cancelled = false
  fetch("/api/employer/jobs")
   .then((r) => r.json())
   .then((j) => {
    if (cancelled || !j.success) return
    const found = (j.data || []).find((x: { id: string }) => x.id === privateJobId)
    if (found) setAllowedId(found.id)
   })
   .catch(() => {})
  return () => { cancelled = true }
 }, [session, privateJobId])

 if (!allowedId) return null
 return (
  <div className="mt-3 flex flex-wrap gap-2">
   <Button size="sm" variant="outline" asChild>
    <Link href={`/employer/monitor/${allowedId}`} target="_blank" rel="noopener noreferrer"><BarChart3 className="mr-1.5 h-3.5 w-3.5" /> Monitor performance ↗</Link>
   </Button>
   <Button size="sm" variant="ghost" asChild>
    <Link href="/employer" target="_blank" rel="noopener noreferrer">Open studio ↗</Link>
   </Button>
  </div>
 )
}
