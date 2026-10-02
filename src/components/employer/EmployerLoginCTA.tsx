"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { getStoredReferralCode } from "@/lib/referral-attribution"

/** Login CTA that preserves ?ref= through the auth redirect (cookie is primary, URL is backup). */
export function EmployerLoginCTA({ backTo = "/employer" }: { backTo?: string }) {
  const params = useSearchParams()
  const [href, setHref] = useState(`/login?mode=employer&callbackUrl=${encodeURIComponent(backTo)}`)

  useEffect(() => {
    const ref = params.get("ref") || getStoredReferralCode()
    const dest = ref ? `${backTo}?ref=${encodeURIComponent(ref)}` : backTo
    setHref(`/login?mode=employer&callbackUrl=${encodeURIComponent(dest)}`)
  }, [params, backTo])

  return (
    <Button asChild>
      <Link href={href} target="_blank" rel="noopener noreferrer">Sign in as employer (new tab)</Link>
    </Button>
  )
}
