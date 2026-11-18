"use client"
import { useMemo, useState } from "react"
import { GraduationCap, ListChecks, FileText, Mail, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { handFont, typeFont } from "@/components/home/fonts"
import { buildPrepKit, buildEmailApplyTemplate } from "@/lib/private-jobs-trust"
import { toast } from "@/components/ui/toast"

interface Props {
 title: string
 company: string
 description?: string | null
 skills?: string[] | null
 category?: string | null
 experience?: string | null
 applicationEmail?: string | null
 applicantName?: string | null
}

export function PrepKit(p: Props) {
 const kit = useMemo(() => buildPrepKit({ title: p.title, description: p.description, skills: p.skills, category: p.category, experience: p.experience }), [p.title, p.description, p.skills, p.category, p.experience])
 const [copied, setCopied] = useState(false)
 const email = useMemo(() => buildEmailApplyTemplate({ jobTitle: p.title, company: p.company, applicantName: p.applicantName, skills: p.skills || [] }), [p.title, p.company, p.applicantName, p.skills])

 const copyEmail = async () => {
  const text = `Subject: ${email.subject}\n\n${email.body}`
  try {
   await navigator.clipboard.writeText(text)
   setCopied(true)
   toast("Email template copied", "success")
   setTimeout(() => setCopied(false), 2000)
  } catch { toast("Copy failed", "destructive") }
 }

 const head = (Icon: typeof GraduationCap, t: string) => (
  <p className={cn(typeFont.className, "flex items-center gap-2 text-[10.5px] font-bold tracking-[0.2em] text-muted-foreground")}><Icon className="h-3.5 w-3.5" /> {t}</p>
 )
 return (
  <div className="grid gap-6 lg:grid-cols-2">
   {/* questions: flash cards you would carry to the interview */}
   <div>
    {head(GraduationCap, "INTERVIEW PREP · TOP QUESTIONS")}
    <div className="mt-3 space-y-3">
     {kit.questions.map((q, i) => (
      <div key={i} className={cn("relative rounded-[3px] border border-[var(--hs-border)] bg-[var(--hs-surface)] py-3 pl-11 pr-4", i % 2 ? "rotate-[0.4deg]" : "-rotate-[0.4deg]")} style={{ backgroundImage: "repeating-linear-gradient(transparent 0 23px, color-mix(in oklch, oklch(60% 0.08 250) 18%, transparent) 23px 24px)" }}>
       <span className={cn(handFont.className, "absolute left-3 top-2.5 text-[1.2rem] text-[var(--color-brick)]")}>Q{i + 1}</span>
       <p className="text-sm font-semibold leading-snug text-foreground">{q.q}</p>
       <p className={cn(handFont.className, "mt-1 text-[1rem] leading-snug text-muted-foreground")}>{q.hint}</p>
      </div>
     ))}
    </div>
    {(p.skills || []).length > 0 ? (
     <div className="mt-4 flex flex-wrap gap-1.5">
      {(p.skills || []).slice(0, 8).map((s) => <span key={s} className={cn(typeFont.className, "rounded-full border border-dashed border-[var(--hs-border-strong)] px-2 py-0.5 text-[10.5px] font-bold uppercase text-foreground/80")}>{s}</span>)}
     </div>
    ) : null}
   </div>

   <div className="space-y-6">
    {/* checklist: a packing list */}
    <div className="relative rounded-[3px] px-5 pb-5 pt-6 text-[oklch(28%_0.03_60)]" style={{ background: "oklch(95% 0.05 95)", boxShadow: "0 1px 1px rgb(60 40 10 / .1), 0 14px 24px -18px rgb(60 40 10 / .5)" }}>
     <span className="absolute -top-2 left-1/2 h-5 w-16 -translate-x-1/2 rotate-[2deg] bg-[oklch(92%_0.03_90/0.8)] shadow-[0_1px_2px_rgb(0_0_0/.12)]" aria-hidden />
     <p className={cn(handFont.className, "flex items-center gap-2 text-[1.3rem] leading-none")}><ListChecks className="h-4 w-4" /> Before you apply</p>
     <ul className="mt-3 space-y-1.5 text-sm">
      {kit.checklist.map((c) => <li key={c} className="flex gap-2.5"><span className="mt-[3px] h-3.5 w-3.5 shrink-0 rounded-[2px] border-[1.5px] border-current opacity-60" aria-hidden />{c}</li>)}
     </ul>
     <p className={cn(handFont.className, "mt-4 border-t border-dashed border-current/30 pt-2 text-[1.1rem]")}>pack these:</p>
     <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">{kit.docs.map((d) => <li key={d}>• {d}</li>)}</ul>
    </div>

    {/* email: a letter you can copy */}
    <div>
     {head(Mail, "ONE-CLICK EMAIL APPLY")}
     <div className="mt-3 rounded-[3px] border border-[var(--hs-border)] bg-[oklch(98%_0.008_90)] p-4 text-[oklch(27%_0.03_60)]" style={{ boxShadow: "0 10px 20px -16px rgb(40 20 0 / .5)" }}>
      <p className={cn(typeFont.className, "border-b border-dashed border-[oklch(27%_0.03_60/0.3)] pb-2 text-[11.5px]")}><span className="opacity-60">Subject: </span><span className="font-bold">{email.subject}</span></p>
      <pre className={cn(typeFont.className, "mt-2 max-h-36 overflow-auto whitespace-pre-wrap text-[11.5px] leading-relaxed")}>{email.body}</pre>
     </div>
     <div className="mt-3 flex flex-wrap gap-2">
      <Button size="sm" variant="outline" className="rounded-full" onClick={copyEmail}>{copied ? <Check className="mr-1 h-3.5 w-3.5" /> : <Copy className="mr-1 h-3.5 w-3.5" />} {copied ? "Copied" : "Copy template"}</Button>
      {p.applicationEmail && <Button size="sm" className="rounded-full" asChild><a href={`mailto:${p.applicationEmail}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`}><FileText className="mr-1 h-3.5 w-3.5" /> Open in mail</a></Button>}
     </div>
    </div>
   </div>
  </div>
 )
}
