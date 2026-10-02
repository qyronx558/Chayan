"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Mail, Loader2, Shield, Bell, Bookmark, Clock, Briefcase, Building2, User } from "lucide-react"
import { loginSchema, type LoginInput } from "@/lib/validations"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { AuthLayout, GoogleButton, Divider, InputWithIcon, PasswordInput } from "@/components/auth/AuthComponents"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const initialMode = searchParams.get("mode") === "employer" ? "employer" : "seeker"
  const callbackUrl = searchParams.get("callbackUrl") || "/"
  const [mode, setMode] = useState<"seeker" | "employer">(initialMode)
  const authError = searchParams.get("error")
  const errorMessage: Record<string, string> = {
    OAuthAccountNotLinked: "This email is already registered with a password. Sign in with your email and password instead.",
    OAuthSignin: "Something went wrong while signing in with Google. Please try again.",
    OAuthCallback: "Google sign-in failed. Please check the authorization and try again.",
    OAuthCreateAccount: "Could not create your account with Google. Please try again.",
    AccessDenied: "Access was denied. Please allow required permissions.",
    Configuration: "Sign-in is temporarily unavailable. Please try again later.",
    Verification: "The sign-in link is invalid or expired.",
    Default: "Sign-in failed. Please try again.",
  }
  const shownError = authError ? errorMessage[authError] || errorMessage.Default : null

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const passwordValue = watch("password", "")

  async function onSubmit(data: LoginInput) {
    setIsLoading(true)
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        toast("Invalid email or password. Please try again.", "destructive")
        return
      }

      // Employer flow: same normal login first, then continue to company verification.
      router.push(mode === "employer" && !searchParams.get("callbackUrl") ? "/employer/jobs" : callbackUrl)
      router.refresh()
    } catch {
      toast("An error occurred. Please try again.", "destructive")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true)
    await signIn("google", { callbackUrl: mode === "employer" && !searchParams.get("callbackUrl") ? "/employer/jobs" : callbackUrl })
  }

  const benefits = [
    { icon: <Bell className="h-5 w-5" />, title: "Instant Job Alerts", description: "Get real-time notifications for new job postings matching your profile - govt & private." },
    { icon: <Bookmark className="h-5 w-5" />, title: "Save & Track", description: "Bookmark jobs, track applications, and manage deadlines in one dashboard." },
    { icon: <Shield className="h-5 w-5" />, title: "Verified Listings", description: "Curated opportunities from trusted government & reputable private employers." },
    { icon: <Clock className="h-5 w-5" />, title: "Exam Calendar", description: "Never miss an exam date with our integrated calendar and reminders." },
  ]

  return (
    <AuthLayout
      sideTitle="Your Career Gateway"
      sideDescription="Sign in to access personalized job alerts, track applications, and discover opportunities across government & private sectors."
      benefits={benefits}
    >
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sign In</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Continue to your dashboard</p>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
          <button
            type="button"
            onClick={() => setMode("seeker")}
            className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${mode === "seeker" ? "bg-white text-gray-900 shadow dark:bg-gray-900 dark:text-white" : "text-gray-500 hover:text-gray-700"}`}
          >
            <User className="h-4 w-4" /> Jobseeker
          </button>
          <button
            type="button"
            onClick={() => setMode("employer")}
            className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${mode === "employer" ? "bg-white text-gray-900 shadow dark:bg-gray-900 dark:text-white" : "text-gray-500 hover:text-gray-700"}`}
          >
            <Building2 className="h-4 w-4" /> Employer
          </button>
        </div>

        {mode === "employer" && (
          <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-800 dark:border-teal-800 dark:bg-teal-950/30 dark:text-teal-200">
            <p className="flex items-center gap-1.5 font-bold"><Briefcase className="h-4 w-4" /> Company login - 2 steps</p>
            <ol className="mt-1.5 list-decimal space-y-0.5 pl-5 text-[13px]">
              <li>Sign in below with your normal account (same as jobseekers).</li>
              <li>Continue to prove your work inbox with a 6-digit OTP code, then Studio unlocks. Typing a domain alone never verifies.</li>
            </ol>
          </div>
        )}

        {shownError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300"
            role="alert"
          >
            {shownError}
          </motion.div>
        )}

        <GoogleButton onClick={handleGoogleSignIn} disabled={isGoogleLoading} loading={isGoogleLoading} />

        <Divider />

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

          <PasswordInput
            label="Password"
            value={passwordValue}
            onChange={register("password").onChange}
            onBlur={register("password").onBlur}
            ref={register("password").ref}
            name="password"
            onToggle={() => setShowPassword(!showPassword)}
            show={showPassword}
            error={errors.password?.message}
            placeholder="Enter your password"
            id="password"
            autoComplete="current-password"
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">Remember me</span>
            </label>
            <Link href="/forgot-password" className="text-sm font-medium text-teal-600 hover:text-teal-700">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="w-full py-3.5" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Signing in...
              </>
            ) : mode === "employer" ? (
              "Sign In & Continue to Company Verification"
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        {mode === "employer" && (
          <p className="text-center text-xs text-gray-500">
            New company not listed? You can create it manually with domain right after login in Studio Step 1.
          </p>
        )}

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-teal-600 hover:text-teal-700 transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}