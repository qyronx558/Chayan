"use client"

import { useCallback, useState } from "react"
import { Check, Copy, Download, Loader2, ShieldCheck, ShieldOff } from "lucide-react"
import { DataCard } from "@/components/admin/dashboard/DataCard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/components/ui/toast"

interface TwoFactorCardProps {
  enabled: boolean
  admin: boolean
  onChanged: (next: boolean) => void
}

type SetupStep = "idle" | "qr" | "backup" | "disable"

export function TwoFactorCard({ enabled, admin, onChanged }: TwoFactorCardProps) {
  const [step, setStep] = useState<SetupStep>("idle")
  const [busy, setBusy] = useState(false)
  const [otpauthUrl, setOtpauthUrl] = useState("")
  const [secret, setSecret] = useState("")
  const [verifyCode, setVerifyCode] = useState("")
  const [disableCode, setDisableCode] = useState("")
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [secretCopied, setSecretCopied] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  const generateQrImage = useCallback(async (url: string) => {
    try {
      const QRCode = await import("qrcode")
      const toDataURL = QRCode.toDataURL ?? QRCode.default?.toDataURL
      if (!toDataURL) throw new Error("QR library not available")
      const dataUrl = await toDataURL(url, {
        width: 200,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      })
      setQrDataUrl(dataUrl)
    } catch {
      toast("Could not generate QR code", "destructive")
    }
  }, [])

  async function startSetup() {
    setBusy(true)
    try {
      const res = await fetch("/api/users/me/two-factor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setup" }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast(json.error || "Could not start 2FA setup", "destructive")
        return
      }
      const data = json.data as { otpauthUrl: string; secret: string }
      setOtpauthUrl(data.otpauthUrl)
      setSecret(data.secret)
      setVerifyCode("")
      setQrDataUrl(null)
      setStep("qr")
      generateQrImage(data.otpauthUrl)
    } catch {
      toast("Could not start 2FA setup", "destructive")
    } finally {
      setBusy(false)
    }
  }

  async function verifyAndEnable() {
    if (!/^\d{6}$/.test(verifyCode)) {
      toast("Enter the 6-digit code from your authenticator app", "destructive")
      return
    }
    setBusy(true)
    try {
      const res = await fetch("/api/users/me/two-factor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", token: verifyCode }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast(json.error || "Verification failed", "destructive")
        return
      }
      const data = json.data as { backupCodes?: string[] }
      const codes = data.backupCodes ?? []
      setBackupCodes(codes)
      if (codes.length > 0) setStep("backup")
      else closeSetup()
      onChanged(true)
      toast("Two-factor authentication enabled", "success")
    } catch {
      toast("Verification failed", "destructive")
    } finally {
      setBusy(false)
    }
  }

  async function confirmDisable() {
    if (!/^\d{6}$/.test(disableCode)) {
      toast("Enter the 6-digit code from your authenticator app", "destructive")
      return
    }
    setBusy(true)
    try {
      const res = await fetch("/api/users/me/two-factor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disable", token: disableCode }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast(json.error || "Could not disable 2FA", "destructive")
        return
      }
      onChanged(false)
      setStep("idle")
      setDisableCode("")
      toast("Two-factor authentication disabled", "success")
    } catch {
      toast("Could not disable 2FA", "destructive")
    } finally {
      setBusy(false)
    }
  }

  function copySecret() {
    navigator.clipboard.writeText(secret).then(
      () => {
        setSecretCopied(true)
        setTimeout(() => setSecretCopied(false), 2000)
      },
      () => toast("Copy failed", "destructive")
    )
  }

  function downloadBackupCodes() {
    const text = [
      "Two-Factor Authentication Backup Codes",
      "========================================",
      "",
      "Store these codes in a safe place.",
      "Each code can only be used once.",
      "",
      ...backupCodes.map((c, i) => `${i + 1}. ${c}`),
      "",
      `Generated: ${new Date().toISOString()}`,
    ].join("\n")
    const blob = new Blob([text], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "2fa-backup-codes.txt"
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    toast("Backup codes downloaded", "success")
  }

  function closeSetup() {
    setStep("idle")
    setOtpauthUrl("")
    setSecret("")
    setVerifyCode("")
    setBackupCodes([])
    setQrDataUrl(null)
  }

  return (
    <>
      <DataCard
        title="Two-factor authentication"
        subtitle="Authenticator app (TOTP)"
        action={<ShieldCheck className="h-4 w-4 text-brick dark:text-brick" aria-hidden="true" />}
      >
        {admin && !enabled ? (
          <div className="mb-3 flex flex-col gap-2 rounded-lg border border-brick/20 bg-brick/5 p-3 sm:flex-row sm:items-center dark:border-brick/30 dark:bg-brick/10">
            <p className="flex-1 text-sm font-medium text-brick dark:text-brick">Two-factor authentication is required for admin accounts</p>
            <Button size="sm" disabled={busy} onClick={startSetup}>
              {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              Set up now
            </Button>
          </div>
        ) : null}

        {enabled ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg border border-rule bg-paper-2/50 p-3 dark:bg-background/5">
              <ShieldCheck className="h-5 w-5 shrink-0 text-brick" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground dark:text-paper">Enabled</p>
                <p className="text-xs text-muted-foreground">Your account is protected with an authenticator app.</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-brick hover:text-brick"
              disabled={admin}
              onClick={() => { setDisableCode(""); setStep("disable") }}
            >
              <ShieldOff className="mr-1.5 h-3.5 w-3.5" />
              {admin ? "Cannot disable (required for admins)" : "Disable 2FA"}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              Add an extra layer of security by using an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator.
            </p>
            <Button size="sm" disabled={busy} onClick={startSetup}>
              {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />}
              Set up authenticator
            </Button>
          </div>
        )}
      </DataCard>

      {/* QR Code Setup Dialog */}
      <Dialog open={step === "qr"} onOpenChange={(open) => { if (!open) closeSetup() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set up authenticator app</DialogTitle>
            <DialogDescription>
              Scan the QR code below with your authenticator app (Google Authenticator, Authy, Microsoft Authenticator, etc.)
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-2">
            <div className="flex items-center justify-center rounded-xl border border-rule bg-white p-3">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Scan this QR code with your authenticator app" width={200} height={200} />
              ) : (
                <div className="flex h-[200px] w-[200px] items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="w-full space-y-2">
              <p className="text-center text-xs text-muted-foreground">
                Can't scan? Enter this key manually:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-lg border border-rule bg-paper-2 px-3 py-2 text-center font-mono text-xs tracking-widest text-foreground dark:bg-background/5 dark:text-paper">
                  {secret}
                </code>
                <Button variant="outline" size="sm" onClick={copySecret} className="shrink-0">
                  {secretCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>

            <div className="w-full space-y-2">
              <Label htmlFor="totp-verify">Enter the 6-digit code from your app</Label>
              <div className="flex gap-2">
                <Input
                  id="totp-verify"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  placeholder="000000"
                  maxLength={6}
                  className="text-center font-mono text-lg tracking-[0.3em]"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter" && verifyCode.length === 6) verifyAndEnable() }}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={closeSetup} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={verifyAndEnable} disabled={busy || verifyCode.length !== 6}>
              {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              Verify & enable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Backup Codes Dialog */}
      <Dialog open={step === "backup"} onOpenChange={(open) => { if (!open) closeSetup() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save your backup codes</DialogTitle>
            <DialogDescription>
              Store these backup codes in a safe place. If you lose access to your authenticator app, you can use these codes to sign in. Each code can only be used once.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-rule bg-paper-2 p-4 dark:bg-background/5">
              {backupCodes.map((code) => (
                <code key={code} className="text-center font-mono text-sm font-medium tracking-wider text-foreground dark:text-paper">
                  {code}
                </code>
              ))}
            </div>

            <Button variant="outline" className="w-full" onClick={downloadBackupCodes}>
              <Download className="mr-2 h-4 w-4" />
              Download backup codes
            </Button>

            <p className="rounded-lg border border-brick/20 bg-brick/5 p-3 text-xs font-medium text-brick dark:border-brick/30 dark:bg-brick/10 dark:text-brick">
              These codes will not be shown again. Download or copy them now.
            </p>
          </div>

          <DialogFooter>
            <Button onClick={closeSetup}>
              Done, I've saved my codes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable 2FA Dialog */}
      <Dialog open={step === "disable"} onOpenChange={(open) => { if (!open) { setStep("idle"); setDisableCode("") } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Disable two-factor authentication</DialogTitle>
            <DialogDescription>
              Enter the 6-digit code from your authenticator app to confirm disabling 2FA. This will make your account less secure.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label htmlFor="totp-disable">Authenticator code</Label>
            <Input
              id="totp-disable"
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              placeholder="000000"
              maxLength={6}
              className="text-center font-mono text-lg tracking-[0.3em]"
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter" && disableCode.length === 6) confirmDisable() }}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { setStep("idle"); setDisableCode("") }} disabled={busy}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDisable} disabled={busy || disableCode.length !== 6}>
              {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              Disable 2FA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
