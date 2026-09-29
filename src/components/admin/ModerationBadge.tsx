"use client"
import { Badge } from "@/components/ui/badge"

export function ModerationBadge({ value }: { value?: string | null }) {
  const v = (value || "APPROVED").toUpperCase()
  if (v === "PENDING") return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">PENDING REVIEW</Badge>
  if (v === "REJECTED") return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">REJECTED</Badge>
  return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">APPROVED</Badge>
}
