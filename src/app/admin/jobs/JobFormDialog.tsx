"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api, fetcher } from "@/lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { jobSchema, type JobInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { cn, formatDate, getStatusColor, slugify } from "@/lib/utils";
import { JOB_LEVEL_OPTIONS, jobLocationLabel, resolveJobLocation, type JobLevelValue } from "@/lib/locations";
import { WizardSteps } from "@/components/admin/WizardSteps";
import { FormSection } from "@/components/admin/FormSection";
import { SmartContentField } from "@/components/admin/SmartContentField";
import { SearchableRelationSelect } from "@/components/admin/SearchableRelationSelect";
import type { FormDialogProps } from "@/components/admin/list/types";
import type { JobRow } from "./config";
import { ArrowLeft, ArrowRight } from "lucide-react";

const WIZARD_STEPS = ["Basic info", "Details & content", "Links & dates", "Review"];

const EMPTY_FORM: JobInput = {
  title: "",
  slug: "",
  departmentId: "",
  categoryId: "",
  jobLevel: "CENTRAL",
  stateId: null,
  districtId: null,
  advertisementNo: null,
  totalVacancies: null,
  salary: null,
  location: null,
  ageLimit: null,
  ageRelaxation: null,
  education: null,
  selectionProcess: null,
  applicationFee: null,
  importantDates: null,
  documentsRequired: null,
  howToApply: null,
  officialNotification: null,
  officialWebsite: null,
  applyLink: null,
  status: "ACTIVE",
  experience: null,
  summary: null,
  startDate: null,
  lastDate: null,
};

function toFormValues(row: JobRow): JobInput {
  return {
    title: row.title,
    slug: row.slug,
    departmentId: row.department.id,
    categoryId: row.category.id,
    jobLevel: row.jobLevel ?? (row.state ? "STATE" : "CENTRAL"),
    stateId: row.state?.id || null,
    districtId: row.district?.id || null,
    advertisementNo: row.advertisementNo,
    totalVacancies: row.totalVacancies,
    salary: row.salary,
    location: row.location,
    ageLimit: row.ageLimit,
    ageRelaxation: row.ageRelaxation,
    education: row.education,
    selectionProcess: row.selectionProcess,
    applicationFee: row.applicationFee,
    importantDates: row.importantDates,
    documentsRequired: row.documentsRequired,
    howToApply: row.howToApply,
    officialNotification: row.officialNotification,
    officialWebsite: row.officialWebsite,
    applyLink: row.applyLink,
    status: row.status as "ACTIVE" | "EXPIRED" | "UPCOMING",
    experience: row.experience,
    summary: row.summary ?? null,
    startDate: row.startDate ? new Date(row.startDate) : null,
    lastDate: row.lastDate ? new Date(row.lastDate) : null,
  };
}

export function JobFormDialog({ row, open, onOpenChange, lookups, onSaved }: FormDialogProps<JobRow>) {
  const [wizardStep, setWizardStep] = useState(0);
  const departments = lookups.departments ?? [];
  const categories = lookups.categories ?? [];
  const states = lookups.states ?? [];

  const form = useForm<JobInput>({
    resolver: zodResolver(jobSchema) as never,
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
    mutationFn: (data: JobInput) => api.post("/api/jobs", data),
    onSuccess: () => {
      onOpenChange(false);
      onSaved();
      toast("Job created", "success");
    },
    onError: (err: Error) => toast(err.message, "destructive"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: JobInput) =>
      api.put(`/api/jobs/${row?.id}`, data),
    onSuccess: () => {
      onOpenChange(false);
      onSaved();
      toast("Job updated", "success");
    },
    onError: (err: Error) => toast(err.message, "destructive"),
  });

  const jobLevel = (form.watch("jobLevel") ?? "CENTRAL") as JobLevelValue;
  const selectedStateId = form.watch("stateId") ?? null;
  const selectedState = states.find((s) => s.id === selectedStateId) ?? null;
  const needsState = jobLevel === "STATE" || jobLevel === "DISTRICT";
  const needsDistrict = jobLevel === "DISTRICT";

  const districtsQuery = useQuery({
    queryKey: ["state-districts", selectedStateId],
    queryFn: () =>
      fetcher<{ success: boolean; data: { id: string; name: string; slug: string }[] }>(
        `/api/states/${encodeURIComponent(selectedStateId as string)}/districts`
      ),
    enabled: open && needsDistrict && !!selectedStateId,
    staleTime: 10 * 60 * 1000,
  });
  const districts = districtsQuery.data?.data ?? [];

  const setJobLevel = (level: JobLevelValue) => {
    form.setValue("jobLevel", level, { shouldDirty: true });
    if (level === "CENTRAL") form.setValue("stateId", null, { shouldDirty: true });
    if (level !== "DISTRICT") form.setValue("districtId", null, { shouldDirty: true });
    form.clearErrors(["stateId", "districtId"]);
  };

  const onSubmit = (data: JobInput) => {
    const stateId =
      typeof data.stateId === "string"
        ? data.stateId.trim() && data.stateId.trim() !== "__none"
          ? data.stateId.trim()
          : null
        : (data.stateId ?? null);
    // Send nulls for the fields the chosen level does not use.
    const loc = resolveJobLocation({ jobLevel: data.jobLevel ?? "CENTRAL", stateId, districtId: data.districtId ?? null });
    if (!loc.ok) {
      form.setError(loc.field, { message: loc.error });
      setWizardStep(0);
      return;
    }
    const clean = { ...data, ...loc.value };
    if (row) updateMutation.mutate(clean);
    else createMutation.mutate(clean);
  };

  const nextStep = async () => {
    const stepFields: Record<number, (keyof JobInput)[]> = {
      0: ["title", "slug", "departmentId", "categoryId", "status", "jobLevel", "stateId", "districtId"],
      1: ["education", "selectionProcess", "applicationFee", "documentsRequired", "howToApply"],
      2: ["officialNotification", "officialWebsite", "applyLink", "startDate", "lastDate"],
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
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg">{row ? "Edit Job" : "Add New Job"}</DialogTitle>
          <DialogDescription>Fields and validation are unchanged - only the layout is stepped. Long content supports plain text or HTML/CSS with live preview.</DialogDescription>
        </DialogHeader>
        <div className="mb-1">
          <WizardSteps steps={WIZARD_STEPS} current={wizardStep} onGo={setWizardStep} />
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {wizardStep === 0 && (
              <FormSection title="Basic information" description="Title auto-generates the slug. Department and category are required.">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} onChange={(e) => { field.onChange(e); form.setValue("slug", slugify(e.target.value)) }} placeholder="e.g. SSC CGL 2026 Notification" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="slug" render={({ field }) => (
                    <FormItem><FormLabel>Slug</FormLabel><FormControl><Input {...field} placeholder="ssc-cgl-2026" /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
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
                <div className="space-y-3 rounded-xl border border-rule p-3 dark:border-ink">
                  <FormField control={form.control} name="jobLevel" render={() => (
                    <FormItem>
                      <FormLabel>Who can apply?</FormLabel>
                      <div role="radiogroup" aria-label="Job level" className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {JOB_LEVEL_OPTIONS.map((opt) => (
                          <Button
                            key={opt.value}
                            type="button"
                            role="radio"
                            aria-checked={jobLevel === opt.value}
                            variant={jobLevel === opt.value ? "default" : "outline"}
                            onClick={() => setJobLevel(opt.value)}
                            className="h-auto flex-col items-start gap-0.5 whitespace-normal px-3 py-2 text-left"
                          >
                            <span className="text-sm font-semibold">{opt.label}</span>
                            <span className={cn("text-xs font-normal", jobLevel === opt.value ? "opacity-90" : "text-muted-foreground")}>
                              {opt.hint}
                            </span>
                          </Button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )} />
                  {needsState && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField control={form.control} name="stateId" render={({ field }) => (
                        <FormItem><FormLabel>State / UT</FormLabel>
                          <FormControl>
                            <SearchableRelationSelect
                              value={field.value}
                              onChange={(id) => {
                                if (id !== field.value) form.setValue("districtId", null, { shouldDirty: true });
                                field.onChange(id);
                              }}
                              options={states}
                              label="State"
                              endpoint="/api/states"
                              placeholder="Select state or UT"
                              searchPlaceholder="Search states..."
                              allowCreate={false}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      {needsDistrict && (
                        <FormField control={form.control} name="districtId" render={({ field }) => (
                          <FormItem><FormLabel>District</FormLabel>
                            <FormControl>
                              <SearchableRelationSelect
                                value={field.value}
                                onChange={field.onChange}
                                options={districts}
                                label="District"
                                endpoint=""
                                placeholder={districtsQuery.isLoading ? "Loading districts…" : "Select district"}
                                searchPlaceholder="Search districts..."
                                allowCreate={false}
                                disabled={!selectedStateId}
                                disabledHint="Select a state first"
                                loading={districtsQuery.isLoading}
                                contextLabel={selectedState?.name}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      )}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem><FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="ACTIVE">Active</SelectItem><SelectItem value="EXPIRED">Expired</SelectItem><SelectItem value="UPCOMING">Upcoming</SelectItem></SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="advertisementNo" render={({ field }) => (
                    <FormItem><FormLabel>Advertisement No</FormLabel><FormControl><Input {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value || null)} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="totalVacancies" render={({ field }) => (
                    <FormItem><FormLabel>Total Vacancies</FormLabel><FormControl><Input type="number" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField control={form.control} name="salary" render={({ field }) => (
                    <FormItem><FormLabel>Salary</FormLabel><FormControl><Input {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value || null)} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="location" render={({ field }) => (
                    <FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value || null)} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <FormField control={form.control} name="experience" render={({ field }) => (
                    <FormItem><FormLabel>Experience</FormLabel><FormControl><Input {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value || null)} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="ageLimit" render={({ field }) => (
                    <FormItem><FormLabel>Age Limit</FormLabel><FormControl><Input {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value || null)} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="ageRelaxation" render={({ field }) => (
                    <FormItem><FormLabel>Age Relaxation</FormLabel><FormControl><Input {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value || null)} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </FormSection>
            )}

            {wizardStep === 1 && (
              <div className="space-y-4">
                <FormField control={form.control} name="summary" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Overview (your own words, 3-5 sentences)</FormLabel>
                    <FormControl>
                      <Textarea rows={4} {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value || null)} placeholder="Who is hiring, which posts, key eligibility, last date and how to apply. Do not paste text from the notice." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="education" render={({ field }) => (
                  <FormItem><FormLabel>Education</FormLabel><FormControl><SmartContentField value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="selectionProcess" render={({ field }) => (
                  <FormItem><FormLabel>Selection Process</FormLabel><FormControl><SmartContentField value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="applicationFee" render={({ field }) => (
                  <FormItem><FormLabel>Application Fee</FormLabel><FormControl><SmartContentField value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="documentsRequired" render={({ field }) => (
                  <FormItem><FormLabel>Documents Required</FormLabel><FormControl><SmartContentField value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="howToApply" render={({ field }) => (
                  <FormItem><FormLabel>How to Apply</FormLabel><FormControl><SmartContentField value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            )}

            {wizardStep === 2 && (
              <FormSection title="Links & dates" description="Official URLs and application window. Dates use the same format as before.">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <FormField control={form.control} name="officialNotification" render={({ field }) => (
                    <FormItem><FormLabel>Notification URL</FormLabel><FormControl><Input {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value || null)} placeholder="https://..." /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="officialWebsite" render={({ field }) => (
                    <FormItem><FormLabel>Website URL</FormLabel><FormControl><Input {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value || null)} placeholder="https://..." /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="applyLink" render={({ field }) => (
                    <FormItem><FormLabel>Apply Link</FormLabel><FormControl><Input {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value || null)} placeholder="https://..." /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField control={form.control} name="startDate" render={({ field }) => (
                    <FormItem><FormLabel>Start Date</FormLabel><FormControl><Input type="date" value={field.value ? formatDate(field.value, "yyyy-MM-dd") : ""} onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="lastDate" render={({ field }) => (
                    <FormItem><FormLabel>Last Date</FormLabel><FormControl><Input type="date" value={field.value ? formatDate(field.value, "yyyy-MM-dd") : ""} onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </FormSection>
            )}

            {wizardStep === 3 && (
              <FormSection title="Review & publish" description="Confirm the summary below, then create or update. Nothing is changed until you submit.">
                <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div><dt className="text-xs text-muted-foreground">Title</dt><dd className="font-medium">{watched.title || "-"}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Slug</dt><dd className="font-mono text-xs">{watched.slug || "-"}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Status</dt><dd><Badge className={getStatusColor(watched.status || "ACTIVE")}>{watched.status}</Badge></dd></div>
                  <div><dt className="text-xs text-muted-foreground">Who can apply</dt><dd>{jobLocationLabel({
                    jobLevel,
                    state: selectedState,
                    district: districts.find((d) => d.id === watched.districtId) ?? row?.district ?? null,
                  })}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Vacancies</dt><dd>{watched.totalVacancies ?? "N/A"}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Last date</dt><dd>{watched.lastDate ? formatDate(watched.lastDate) : "-"}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Apply link</dt><dd className="truncate text-brick">{watched.applyLink || "-"}</dd></div>
                </dl>
              </FormSection>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-rule pt-4 dark:border-ink">
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
                    {row ? "Update" : "Create"} Job
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
