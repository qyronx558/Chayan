"use client"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { jobReferralSchema, type JobReferralInput } from "@/lib/validations"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "@/components/ui/toast"

export default function ReferJobPage() {
  const [done, setDone] = useState(false)
  const form = useForm<JobReferralInput>({ resolver: zodResolver(jobReferralSchema) as never, defaultValues: { title: "", companyName: "", url: "", proofUrl: "", location: "", note: "" } })

  const onSubmit = async (data: JobReferralInput) => {
    try {
      const res = await fetch("/api/private-jobs/refer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
      const json = await res.json()
      if (json.success) { setDone(true); toast("Referred! Our team will verify and publish.", "success"); form.reset() }
      else toast(json.error || "Failed", "destructive")
    } catch { toast("Failed", "destructive") }
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold">Refer a private job</h1>
      <p className="mb-6 text-gray-600">Found a genuine opening? Share the official apply link. We verify, score trust and publish - you get credit.</p>
      <Card><CardHeader><CardTitle>Job referral</CardTitle></CardHeader><CardContent>
        {done && <p className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">Thanks! Your referral is under review.</p>}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => <FormItem><FormLabel>Job title</FormLabel><FormControl><Input placeholder="e.g. Frontend Developer" {...field} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="companyName" render={({ field }) => <FormItem><FormLabel>Company</FormLabel><FormControl><Input placeholder="e.g. Acme Pvt Ltd" {...field} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="url" render={({ field }) => <FormItem><FormLabel>Official apply URL *</FormLabel><FormControl><Input placeholder="https://company.com/careers/..." {...field} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="proofUrl" render={({ field }) => <FormItem><FormLabel>Proof / source URL (optional)</FormLabel><FormControl><Input placeholder="https://... announcement" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="location" render={({ field }) => <FormItem><FormLabel>Location (optional)</FormLabel><FormControl><Input placeholder="Bangalore / Remote" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="note" render={({ field }) => <FormItem><FormLabel>Note (optional)</FormLabel><FormControl><Textarea placeholder="Why is this genuine? e.g. listed on company careers page" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>} />
            <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Submitting..." : "Submit referral"}</Button>
          </form>
        </Form>
      </CardContent></Card>
    </div>
  )
}
