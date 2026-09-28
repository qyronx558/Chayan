"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Loader2, Mail, User, Shield, Bell, Bookmark, Clock, CheckCircle2 } from "lucide-react"
import { registerSchema, type RegisterInput } from "@/lib/validations"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/toast"
import { AuthLayout, GoogleButton, Divider, InputWithIcon, PasswordInput, StrengthMeter } from "@/components/auth/AuthComponents"

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  const password = watch("password", "")
  const confirmPassword = watch("confirmPassword", "")

  async function onSubmit(data: RegisterInput) {
    if (!acceptedTerms) {
      toast("Please accept the terms and conditions", "destructive")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          confirmPassword: data.confirmPassword,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        toast(err.error || "Registration failed", "destructive")
        return
      }

      toast("Account created successfully! Please sign in.", "success")
      router.push("/login")
    } catch {
      toast("An error occurred. Please try again.", "destructive")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true)
    await signIn("google", { callbackUrl: "/" })
  }

  const benefits = [
    { icon: <Bell className="h-5 w-5" />, title: "Personalized Alerts", description: "Get job notifications tailored to your qualifications, location, and preferences - govt & private." },
    { icon: <Bookmark className="h-5 w-5" />, title: "Application Tracker", description: "Track every application status, deadlines, and documents in one place." },
    { icon: <Shield className="h-5 w-5" />, title: "Verified Sources Only", description: "Curated opportunities from official government portals & reputable private employers." },
    { icon: <CheckCircle2 className="h-5 w-5" />, title: "Exam Calendar & Syllabus", description: "Access exam dates, admit cards, results, and syllabi for all major exams." },
  ]

  return (
    <AuthLayout
      sideTitle="Your Career Gateway"
      sideDescription="Create your free account and join thousands discovering opportunities across government & private sectors."
      benefits={benefits}
    >
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Account</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Takes less than a minute</p>
        </div>

        <GoogleButton onClick={handleGoogleSignIn} disabled={isGoogleLoading} loading={isGoogleLoading} />

        <Divider />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <InputWithIcon
            icon={<User className="h-5 w-5" />}
            label="Full Name"
            type="text"
            placeholder="John Doe"
            {...register("name")}
            error={errors.name?.message}
            autoComplete="name"
            autoFocus
          />

          <InputWithIcon
            icon={<Mail className="h-5 w-5" />}
            label="Email Address"
            type="email"
            placeholder="name@example.com"
            {...register("email")}
            error={errors.email?.message}
            autoComplete="email"
          />

          <PasswordInput
            label="Password"
            value={password}
            onChange={register("password").onChange}
            onBlur={register("password").onBlur}
            ref={register("password").ref}
            name="password"
            onToggle={() => setShowPassword(!showPassword)}
            show={showPassword}
            error={errors.password?.message}
            placeholder="Create a strong password"
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
            placeholder="Confirm your password"
            id="confirmPassword"
            autoComplete="new-password"
          />

          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
              className="mt-0.5"
            />
            <Label htmlFor="terms" className="text-sm font-normal text-gray-600 dark:text-gray-400">
              I accept the{" "}
              <Link href="/terms" className="text-teal-600 hover:text-teal-700 font-medium underline underline-offset-2">
                Terms and Conditions
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-teal-600 hover:text-teal-700 font-medium underline underline-offset-2">
                Privacy Policy
              </Link>
            </Label>
          </div>

          <Button type="submit" className="w-full py-3.5" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-teal-600 hover:text-teal-700 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}