"use client"

import { useState } from "react"
import type { UseFormReturn } from "react-hook-form"
import { Loader2, BadgeCheck } from "lucide-react"
import { DataCard } from "@/components/admin/dashboard/DataCard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/toast"
import { PROFILE_LANGUAGES } from "@/lib/profile"
import type { ProfileUpdateInput } from "@/lib/profile-schemas"

interface PersonalInfoFormProps {
  form: UseFormReturn<ProfileUpdateInput>
  email: string
  emailVerified: boolean
  phoneVerified: boolean
  onRequestEmailVerify: () => Promise<void>
  onSendPhoneCode: () => Promise<{ sent: boolean; devCode: string | null }>
  onConfirmPhoneCode: (code: string) => Promise<boolean>
  onChangeEmail: (next: string) => Promise<void>
}

export function PersonalInfoForm({
  form,
  email,
  emailVerified,
  phoneVerified,
  onRequestEmailVerify,
  onSendPhoneCode,
  onConfirmPhoneCode,
  onChangeEmail,
}: PersonalInfoFormProps) {
  const { register, setValue, watch, formState } = form
  const [emailBusy, setEmailBusy] = useState(false)
  const [emailMode, setEmailMode] = useState(false)
  const [emailNext, setEmailNext] = useState("")
  const [emailNextBusy, setEmailNextBusy] = useState(false)
  const [codeOpen, setCodeOpen] = useState(false)
  const [code, setCode] = useState("")
  const [codeBusy, setCodeBusy] = useState(false)
  const [smsBusy, setSmsBusy] = useState(false)
  const [devCode, setDevCode] = useState<string | null>(null)
  const language = watch("language")
  const errors = formState.errors

  async function handleVerifyEmail() {
    setEmailBusy(true)
    try {
      await onRequestEmailVerify()
    } finally {
      setEmailBusy(false)
    }
  }

  async function handleSendCode() {
    setSmsBusy(true)
    try {
      const result = await onSendPhoneCode()
      if (!result.sent) return
      setDevCode(result.devCode)
      setCodeOpen(true)
    } finally {
      setSmsBusy(false)
    }
  }

  async function handleConfirmCode() {
    if (!/^\d{6}$/.test(code)) {
      toast("Enter the 6-digit code", "destructive")
      return
    }
    setCodeBusy(true)
    try {
      const ok = await onConfirmPhoneCode(code)
      if (ok) {
        setCodeOpen(false)
        setCode("")
        setDevCode(null)
      }
    } finally {
      setCodeBusy(false)
    }
  }

  async function handleChangeEmail() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNext.trim())) {
      toast("Enter a valid email address", "destructive")
      return
    }
    setEmailNextBusy(true)
    try {
      await onChangeEmail(emailNext.trim())
      setEmailMode(false)
      setEmailNext("")
    } finally {
      setEmailNextBusy(false)
    }
  }

  return (
    <DataCard title="About you" subtitle="How we reach you when something you care about changes. Only you see this." className="rounded-[4px] border-[var(--hs-border)] bg-[var(--hs-paper-slip)] shadow-[0_1px_2px_rgb(60_40_10/.08),0_16px_28px_-22px_rgb(60_40_10/.55)]">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="profile-name">Full name</Label>
          <Input id="profile-name" autoComplete="name" {...register("name")} aria-invalid={!!errors.name} aria-describedby={errors.name ? "profile-name-error" : undefined} />
          {errors.name ? (
            <p id="profile-name-error" role="alert" aria-live="polite" className="text-xs font-medium text-brick dark:text-brick">
              {errors.name.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="profile-language">Language</Label>
          <Select value={language} onValueChange={(v) => setValue("language", v as ProfileUpdateInput["language"], { shouldDirty: true, shouldValidate: true })}>
            <SelectTrigger id="profile-language">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {PROFILE_LANGUAGES.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5" id="profile-email">
          <Label htmlFor="profile-email-input">Email</Label>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Input id="profile-email-input" value={email} disabled className="flex-1" aria-label="Email address" />
              {emailVerified ? (
                <Badge variant="secondary" className="shrink-0 gap-1 border-rule bg-paper-3 text-brick dark:border-rule dark:bg-paper-3 dark:text-brick">
                  <BadgeCheck className="h-3 w-3" />
                  Verified
                </Badge>
              ) : (
                <Button type="button" size="sm" variant="outline" disabled={emailBusy} onClick={handleVerifyEmail}>
                  {emailBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Verify"}
                </Button>
              )}
            </div>
            {!emailMode ? (
              <button type="button" onClick={() => setEmailMode(true)} className="w-fit text-xs font-medium text-brick underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rule dark:text-brick">
                Change email
              </button>
            ) : (
              <div className="rounded-lg border border-rule p-3 ">
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">A confirmation link will be sent to the new address before it changes.</p>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <Input value={emailNext} onChange={(e) => setEmailNext(e.target.value)} placeholder="new@example.com" aria-label="New email address" inputMode="email" />
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => setEmailMode(false)}>
                      Cancel
                    </Button>
                    <Button type="button" size="sm" disabled={emailNextBusy} onClick={handleChangeEmail}>
                      {emailNextBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Send link"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="space-y-1.5" id="profile-phone">
          <Label htmlFor="profile-phone-input">Mobile number</Label>
          <div className="flex items-center gap-2">
            <Input id="profile-phone-input" inputMode="numeric" autoComplete="tel" placeholder="10-digit mobile number" {...register("phone")} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "profile-phone-error" : "profile-phone-hint"} className="flex-1" />
            {phoneVerified ? (
              <Badge variant="secondary" className="shrink-0 gap-1 border-rule bg-paper-3 text-brick dark:border-rule dark:bg-paper-3 dark:text-brick">
                <BadgeCheck className="h-3 w-3" />
                Verified
              </Badge>
            ) : (
              <Button type="button" size="sm" variant="outline" disabled={smsBusy} onClick={handleSendCode}>
                {smsBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Verify"}
              </Button>
            )}
          </div>
          {errors.phone ? (
            <p id="profile-phone-error" role="alert" aria-live="polite" className="text-xs font-medium text-brick dark:text-brick">
              {errors.phone.message}
            </p>
          ) : (
            <p id="profile-phone-hint" className="text-xs text-muted-foreground dark:text-muted-foreground">
              Changing the number resets verification.
            </p>
          )}
          {codeOpen && !phoneVerified ? (
            <div className="rounded-lg border border-rule p-3 ">
              <Label htmlFor="profile-phone-code">6-digit SMS code</Label>
              {devCode ? (
                <p className="mt-1 rounded-md bg-paper-3 px-2.5 py-1.5 text-xs font-medium text-brick dark:bg-paper-3 dark:text-brick" role="status">
                  No SMS service configured, so your code is shown here: <span className="font-mono text-sm font-bold ">{devCode}</span>
                </p>
              ) : null}
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <Input id="profile-phone-code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" placeholder="123456" maxLength={6} className="sm:max-w-44" />
                <Button type="button" size="sm" disabled={codeBusy || code.length !== 6} onClick={handleConfirmCode}>
                  {codeBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Confirm"}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </DataCard>
  )
}
