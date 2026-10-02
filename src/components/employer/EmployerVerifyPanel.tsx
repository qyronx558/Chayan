"use client"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/components/ui/toast"
import { ShieldCheck, MailCheck, Lock } from "lucide-react"

interface Props {
  companies: { id: string; name: string }[]
  onVerified: (companyId: string) => void
}

/**
 * Inbox-proof company verification (shared by Studio + claim page).
 * Privacy: only masked inbox (h*@acme.com) is ever displayed.
 * Security: code is 6-digit, bcrypt-hashed server-side, 10-min expiry,
 * single-use, 5-attempt lock, rate-limited sends. No login links in email.
 */
export function EmployerVerifyPanel({ companies, onVerified }: Props) {
  const [tab, setTab] = useState<"claim" | "create">("claim")
  const [claimCompanyId, setClaimCompanyId] = useState("")
  const [claimEmail, setClaimEmail] = useState("")
  const [newName, setNewName] = useState("")
  const [newDomain, setNewDomain] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [challengeId, setChallengeId] = useState("")
  const [maskedEmail, setMaskedEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)

  const sendCode = async () => {
    setSending(true)
    try {
      const payload =
        tab === "claim"
          ? { companyId: claimCompanyId, workEmail: claimEmail.trim() }
          : { name: newName.trim(), domain: newDomain.trim(), description: newDesc.trim() || null, workEmail: newEmail.trim() }
      if (tab === "claim" && (!claimCompanyId || !claimEmail.trim())) { toast("Select company + work email", "destructive"); return }
      if (tab === "create" && (!newName.trim() || !newDomain.trim() || !newEmail.trim())) { toast("Name + domain + work email required", "destructive"); return }
      const res = await fetch("/api/employer/verify/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      const json = await res.json()
      if (json.success && json.alreadyVerified) { toast("Already verified", "success"); return }
      if (json.success) {
        setChallengeId(json.data.challengeId)
        setMaskedEmail(json.data.maskedEmail)
        setOtp("")
        toast(json.message, "success")
      } else if (json.data?.companyId) {
        toast(`${json.error} - switch to "Claim existing" to verify it.`, "destructive")
      } else {
        toast(json.error || "Failed to send code", "destructive")
      }
    } catch { toast("Failed to send code", "destructive") } finally { setSending(false) }
  }

  const verifyCode = async () => {
    if (!/^\d{6}$/.test(otp.trim())) { toast("Enter the 6-digit code", "destructive"); return }
    setVerifying(true)
    try {
      const res = await fetch("/api/employer/verify/confirm", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, otp: otp.trim() }),
      })
      const json = await res.json()
      if (json.success) {
        toast(json.message, "success")
        setChallengeId("")
        setOtp("")
        onVerified(json.data.companyId)
      } else {
        toast(json.error || "Invalid or expired code", "destructive")
      }
    } catch { toast("Verification failed", "destructive") } finally { setVerifying(false) }
  }

  return (
    <div>
      <div className="mb-3 flex gap-2">
        <Button size="sm" variant={tab === "claim" ? "default" : "outline"} onClick={() => { setTab("claim"); setChallengeId(""); setOtp("") }}>Claim existing</Button>
        <Button size="sm" variant={tab === "create" ? "default" : "outline"} onClick={() => { setTab("create"); setChallengeId(""); setOtp("") }}>Create new manually</Button>
      </div>

      {!challengeId ? (
        <div className="grid gap-3">
          {tab === "claim" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <select className="rounded-md border p-2 text-sm" value={claimCompanyId} onChange={(e) => setClaimCompanyId(e.target.value)}>
                <option value="">Select company…</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <Input placeholder="you@company.com (must open this inbox)" value={claimEmail} onChange={(e) => setClaimEmail(e.target.value)} inputMode="email" />
            </div>
          ) : (
            <div className="grid gap-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <Input placeholder="Company name - e.g. Acme Pvt Ltd" value={newName} onChange={(e) => setNewName(e.target.value)} />
                <Input placeholder="Company domain - acme.com" value={newDomain} onChange={(e) => setNewDomain(e.target.value)} />
                <Input placeholder="Work email - you@acme.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} inputMode="email" />
              </div>
              <Input placeholder="Short description (optional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
              <p className="text-xs text-gray-500">Not in the dropdown? Type the official name + domain. Free inboxes (Gmail/Yahoo) are rejected - only the company&apos;s own domain counts.</p>
            </div>
          )}
          <div><Button onClick={sendCode} disabled={sending}>{sending ? "Sending secure code…" : "Send 6-digit verification code"}</Button></div>
          <p className="flex items-start gap-1.5 text-xs text-gray-500"><Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />Typing a domain never verifies you - only entering the code sent to that inbox does. Codes are hashed, expire in 10 minutes and lock after 5 wrong tries.</p>
        </div>
      ) : (
        <Card className="border-teal-200 bg-teal-50/50"><CardContent className="space-y-3 p-4">
          <p className="flex items-center gap-1.5 text-sm font-bold"><MailCheck className="h-4 w-4 text-teal-600" /> Code sent to {maskedEmail}</p>
          <div className="flex max-w-sm gap-2">
            <Input placeholder="6-digit code" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" maxLength={6} className="text-center text-lg font-bold tracking-[0.3em]" />
            <Button onClick={verifyCode} disabled={verifying}>{verifying ? "Verifying…" : "Verify"}</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="ghost" onClick={sendCode} disabled={sending}>{sending ? "Resending…" : "Resend code"}</Button>
            <Button size="sm" variant="ghost" onClick={() => { setChallengeId(""); setOtp("") }}>Change inbox</Button>
          </div>
          <p className="flex items-start gap-1.5 text-xs text-gray-500"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />Anti-phishing: the mail comes only from <strong>Chayan Verify &lt;noreply@chayanjobs.com&gt;</strong> with a code and no login links. Never share the code; enter it only on chayanjobs.com. Full inbox addresses are never shown publicly - only {maskedEmail}.</p>
        </CardContent></Card>
      )}
    </div>
  )
}
