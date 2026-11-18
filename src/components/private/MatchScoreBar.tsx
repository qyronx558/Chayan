"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { handFont, typeFont } from "@/components/home/fonts"

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

 const tag = "relative rounded-[10px] border border-[var(--hs-border-strong)] bg-[var(--hs-paper-slip)] py-4 pl-12 pr-5"
 const hole = <span aria-hidden className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-[var(--hs-border-strong)] bg-background" />
 if (!loaded) return <div className="h-16 animate-pulse rounded-[10px] bg-[var(--hs-surface-2)]" />
 if (!hasResume) {
  return (
   <div className={cn(tag, "flex flex-wrap items-center justify-between gap-3 border-dashed")}>
    {hole}
    <p className="flex items-center gap-2 text-sm font-semibold text-foreground"><Sparkles className="h-4 w-4 text-[var(--color-brick)]" /> Upload resume to see your match score for this role</p>
    <Link href="/profile" className={cn(handFont.className, "text-[1.1rem] text-[var(--hs-trust)] underline decoration-wavy decoration-1 underline-offset-4")}>Upload resume →</Link>
   </div>
  )
 }
 if (!match) return null
 const ink = match.matchScore >= 70 ? "oklch(48% 0.12 155)" : match.matchScore >= 40 ? "oklch(60% 0.13 75)" : "oklch(52% 0.19 27)"
 return (
  <div className={tag} style={{ boxShadow: "0 14px 24px -18px rgb(20 30 70 / .5)" }}>
   {hole}
   <div className="flex flex-wrap items-center justify-between gap-3">
    <p className="flex items-baseline gap-2">
     <span className={cn(typeFont.className, "text-[10px] font-bold tracking-[0.2em] text-muted-foreground")}>YOUR MATCH</span>
     <span className="font-display text-[1.6rem] font-black leading-none tabular-nums" style={{ color: ink }}>{match.matchScore}%</span>
    </p>
    <div className="flex flex-wrap gap-1.5">{match.matchedSkills.slice(0, 4).map((s) => <span key={s} className={cn(typeFont.className, "rounded-full border border-[var(--hs-border-strong)] px-2 py-0.5 text-[10.5px] font-bold uppercase text-foreground/80")}>✓ {s}</span>)}</div>
   </div>
   <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-[var(--hs-surface-2)]">
    <div className="h-full rounded-full transition-all" style={{ width: `${match.matchScore}%`, background: ink }} />
   </div>
   {match.improvementTips[0] && <p className={cn(handFont.className, "mt-2 text-[1.02rem] leading-snug text-muted-foreground")}>tip: {match.improvementTips[0]}</p>}
  </div>
 )
}
