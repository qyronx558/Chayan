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

  if (!loaded) return <div className="h-16 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
  if (!hasResume) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-blue-200 bg-blue-50/60 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-gray-800"><Sparkles className="h-4 w-4 text-blue-500" /> Upload resume to see your match score for this role</p>
        <Link href="/profile" className="text-sm font-bold text-blue-700 hover:underline">Upload resume →</Link>
      </div>
    )
  }
  if (!match) return null
  const color = match.matchScore >= 70 ? "bg-emerald-500" : match.matchScore >= 40 ? "bg-amber-500" : "bg-gray-300"
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-2 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-sm font-bold"><Sparkles className="h-4 w-4 text-teal-600" /> Your match: {match.matchScore}%</p>
        <div className="flex flex-wrap gap-1">{match.matchedSkills.slice(0, 4).map((s) => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}</div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${match.matchScore}%` }} />
      </div>
      {match.improvementTips[0] && <p className="mt-2 text-xs text-gray-500">{match.improvementTips[0]}</p>}
    </div>
  )
}
