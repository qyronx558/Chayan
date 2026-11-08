"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

export function CookieConsent() {
 const [visible, setVisible] = useState(false)

 useEffect(() => {
  const consent = localStorage.getItem("ChayanJobs-cookie-consent")
  if (!consent) {
   const timer = setTimeout(() => setVisible(true), 1000)
   return () => clearTimeout(timer)
  }
 }, [])

 function accept() {
  localStorage.setItem("ChayanJobs-cookie-consent", "accepted")
  setVisible(false)
 }

 function decline() {
  localStorage.setItem("ChayanJobs-cookie-consent", "declined")
  setVisible(false)
 }

 if (!visible) return null

 return (
  <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-rule bg-background px-4 pt-4 pb-[max(env(safe-area-inset-bottom),1rem)] dark:border-ink dark:bg-ink">
   <div className="mx-auto flex max-w-7xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex-1">
     <p className="text-sm text-foreground dark:text-muted-foreground">
      We use cookies to improve your experience, analyze traffic, and show ads.
      Ad privacy choices in the EEA/UK are managed by Google&apos;s consent
      message (Funding Choices). By continuing, you agree to our{" "}
       <Link href="/cookie-policy" className="text-brick underline hover:text-brick dark:text-brick">
       Cookie Policy
      </Link>
      {" "}and{" "}
       <Link href="/privacy" className="text-brick underline hover:text-brick dark:text-brick">
       Privacy Policy
      </Link>.
     </p>
    </div>
    <div className="flex items-center gap-2">
     <Button variant="outline" size="sm" onClick={decline}>
      Decline
     </Button>
     <Button size="sm" onClick={accept}>
      Accept
     </Button>
     <button onClick={decline} className="ml-1 text-muted-foreground hover:text-muted-foreground" aria-label="Close">
      <X className="h-4 w-4" />
     </button>
    </div>
   </div>
  </div>
 )
}
