"use client"
import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api, fetcher } from "@/lib/api"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { admissionSchema, type AdmissionInput } from "@/lib/validations"
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
import { isAdmin, isSuperAdmin } from "@/lib/roles"
import { Search, ArrowLeft, ArrowRight } from "lucide-react"
import { AdminPageHeader } from "@/components/admin/AdminPageHeader"
import { RowActions } from "@/components/admin/RowActions"
import { ConfirmDeleteDialog } from "@/components/admin/ConfirmDeleteDialog"
import { BulkActionBar } from "@/components/admin/BulkActionBar"
import { ScopeToolbar } from "@/components/admin/ScopeToolbar"
import { UploaderCell } from "@/components/admin/UploaderCell"
import { ModerationBadge } from "@/components/admin/ModerationBadge"
import { WizardSteps } from "@/components/admin/WizardSteps"
import { FormSection } from "@/components/admin/FormSection"
import { SmartContentField } from "@/components/admin/SmartContentField"
import { exportToCsv, flattenForCsv } from "@/lib/admin-export"

interface Department { id: string; name: string }
interface Category { id: string; name: string }
interface AdmissionItem {
  id: string; title: string; slug: string; description: string | null; pdfUrl: string | null; startDate: string | null; lastDate: string | null; applicationFee: string | null; status: string | null; createdAt: string
  department: Department; category: Category
  moderation?: string | null; reviewNote?: string | null; createdBy?: { id: string; name: string | null; email: string; role?: string | null } | null; createdById?: string | null
}

const WIZARD_STEPS = ["Basic info", "Content & schedule", "Review"]

export default function AdminAdmissions() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [scope, setScope] = useState<"mine" | "all">("mine")
  const [moderationFilter, setModerationFilter] = useState("")
  const [adminIdFilter, setAdminIdFilter] = useState("")
  const [queueOnly, setQueueOnly] = useState(false)
  const superView = isSuperAdmin(session?.user?.role)
  useEffect(() => {
    if (superView) {
      // Full listing by default — super-admin (manual + bulk) uploads included.
      setScope("all")
      setModerationFilter("")
      setQueueOnly(false)
    }
  }, [superView])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [wizardStep, setWizardStep] = useState(0)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const { data: admissionsData, isLoading } = useQuery<{ success: boolean; data: AdmissionItem[]; pagination: { page: number; totalPages: number; total: number } }>({
    queryKey: ["admin-admissions", page, search, scope, moderationFilter, adminIdFilter, queueOnly],
    queryFn: () => fetcher(`/api/admissions?page=${page}&limit=10&search=${search}&scope=${scope}${moderationFilter ? `&moderation=${moderationFilter}` : ""}${adminIdFilter ? `&createdById=${encodeURIComponent(adminIdFilter)}` : ""}${queueOnly ? "&onlyAdmins=true" : ""}`),
  })

  const { data: deptsData } = useQuery<{ success: boolean; data: Department[] }>({ queryKey: ["admin-departments"], queryFn: () => fetcher("/api/departments") })
  const { data: catsData } = useQuery<{ success: boolean; data: Category[] }>({ queryKey: ["admin-categories"], queryFn: () => fetcher("/api/categories") })

  const form = useForm<AdmissionInput>({
    resolver: zodResolver(admissionSchema) as any,
    defaultValues: { title: "", slug: "", description: null, departmentId: "", categoryId: "", startDate: null, lastDate: null, applicationFee: null, pdfUrl: null, status: null },
  })

  const createMutation = useMutation({
    mutationFn: (data: AdmissionInput) => api.post("/api/admissions", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-admissions"] }); setDialogOpen(false); form.reset(); toast("Admission created", "success") },
    onError: (err: Error) => toast(err.message, "destructive"),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdmissionInput }) => api.put(`/api/admissions/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-admissions"] }); setDialogOpen(false); setEditingId(null); form.reset(); toast("Admission updated", "success") },
    onError: (err: Error) => toast(err.message, "destructive"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admissions/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-admissions"] }); setDeleteId(null); toast("Admission deleted", "success") },
    onError: (err: Error) => toast(err.message, "destructive"),
  })

  if (status === "loading") return <Skeleton className="h-96" />
  if (!session || !isAdmin(session.user.role)) { router.push("/login"); return null }

  const admissions = admissionsData?.data || []
  const pagination = admissionsData?.pagination
  const departments = deptsData?.data || []
  const categories = catsData?.data || []

  const onSubmit = (data: AdmissionInput) => {
    if (editingId) { updateMutation.mutate({ id: editingId, data }) }
    else { createMutation.mutate(data) }
  }

  const openEdit = (a: AdmissionItem) => {
    setEditingId(a.id)
    setWizardStep(0)
    form.reset({ title: a.title, slug: a.slug, description: a.description, departmentId: a.department.id, categoryId: a.category.id, startDate: a.startDate ? new Date(a.startDate) : null, lastDate: a.lastDate ? new Date(a.lastDate) : null, applicationFee: a.applicationFee, pdfUrl: a.pdfUrl, status: a.status })
    setDialogOpen(true)
  }

  const openCreate = () => {
    setEditingId(null)
    setWizardStep(0)
    form.reset({ title: "", slug: "", description: null, departmentId: "", categoryId: "", startDate: null, lastDate: null, applicationFee: null, pdfUrl: null, status: null })
    setDialogOpen(true)
  }

  const toggleStatus = async (a: AdmissionItem) => {
    const next = a.status === "PUBLISHED" ? null : "PUBLISHED"
    setTogglingId(a.id)
    try {
      await api.put(`/api/admissions/${a.id}`, {
        title: a.title, slug: a.slug, description: a.description,
        departmentId: a.department.id, categoryId: a.category.id,
        startDate: a.startDate ? new Date(a.startDate) : null,
        lastDate: a.lastDate ? new Date(a.lastDate) : null,
        applicationFee: a.applicationFee, pdfUrl: a.pdfUrl, status: next,
      })
      queryClient.invalidateQueries({ queryKey: ["admin-admissions"] })
      toast(next ? "Admission published" : "Admission moved to draft", "success")
    } catch (e) {
      toast(e instanceof Error ? e.message : "Status update failed", "destructive")
    } finally {
      setTogglingId(null)
    }
  }

  const copyLink = async (a: AdmissionItem) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/admission/${a.slug}`)
      setCopiedId(a.id)
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
    setSelected((prev) => (prev.size === admissions.length && admissions.length > 0 ? new Set() : new Set(admissions.map((a) => a.id))))
  }
  const handleBulkDelete = async () => {
    if (selected.size === 0) return
    setBulkDeleting(true)
    try {
      for (const id of selected) await api.delete(`/api/admissions/${id}`)
      setSelected(new Set())
      queryClient.invalidateQueries({ queryKey: ["admin-admissions"] })
      toast("Selected admissions deleted", "success")
    } catch (e) {
      toast(e instanceof Error ? e.message : "Bulk delete failed", "destructive")
    } finally {
      setBulkDeleting(false)
    }
  }
  const handleExport = () => {
    const rows = admissions.filter((a) => selected.size === 0 || selected.has(a.id)).map((a) => flattenForCsv(a as unknown as Record<string, unknown>))
    exportToCsv(rows, "admissions-export")
    toast("CSV exported", "success")
  }

  const nextStep = async () => {
    const stepFields: Record<number, (keyof AdmissionInput)[]> = {
      0: ["title", "slug", "departmentId", "categoryId"],
      1: ["description", "applicationFee", "startDate", "lastDate", "pdfUrl", "status"],
    }
    const fields = stepFields[wizardStep]
    if (fields) {
      const ok = await form.trigger(fields as any)
      if (!ok) return
    }
    setWizardStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1))
  }

  const watched = form.watch()

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Admissions"
        subtitle="Admission notices - rich description and fee support plain text or styled HTML."
        total={pagination?.total}
        totalLabel="admissions"
        actionLabel="Add Admission"
        onAction={openCreate}
      />

      <Card className="overflow-hidden rounded-2xl border-gray-200 shadow-sm dark:border-gray-800">
        <CardHeader className="space-y-3 border-b border-gray-100 bg-white pb-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search admissions..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="bg-gray-50 pl-9 dark:bg-gray-800" />
            </div>
            <ScopeToolbar role={session?.user?.role} scope={scope} onScopeChange={(s) => { setScope(s); setPage(1) }} moderation={moderationFilter} onModerationChange={(m) => { setModerationFilter(m); setPage(1) }} adminId={adminIdFilter} onAdminIdChange={(v) => { setAdminIdFilter(v); setPage(1) }} queueOnly={queueOnly} onQueueOnlyChange={(v) => { setQueueOnly(v); if (v) setModerationFilter("PENDING"); setPage(1) }} />
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
                      <TableHead className="w-10"><Checkbox checked={admissions.length > 0 && selected.size === admissions.length} onCheckedChange={toggleSelectAll} aria-label="Select all" /></TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide">Title</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide">Department</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide">Start Date</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide">Last Date</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide">Status</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide">Uploaded by</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide">Moderation</TableHead>
                      <TableHead className="text-right text-xs font-semibold uppercase tracking-wide">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admissions.map((a) => (
                      <TableRow key={a.id} className="border-b border-gray-100 last:border-0 hover:bg-teal-50/40 dark:border-gray-800 dark:hover:bg-gray-800/50">
                        <TableCell><Checkbox checked={selected.has(a.id)} onCheckedChange={() => toggleSelect(a.id)} aria-label={`Select ${a.title}`} /></TableCell>
                        <TableCell className="max-w-[200px] truncate font-medium">{a.title}</TableCell>
                        <TableCell className="whitespace-nowrap">{a.department.name}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatDate(a.startDate) || "-"}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatDate(a.lastDate) || "-"}</TableCell>
                        <TableCell><Badge variant={a.status === "PUBLISHED" ? "default" : "secondary"}>{a.status || "Draft"}</Badge></TableCell>
                        <TableCell>
                          <UploaderCell name={a.createdBy?.name} email={a.createdBy?.email} id={a.createdBy?.id || a.createdById} role={a.createdBy?.role} compact />
                        </TableCell>
                        <TableCell><ModerationBadge value={a.moderation} /></TableCell>
                        <TableCell className="text-right">
                          <RowActions
                            onEdit={() => openEdit(a)}
                            viewHref={`/admission/${a.slug}`}
                            onCopy={() => copyLink(a)}
                            copied={copiedId === a.id}
                            toggleLabel={a.status === "PUBLISHED" ? "Move to draft" : "Publish now"}
                            onToggleStatus={() => toggleStatus(a)}
                            toggling={togglingId === a.id}
                            onDelete={() => setDeleteId(a.id)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {admissions.length === 0 && <TableRow><TableCell colSpan={9} className="py-10 text-center text-gray-500">No admissions found</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
              {pagination && (
                <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 p-4 sm:flex-row dark:border-gray-800">
                  <p className="text-sm text-gray-500">Total: {pagination.total}</p>
                  <Pagination currentPage={page} totalPages={pagination.totalPages} onPageChange={setPage} />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Admission" : "Add Admission"}</DialogTitle>
            <DialogDescription>Same fields, stepped layout. Description and fee support Visual / HTML / Preview.</DialogDescription>
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                          <SelectContent>{departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="categoryId" render={({ field }) => (
                      <FormItem><FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                          <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
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
                    <FormItem><FormLabel>Description - plain text or styled HTML</FormLabel><FormControl><SmartContentField value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="applicationFee" render={({ field }) => (
                    <FormItem><FormLabel>Application Fee - plain text or styled HTML</FormLabel><FormControl><SmartContentField value={field.value} onChange={field.onChange} rows={4} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField control={form.control} name="startDate" render={({ field }) => (
                      <FormItem><FormLabel>Start Date</FormLabel><FormControl><Input type="date" value={field.value ? formatDate(field.value, "yyyy-MM-dd") : ""} onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="lastDate" render={({ field }) => (
                      <FormItem><FormLabel>Last Date</FormLabel><FormControl><Input type="date" value={field.value ? formatDate(field.value, "yyyy-MM-dd") : ""} onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField control={form.control} name="pdfUrl" render={({ field }) => (
                      <FormItem><FormLabel>PDF URL</FormLabel><FormControl><Input {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value || null)} placeholder="https://..." /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="status" render={({ field }) => (
                      <FormItem><FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                          <SelectContent><SelectItem value=" ">Draft</SelectItem><SelectItem value="PUBLISHED">Published</SelectItem></SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>
              )}
              {wizardStep === 2 && (
                <FormSection title="Review & publish" description="Confirm before saving.">
                  <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                    <div><dt className="text-xs uppercase tracking-wide text-gray-400">Title</dt><dd className="font-medium">{watched.title || "-"}</dd></div>
                    <div><dt className="text-xs uppercase tracking-wide text-gray-400">Status</dt><dd><Badge variant={watched.status === "PUBLISHED" ? "default" : "secondary"}>{watched.status || "Draft"}</Badge></dd></div>
                    <div><dt className="text-xs uppercase tracking-wide text-gray-400">Window</dt><dd>{watched.startDate ? formatDate(watched.startDate) : "-"} → {watched.lastDate ? formatDate(watched.lastDate) : "-"}</dd></div>
                    <div><dt className="text-xs uppercase tracking-wide text-gray-400">PDF</dt><dd className="truncate text-teal-700">{watched.pdfUrl || "-"}</dd></div>
                  </dl>
                </FormSection>
              )}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <div className="flex items-center gap-2">
                  {wizardStep > 0 && <Button type="button" variant="outline" onClick={() => setWizardStep((s) => s - 1)}><ArrowLeft className="mr-1 h-4 w-4" /> Back</Button>}
                  {wizardStep < WIZARD_STEPS.length - 1
                    ? <Button type="button" onClick={nextStep}>Next <ArrowRight className="ml-1 h-4 w-4" /></Button>
                    : <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>{editingId ? "Update" : "Create"}</Button>}
                </div>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!deleteId}
        title="Delete Admission"
        itemLabel={admissions.find((a) => a.id === deleteId)?.title}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        pending={deleteMutation.isPending}
      />
    </div>
  )
}
