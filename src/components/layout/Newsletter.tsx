"use client"

import * as React from "react"
import { Mail, Send, CheckCircle, AlertCircle, ShieldCheck, BellRing } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function Newsletter({ className }: { className?: string }) {
  const [email, setEmail] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [subscribed, setSubscribed] = React.useState(false)
  const [error, setError] = React.useState("")

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
    return (
      <Card className={cn("overflow-hidden border-teal-200 dark:border-teal-900", className)}>
        <div className="bg-gradient-to-r from-teal-900 to-teal-600 px-3 py-3 text-center">
          <CardTitle className="text-sm font-semibold text-white">You&apos;re subscribed!</CardTitle>
          <p className="mt-0.5 text-[11px] text-teal-100">
            Welcome aboard - your job alerts are on the way.
          </p>
        </div>
        <CardContent className="flex flex-col items-center gap-1.5 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-950">
            <CheckCircle className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          </div>
          <p className="max-w-md text-center text-[11px] text-muted-foreground">
            Thank you for subscribing to job alerts and updates.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("overflow-hidden border-teal-200 shadow-sm dark:border-teal-900", className)}>
      <div className="flex items-center gap-2 bg-gradient-to-r from-teal-900 to-teal-600 px-3 py-2.5">
        <BellRing className="h-3.5 w-3.5 shrink-0 text-white" />
        <h3 className="text-xs font-bold tracking-tight text-white">
          Get Free Job Alerts in Your Inbox
        </h3>
      </div>
      <CardContent className="px-3 py-3">
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
                error && "border-red-500 focus-visible:ring-red-500"
              )}
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="h-8 shrink-0 bg-teal-600 px-3 text-xs hover:bg-teal-700"
          >
            {loading ? (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <span className="flex items-center gap-1">
                <Send className="h-3 w-3" />
                Subscribe
              </span>
            )}
          </Button>
        </form>
        {error && (
          <p className="mt-1 flex items-center gap-1 text-[11px] text-red-500">
            <AlertCircle className="h-3 w-3" />
            {error}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-2.5 w-2.5 text-teal-600 dark:text-teal-400" />
            No spam
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle className="h-2.5 w-2.5 text-teal-600 dark:text-teal-400" />
            Unsubscribe anytime
          </span>
        </div>
      </CardContent>
    </Card>
  )
}