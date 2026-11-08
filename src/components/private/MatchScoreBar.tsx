"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Match {
 matchScore: number
 matchedSkills: string[]
 matchDetails: string[]
 improvementTips: string[]
}

export function MatchScoreBar({ privateJobId }: { privateJobId: string }) {
 const [match, setMatch] = useState<Match | null>(null)
 const [hasResume, setHasResume] = useState(false)
 const [loaded, setLoaded] = useState(false)

 useEffect(() => {
  let cancelled = false
  fetch("/api/private-jobs/recommendations")
   .then((r) => r.json())
   .then((json) => {
    if (cancelled) return
    const all = [...(json.data?.topMatches || []), ...(json.data?.otherJobs || [])]
    const found = all.find((j: { id: string }) => j.id === privateJobId)
    if (found) {
     setMatch({ matchScore: found.matchScore, matchedSkills: found.matchedSkills, matchDetails: found.matchDetails, improvementTips: found.improvementTips })
     setHasResume(true)
    } else if (json.data?.topMatches) {
     setHasResume(true)
    }
    setLoaded(true)
   })
   .catch(() => setLoaded(true))
  return () => { cancelled = true }
 }, [privateJobId])

 if (!loaded) return <div className="h-16 animate-pulse rounded-2xl bg-paper-3 dark:bg-ink" />
 if (!hasResume) {
  return (
   <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-rule bg-paper-3 p-4">
    <p className="flex items-center gap-2 text-sm font-semibold text-foreground"><Sparkles className="h-4 w-4 text-brick" /> Upload resume to see your match score for this role</p>
    <Link href="/profile" className="text-sm font-bold text-brick hover:underline">Upload resume →</Link>
   </div>
  )
 }
 if (!match) return null
 const color = match.matchScore >= 70 ? "bg-paper-3" : match.matchScore >= 40 ? "bg-paper-2" : "bg-paper-3"
 return (
  <div className="rounded-2xl border border-rule bg-background p-4 dark:border-ink dark:bg-ink">
   <div className="mb-2 flex items-center justify-between">
    <p className="flex items-center gap-1.5 text-sm font-bold"><Sparkles className="h-4 w-4 text-brick" /> Your match: {match.matchScore}%</p>
    <div className="flex flex-wrap gap-1">{match.matchedSkills.slice(0, 4).map((s) => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}</div>
   </div>
   <div className="h-2 overflow-hidden rounded-full bg-paper-3 dark:bg-ink">
    <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${match.matchScore}%` }} />
   </div>
   {match.improvementTips[0] && <p className="mt-2 text-xs text-muted-foreground">{match.improvementTips[0]}</p>}
  </div>
 )
}
