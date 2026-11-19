"use client"

import { useSyncExternalStore } from "react"
import { cn, formatDate } from "@/lib/utils"
import { handFont, typeFont } from "@/components/home/fonts"

const subscribe = () => () => {}
const clientNow = typeof window === "undefined" ? 0 : Date.now()

function useDaysLeft(lastDate: string | null) {
  const now = useSyncExternalStore(subscribe, () => clientNow, () => 0)
  if (!lastDate || !now) return { days: null, urgent: false }
  const days = Math.floor((new Date(lastDate).getTime() - now) / 86400000)
  return { days, urgent: days >= 0 && days <= 7 }
}

export function DaysLeftNote({ lastDate }: { lastDate: string }) {
  const { days, urgent } = useDaysLeft(lastDate)
  return (
    <dd className={urgent ? "font-bold text-[var(--color-brick)]" : "text-foreground"}>
      {formatDate(lastDate)}
      {days !== null && days >= 0 ? (
        <span className={cn(handFont.className, "ml-2 text-[0.98rem] font-normal", urgent ? "text-[var(--color-brick)]" : "text-muted-foreground")}>
          {urgent ? `only ${days}d left` : `${days}d left`}
        </span>
      ) : null}
    </dd>
  )
}

export function DaysLeftStamp({ lastDate }: { lastDate: string | null }) {
  const { days, urgent } = useDaysLeft(lastDate)
  if (days === null || days < 0) return null
  return (
    <span
      className={cn(typeFont.className, "shrink-0 rotate-[6deg] rounded-[3px] border-2 px-1.5 text-[10px] font-bold")}
      style={{ color: urgent ? "oklch(52% 0.19 27)" : "oklch(45% 0.13 255)", borderColor: "currentColor" }}
    >
      {urgent ? `ONLY ${days}D LEFT` : `${days}D LEFT`}
    </span>
  )
}

export function UrgentDate({ lastDate }: { lastDate: string }) {
  const { urgent } = useDaysLeft(lastDate)
  return <span className={urgent ? "font-bold text-[var(--color-brick)]" : "text-foreground"}>{formatDate(lastDate)}</span>
}
