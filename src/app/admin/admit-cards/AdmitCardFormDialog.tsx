"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { admitCardSchema, type AdmitCardInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { SearchableRelationSelect } from "@/components/admin/SearchableRelationSelect";
import type { FormDialogProps } from "@/components/admin/list/types";
import type { AdmitCardRow } from "./config";
import { ArrowLeft, ArrowRight } from "lucide-react";

const WIZARD_STEPS = ["Basic info", "Content & links", "Review"];

const EMPTY_FORM: AdmitCardInput = {
  title: "",
  slug: "",
  description: null,
  departmentId: "",
  categoryId: "",
  jobId: null,
  examDate: null,
  downloadUrl: null,
  status: null,
};

function toFormValues(row: AdmitCardRow): AdmitCardInput {
  return {
    title: row.title,
    slug: row.slug,
    description: row.description,
    departmentId: row.department.id,
    categoryId: row.category.id,
    jobId: typeof row.jobId === "string" ? row.jobId.trim() || null : (row.jobId ?? null),
    examDate: row.examDate ? new Date(row.examDate) : null,
    downloadUrl: row.downloadUrl,
    status: typeof row.status === "string" ? row.status.trim() || null : (row.status ?? null),
  };
}

export function AdmitCardFormDialog({ row, open, onOpenChange, lookups, onSaved }: FormDialogProps<AdmitCardRow>) {
  const [wizardStep, setWizardStep] = useState(0);
  const departments = lookups.departments ?? [];
  const categories = lookups.categories ?? [];

  const form = useForm<AdmitCardInput>({
    resolver: zodResolver(admitCardSchema) as never,
    defaultValues: EMPTY_FORM,
  });

  useEffect(() => {
    if (open) {
      setWizardStep(0);
      form.reset(row ? toFormValues(row) : { ...EMPTY_FORM });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, row?.id]);

  const createMutation = useMutation({
    mutationFn: (data: AdmitCardInput) => api.post("/api/admit-cards", data),
    onSuccess: () => {
      onOpenChange(false);
      onSaved();
      toast("Admit card created", "success");
    },
    onError: (err: Error) => toast(err.message, "destructive"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: AdmitCardInput) => api.put(`/api/admit-cards/${row?.id}`, data),
    onSuccess: () => {
      onOpenChange(false);
      onSaved();
      toast("Admit card updated", "success");
    },
    onError: (err: Error) => toast(err.message, "destructive"),
  });

  const onSubmit = (data: AdmitCardInput) => {
    const clean = {
      ...data,
      jobId: typeof data.jobId === "string" ? (data.jobId.trim() || null) : (data.jobId ?? null),
      status: typeof data.status === "string" ? (data.status.trim() && data.status !== "__draft" ? data.status : null) : (data.status ?? null),
    };
    if (row) updateMutation.mutate(clean);
    else createMutation.mutate(clean);
  };

  const nextStep = async () => {
    const stepFields: Record<number, (keyof AdmitCardInput)[]> = {
      0: ["title", "slug", "departmentId", "categoryId"],
      1: ["description", "downloadUrl", "examDate", "status"],
    };
    const fields = stepFields[wizardStep];
    if (fields) {
      const ok = await form.trigger(fields as never);
      if (!ok) return;
    }
    setWizardStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1));
  };

  const watched = form.watch();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>{row ? "Edit Admit Card" : "Add Admit Card"}</DialogTitle>
          <DialogDescription>Same fields, stepped layout. Description supports Visual / HTML / Preview.</DialogDescription>
        </DialogHeader>
        <div className="mb-1"><WizardSteps steps={WIZARD_STEPS} current={wizardStep} onGo={setWizardStep} /></div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {wizardStep === 0 && (
              <FormSection title="Basic information" description="Title auto-generates the slug.">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} onChange={(e) => { field.onChange(e); form.setValue("slug", slugify(e.target.value)) }} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="slug" render={({ field }) => (
                  <FormItem><FormLabel>Slug</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField control={form.control} name="departmentId" render={({ field }) => (
                    <FormItem><FormLabel>Department</FormLabel>
                      <FormControl>
                        <SearchableRelationSelect
                          value={field.value}
                          onChange={(id) => field.onChange(id ?? "")}
                          options={departments}
                          label="Department"
                          endpoint="/api/departments"
                          placeholder="Select department"
                          searchPlaceholder="Search departments..."
                          invalidateKeys={[["admin-departments"]]}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="categoryId" render={({ field }) => (
                    <FormItem><FormLabel>Category</FormLabel>
                      <FormControl>
                        <SearchableRelationSelect
                          value={field.value}
                          onChange={(id) => field.onChange(id ?? "")}
                          options={categories}
                          label="Category"
                          endpoint="/api/categories"
                          placeholder="Select category"
                          searchPlaceholder="Search categories..."
                          invalidateKeys={[["admin-categories"]]}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </FormSection>
            )}
            {wizardStep === 1 && (
              <div className="space-y-4">
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Description - plain text or styled HTML</FormLabel><FormControl><SmartContentField value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField control={form.control} name="downloadUrl" render={({ field }) => (
                    <FormItem><FormLabel>Download URL</FormLabel><FormControl><Input {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value || null)} placeholder="https://..." /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="examDate" render={({ field }) => (
                    <FormItem><FormLabel>Exam Date</FormLabel><FormControl><Input type="date" value={field.value ? formatDate(field.value, "yyyy-MM-dd") : ""} onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>Status</FormLabel>
                    <Select onValueChange={(v) => field.onChange(v === "__draft" ? null : v)} value={field.value ?? "__draft"}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                      <SelectContent><SelectItem value="__draft">Draft</SelectItem><SelectItem value="PUBLISHED">Published</SelectItem></SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            )}
            {wizardStep === 2 && (
              <FormSection title="Review & publish" description="Confirm before saving.">
                <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div><dt className="text-xs text-muted-foreground">Title</dt><dd className="font-medium">{watched.title || "-"}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Status</dt><dd><Badge variant={watched.status === "PUBLISHED" ? "default" : "secondary"}>{watched.status || "Draft"}</Badge></dd></div>
                  <div><dt className="text-xs text-muted-foreground">Exam date</dt><dd>{watched.examDate ? formatDate(watched.examDate) : "-"}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Download</dt><dd className="truncate text-brick">{watched.downloadUrl || "-"}</dd></div>
                </dl>
              </FormSection>
            )}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-rule pt-4 dark:border-ink">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <div className="flex items-center gap-2">
                {wizardStep > 0 && <Button type="button" variant="outline" onClick={() => setWizardStep((s) => s - 1)}><ArrowLeft className="mr-1 h-4 w-4" /> Back</Button>}
                {wizardStep < WIZARD_STEPS.length - 1
                  ? <Button type="button" onClick={nextStep}>Next <ArrowRight className="ml-1 h-4 w-4" /></Button>
                  : <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>{row ? "Update" : "Create"}</Button>}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
