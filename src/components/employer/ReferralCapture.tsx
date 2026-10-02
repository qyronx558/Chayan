"use client"
import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { captureReferralFromUrl } from "@/lib/referral-attribution"

/** First-touch ?ref=CODE attribution. Mount once in the employer shell. */
export function ReferralCapture() {
  const params = useSearchParams()
  useEffect(() => {
    captureReferralFromUrl()
  }, [params])
  return null
}
