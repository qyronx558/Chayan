"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Mail, Loader2, Shield, Bell, Bookmark, Clock, Briefcase, Building2, User, ShieldCheck, ArrowLeft } from "lucide-react"
import { loginSchema, type LoginInput } from "@/lib/validations"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { handFont, typeFont } from "@/components/home/fonts"
import { AuthLayout, GoogleButton, Divider, InputWithIcon, PasswordInput } from "@/components/auth/AuthComponents"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [twoFactorStep, setTwoFactorStep] = useState(false)
  const [totpCode, setTotpCode] = useState("")
  const [savedCredentials, setSavedCredentials] = useState<{ email: string; password: string } | null>(null)

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
      // Check if this account has 2FA enabled before attempting sign-in
      const checkRes = await fetch("/api/auth/two-factor-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, password: data.password }),
      })
      const checkJson = await checkRes.json().catch(() => ({ requires2FA: false }))
      if (checkRes.status === 429) {
        toast("Too many attempts. Please wait a few minutes and try again.", "destructive")
        return
      }

      if ((checkJson as { requires2FA?: boolean }).requires2FA) {
        setSavedCredentials({ email: data.email, password: data.password })
        setTwoFactorStep(true)
        setTotpCode("")
        return
      }

      // No 2FA — sign in directly
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        totpCode: "",
        redirect: false,
      })

      if (result?.error) {
        toast(
          result.code === "rate_limited"
            ? "Too many attempts. Please wait a few minutes and try again."
            : "Invalid email or password. Please try again.",
          "destructive"
        )
        return
      }

      router.push(mode === "employer" && !searchParams.get("callbackUrl") ? "/employer/jobs" : callbackUrl)
      router.refresh()
    } catch {
      toast("An error occurred. Please try again.", "destructive")
    } finally {
      setIsLoading(false)
    }
  }

  async function onSubmitTotp() {
    if (!savedCredentials || !/^\d{6}$/.test(totpCode)) return
    setIsLoading(true)
    try {
      const result = await signIn("credentials", {
        email: savedCredentials.email,
        password: savedCredentials.password,
        totpCode,
        redirect: false,
      })

      if (result?.error) {
        toast(
          result.code === "rate_limited"
            ? "Too many attempts. Please wait a few minutes and try again."
            : "Invalid authenticator code. Please try again.",
          "destructive"
        )
        setTotpCode("")
        return
      }

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
      variant="login"
      pass={mode}
    >
      <div className="space-y-6">
        {twoFactorStep ? (
          <>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 rotate-[-6deg] items-center justify-center rounded-full border-[2.5px] border-[var(--color-brick)] text-[var(--color-brick)]">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h1 className="font-display text-[1.9rem] font-black leading-tight text-foreground">Two-factor authentication</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter the 6-digit code from your authenticator app to continue signing in.
              </p>
              <p className={`${handFont.className} mt-1 text-[1.05rem] text-[var(--color-brick)]`}>one more lock, just for you.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="totp-login" className={`${typeFont.className} mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-foreground/75`}>
                  Authenticator code
                </label>
                <input
                  id="totp-login"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={(e) => { if (e.key === "Enter" && totpCode.length === 6) onSubmitTotp() }}
                  placeholder="000000"
                  className={`${typeFont.className} w-full rounded-[12px] border-[1.5px] border-dashed border-[var(--hs-border-strong)] bg-[var(--hs-surface)] px-4 py-4 text-center text-[1.9rem] font-bold tracking-[0.5em] text-foreground placeholder:text-muted-foreground/30 focus:border-solid focus:border-foreground/70 focus:outline-none focus:ring-4 focus:ring-[color-mix(in_oklch,var(--color-brick)_14%,transparent)]`}
                />
              </div>

              <Button
                type="button"
                className="h-12 w-full rounded-full text-[15px] font-semibold"
                disabled={isLoading || totpCode.length !== 6}
                onClick={onSubmitTotp}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & sign in"
                )}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setTwoFactorStep(false)
                  setSavedCredentials(null)
                  setTotpCode("")
                }}
                className={`${handFont.className} flex w-full items-center justify-center gap-1.5 text-[1.08rem] text-muted-foreground transition-colors hover:text-[var(--color-brick)]`}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to sign in
              </button>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Open your authenticator app (Google Authenticator, Authy, etc.) to find the code. If you&apos;ve lost access, use a backup code.
            </p>
          </>
        ) : (
          <>
            <div className="text-center">
              <h1 className="font-display text-[2.1rem] font-black leading-none text-foreground">Sign In</h1>
              <p className="mt-2 text-[14.5px] text-muted-foreground">Continue to your dashboard</p>
            </div>

            <div className="grid grid-cols-2 gap-1 rounded-full border-[1.5px] border-[var(--hs-border-strong)] bg-[var(--hs-surface)] p-1" role="group" aria-label="Account type">
              <button
                type="button"
                onClick={() => setMode("seeker")}
                aria-pressed={mode === "seeker"}
                className={`flex items-center justify-center gap-1.5 rounded-full px-3 py-2.5 text-sm font-semibold transition-all duration-300 ${mode === "seeker" ? "bg-[var(--color-brick)] text-[oklch(98%_0.01_90)] shadow-[0_4px_10px_-4px_rgb(0_0_0/.4)]" : "text-muted-foreground hover:text-foreground"}`}
              >
                <User className="h-4 w-4" /> Jobseeker
              </button>
              <button
                type="button"
                onClick={() => setMode("employer")}
                aria-pressed={mode === "employer"}
                className={`flex items-center justify-center gap-1.5 rounded-full px-3 py-2.5 text-sm font-semibold transition-all duration-300 ${mode === "employer" ? "bg-[oklch(45%_0.13_255)] text-[oklch(98%_0.01_90)] shadow-[0_4px_10px_-4px_rgb(0_0_0/.4)]" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Building2 className="h-4 w-4" /> Employer
              </button>
            </div>

            {mode === "employer" && (
              <div className="relative rotate-[-0.6deg] rounded-[3px] px-4 pb-4 pt-5 text-sm text-[oklch(28%_0.03_60)]" style={{ background: "oklch(92% 0.05 240)", boxShadow: "0 1px 1px rgb(20 30 60 / .1), 0 12px 18px -14px rgb(20 30 60 / .5)" }}>
                <span className="absolute -top-2 left-8 h-4 w-14 rotate-[-4deg] bg-[oklch(92%_0.03_90/0.85)] shadow-[0_1px_2px_rgb(0_0_0/.12)]" aria-hidden />
                <p className="flex items-center gap-1.5 font-bold text-[oklch(38%_0.13_255)]"><Briefcase className="h-4 w-4" /> Company login - 2 steps</p>
                <ol className="mt-1.5 list-decimal space-y-1 pl-5 text-[13px] leading-snug">
                  <li>Sign in below with your normal account (same as jobseekers).</li>
                  <li>Continue to prove your work inbox with a 6-digit OTP code, then Studio unlocks. Typing a domain alone never verifies.</li>
                </ol>
              </div>
            )}

            {shownError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[10px] border-[1.5px] border-dashed border-[var(--color-brick)] px-4 py-3 text-sm font-medium text-[var(--color-brick)]"
                style={{ background: "color-mix(in oklch, var(--color-brick) 7%, transparent)" }}
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
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 cursor-pointer rounded-[4px] accent-[var(--color-brick)]"
                  />
                  <span className="text-sm text-muted-foreground">Remember me</span>
                </label>
                <Link href="/forgot-password" className={`${handFont.className} text-[1.05rem] text-[var(--hs-trust)] underline decoration-wavy decoration-1 underline-offset-4 hover:text-[var(--color-brick)]`}>
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" className="h-auto min-h-12 w-full whitespace-normal rounded-full py-3 text-[15px] font-semibold transition-transform hover:-translate-y-px" disabled={isLoading}>
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
              <p className="text-center text-xs text-muted-foreground">
                New company not listed? You can create it manually with domain right after login in Studio Step 1.
              </p>
            )}

            <p className="border-t border-dashed border-[var(--hs-border-strong)] pt-5 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/register" className={`${handFont.className} text-[1.15rem] text-[var(--color-brick)] underline decoration-wavy decoration-1 underline-offset-4`}>
                Create one
              </Link>
            </p>
          </>
        )}
      </div>
    </AuthLayout>
  )
}