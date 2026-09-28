"use client"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api, fetcher } from "@/lib/api"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { privateJobSchema, type PrivateJobInput } from "@/lib/validations"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form"
import { Pagination } from "@/components/ui/pagination"
import { toast } from "@/components/ui/toast"
import { formatDate, slugify } from "@/lib/utils"
import { isAdmin } from "@/lib/roles"
import { Search, ArrowLeft, ArrowRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { AdminPageHeader } from "@/components/admin/AdminPageHeader"
import { RowActions } from "@/components/admin/RowActions"
import { ConfirmDeleteDialog } from "@/components/admin/ConfirmDeleteDialog"
import { BulkActionBar } from "@/components/admin/BulkActionBar"
import { WizardSteps } from "@/components/admin/WizardSteps"
import { FormSection } from "@/components/admin/FormSection"
import { SmartContentField } from "@/components/admin/SmartContentField"
import { exportToCsv, flattenForCsv } from "@/lib/admin-export"

interface Company { id: string; name: string }
interface PrivateJobItem {
  id: string; title: string; slug: string; type: string; status: string; category: string | null; description: string | null; location: string | null; salary: string | null; experience: string | null; applicationUrl: string | null; applicationEmail: string | null; company: Company; lastDate: string | null; createdAt: string
}
interface PaginationInfo { total: number; page: number; limit: number; totalPages: number }

const WIZARD_STEPS = ["Basic info", "Details & content", "Apply & dates", "Review"]

export default function AdminPrivateJobs() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [wizardStep, setWizardStep] = useState(0)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [newCompanyMode, setNewCompanyMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const { data: jobsData, isLoading } = useQuery<{ success: boolean; data: PrivateJobItem[]; pagination: PaginationInfo }>({
    queryKey: ["admin-private-jobs", page, search, typeFilter],
    queryFn: () => fetcher(`/api/private-jobs?page=${page}&limit=10&search=${search}&type=${typeFilter}&scope=mine`),
  })

  const { data: companiesData } = useQuery<{ success: boolean; data: Company[] }>({
    queryKey: ["admin-companies"],
    queryFn: () => fetcher("/api/companies"),
  })

  const form = useForm<PrivateJobInput>({
    resolver: zodResolver(privateJobSchema) as any,
    defaultValues: {
      title: "", slug: "", companyId: "", companyName: "", type: "FULL_TIME",
      category: null, description: null, location: null, salary: null,
      experience: null, applicationUrl: null, applicationEmail: null,
      lastDate: null, status: "ACTIVE",
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: PrivateJobInput) => api.post("/api/private-jobs", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-private-jobs"] })
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] })
      setDialogOpen(false)
      form.reset()
      toast("Private job created", "success")
    },
    onError: (err: Error) => toast(err.message, "destructive"),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: PrivateJobInput }) => api.put(`/api/private-jobs/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-private-jobs"] })
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] })
      setDialogOpen(false)
      setEditingId(null)
      form.reset()
      toast("Private job updated", "success")
    },
    onError: (err: Error) => toast(err.message, "destructive"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/private-jobs/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-private-jobs"] }); setDeleteId(null); toast("Private job deleted", "success") },
    onError: (err: Error) => toast(err.message, "destructive"),
  })

  if (status === "loading") return <Skeleton className="h-96" />
  if (!session || !isAdmin(session.user.role)) { router.push("/login"); return null }

  const jobs = jobsData?.data || []
  const pagination = jobsData?.pagination
  const companies = companiesData?.data || []

  const onSubmit = (data: PrivateJobInput) => {
    if (newCompanyMode) {
      const name = (data.companyName || "").trim()
      if (!name) { toast("Enter a company name", "destructive"); return }
      const payload = { ...data, companyId: undefined, companyName: name }
      if (editingId) updateMutation.mutate({ id: editingId, data: payload })
      else createMutation.mutate(payload)
    } else {
      const payload = { ...data, companyName: undefined }
      if (editingId) updateMutation.mutate({ id: editingId, data: payload })
      else createMutation.mutate(payload)
    }
  }

  const openEdit = (job: PrivateJobItem) => {
    setEditingId(job.id)
    setNewCompanyMode(false)
    setWizardStep(0)
    form.reset({
      title: job.title, slug: job.slug, companyId: job.company.id, companyName: "",
      type: job.type as any, category: job.category, description: job.description,
      location: job.location, salary: job.salary, experience: job.experience,
      applicationUrl: job.applicationUrl, applicationEmail: job.applicationEmail,
      lastDate: job.lastDate ? new Date(job.lastDate) : null,
      status: job.status as "ACTIVE" | "EXPIRED",
    })
    setDialogOpen(true)
  }

  const openCreate = () => {
    setEditingId(null)
    setNewCompanyMode(false)
    setWizardStep(0)
    form.reset({ title: "", slug: "", companyId: "", companyName: "", type: "FULL_TIME", category: null, description: null, location: null, salary: null, experience: null, applicationUrl: null, applicationEmail: null, lastDate: null, status: "ACTIVE" })
    setDialogOpen(true)
  }

  const toggleStatus = async (job: PrivateJobItem) => {
    const next = job.status === "ACTIVE" ? "EXPIRED" : "ACTIVE"
    setTogglingId(job.id)
    try {
      const payload = {
        title: job.title, slug: job.slug, companyId: job.company.id, companyName: undefined,
        type: job.type, category: job.category, description: job.description,
        location: job.location, salary: job.salary, experience: job.experience,
        applicationUrl: job.applicationUrl, applicationEmail: job.applicationEmail,
        lastDate: job.lastDate ? new Date(job.lastDate) : null, status: next,
      }
      await api.put(`/api/private-jobs/${job.id}`, payload)
      queryClient.invalidateQueries({ queryKey: ["admin-private-jobs"] })
      toast(`Private job marked ${next}`, "success")
    } catch (e) {
      toast(e instanceof Error ? e.message : "Status update failed", "destructive")
    } finally {
      setTogglingId(null)
    }
  }

  const copyLink = async (job: PrivateJobItem) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/private-jobs/${job.slug}`)
      setCopiedId(job.id)
      toast("Public link copied", "success")
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast("Copy failed", "destructive")
    }
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const toggleSelectAll = () => {
    setSelected((prev) => (prev.size === jobs.length && jobs.length > 0 ? new Set() : new Set(jobs.map((j) => j.id))))
  }
  const handleBulkDelete = async () => {
    if (selected.size === 0) return
    setBulkDeleting(true)
    try {
      for (const id of selected) await api.delete(`/api/private-jobs/${id}`)
      setSelected(new Set())
      queryClient.invalidateQueries({ queryKey: ["admin-private-jobs"] })
      toast("Selected private jobs deleted", "success")
    } catch (e) {
      toast(e instanceof Error ? e.message : "Bulk delete failed", "destructive")
    } finally {
      setBulkDeleting(false)
    }
  }
  const handleExport = () => {
    const rows = jobs.filter((j) => selected.size === 0 || selected.has(j.id)).map((j) => flattenForCsv(j as unknown as Record<string, unknown>))
    exportToCsv(rows, "private-jobs-export")
    toast("CSV exported", "success")
  }

  const nextStep = async () => {
    const stepFields: Record<number, (keyof PrivateJobInput)[]> = {
      0: ["title", "slug", "companyId", "type", "status"],
      1: ["description", "category", "location", "salary", "experience"],
      2: ["applicationUrl", "applicationEmail", "lastDate"],
    }
    const fields = stepFields[wizardStep]
    if (fields) {
      const ok = await form.trigger(fields as any)
      if (!ok && wizardStep === 0 && newCompanyMode) {
        const nameOk = await form.trigger("companyName" as any)
        if (!nameOk) return
      } else if (!ok) return
    }
    setWizardStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1))
  }

  const watched = form.watch()

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Private Jobs"
        subtitle="Private-sector listings - rich description supports plain text or styled HTML with live preview."
        total={pagination?.total}
        totalLabel="private jobs"
        actionLabel="Add Private Job"
        onAction={openCreate}
      />

      <Card className="overflow-hidden rounded-2xl border-gray-200 shadow-sm dark:border-gray-800">
        <CardHeader className="space-y-3 border-b border-gray-100 bg-white pb-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search private jobs..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="bg-gray-50 pl-9 dark:bg-gray-800" />
            </div>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="All Types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">All Types</SelectItem>
                <SelectItem value="FULL_TIME">Full-Time</SelectItem>
                <SelectItem value="PART_TIME">Part-Time</SelectItem>
                <SelectItem value="INTERNSHIP">Internship</SelectItem>
                <SelectItem value="CONTRACT">Contract</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <BulkActionBar selectedCount={selected.size} onClear={() => setSelected(new Set())} onDelete={handleBulkDelete} onExport={handleExport} deleting={bulkDeleting} />
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? <div className="p-4"><Skeleton className="h-64" /></div> : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/80 hover:bg-gray-50/80 dark:bg-gray-800/40">
                      <TableHead className="w-10"><Checkbox checked={jobs.length > 0 && selected.size === jobs.length} onCheckedChange={toggleSelectAll} aria-label="Select all" /></TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide">Title</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide">Company</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide">Type</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide">Status</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide">Last Date</TableHead>
                      <TableHead className="text-right text-xs font-semibold uppercase tracking-wide">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="popLayout">
                      {jobs.map((job: PrivateJobItem) => (
                        <motion.tr key={job.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="border-b border-gray-100 transition-colors last:border-0 hover:bg-teal-50/40 dark:border-gray-800 dark:hover:bg-gray-800/50">
                          <TableCell><Checkbox checked={selected.has(job.id)} onCheckedChange={() => toggleSelect(job.id)} aria-label={`Select ${job.title}`} /></TableCell>
                          <TableCell className="max-w-[250px] truncate font-medium">{job.title}</TableCell>
                          <TableCell className="whitespace-nowrap">{job.company.name}</TableCell>
                          <TableCell><Badge variant="outline">{job.type.replace("_", " ")}</Badge></TableCell>
                          <TableCell><Badge variant={job.status === "ACTIVE" ? "default" : "secondary"}>{job.status}</Badge></TableCell>
                          <TableCell className="whitespace-nowrap">{job.lastDate ? formatDate(job.lastDate) : "N/A"}</TableCell>
                          <TableCell className="text-right">
                            <RowActions
                              onEdit={() => openEdit(job)}
                              viewHref={`/private-jobs/${job.slug}`}
                              onCopy={() => copyLink(job)}
                              copied={copiedId === job.id}
                              toggleLabel={job.status === "ACTIVE" ? "Mark expired" : "Mark active"}
                              onToggleStatus={() => toggleStatus(job)}
                              toggling={togglingId === job.id}
                              onDelete={() => setDeleteId(job.id)}
                            />
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                    {jobs.length === 0 && <TableRow><TableCell colSpan={7} className="py-10 text-center text-gray-500">No private jobs found</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
              {pagination && (
                <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 p-4 sm:flex-row dark:border-gray-800">
                  <p className="text-sm text-gray-500">Total: {pagination.total} private jobs</p>
                  <Pagination currentPage={page} totalPages={pagination.totalPages} onPageChange={setPage} />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Private Job" : "Add New Private Job"}</DialogTitle>
            <DialogDescription>Same fields and company logic - stepped for clarity. Description supports Visual / HTML / Preview.</DialogDescription>
          </DialogHeader>
          <div className="mb-1"><WizardSteps steps={WIZARD_STEPS} current={wizardStep} onGo={setWizardStep} /></div>
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
                                {companies.map((c: Company) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
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
                      <FormItem><FormLabel>Salary</FormLabel><FormControl><Input {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value || null)} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="experience" render={({ field }) => (
                      <FormItem><FormLabel>Experience</FormLabel><FormControl><Input {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value || null)} /></FormControl><FormMessage /></FormItem>
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
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <div className="flex items-center gap-2">
                  {wizardStep > 0 && <Button type="button" variant="outline" onClick={() => setWizardStep((s) => s - 1)}><ArrowLeft className="mr-1 h-4 w-4" /> Back</Button>}
                  {wizardStep < WIZARD_STEPS.length - 1
                    ? <Button type="button" onClick={nextStep}>Next <ArrowRight className="ml-1 h-4 w-4" /></Button>
                    : <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>{editingId ? "Update" : "Create"} Private Job</Button>}
                </div>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!deleteId}
        title="Delete Private Job"
        itemLabel={jobs.find((j) => j.id === deleteId)?.title}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        pending={deleteMutation.isPending}
      />
    </div>
  )
}
