"use client"

import * as React from "react"
import { Mail, Send, CheckCircle, AlertCircle, ShieldCheck, BellRing } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function Newsletter({
 className,
 variant = "default",
}: {
 className?: string
 variant?: "default" | "footer"
}) {
 const [email, setEmail] = React.useState("")
 const [loading, setLoading] = React.useState(false)
 const [subscribed, setSubscribed] = React.useState(false)
 const [error, setError] = React.useState("")
 const isFooter = variant === "footer"

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setError("")

  if (!email.trim()) {
   setError("Please enter your email address")
   return
  }

  if (!EMAIL_REGEX.test(email)) {
   setError("Please enter a valid email address")
   return
  }

  setLoading(true)

  try {
   const res = await fetch("/api/newsletter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
   })

   if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || "Subscription failed")
   }

   setSubscribed(true)
   setEmail("")
   toast("Successfully subscribed to newsletter!", "success")
  } catch (err) {
   const message = err instanceof Error ? err.message : "Something went wrong"
   setError(message)
   toast(message, "destructive")
  } finally {
   setLoading(false)
  }
 }

 if (subscribed) {
  if (isFooter) {
   return (
    <div className={cn("border border-paper/25 p-3", className)}>
     <div className="flex items-center gap-2">
      <CheckCircle className="h-4 w-4 shrink-0 text-paper" />
      <p className="text-xs font-semibold text-paper">You&apos;re subscribed</p>
     </div>
     <p className="mt-1 text-[11px] leading-snug text-paper/65">
      Welcome aboard. Your job alerts are on the way.
     </p>
    </div>
   )
  }
  return (
   <Card className={cn("border-rule", className)}>
    <div className="border-b border-rule bg-ink px-4 py-3">
     <CardTitle className="text-sm font-semibold text-paper">You&apos;re subscribed</CardTitle>
     <p className="mt-0.5 text-[11px] text-paper/65">
      Welcome aboard. Your job alerts are on the way.
     </p>
    </div>
    <CardContent className="flex items-start gap-2 py-4">
     <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brick" />
     <p className="text-xs leading-relaxed text-muted-foreground">
      Thank you for subscribing to job alerts and updates.
     </p>
    </CardContent>
   </Card>
  )
 }

 if (isFooter) {
  return (
   <div className={cn("", className)}>
    <div className="flex items-center gap-2">
     <BellRing className="h-3.5 w-3.5 shrink-0 text-paper/60" />
     <h3 className="font-display text-sm font-bold text-paper">
      Get free job alerts in your inbox
     </h3>
    </div>
    <form onSubmit={handleSubmit} className="mt-2.5 flex items-center gap-1.5">
     <div className="relative flex-1">
      <Mail className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-paper/45" />
      <Input
       type="email"
       placeholder="Email address"
       value={email}
       onChange={(e) => {
        setEmail(e.target.value)
        if (error) setError("")
       }}
       aria-label="Email address"
       className={cn(
        "h-8 rounded-none border-paper/25 bg-paper/5 pl-6 text-xs text-paper placeholder:text-paper/45",
        error && "border-brick"
       )}
      />
     </div>
     <Button
      type="submit"
      disabled={loading}
      className="h-8 shrink-0 rounded-none bg-paper px-3 text-xs text-ink hover:bg-paper-2"
     >
      {loading ? (
       <span className="h-3 w-3 animate-spin rounded-full border-2 border-ink border-t-transparent" />
      ) : (
       <span className="flex items-center gap-1">
        <Send className="h-3 w-3" />
        Subscribe
       </span>
      )}
     </Button>
    </form>
    {error && (
     <p className="mt-1 flex items-center gap-1 text-[11px] text-brick">
      <AlertCircle className="h-3 w-3" />
      {error}
     </p>
    )}
    <div className="agate mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] text-paper/55">
     <span className="flex items-center gap-1">
      <ShieldCheck className="h-2.5 w-2.5" />
      No spam
     </span>
     <span className="flex items-center gap-1">
      <CheckCircle className="h-2.5 w-2.5" />
      Unsubscribe anytime
     </span>
    </div>
   </div>
  )
 }

 return (
  <Card className={cn("border-rule", className)}>
   <div className="flex items-center gap-2 border-b border-rule bg-ink px-4 py-2.5">
    <BellRing className="h-3.5 w-3.5 shrink-0 text-paper/70" />
    <h3 className="font-display text-sm font-bold text-paper">
     Get free job alerts in your inbox
    </h3>
   </div>
   <CardContent className="px-4 py-3">
    <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
     <div className="relative flex-1">
      <Mail className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
      <Input
       type="email"
       placeholder="Email address"
       value={email}
       onChange={(e) => {
        setEmail(e.target.value)
        if (error) setError("")
       }}
       aria-label="Email address"
       className={cn(
        "h-8 pl-6 text-xs",
        error && "border-brick"
       )}
      />
     </div>
     <Button
      type="submit"
      disabled={loading}
      className="h-8 shrink-0 px-3 text-xs"
     >
      {loading ? (
       <span className="h-3 w-3 animate-spin rounded-full border-2 border-background border-t-transparent" />
      ) : (
       <span className="flex items-center gap-1">
        <Send className="h-3 w-3" />
        Subscribe
       </span>
      )}
     </Button>
    </form>
    {error && (
     <p className="mt-1 flex items-center gap-1 text-[11px] text-brick">
      <AlertCircle className="h-3 w-3" />
      {error}
     </p>
    )}
    <div className="agate mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] text-muted-foreground">
     <span className="flex items-center gap-1">
      <ShieldCheck className="h-2.5 w-2.5" />
      No spam
     </span>
     <span className="flex items-center gap-1">
      <CheckCircle className="h-2.5 w-2.5" />
      Unsubscribe anytime
     </span>
    </div>
   </CardContent>
  </Card>
 )
}