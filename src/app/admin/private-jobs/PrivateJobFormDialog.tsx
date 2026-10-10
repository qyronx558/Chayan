"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { privateJobSchema, type PrivateJobInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/components/ui/toast";
import { formatDate, slugify } from "@/lib/utils";
import { WizardSteps } from "@/components/admin/WizardSteps";
import { FormSection } from "@/components/admin/FormSection";
import { SmartContentField } from "@/components/admin/SmartContentField";
import type { FormDialogProps } from "@/components/admin/list/types";
import type { PrivateJobRow } from "./config";
import { ArrowLeft, ArrowRight } from "lucide-react";

const WIZARD_STEPS = ["Basic info", "Details & content", "Apply & dates", "Review"];

const EMPTY_FORM: PrivateJobInput = {
  title: "",
  slug: "",
  companyId: "",
  companyName: "",
  type: "FULL_TIME",
  category: null,
  description: null,
  location: null,
  salary: null,
  salaryMin: null,
  salaryMax: null,
  experience: null,
  expMin: null,
  expMax: null,
  qualification: null,
  skills: [],
  remotePolicy: null,
  vacancies: null,
  applicationUrl: null,
  applicationEmail: null,
  proofUrl: null,
  lastDate: null,
  status: "ACTIVE",
  isFresherFriendly: false,
  isWalkIn: false,
  walkInVenue: null,
  walkInDate: null,
};

function toFormValues(row: PrivateJobRow): PrivateJobInput {
  return {
    title: row.title,
    slug: row.slug,
    companyId: row.company.id,
    companyName: "",
    type: row.type as PrivateJobInput["type"],
    category: row.category,
    description: row.description,
    location: row.location,
    salary: row.salary,
    salaryMin: row.salaryMin,
    salaryMax: row.salaryMax,
    experience: row.experience,
    expMin: row.expMin,
    expMax: row.expMax,
    qualification: row.qualification,
    skills: row.skills ?? [],
    remotePolicy: (row.remotePolicy as PrivateJobInput["remotePolicy"]) ?? null,
    vacancies: row.vacancies,
    applicationUrl: row.applicationUrl,
    applicationEmail: row.applicationEmail,
    proofUrl: row.proofUrl,
    lastDate: row.lastDate ? new Date(row.lastDate) : null,
    status: row.status as "ACTIVE" | "EXPIRED",
    isFresherFriendly: row.isFresherFriendly ?? false,
    isWalkIn: row.isWalkIn ?? false,
    walkInVenue: row.walkInVenue,
    walkInDate: row.walkInDate ? new Date(row.walkInDate) : null,
  };
}

export function PrivateJobFormDialog({ row, open, onOpenChange, lookups, onSaved }: FormDialogProps<PrivateJobRow>) {
  const [wizardStep, setWizardStep] = useState(0);
  const [newCompanyMode, setNewCompanyMode] = useState(false);
  const companies = lookups.companies ?? [];

  const form = useForm<PrivateJobInput>({
    resolver: zodResolver(privateJobSchema) as never,
    defaultValues: EMPTY_FORM,
  });

  useEffect(() => {
    if (open) {
      setWizardStep(0);
      setNewCompanyMode(false);
      form.reset(row ? toFormValues(row) : { ...EMPTY_FORM });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, row?.id]);

  const createMutation = useMutation({
    mutationFn: (data: PrivateJobInput) => api.post("/api/private-jobs", data),
    onSuccess: () => {
      onOpenChange(false);
      onSaved();
      toast("Private job created", "success");
    },
    onError: (err: Error) => toast(err.message, "destructive"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: PrivateJobInput) =>
      api.put(`/api/private-jobs/${row?.id}`, data),
    onSuccess: () => {
      onOpenChange(false);
      onSaved();
      toast("Private job updated", "success");
    },
    onError: (err: Error) => toast(err.message, "destructive"),
  });

  const onSubmit = (data: PrivateJobInput) => {
    if (newCompanyMode) {
      const name = (data.companyName || "").trim();
      if (!name) {
        toast("Enter a company name", "destructive");
        return;
      }
      const payload = { ...data, companyId: undefined, companyName: name };
      if (row) updateMutation.mutate(payload);
      else createMutation.mutate(payload);
    } else {
      const payload = { ...data, companyName: undefined };
      if (row) updateMutation.mutate(payload);
      else createMutation.mutate(payload);
    }
  };

  const nextStep = async () => {
    const stepFields: Record<number, (keyof PrivateJobInput)[]> = {
      0: ["title", "slug", "companyId", "type", "status"],
      1: ["description", "category", "location", "salary", "experience"],
      2: ["applicationUrl", "applicationEmail", "lastDate"],
    };
    const fields = stepFields[wizardStep];
    if (fields) {
      const ok = await form.trigger(fields as never);
      if (!ok && wizardStep === 0 && newCompanyMode) {
        const nameOk = await form.trigger("companyName" as never);
        if (!nameOk) return;
      } else if (!ok) return;
    }
    setWizardStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1));
  };

  const watched = form.watch();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg">{row ? "Edit Private Job" : "Add New Private Job"}</DialogTitle>
          <DialogDescription>Same fields and company logic - stepped for clarity. Description supports Visual / HTML / Preview.</DialogDescription>
        </DialogHeader>
        <div className="mb-1">
          <WizardSteps steps={WIZARD_STEPS} current={wizardStep} onGo={setWizardStep} />
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {wizardStep === 0 && (
              <FormSection title="Basic information" description="Select an existing company or add a new one. Title auto-generates the slug.">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} onChange={(e) => { field.onChange(e); form.setValue("slug", slugify(e.target.value)) }} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="slug" render={({ field }) => (
                    <FormItem><FormLabel>Slug</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField control={form.control} name="companyId" render={({ field }) => (
                    <FormItem><FormLabel>Company</FormLabel>
                      {newCompanyMode ? (
                        <>
                          <FormField control={form.control} name="companyName" render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder="Enter new company name" {...field} value={field.value || ""} className="mb-2" />
                              </FormControl>
                              <FormMessage className="mb-2" />
                            </FormItem>
                          )} />
                          <Button type="button" variant="link" size="sm" className="h-auto px-0 text-xs" onClick={() => { setNewCompanyMode(false); form.setValue("companyId", ""); form.setValue("companyName", "") }}>
                            Back to select existing company
                          </Button>
                          {form.formState.errors.companyId?.message && (
                            <p className="mt-1 text-xs font-medium text-red-500">{form.formState.errors.companyId.message}</p>
                          )}
                        </>
                      ) : (
                        <>
                          <Select onValueChange={(v) => { if (v === "__new__") { setNewCompanyMode(true); field.onChange("") } else field.onChange(v) }} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                              <SelectItem value="__new__">+ Add New Company</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </>
                      )}
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem><FormLabel>Job Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="FULL_TIME">Full-Time</SelectItem>
                          <SelectItem value="PART_TIME">Part-Time</SelectItem>
                          <SelectItem value="INTERNSHIP">Internship</SelectItem>
                          <SelectItem value="CONTRACT">Contract</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem><FormLabel>Industry / Category</FormLabel><FormControl><Input {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value || null)} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem><FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="ACTIVE">Active</SelectItem><SelectItem value="EXPIRED">Expired</SelectItem></SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </FormSection>
            )}

            {wizardStep === 1 && (
              <div className="space-y-4">
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Description - plain text or styled HTML</FormLabel><FormControl><SmartContentField value={field.value} onChange={field.onChange} placeholder="Paste or type the job description. Switch to HTML/CSS for styled tables..." /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <FormField control={form.control} name="location" render={({ field }) => (
                    <FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value || null)} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="salary" render={({ field }) => (
                    <FormItem><FormLabel>Salary (text)</FormLabel><FormControl><Input {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value || null)} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="experience" render={({ field }) => (
                    <FormItem><FormLabel>Experience (text)</FormLabel><FormControl><Input {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value || null)} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <FormField control={form.control} name="salaryMin" render={({ field }) => (
                    <FormItem><FormLabel>Salary min (monthly ₹)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="salaryMax" render={({ field }) => (
                    <FormItem><FormLabel>Salary max (monthly ₹)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="vacancies" render={({ field }) => (
                    <FormItem><FormLabel>Openings</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <FormField control={form.control} name="expMin" render={({ field }) => (
                    <FormItem><FormLabel>Exp min (yrs)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="expMax" render={({ field }) => (
                    <FormItem><FormLabel>Exp max (yrs)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="remotePolicy" render={({ field }) => (
                    <FormItem><FormLabel>Work mode</FormLabel>
                      <Select onValueChange={(v) => field.onChange(v === "__none__" ? null : v)} value={field.value || "__none__"}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="__none__">Not specified</SelectItem><SelectItem value="ONSITE">On-site</SelectItem><SelectItem value="HYBRID">Hybrid</SelectItem><SelectItem value="REMOTE">Remote</SelectItem></SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField control={form.control} name="skills" render={({ field }) => (
                    <FormItem><FormLabel>Skills (comma separated)</FormLabel><FormControl><Input value={(field.value || []).join(", ")} onChange={(e) => field.onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} placeholder="React, Sales, Excel" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="qualification" render={({ field }) => (
                    <FormItem><FormLabel>Qualification</FormLabel><FormControl><Input {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value || null)} placeholder="Any Graduate / B.Tech" /></FormControl></FormItem>
                  )} />
                </div>
                <div className="flex flex-wrap gap-4">
                  <FormField control={form.control} name="isFresherFriendly" render={({ field }) => (
                    <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="!mt-0">Fresher friendly</FormLabel></FormItem>
                  )} />
                  <FormField control={form.control} name="isWalkIn" render={({ field }) => (
                    <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="!mt-0">Walk-in</FormLabel></FormItem>
                  )} />
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <FormSection title="Application & dates" description="How candidates apply and the deadline.">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField control={form.control} name="applicationUrl" render={({ field }) => (
                    <FormItem><FormLabel>Application URL</FormLabel><FormControl><Input {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value || null)} placeholder="https://..." /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="applicationEmail" render={({ field }) => (
                    <FormItem><FormLabel>Application Email</FormLabel><FormControl><Input {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value || null)} placeholder="hr@company.com" /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="lastDate" render={({ field }) => (
                  <FormItem><FormLabel>Last Date</FormLabel><FormControl><Input type="date" value={field.value ? formatDate(field.value, "yyyy-MM-dd") : ""} onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField control={form.control} name="proofUrl" render={({ field }) => (
                    <FormItem><FormLabel>Proof URL (official posting)</FormLabel><FormControl><Input {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value || null)} placeholder="https://company.com/careers/..." /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="walkInVenue" render={({ field }) => (
                    <FormItem><FormLabel>Walk-in venue</FormLabel><FormControl><Input {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value || null)} /></FormControl></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="walkInDate" render={({ field }) => (
                  <FormItem><FormLabel>Walk-in date</FormLabel><FormControl><Input type="date" value={field.value ? formatDate(field.value, "yyyy-MM-dd") : ""} onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)} /></FormControl></FormItem>
                )} />
              </FormSection>
            )}

            {wizardStep === 3 && (
              <FormSection title="Review & publish" description="Confirm before saving.">
                <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div><dt className="text-xs uppercase tracking-wide text-gray-400">Title</dt><dd className="font-medium">{watched.title || "-"}</dd></div>
                  <div><dt className="text-xs uppercase tracking-wide text-gray-400">Company</dt><dd>{newCompanyMode ? watched.companyName || "New company" : companies.find((c) => c.id === watched.companyId)?.name || "-"}</dd></div>
                  <div><dt className="text-xs uppercase tracking-wide text-gray-400">Type</dt><dd>{watched.type}</dd></div>
                  <div><dt className="text-xs uppercase tracking-wide text-gray-400">Last date</dt><dd>{watched.lastDate ? formatDate(watched.lastDate) : "-"}</dd></div>
                </dl>
              </FormSection>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <div className="flex items-center gap-2">
                {wizardStep > 0 && (
                  <Button type="button" variant="outline" onClick={() => setWizardStep((s) => s - 1)}>
                    <ArrowLeft className="mr-1 h-4 w-4" /> Back
                  </Button>
                )}
                {wizardStep < WIZARD_STEPS.length - 1 ? (
                  <Button type="button" onClick={nextStep}>
                    Next <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {row ? "Update" : "Create"} Private Job
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
