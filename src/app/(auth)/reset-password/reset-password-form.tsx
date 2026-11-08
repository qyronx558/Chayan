"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { z } from "zod"
import { Loader2, Lock, CheckCircle2, AlertCircle, ArrowLeft, Shield, Bell, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { AuthLayout, Divider, PasswordInput, StrengthMeter } from "@/components/auth/AuthComponents"

const resetSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type ResetInput = z.infer<typeof resetSchema>

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams?.get("token") || ""

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetInput>({
    resolver: zodResolver(resetSchema),
  })

  const password = watch("password", "")
  const confirmPassword = watch("confirmPassword", "")

  useEffect(() => {
    if (!token) {
      setError("No reset token provided. Please request a new password reset link.")
    }
  }, [token])

  async function onSubmit(data: ResetInput) {
    setIsLoading(true)
    setError("")
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: data.password }),
      })
      const json = await res.json()
      if (json.success) {
        setIsSuccess(true)
        toast("Password reset successfully!", "success")
      } else {
        setError(json.error || "Failed to reset password")
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const benefits = [
    { icon: <Shield className="h-5 w-5" />, title: "Secure Update", description: "Your new password is encrypted and never stored in plain text." },
    { icon: <Bell className="h-5 w-5" />, title: "Instant Effect", description: "Changes take effect immediately across all your devices." },
    { icon: <Clock className="h-5 w-5" />, title: "Session Refresh", description: "You will be logged out of other sessions for security." },
  ]

  return (
    <AuthLayout
      sideTitle={isSuccess ? "Password Reset" : "Set New Password"}
      sideDescription={isSuccess
        ? "Your password has been reset successfully. You can now sign in with your new password."
        : "Enter your new password below. Make sure it's strong and unique."}
      benefits={benefits}
    >
      <div className="space-y-6">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-paper-3 dark:bg-paper-3"
          >
            {isSuccess ? (
              <CheckCircle2 className="h-8 w-8 text-foreground dark:text-foreground" />
            ) : (
              <Lock className="h-8 w-8 text-brick dark:text-brick" />
            )}
          </motion.div>
          <h1 className="text-2xl font-bold text-foreground dark:text-paper">
            {isSuccess ? "Password Reset" : "Set New Password"}
          </h1>
          <p className="mt-2 text-muted-foreground dark:text-muted-foreground">
            {isSuccess
              ? "Your password has been updated. You can now sign in with your new password."
              : "Enter your new password below."}
          </p>
        </div>

        {isSuccess ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-paper-3 p-4 text-sm text-foreground dark:bg-paper-3 dark:text-foreground border border-rule dark:border-rule">
              <p className="font-medium">Password updated successfully!</p>
              <p className="mt-1">You will be logged out of other sessions. Please sign in again with your new password.</p>
            </div>
            <Button className="w-full py-3.5" asChild>
              <Link href="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go to Login
              </Link>
            </Button>
          </div>
        ) : error && !token ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-paper-2 p-4 text-sm text-brick dark:bg-paper-2 dark:text-brick border border-brick dark:border-brick flex items-start gap-3">
              <AlertCircle className="mr-2 inline h-5 w-5 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <Button variant="outline" className="w-full py-3.5" asChild>
              <Link href="/forgot-password">Request New Reset Link</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-paper-2 p-3 text-sm text-brick dark:bg-paper-2 dark:text-brick border border-brick dark:border-brick flex items-center gap-2"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <PasswordInput
              label="New Password"
              value={password}
              onChange={register("password").onChange}
              onBlur={register("password").onBlur}
              ref={register("password").ref}
              name="password"
              onToggle={() => setShowPassword(!showPassword)}
              show={showPassword}
              error={errors.password?.message}
              placeholder="••••••••"
              id="password"
              autoComplete="new-password"
            />

            <StrengthMeter password={password} />

            <PasswordInput
              label="Confirm Password"
              value={confirmPassword}
              onChange={register("confirmPassword").onChange}
              onBlur={register("confirmPassword").onBlur}
              ref={register("confirmPassword").ref}
              name="confirmPassword"
              onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
              show={showConfirmPassword}
              error={errors.confirmPassword?.message}
              placeholder="••••••••"
              id="confirmPassword"
              autoComplete="new-password"
            />

            <Button type="submit" className="w-full py-3.5" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </form>
        )}
      </div>
    </AuthLayout>
  )
}