"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { DataCard } from "@/components/admin/dashboard/DataCard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/toast"
import { formatDate } from "@/lib/utils"
import { passwordUpdateSchema, passwordStrength, type PasswordUpdateInput } from "@/lib/profile-schemas"

interface PasswordFormProps {
  passwordChangedAt: string | null
  hasPassword: boolean
  onChanged: () => void
}

export function PasswordForm({ passwordChangedAt, hasPassword, onChanged }: PasswordFormProps) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [show, setShow] = useState({ c: false, n: false, k: false })
  const form = useForm<PasswordUpdateInput>({ resolver: zodResolver(passwordUpdateSchema), mode: "onChange" })
  const { register, watch, formState, reset, handleSubmit } = form
  const errors = formState.errors
  const valid = formState.isValid
  const newPw = watch("newPassword") ?? ""
  const confirmPw = watch("confirmPassword") ?? ""
  const strength = passwordStrength(newPw)
  const match = newPw.length > 0 && confirmPw.length > 0 ? newPw === confirmPw : null

  async function onSubmit(data: PasswordUpdateInput) {
    setBusy(true)
    try {
      const res = await fetch("/api/users/me/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: data.currentPassword, newPassword: data.newPassword }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast(json.error || "Failed to change password", "destructive")
        return
      }
      toast("Password updated. Other sessions signed out.", "success")
      reset()
      setOpen(false)
      onChanged()
    } catch {
      toast("Failed to change password", "destructive")
    } finally {
      setBusy(false)
    }
  }

  return (
    <DataCard
      title="Password"
      subtitle={passwordChangedAt ? `Last changed ${formatDate(new Date(passwordChangedAt), "dd MMM yyyy")}` : "Protect your account"}
      action={
        hasPassword ? (
          <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
            {open ? "Close" : "Change password"}
          </Button>
        ) : undefined
      }
    >
      {!hasPassword ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">
          Your account uses Google sign-in and has no password set.
        </p>
      ) : !open ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Use a strong, unique password. Changing it signs out all other sessions.</p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pw-current">Current password</Label>
            <div className="relative">
              <Input id="pw-current" type={show.c ? "text" : "password"} autoComplete="current-password" {...register("currentPassword")} aria-invalid={!!errors.currentPassword} className="pr-10" />
              <button type="button" onClick={() => setShow((s) => ({ ...s, c: !s.c }))} aria-label={show.c ? "Hide current password" : "Show current password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600">
                {show.c ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.currentPassword ? <p role="alert" aria-live="polite" className="text-xs font-medium text-red-600 dark:text-red-400">{errors.currentPassword.message}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pw-new">New password</Label>
            <div className="relative">
              <Input id="pw-new" type={show.n ? "text" : "password"} autoComplete="new-password" {...register("newPassword")} aria-invalid={!!errors.newPassword} className="pr-10" />
              <button type="button" onClick={() => setShow((s) => ({ ...s, n: !s.n }))} aria-label={show.n ? "Hide new password" : "Show new password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600">
                {show.n ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {newPw ? (
              <div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10" role="progressbar" aria-valuenow={strength.score} aria-valuemin={0} aria-valuemax={4} aria-label={`Password strength ${strength.label}`}>
                  <div className="h-full rounded-full bg-teal-700 transition-all dark:bg-teal-500" style={{ width: `${(strength.score / 4) * 100}%` }} />
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{strength.label}</p>
              </div>
            ) : null}
            {errors.newPassword ? <p role="alert" aria-live="polite" className="text-xs font-medium text-red-600 dark:text-red-400">{errors.newPassword.message}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pw-confirm">Confirm new password</Label>
            <div className="relative">
              <Input id="pw-confirm" type={show.k ? "text" : "password"} autoComplete="new-password" {...register("confirmPassword")} aria-invalid={!!errors.confirmPassword} className="pr-10" />
              <button type="button" onClick={() => setShow((s) => ({ ...s, k: !s.k }))} aria-label={show.k ? "Hide confirmation" : "Show confirmation"} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600">
                {show.k ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {match !== null ? (
              <p className={match ? "text-xs text-teal-700 dark:text-teal-300" : "text-xs text-red-600 dark:text-red-400"} role="status">
                {match ? "Passwords match" : "Passwords do not match"}
              </p>
            ) : null}
            {errors.confirmPassword ? <p role="alert" aria-live="polite" className="text-xs font-medium text-red-600 dark:text-red-400">{errors.confirmPassword.message}</p> : null}
          </div>
          <Button type="submit" disabled={busy || !valid}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Update password
          </Button>
        </form>
      )}
    </DataCard>
  )
}
