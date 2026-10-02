"use client"
import { useMemo, useState } from "react"
import { GraduationCap, ListChecks, FileText, Mail, Copy, Check } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><GraduationCap className="h-4 w-4 text-teal-600" /> Interview prep - top questions</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {kit.questions.map((q, i) => (
            <div key={i} className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 dark:border-gray-700 dark:bg-gray-800/60">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{i + 1}. {q.q}</p>
              <p className="mt-1 text-xs text-gray-500">{q.hint}</p>
            </div>
          ))}
          <div className="flex flex-wrap gap-1.5">
            {(p.skills || []).slice(0, 8).map((s) => <Badge key={s} variant="secondary" className="text-[11px]">{s}</Badge>)}
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><ListChecks className="h-4 w-4 text-teal-600" /> Apply checklist</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-sm text-gray-700 dark:text-gray-200">
              {kit.checklist.map((c) => <li key={c} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />{c}</li>)}
            </ul>
            <p className="mt-3 border-t pt-2 text-xs font-semibold text-gray-500">Carry:</p>
            <ul className="mt-1 space-y-1 text-xs text-gray-500">{kit.docs.map((d) => <li key={d}>• {d}</li>)}</ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Mail className="h-4 w-4 text-teal-600" /> One-click email apply</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-gray-500">Subject: <span className="font-semibold text-gray-800 dark:text-gray-100">{email.subject}</span></p>
            <pre className="max-h-36 overflow-auto whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">{email.body}</pre>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={copyEmail}>{copied ? <Check className="mr-1 h-3.5 w-3.5" /> : <Copy className="mr-1 h-3.5 w-3.5" />} {copied ? "Copied" : "Copy template"}</Button>
              {p.applicationEmail && <Button size="sm" asChild><a href={`mailto:${p.applicationEmail}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`}><FileText className="mr-1 h-3.5 w-3.5" /> Open in mail</a></Button>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
