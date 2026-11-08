"use client"

import { usePathname, useRouter } from "next/navigation"
import { Sparkles } from "lucide-react"

const HOME_SEEN_KEY = "ChayanJobs_tour_v2_home_seen"
const CAL_SEEN_KEY = "ChayanJobs_tour_v2_calendar_seen"

/** Footer / help entry point to replay the intelligent spotlight tour. */
export function TourReplayButton({ className = "" }: { className?: string }) {
  const pathname = usePathname()
  const router = useRouter()

  const replay = () => {
    try {
      if ((pathname ?? "/").startsWith("/exam-calendar")) {
        localStorage.removeItem(CAL_SEEN_KEY)
        window.dispatchEvent(new Event("ChayanJobs:replay-tour"))
      } else if ((pathname ?? "/") === "/") {
        localStorage.removeItem(HOME_SEEN_KEY)
        window.dispatchEvent(new Event("ChayanJobs:replay-tour"))
      } else {
        // From any other page, jump into the relevant tour
        router.push("/?tour=1")
      }
    } catch {
      router.push("/?tour=1")
    }
  }

  return (
    <button
      type="button"
      onClick={replay}
      className={`inline-flex items-center gap-1.5 rounded-full border border-rule bg-paper-3 px-3 py-1.5 text-xs font-semibold text-brick transition-colors hover:bg-paper-3 hover:text-brick ${className}`}
    >
      <Sparkles className="h-3.5 w-3.5" />
      Take a quick tour
    </button>
  )
}
