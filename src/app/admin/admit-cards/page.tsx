"use client"
import { useMemo, useState } from "react"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Pagination } from "@/components/ui/pagination"
import { toast } from "@/components/ui/toast"
import { formatDate, slugify, cn } from "@/lib/utils"
import { isAdmin } from "@/lib/roles"
import { Plus, Pencil, Trash2, Search, Eye, Copy, Download, FileText } from "lucide-react"
import { AdminFormDialog } from "@/components/admin/AdminFormDialog"
import { FormTextField, FormRichField, FormSelectField, FormDateField, FormPdfField } from "@/components/admin/fields"
import { JobPickerField } from "@/components/admin/JobPicker"
import { audit, contentStatusBadge, CONTENT_STATUS_OPTIONS } from "@/components/admin/collection-helpers"
import { exportToCsv, flattenForCsv } from "@/lib/admin-export"

interface Department { id: string; name: string }
interface Category { id: string; name: string }
interface AdmitCardItem {
  id: string; title: string; slug: string; description: string | null; jobId: string | null; examDate: string | null; downloadUrl: string | null; status: string | null; createdAt: string
  department: Department; category: Category; job?: { id: string; title: string } | null
}

const EMPTY: AdmitCardInput = { title: "", slug: "", description: null, departmentId: "", categoryId: "", jobId: null, examDate: null, downloadUrl: null, status: null }

export default function AdminAdmitCards() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [deptFilter, setDeptFilter] = useState("")
  const [catFilter, setCatFilter] = useState("")
  const [sort, setSort] = useState("latest")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [viewItem, setViewItem] = useState<AdmitCardItem | null>(null)
  const [selected, setSelected] = useState<string[]>([])

  const queryUrl = useMemo(() => {
    const p = new URLSearchParams({ page: String(page), limit: "10", scope: "mine" })
    if (search) p.set("search", search)
    if (statusFilter) p.set("status", statusFilter)
    if (deptFilter) p.set("departmentId", deptFilter)
    if (catFilter) p.set("categoryId", catFilter)
    if (sort) p.set("sort", sort)
    return `/api/admit-cards?${p.toString()}`
  }, [page, search, statusFilter, deptFilter, catFilter, sort])

  const { data: cardsData, isLoading } = useQuery<{ success: boolean; data: AdmitCardItem[]; pagination: { page: number; totalPages: number; total: number } }>({
    queryKey: ["admin-admit-cards", queryUrl], queryFn: () => fetcher(queryUrl),
  })
  const { data: deptsData } = useQuery<{ success: boolean; data: Department[] }>({ queryKey: ["admin-departments"], queryFn: () => fetcher("/api/departments") })
  const { data: catsData } = useQuery<{ success: boolean; data: Category[] }>({ queryKey: ["admin-categories"], queryFn: () => fetcher("/api/categories") })

  const form = useForm<AdmitCardInput>({ resolver: zodResolver(admitCardSchema) as any, defaultValues: EMPTY })
  const invalidate = () => { queryClient.invalidateQueries({ queryKey: ["admin-admit-cards"] }); setSelected([]) }

  const createMutation = useMutation({
    mutationFn: (data: AdmitCardInput) => api.post<{ success: boolean; data: AdmitCardItem }>("/api/admit-cards", data),
    onSuccess: (res) => { invalidate(); setDialogOpen(false); form.reset(EMPTY); audit("CREATE", "AdmitCard", res.data.id, res.data.title); toast("Admit card created", "success") },
    onError: (err: Error) => toast(err.message, "destructive"),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdmitCardInput }) => api.put(`/api/admit-cards/${id}`, data),
    onSuccess: (_, v) => { invalidate(); setDialogOpen(false); setEditingId(null); form.reset(EMPTY); audit("UPDATE", "AdmitCard", v.id, v.data.title); toast("Admit card updated", "success") },
    onError: (err: Error) => toast(err.message, "destructive"),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admit-cards/${id}`),
    onSuccess: (_, id) => { invalidate(); setDeleteId(null); audit("DELETE", "AdmitCard", id); toast("Admit card deleted", "success") },
    onError: (err: Error) => toast(err.message, "destructive"),
  })
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const c = cards.find((x) => x.id === id)!
      await api.put(`/api/admit-cards/${id}`, { title: c.title, slug: c.slug, description: c.description, departmentId: c.department.id, categoryId: c.category.id, jobId: c.jobId, examDate: c.examDate, downloadUrl: c.downloadUrl, status })
      return { id, status }
    },
    onSuccess: ({ id, status }) => { invalidate(); audit("STATUS", "AdmitCard", id, `status=${status}`); toast(`Status → ${status}`, "success") },
    onError: (err: Error) => toast(err.message, "destructive"),
  })
  const bulkDelete = useMutation({
    mutationFn: async (ids: string[]) => { for (const id of ids) await api.delete(`/api/admit-cards/${id}`); return ids },
    onSuccess: (ids) => { invalidate(); ids.forEach((id) => audit("DELETE", "AdmitCard", id, "bulk delete")); toast(`${ids.length} admit cards deleted`, "success") },
    onError: (err: Error) => toast(err.message, "destructive"),
  })

  if (status === "loading") return <Skeleton className="h-96" />
  if (!session || !isAdmin(session.user.role)) { router.push("/login"); return null }

  const cards = cardsData?.data || []
  const pagination = cardsData?.pagination
  const departments = deptsData?.data || []
  const categories = catsData?.data || []

  const toInput = (c: AdmitCardItem): AdmitCardInput => ({
    title: c.title, slug: c.slug, description: c.description, departmentId: c.department.id,
    categoryId: c.category.id, jobId: c.jobId, examDate: c.examDate ? new Date(c.examDate) : null,
    downloadUrl: c.downloadUrl, status: c.status,
  })
  const openEdit = (c: AdmitCardItem) => { setEditingId(c.id); form.reset(toInput(c)); setDialogOpen(true) }
  const openCreate = () => { setEditingId(null); form.reset(EMPTY); setDialogOpen(true) }
  const onSubmit = (data: AdmitCardInput) => {
    const payload = { ...data, status: data.status === " " ? null : data.status }
    if (editingId) updateMutation.mutate({ id: editingId, data: payload })
    else createMutation.mutate(payload)
  }
  const cloneItem = async (c: AdmitCardItem) => {
    try {
      const res = await api.post<{ success: boolean; data: AdmitCardItem }>("/api/admit-cards", { ...toInput(c), title: `${c.title} (Copy)`, slug: `${c.slug}-copy-${Date.now().toString(36)}`, status: "DRAFT" })
      invalidate(); audit("CREATE", "AdmitCard", res.data.id, `cloned from ${c.id}`); toast("Duplicated as Draft", "success")
    } catch (e) { toast(e instanceof Error ? e.message : "Clone failed", "destructive") }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Admit Cards</h1>
          <p className="text-sm text-gray-500">{pagination?.total ?? 0} total · exam date + download PDF + linked job</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { exportToCsv(cards.map((r) => flattenForCsv(r as unknown as Record<string, unknown>)), "admit-cards"); toast("Exported", "success") }}><Download className="mr-1 h-4 w-4" /> Export</Button>
          <Button onClick={openCreate}><Plus className="mr-1 h-4 w-4" /> Add Admit Card</Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search admit cards..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-9" />
            </div>
            <Select value={statusFilter || "all"} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1) }}>
              <SelectTrigger className="w-36"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Status</SelectItem>{CONTENT_STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}<SelectItem value="PUBLISHED">Published (legacy)</SelectItem></SelectContent>
            </Select>
            <Select value={deptFilter || "all"} onValueChange={(v) => { setDeptFilter(v === "all" ? "" : v); setPage(1) }}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Departments</SelectItem>{departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={catFilter || "all"} onValueChange={(v) => { setCatFilter(v === "all" ? "" : v); setPage(1) }}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Categories</SelectItem>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => { setSort(v); setPage(1) }}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Sort" /></SelectTrigger>
              <SelectContent><SelectItem value="latest">Newest</SelectItem><SelectItem value="oldest">Oldest</SelectItem><SelectItem value="title_asc">Title A–Z</SelectItem><SelectItem value="title_desc">Title Z–A</SelectItem></SelectContent>
            </Select>
          </div>
          {selected.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-teal-50 p-2 text-sm">
              <span className="font-medium">{selected.length} selected</span>
              <Button size="sm" variant="outline" onClick={() => selected.forEach((id) => statusMutation.mutate({ id, status: "PUBLISHED" }))}>Publish</Button>
              <Button size="sm" variant="outline" onClick={() => selected.forEach((id) => statusMutation.mutate({ id, status: "ARCHIVED" }))}>Archive</Button>
              <Button size="sm" variant="destructive" onClick={() => bulkDelete.mutate(selected)}>Delete</Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected([])}>Clear</Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? <Skeleton className="h-64" /> : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8 pl-4"><Checkbox checked={cards.length > 0 && selected.length === cards.length} onCheckedChange={(v) => setSelected(v ? cards.map((c) => c.id) : [])} /></TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Exam Date</TableHead>
                    <TableHead>Download</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cards.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="pl-4"><Checkbox checked={selected.includes(c.id)} onCheckedChange={(v) => setSelected(v ? [...selected, c.id] : selected.filter((s) => s !== c.id))} /></TableCell>
                      <TableCell className="max-w-[260px]">
                        <span className="block truncate font-medium">{c.title}</span>
                        {c.job && <span className="text-xs text-teal-700">↗ {c.job.title.slice(0, 40)}</span>}
                      </TableCell>
                      <TableCell>{c.department.name}</TableCell>
                      <TableCell>{formatDate(c.examDate) || "-"}</TableCell>
                      <TableCell>{c.downloadUrl ? <a href={c.downloadUrl} target="_blank" rel="noopener noreferrer" className="text-teal-700 hover:underline"><FileText className="h-4 w-4" /></a> : <span className="text-xs text-gray-400">-</span>}</TableCell>
                      <TableCell>
                        <Select value={c.status || "DRAFT"} onValueChange={(v) => statusMutation.mutate({ id: c.id, status: v })}>
                          <SelectTrigger className={cn("h-7 w-28 text-xs", contentStatusBadge(c.status))}><SelectValue /></SelectTrigger>
                          <SelectContent>{CONTENT_STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}<SelectItem value="PUBLISHED">Published</SelectItem></SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setViewItem(c)}><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => cloneItem(c)}><Copy className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(c.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {cards.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-gray-500">No admit cards found</TableCell></TableRow>}
                </TableBody>
              </Table>
              {pagination && (
                <div className="flex items-center justify-between p-4">
                  <p className="text-sm text-gray-500">Total: {pagination.total}</p>
                  <Pagination currentPage={page} totalPages={pagination.totalPages} onPageChange={setPage} />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Form {...form}>
        <AdminFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title={editingId ? "Edit Admit Card" : "Add Admit Card"}
          onSubmit={form.handleSubmit(onSubmit)}
          saving={createMutation.isPending || updateMutation.isPending}
          submitLabel={editingId ? "Update" : "Publish Admit Card"}
          tabs={[
            { id: "basic", label: "Basic Info", content: (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel>Title *</FormLabel><FormControl><Input {...field} onChange={(e) => { field.onChange(e); if (!editingId) form.setValue("slug", slugify(e.target.value)) }} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormTextField control={form.control} name="slug" label="Slug *" nullable={false} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormSelectField control={form.control} name="departmentId" label="Department *" options={departments} />
                  <FormSelectField control={form.control} name="categoryId" label="Category *" options={categories} />
                </div>
                <JobPickerField control={form.control} name="jobId" />
                <div className="grid grid-cols-2 gap-4">
                  <FormDateField control={form.control} name="examDate" label="Exam Date" />
                  <FormSelectField control={form.control} name="status" label="Status" options={CONTENT_STATUS_OPTIONS} allowClear clearLabel="Draft (null)" />
                </div>
              </div>
            ) },
            { id: "content", label: "Content", content: (<FormRichField control={form.control} name="description" label="Instructions (exam city, shift, documents to carry)" />) },
            { id: "pdf", label: "Download PDF", content: (<FormPdfField control={form.control} name="downloadUrl" label="Admit Card PDF" folder="chayan/admit-cards" />) },
            { id: "seo", label: "Review & SEO", content: (
              <div className="space-y-3 text-sm">
                <p className="rounded-md bg-gray-50 p-3 text-xs text-gray-500">Public URL: <span className="font-mono">/admit-cards/{form.watch("slug") || "your-slug"}</span></p>
                <Badge className={contentStatusBadge(form.watch("status"))}>{form.watch("status") || "Draft"}</Badge>
              </div>
            ) },
          ]}
        />
      </Form>

      <Sheet open={!!viewItem} onOpenChange={(o) => { if (!o) setViewItem(null) }}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader><SheetTitle>{viewItem?.title}</SheetTitle><SheetDescription className="font-mono text-xs">{viewItem?.slug}</SheetDescription></SheetHeader>
          {viewItem && (
            <dl className="mt-4 space-y-2 text-sm">
              {[["Department", viewItem.department.name], ["Category", viewItem.category.name], ["Linked job", viewItem.job?.title ?? "-"], ["Exam date", formatDate(viewItem.examDate) || "-"], ["Status", viewItem.status || "Draft"]].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b py-1.5"><dt className="text-gray-500">{k}</dt><dd className="text-right font-medium">{v}</dd></div>
              ))}
              {viewItem.downloadUrl && <a href={viewItem.downloadUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-teal-700 hover:underline"><FileText className="h-4 w-4" /> Open PDF</a>}
            </dl>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Delete Admit Card</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-500">Permanently delete this admit card? This cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
