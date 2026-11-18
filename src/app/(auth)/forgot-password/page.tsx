"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { motion } from "framer-motion"
import { z } from "zod"
import { Loader2, Mail, ArrowLeft, CheckCircle2, Shield, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { handFont } from "@/components/home/fonts"
import { AuthLayout, InputWithIcon } from "@/components/auth/AuthComponents"

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
    { icon: <Mail className="h-5 w-5" />, title: "Instant Delivery", description: "Reset emails are sent immediately - check your inbox and spam folder." },
    { icon: <Clock className="h-5 w-5" />, title: "Quick Recovery", description: "Get back to tracking your applications in minutes, not hours." },
  ]

  return (
    <AuthLayout
      sideTitle={isSuccess ? "Check Your Email" : "Reset Password"}
      sideDescription={isSuccess
        ? "We have sent a password reset link to your email address. Please check your inbox."
        : "Enter your email address and we'll send you a secure reset link."}
      benefits={benefits}
      variant={isSuccess ? "forgot-sent" : "forgot"}
    >
      <div className="space-y-6">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border-[2.5px] ${isSuccess ? "rotate-[6deg] border-[oklch(45%_0.1_160)] text-[oklch(45%_0.1_160)]" : "-rotate-[6deg] border-[var(--color-brick)] text-[var(--color-brick)]"}`}
          >
            {isSuccess ? (
              <CheckCircle2 className="h-8 w-8" />
            ) : (
              <Mail className="h-8 w-8" />
            )}
          </motion.div>
          <h1 className="font-display text-[2rem] font-black leading-tight text-foreground">
            {isSuccess ? "Check Your Email" : "Reset Password"}
          </h1>
          <p className="mt-2 text-[14.5px] text-muted-foreground">
            {isSuccess
              ? "If an account exists with that email, you will receive a password reset link shortly."
              : "Enter your email address and we'll send you a reset link."}
          </p>
        </div>

        {isSuccess ? (
          <div className="space-y-4">
            <div className="relative rotate-[-0.6deg] rounded-[3px] px-4 pb-4 pt-5 text-sm text-[oklch(28%_0.03_60)]" style={{ background: "oklch(93% 0.09 95)", boxShadow: "0 1px 1px rgb(60 40 10 / .1), 0 12px 18px -14px rgb(60 40 10 / .5)" }}>
              <span className="absolute -top-2 left-1/2 h-4 w-14 -translate-x-1/2 rotate-[3deg] bg-[oklch(92%_0.03_90/0.85)] shadow-[0_1px_2px_rgb(0_0_0/.12)]" aria-hidden />
              <p className={`${handFont.className} text-[1.25rem] leading-tight`}>Reset email sent!</p>
              <p className="mt-1 leading-relaxed">Please check your inbox (and spam folder) for a link to reset your password. The link expires in 1 hour.</p>
            </div>
            <Button variant="outline" className="h-12 w-full rounded-full text-[15px] font-semibold" asChild>
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

            <Button type="submit" className="h-12 w-full rounded-full text-[15px] font-semibold transition-transform hover:-translate-y-px" disabled={isLoading}>
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
              <Link href="/login" className={`${handFont.className} inline-flex items-center text-[1.1rem] text-[var(--hs-trust)] underline decoration-wavy decoration-1 underline-offset-4 hover:text-[var(--color-brick)]`}>
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