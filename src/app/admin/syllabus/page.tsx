"use client"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api, fetcher } from "@/lib/api"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { syllabusSchema, type SyllabusInput } from "@/lib/validations"
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
import { slugify } from "@/lib/utils"
import { isAdmin } from "@/lib/roles"
import { Search, ArrowLeft, ArrowRight } from "lucide-react"
import { AdminPageHeader } from "@/components/admin/AdminPageHeader"
import { RowActions } from "@/components/admin/RowActions"
import { ConfirmDeleteDialog } from "@/components/admin/ConfirmDeleteDialog"
import { BulkActionBar } from "@/components/admin/BulkActionBar"
import { WizardSteps } from "@/components/admin/WizardSteps"
import { FormSection } from "@/components/admin/FormSection"
import { SmartContentField } from "@/components/admin/SmartContentField"
import { exportToCsv, flattenForCsv } from "@/lib/admin-export"

interface Department { id: string; name: string }
interface Category { id: string; name: string }
interface SyllabusItem {
  id: string; title: string; slug: string; description: string | null; jobId: string | null; pdfUrl: string | null; subjects: string | null; status: string | null; createdAt: string
  department: Department; category: Category
}

const WIZARD_STEPS = ["Basic info", "Content & subjects", "Review"]

export default function AdminSyllabus() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [wizardStep, setWizardStep] = useState(0)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const { data: syllabusData, isLoading } = useQuery<{ success: boolean; data: SyllabusItem[]; pagination: { page: number; totalPages: number; total: number } }>({
    queryKey: ["admin-syllabus", page, search],
    queryFn: () => fetcher(`/api/syllabus?page=${page}&limit=10&search=${search}&scope=mine`),
  })

  const { data: deptsData } = useQuery<{ success: boolean; data: Department[] }>({ queryKey: ["admin-departments"], queryFn: () => fetcher("/api/departments") })
  const { data: catsData } = useQuery<{ success: boolean; data: Category[] }>({ queryKey: ["admin-categories"], queryFn: () => fetcher("/api/categories") })

  const form = useForm<SyllabusInput>({
    resolver: zodResolver(syllabusSchema) as any,
    defaultValues: { title: "", slug: "", description: null, departmentId: "", categoryId: "", jobId: null, pdfUrl: null, subjects: null, status: null },
  })

  const createMutation = useMutation({
    mutationFn: (data: SyllabusInput) => api.post("/api/syllabus", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-syllabus"] }); setDialogOpen(false); form.reset(); toast("Syllabus created", "success") },
    onError: (err: Error) => toast(err.message, "destructive"),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SyllabusInput }) => api.put(`/api/syllabus/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-syllabus"] }); setDialogOpen(false); setEditingId(null); form.reset(); toast("Syllabus updated", "success") },
    onError: (err: Error) => toast(err.message, "destructive"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/syllabus/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-syllabus"] }); setDeleteId(null); toast("Syllabus deleted", "success") },
    onError: (err: Error) => toast(err.message, "destructive"),
  })

  if (status === "loading") return <Skeleton className="h-96" />
  if (!session || !isAdmin(session.user.role)) { router.push("/login"); return null }

  const syllabusList = syllabusData?.data || []
  const pagination = syllabusData?.pagination
  const departments = deptsData?.data || []
  const categories = catsData?.data || []

  const onSubmit = (data: SyllabusInput) => {
    if (editingId) { updateMutation.mutate({ id: editingId, data }) }
    else { createMutation.mutate(data) }
  }

  const openEdit = (s: SyllabusItem) => {
    setEditingId(s.id)
    setWizardStep(0)
    form.reset({ title: s.title, slug: s.slug, description: s.description, departmentId: s.department.id, categoryId: s.category.id, jobId: s.jobId, pdfUrl: s.pdfUrl, subjects: s.subjects, status: s.status })
    setDialogOpen(true)
  }

  const openCreate = () => {
    setEditingId(null)
    setWizardStep(0)
    form.reset({ title: "", slug: "", description: null, departmentId: "", categoryId: "", jobId: null, pdfUrl: null, subjects: null, status: null })
    setDialogOpen(true)
  }

  const toggleStatus = async (s: SyllabusItem) => {
    const next = s.status === "PUBLISHED" ? null : "PUBLISHED"
    setTogglingId(s.id)
    try {
      await api.put(`/api/syllabus/${s.id}`, {
        title: s.title, slug: s.slug, description: s.description,
        departmentId: s.department.id, categoryId: s.category.id,
        jobId: s.jobId, pdfUrl: s.pdfUrl, subjects: s.subjects, status: next,
      })
      queryClient.invalidateQueries({ queryKey: ["admin-syllabus"] })
      toast(next ? "Syllabus published" : "Syllabus moved to draft", "success")
    } catch (e) {
      toast(e instanceof Error ? e.message : "Status update failed", "destructive")
    } finally {
      setTogglingId(null)
    }
  }

  const copyLink = async (s: SyllabusItem) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/syllabus/${s.slug}`)
      setCopiedId(s.id)
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
    setSelected((prev) => (prev.size === syllabusList.length && syllabusList.length > 0 ? new Set() : new Set(syllabusList.map((s) => s.id))))
  }
  const handleBulkDelete = async () => {
    if (selected.size === 0) return
    setBulkDeleting(true)
    try {
      for (const id of selected) await api.delete(`/api/syllabus/${id}`)
      setSelected(new Set())
      queryClient.invalidateQueries({ queryKey: ["admin-syllabus"] })
      toast("Selected syllabus deleted", "success")
    } catch (e) {
      toast(e instanceof Error ? e.message : "Bulk delete failed", "destructive")
    } finally {
      setBulkDeleting(false)
    }
  }
  const handleExport = () => {
    const rows = syllabusList.filter((s) => selected.size === 0 || selected.has(s.id)).map((s) => flattenForCsv(s as unknown as Record<string, unknown>))
    exportToCsv(rows, "syllabus-export")
    toast("CSV exported", "success")
  }

  const nextStep = async () => {
    const stepFields: Record<number, (keyof SyllabusInput)[]> = {
      0: ["title", "slug", "departmentId", "categoryId"],
      1: ["description", "subjects", "pdfUrl", "status"],
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
        title="Syllabus"
        subtitle="Exam patterns & subject lists - both fields support plain text or styled HTML."
        total={pagination?.total}
        totalLabel="syllabus"
        actionLabel="Add Syllabus"
        onAction={openCreate}
      />

      <Card className="overflow-hidden rounded-2xl border-gray-200 shadow-sm dark:border-gray-800">
        <CardHeader className="space-y-3 border-b border-gray-100 bg-white pb-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Search syllabus..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="bg-gray-50 pl-9 dark:bg-gray-800" />
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
                      <TableHead className="w-10"><Checkbox checked={syllabusList.length > 0 && selected.size === syllabusList.length} onCheckedChange={toggleSelectAll} aria-label="Select all" /></TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide">Title</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide">Department</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide">Status</TableHead>
                      <TableHead className="text-right text-xs font-semibold uppercase tracking-wide">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {syllabusList.map((s) => (
                      <TableRow key={s.id} className="border-b border-gray-100 last:border-0 hover:bg-teal-50/40 dark:border-gray-800 dark:hover:bg-gray-800/50">
                        <TableCell><Checkbox checked={selected.has(s.id)} onCheckedChange={() => toggleSelect(s.id)} aria-label={`Select ${s.title}`} /></TableCell>
                        <TableCell className="max-w-[250px] truncate font-medium">{s.title}</TableCell>
                        <TableCell className="whitespace-nowrap">{s.department.name}</TableCell>
                        <TableCell><Badge variant={s.status === "PUBLISHED" ? "default" : "secondary"}>{s.status || "Draft"}</Badge></TableCell>
                        <TableCell className="text-right">
                          <RowActions
                            onEdit={() => openEdit(s)}
                            viewHref={`/syllabus/${s.slug}`}
                            onCopy={() => copyLink(s)}
                            copied={copiedId === s.id}
                            toggleLabel={s.status === "PUBLISHED" ? "Move to draft" : "Publish now"}
                            onToggleStatus={() => toggleStatus(s)}
                            toggling={togglingId === s.id}
                            onDelete={() => setDeleteId(s.id)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {syllabusList.length === 0 && <TableRow><TableCell colSpan={5} className="py-10 text-center text-gray-500">No syllabus found</TableCell></TableRow>}
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
            <DialogTitle>{editingId ? "Edit Syllabus" : "Add Syllabus"}</DialogTitle>
            <DialogDescription>Same fields, stepped layout. Description and subjects support Visual / HTML / Preview.</DialogDescription>
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
                  <FormField control={form.control} name="subjects" render={({ field }) => (
                    <FormItem><FormLabel>Subjects - plain text or styled HTML</FormLabel><FormControl><SmartContentField value={field.value} onChange={field.onChange} placeholder="List subjects as plain lines, bullets (Visual), or a styled HTML table..." /></FormControl><FormMessage /></FormItem>
                  )} />
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
                    <div className="sm:col-span-2"><dt className="text-xs uppercase tracking-wide text-gray-400">PDF</dt><dd className="truncate text-teal-700">{watched.pdfUrl || "-"}</dd></div>
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
        title="Delete Syllabus"
        itemLabel={syllabusList.find((s) => s.id === deleteId)?.title}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        pending={deleteMutation.isPending}
      />
    </div>
  )
}
