"use client"
import { Badge } from "@/components/ui/badge"

export function ModerationBadge({ value }: { value?: string | null }) {
  const v = (value || "APPROVED").toUpperCase()
  if (v === "PENDING") return <Badge className="bg-paper-2 text-brick hover:bg-paper-2">PENDING REVIEW</Badge>
  if (v === "REJECTED") return <Badge className="bg-paper-2 text-brick hover:bg-paper-2">REJECTED</Badge>
  return <Badge className="bg-paper-3 text-foreground hover:bg-paper-3">APPROVED</Badge>
}
