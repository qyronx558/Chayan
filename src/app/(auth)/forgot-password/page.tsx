"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { motion } from "framer-motion"
import { z } from "zod"
import { Loader2, Mail, ArrowLeft, CheckCircle2, Shield, Bell, Bookmark, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/toast"
import { AuthLayout, Divider, InputWithIcon } from "@/components/auth/AuthComponents"

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
})

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  async function onSubmit(data: ForgotPasswordInput) {
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      })
      const json = await res.json()
      if (json.success) {
        setIsSuccess(true)
        toast("If an account exists, a reset email has been sent.", "success")
      } else {
        toast(json.error || "Failed to send reset email.", "destructive")
      }
    } catch {
      toast("Failed to send reset email. Please try again.", "destructive")
    } finally {
      setIsLoading(false)
    }
  }

  const benefits = [
    { icon: <Shield className="h-5 w-5" />, title: "Secure Reset", description: "Password reset links are single-use and expire in 1 hour for security." },
    { icon: <Mail className="h-5 w-5" />, title: "Instant Delivery", description: "Reset emails are sent immediately — check your inbox and spam folder." },
    { icon: <Clock className="h-5 w-5" />, title: "Quick Recovery", description: "Get back to tracking your applications in minutes, not hours." },
  ]

  return (
    <AuthLayout
      sideTitle={isSuccess ? "Check Your Email" : "Reset Password"}
      sideDescription={isSuccess
        ? "We have sent a password reset link to your email address. Please check your inbox."
        : "Enter your email address and we'll send you a secure reset link."}
      benefits={benefits}
    >
      <div className="space-y-6">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-100 dark:bg-teal-900/30"
          >
            {isSuccess ? (
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            ) : (
              <Mail className="h-8 w-8 text-teal-600 dark:text-teal-400" />
            )}
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isSuccess ? "Check Your Email" : "Reset Password"}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {isSuccess
              ? "If an account exists with that email, you will receive a password reset link shortly."
              : "Enter your email address and we'll send you a reset link."}
          </p>
        </div>

        {isSuccess ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-green-50 p-4 text-sm text-green-800 dark:bg-green-950/30 dark:text-green-300 border border-green-200 dark:border-green-800">
              <p className="font-medium">Reset email sent!</p>
              <p className="mt-1">Please check your inbox (and spam folder) for a link to reset your password. The link expires in 1 hour.</p>
            </div>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <InputWithIcon
              icon={<Mail className="h-5 w-5" />}
              label="Email Address"
              type="email"
              placeholder="name@example.com"
              {...register("email")}
              error={errors.email?.message}
              autoComplete="email"
              autoFocus
            />

            <Button type="submit" className="w-full py-3.5" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>

            <div className="text-center">
              <Link href="/login" className="inline-flex items-center text-sm font-medium text-teal-600 hover:text-teal-700">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to login
              </Link>
            </div>
          </form>
        )}
      </div>
    </AuthLayout>
  )
}