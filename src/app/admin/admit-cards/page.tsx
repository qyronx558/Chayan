"use client"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api, fetcher } from "@/lib/api"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { admitCardSchema, type AdmitCardInput } from "@/lib/validations"
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
interface AdmitCardItem {
  id: string; title: string; slug: string; description: string | null; jobId: string | null; examDate: string | null; downloadUrl: string | null; status: string | null; createdAt: string
  department: Department; category: Category
}

const WIZARD_STEPS = ["Basic info", "Content & links", "Review"]

export default function AdminAdmitCards() {
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

  const { data: cardsData, isLoading } = useQuery<{ success: boolean; data: AdmitCardItem[]; pagination: { page: number; totalPages: number; total: number } }>({
    queryKey: ["admin-admit-cards", page, search],
    queryFn: () => fetcher(`/api/admit-cards?page=${page}&limit=10&search=${search}&scope=mine`),
  })

  const { data: deptsData } = useQuery<{ success: boolean; data: Department[] }>({ queryKey: ["admin-departments"], queryFn: () => fetcher("/api/departments") })
  const { data: catsData } = useQuery<{ success: boolean; data: Category[] }>({ queryKey: ["admin-categories"], queryFn: () => fetcher("/api/categories") })

  const form = useForm<AdmitCardInput>({
    resolver: zodResolver(admitCardSchema) as any,
    defaultValues: { title: "", slug: "", description: null, departmentId: "", categoryId: "", jobId: null, examDate: null, downloadUrl: null, status: null },
  })

  const createMutation = useMutation({
    mutationFn: (data: AdmitCardInput) => api.post("/api/admit-cards", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-admit-cards"] }); setDialogOpen(false); form.reset(); toast("Admit card created", "success") },
    onError: (err: Error) => toast(err.message, "destructive"),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdmitCardInput }) => api.put(`/api/admit-cards/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-admit-cards"] }); setDialogOpen(false); setEditingId(null); form.reset(); toast("Admit card updated", "success") },
    onError: (err: Error) => toast(err.message, "destructive"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admit-cards/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-admit-cards"] }); setDeleteId(null); toast("Admit card deleted", "success") },
    onError: (err: Error) => toast(err.message, "destructive"),
  })

  if (status === "loading") return <Skeleton className="h-96" />
  if (!session || !isAdmin(session.user.role)) { router.push("/login"); return null }

  const cards = cardsData?.data || []
  const pagination = cardsData?.pagination
  const departments = deptsData?.data || []
  const categories = catsData?.data || []

  const onSubmit = (data: AdmitCardInput) => {
    if (editingId) { updateMutation.mutate({ id: editingId, data }) }
    else { createMutation.mutate(data) }
  }

  const openEdit = (c: AdmitCardItem) => {
    setEditingId(c.id)
    setWizardStep(0)
    form.reset({ title: c.title, slug: c.slug, description: c.description, departmentId: c.department.id, categoryId: c.category.id, jobId: c.jobId, examDate: c.examDate ? new Date(c.examDate) : null, downloadUrl: c.downloadUrl, status: c.status })
    setDialogOpen(true)
  }

  const openCreate = () => {
    setEditingId(null)
    setWizardStep(0)
    form.reset({ title: "", slug: "", description: null, departmentId: "", categoryId: "", jobId: null, examDate: null, downloadUrl: null, status: null })
    setDialogOpen(true)
  }

  const toggleStatus = async (c: AdmitCardItem) => {
    const next = c.status === "PUBLISHED" ? null : "PUBLISHED"
    setTogglingId(c.id)
    try {
      await api.put(`/api/admit-cards/${c.id}`, {
        title: c.title, slug: c.slug, description: c.description,
        departmentId: c.department.id, categoryId: c.category.id, jobId: c.jobId,
        examDate: c.examDate ? new Date(c.examDate) : null, downloadUrl: c.downloadUrl, status: next,
      })
      queryClient.invalidateQueries({ queryKey: ["admin-admit-cards"] })
      toast(next ? "Admit card published" : "Admit card moved to draft", "success")
    } catch (e) {
      toast(e instanceof Error ? e.message : "Status update failed", "destructive")
    } finally {
      setTogglingId(null)
    }
  }

  const copyLink = async (c: AdmitCardItem) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/admit-card/${c.slug}`)
      setCopiedId(c.id)
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
    setSelected((prev) => (prev.size === cards.length && cards.length > 0 ? new Set() : new Set(cards.map((c) => c.id))))
  }
  const handleBulkDelete = async () => {
    if (selected.size === 0) return
    setBulkDeleting(true)
    try {
      for (const id of selected) await api.delete(`/api/admit-cards/${id}`)
      setSelected(new Set())
      queryClient.invalidateQueries({ queryKey: ["admin-admit-cards"] })
      toast("Selected admit cards deleted", "success")
    } catch (e) {
      toast(e instanceof Error ? e.message : "Bulk delete failed", "destructive")
    } finally {
      setBulkDeleting(false)
    }
  }
  const handleExport = () => {
    const rows = cards.filter((c) => selected.size === 0 || selected.has(c.id)).map((c) => flattenForCsv(c as unknown as Record<string, unknown>))
    exportToCsv(rows, "admit-cards-export")
    toast("CSV exported", "success")
  }

  const nextStep = async () => {
    const stepFields: Record<number, (keyof AdmitCardInput)[]> = {
      0: ["title", "slug", "departmentId", "categoryId"],
      1: ["description", "downloadUrl", "examDate", "status"],
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
        title="Admit Cards"
        subtitle="Hall tickets & exam notices - plain text or styled HTML with live preview."
        total={pagination?.total}
        totalLabel="admit cards"
        actionLabel="Add Admit Card"
        onAction={openCreate}
      />

      <Card className="overflow-hidden rounded-2xl border-gray-200 shadow-sm dark:border-gray-800">
        <CardHeader className="space-y-3 border-b border-gray-100 bg-white pb-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Search admit cards..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="bg-gray-50 pl-9 dark:bg-gray-800" />
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
                      <TableHead className="w-10"><Checkbox checked={cards.length > 0 && selected.size === cards.length} onCheckedChange={toggleSelectAll} aria-label="Select all" /></TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide">Title</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide">Department</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide">Exam Date</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide">Status</TableHead>
                      <TableHead className="text-right text-xs font-semibold uppercase tracking-wide">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cards.map((c) => (
                      <TableRow key={c.id} className="border-b border-gray-100 last:border-0 hover:bg-teal-50/40 dark:border-gray-800 dark:hover:bg-gray-800/50">
                        <TableCell><Checkbox checked={selected.has(c.id)} onCheckedChange={() => toggleSelect(c.id)} aria-label={`Select ${c.title}`} /></TableCell>
                        <TableCell className="max-w-[250px] truncate font-medium">{c.title}</TableCell>
                        <TableCell className="whitespace-nowrap">{c.department.name}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatDate(c.examDate) || "-"}</TableCell>
                        <TableCell><Badge variant={c.status === "PUBLISHED" ? "default" : "secondary"}>{c.status || "Draft"}</Badge></TableCell>
                        <TableCell className="text-right">
                          <RowActions
                            onEdit={() => openEdit(c)}
                            viewHref={`/admit-card/${c.slug}`}
                            onCopy={() => copyLink(c)}
                            copied={copiedId === c.id}
                            toggleLabel={c.status === "PUBLISHED" ? "Move to draft" : "Publish now"}
                            onToggleStatus={() => toggleStatus(c)}
                            toggling={togglingId === c.id}
                            onDelete={() => setDeleteId(c.id)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {cards.length === 0 && <TableRow><TableCell colSpan={6} className="py-10 text-center text-gray-500">No admit cards found</TableCell></TableRow>}
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
            <DialogTitle>{editingId ? "Edit Admit Card" : "Add Admit Card"}</DialogTitle>
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
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value=" ">Draft</SelectItem><SelectItem value="PUBLISHED">Published</SelectItem></SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              )}
              {wizardStep === 2 && (
                <FormSection title="Review & publish" description="Confirm before saving.">
                  <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                    <div><dt className="text-xs uppercase tracking-wide text-gray-400">Title</dt><dd className="font-medium">{watched.title || "-"}</dd></div>
                    <div><dt className="text-xs uppercase tracking-wide text-gray-400">Status</dt><dd><Badge variant={watched.status === "PUBLISHED" ? "default" : "secondary"}>{watched.status || "Draft"}</Badge></dd></div>
                    <div><dt className="text-xs uppercase tracking-wide text-gray-400">Exam date</dt><dd>{watched.examDate ? formatDate(watched.examDate) : "-"}</dd></div>
                    <div><dt className="text-xs uppercase tracking-wide text-gray-400">Download</dt><dd className="truncate text-teal-700">{watched.downloadUrl || "-"}</dd></div>
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
        title="Delete Admit Card"
        itemLabel={cards.find((c) => c.id === deleteId)?.title}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        pending={deleteMutation.isPending}
      />
    </div>
  )
}
