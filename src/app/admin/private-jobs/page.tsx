"use client"
import { useMemo, useState } from "react"
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
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Pagination } from "@/components/ui/pagination"
import { toast } from "@/components/ui/toast"
import { formatDate, slugify, cn } from "@/lib/utils"
import { isAdmin } from "@/lib/roles"
import { Plus, Pencil, Trash2, Search, Eye, Copy, Download, AlertTriangle } from "lucide-react"
import { AdminFormDialog } from "@/components/admin/AdminFormDialog"
import { FormTextField, FormRichField, FormSelectField, FormDateField, FormUrlField } from "@/components/admin/fields"
import { audit, isOverdue, isExpiringSoon } from "@/components/admin/collection-helpers"
import { exportToCsv, flattenForCsv } from "@/lib/admin-export"

interface Company { id: string; name: string }
interface PrivateJobItem {
  id: string; title: string; slug: string; type: string; status: string; category: string | null; description: string | null; location: string | null; salary: string | null; experience: string | null; applicationUrl: string | null; applicationEmail: string | null; company: Company; lastDate: string | null; createdAt: string
}

const EMPTY: PrivateJobInput = {
  title: "", slug: "", companyId: "", companyName: "", type: "FULL_TIME",
  category: null, description: null, location: null, salary: null,
  experience: null, applicationUrl: null, applicationEmail: null, lastDate: null, status: "ACTIVE",
}

const TYPE_OPTIONS = [
  { value: "FULL_TIME", label: "Full-Time" },
  { value: "PART_TIME", label: "Part-Time" },
  { value: "INTERNSHIP", label: "Internship" },
  { value: "CONTRACT", label: "Contract" },
]
const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "UPCOMING", label: "Upcoming" },
  { value: "EXPIRED", label: "Expired" },
]

export default function AdminPrivateJobs() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [expiringOnly, setExpiringOnly] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [viewItem, setViewItem] = useState<PrivateJobItem | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [newCompanyMode, setNewCompanyMode] = useState(false)

  const queryUrl = useMemo(() => {
    const p = new URLSearchParams({ page: String(page), limit: "10", scope: "mine" })
    if (search) p.set("search", search)
    if (typeFilter) p.set("type", typeFilter)
    if (statusFilter) p.set("status", statusFilter)
    return `/api/private-jobs?${p.toString()}`
  }, [page, search, typeFilter, statusFilter])

  const { data: jobsData, isLoading } = useQuery<{ success: boolean; data: PrivateJobItem[]; pagination: { page: number; totalPages: number; total: number } }>({
    queryKey: ["admin-private-jobs", queryUrl], queryFn: () => fetcher(queryUrl),
  })
  const { data: companiesData } = useQuery<{ success: boolean; data: Company[] }>({
    queryKey: ["admin-companies"], queryFn: () => fetcher("/api/companies"),
  })

  const form = useForm<PrivateJobInput>({ resolver: zodResolver(privateJobSchema) as any, defaultValues: EMPTY })
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-private-jobs"] })
    queryClient.invalidateQueries({ queryKey: ["admin-companies"] })
    setSelected([])
  }

  const createMutation = useMutation({
    mutationFn: (data: PrivateJobInput) => api.post<{ success: boolean; data: PrivateJobItem }>("/api/private-jobs", data),
    onSuccess: (res) => { invalidate(); setDialogOpen(false); form.reset(EMPTY); setNewCompanyMode(false); audit("CREATE", "PrivateJob", res.data.id, res.data.title); toast("Private job created", "success") },
    onError: (err: Error) => toast(err.message, "destructive"),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: PrivateJobInput }) => api.put(`/api/private-jobs/${id}`, data),
    onSuccess: (_, v) => { invalidate(); setDialogOpen(false); setEditingId(null); form.reset(EMPTY); setNewCompanyMode(false); audit("UPDATE", "PrivateJob", v.id, v.data.title); toast("Private job updated", "success") },
    onError: (err: Error) => toast(err.message, "destructive"),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/private-jobs/${id}`),
    onSuccess: (_, id) => { invalidate(); setDeleteId(null); audit("DELETE", "PrivateJob", id); toast("Private job deleted", "success") },
    onError: (err: Error) => toast(err.message, "destructive"),
  })
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const j = jobs.find((x) => x.id === id)!
      await api.put(`/api/private-jobs/${id}`, { title: j.title, slug: j.slug, companyId: j.company.id, type: j.type, category: j.category, description: j.description, location: j.location, salary: j.salary, experience: j.experience, applicationUrl: j.applicationUrl, applicationEmail: j.applicationEmail, lastDate: j.lastDate, status })
      return { id, status }
    },
    onSuccess: ({ id, status }) => { invalidate(); audit("STATUS", "PrivateJob", id, `status=${status}`); toast(`Status → ${status}`, "success") },
    onError: (err: Error) => toast(err.message, "destructive"),
  })
  const bulkDelete = useMutation({
    mutationFn: async (ids: string[]) => { for (const id of ids) await api.delete(`/api/private-jobs/${id}`); return ids },
    onSuccess: (ids) => { invalidate(); ids.forEach((id) => audit("DELETE", "PrivateJob", id, "bulk delete")); toast(`${ids.length} deleted`, "success") },
    onError: (err: Error) => toast(err.message, "destructive"),
  })

  if (status === "loading") return <Skeleton className="h-96" />
  if (!session || !isAdmin(session.user.role)) { router.push("/login"); return null }

  const allJobs = jobsData?.data || []
  const jobs = expiringOnly ? allJobs.filter((j) => isOverdue(j.lastDate) || isExpiringSoon(j.lastDate)) : allJobs
  const pagination = jobsData?.pagination
  const companies = companiesData?.data || []

  const toInput = (job: PrivateJobItem): PrivateJobInput => ({
    title: job.title, slug: job.slug, companyId: job.company.id, companyName: "",
    type: job.type as PrivateJobInput["type"], category: job.category, description: job.description,
    location: job.location, salary: job.salary, experience: job.experience,
    applicationUrl: job.applicationUrl, applicationEmail: job.applicationEmail,
    lastDate: job.lastDate ? new Date(job.lastDate) : null, status: job.status as PrivateJobInput["status"],
  })
  const openEdit = (job: PrivateJobItem) => { setEditingId(job.id); setNewCompanyMode(false); form.reset(toInput(job)); setDialogOpen(true) }
  const openCreate = () => { setEditingId(null); setNewCompanyMode(false); form.reset(EMPTY); setDialogOpen(true) }

  const onSubmit = (data: PrivateJobInput) => {
    if (newCompanyMode) {
      const name = (data.companyName || "").trim()
      if (!name) { toast("Enter a company name", "destructive"); return }
      const payload = { ...data, companyId: undefined, companyName: name }
      if (editingId) updateMutation.mutate({ id: editingId, data: payload })
      else createMutation.mutate(payload)
    } else {
      if (!data.companyId) { toast("Select a company or create a new one", "destructive"); return }
      const payload = { ...data, companyName: undefined }
      if (editingId) updateMutation.mutate({ id: editingId, data: payload })
      else createMutation.mutate(payload)
    }
  }
  const cloneItem = async (job: PrivateJobItem) => {
    try {
      const res = await api.post<{ success: boolean; data: PrivateJobItem }>("/api/private-jobs", {
        ...toInput(job), companyName: undefined, title: `${job.title} (Copy)`,
        slug: `${job.slug}-copy-${Date.now().toString(36)}`, status: "UPCOMING",
      })
      invalidate(); audit("CREATE", "PrivateJob", res.data.id, `cloned from ${job.id}`); toast("Duplicated as Upcoming", "success")
    } catch (e) { toast(e instanceof Error ? e.message : "Clone failed", "destructive") }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Private Jobs</h1>
          <p className="text-sm text-gray-500">{pagination?.total ?? 0} total · company-linked corporate postings</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { exportToCsv(jobs.map((r) => flattenForCsv(r as unknown as Record<string, unknown>)), "private-jobs"); toast("Exported", "success") }}><Download className="mr-1 h-4 w-4" /> Export</Button>
          <Button onClick={openCreate}><Plus className="mr-1 h-4 w-4" /> Add Private Job</Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search title or company..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-9" />
            </div>
            <Select value={typeFilter || "all"} onValueChange={(v) => { setTypeFilter(v === "all" ? "" : v); setPage(1) }}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All Types" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Types</SelectItem>{TYPE_OPTIONS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={statusFilter || "all"} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1) }}>
              <SelectTrigger className="w-36"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Status</SelectItem>{STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant={expiringOnly ? "default" : "outline"} size="sm" onClick={() => setExpiringOnly(!expiringOnly)}>
              <AlertTriangle className="mr-1 h-4 w-4" /> Expiring
            </Button>
          </div>
          {selected.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-teal-50 p-2 text-sm">
              <span className="font-medium">{selected.length} selected</span>
              <Button size="sm" variant="outline" onClick={() => selected.forEach((id) => statusMutation.mutate({ id, status: "ACTIVE" }))}>Set Active</Button>
              <Button size="sm" variant="outline" onClick={() => selected.forEach((id) => statusMutation.mutate({ id, status: "EXPIRED" }))}>Set Expired</Button>
              <Button size="sm" variant="destructive" onClick={() => bulkDelete.mutate(selected)}>Delete</Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected([])}>Clear</Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-64" /> : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"><Checkbox checked={jobs.length > 0 && selected.length === jobs.length} onCheckedChange={(v) => setSelected(v ? jobs.map((j) => j.id) : [])} /></TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => {
                    const overdue = isOverdue(job.lastDate)
                    return (
                      <TableRow key={job.id} className={cn(overdue && "bg-red-50/50")}>
                        <TableCell><Checkbox checked={selected.includes(job.id)} onCheckedChange={(v) => setSelected(v ? [...selected, job.id] : selected.filter((s) => s !== job.id))} /></TableCell>
                        <TableCell className="max-w-[240px] truncate font-medium">{job.title}</TableCell>
                        <TableCell>{job.company.name}</TableCell>
                        <TableCell><Badge variant="outline">{job.type.replace("_", " ")}</Badge></TableCell>
                        <TableCell>
                          <Select value={job.status} onValueChange={(v) => statusMutation.mutate({ id: job.id, status: v })}>
                            <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>{STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className={cn(overdue && "font-semibold text-red-600")}>{job.lastDate ? formatDate(job.lastDate) : "N/A"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setViewItem(job)}><Eye className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => openEdit(job)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => cloneItem(job)}><Copy className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteId(job.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {jobs.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-gray-500">No private jobs found</TableCell></TableRow>}
                </TableBody>
              </Table>
              {pagination && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-gray-500">Total: {pagination.total} private jobs</p>
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
          title={editingId ? "Edit Private Job" : "Add Private Job"}
          onSubmit={form.handleSubmit(onSubmit)}
          saving={createMutation.isPending || updateMutation.isPending}
          submitLabel={editingId ? "Update" : "Create"}
          tabs={[
            { id: "basic", label: "Basic Info", content: (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel>Title *</FormLabel><FormControl><Input {...field} onChange={(e) => { field.onChange(e); if (!editingId) form.setValue("slug", slugify(e.target.value)) }} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormTextField control={form.control} name="slug" label="Slug *" nullable={false} />
                </div>
                <div className="rounded-lg border p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">Company *</span>
                    <label className="flex items-center gap-2 text-xs text-gray-600">
                      <Switch checked={newCompanyMode} onCheckedChange={setNewCompanyMode} /> New company
                    </label>
                  </div>
                  {newCompanyMode ? (
                    <FormTextField control={form.control} name="companyName" label="New Company Name" placeholder="Acme Pvt. Ltd." nullable={false} />
                  ) : (
                    <FormSelectField control={form.control} name="companyId" label="Select Company" options={companies} />
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <FormSelectField control={form.control} name="type" label="Job Type" options={TYPE_OPTIONS} />
                  <FormSelectField control={form.control} name="status" label="Status" options={STATUS_OPTIONS} />
                  <FormTextField control={form.control} name="category" label="Category" placeholder="IT / Sales / ..." />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <FormTextField control={form.control} name="location" label="Location" placeholder="Bengaluru / Remote" />
                  <FormTextField control={form.control} name="salary" label="Salary" placeholder="₹6–10 LPA" />
                  <FormTextField control={form.control} name="experience" label="Experience" placeholder="1–3 years" />
                </div>
              </div>
            ) },
            { id: "content", label: "Description", content: (
              <div className="space-y-4">
                <FormRichField control={form.control} name="description" label="Job Description (role, responsibilities, skills)" />
                <FormDateField control={form.control} name="lastDate" label="Application Deadline" />
              </div>
            ) },
            { id: "apply", label: "How to Apply", content: (
              <div className="space-y-4">
                <FormUrlField control={form.control} name="applicationUrl" label="Application URL" placeholder="https://company.com/careers/..." />
                <FormTextField control={form.control} name="applicationEmail" label="Application Email" placeholder="hr@company.com" type="email" />
                <p className="text-xs text-gray-500">Provide at least one apply channel. The public page shows an Apply button + email fallback.</p>
              </div>
            ) },
            { id: "seo", label: "Review & SEO", content: (
              <div className="space-y-3 text-sm">
                <p className="rounded-md bg-gray-50 p-3 text-xs text-gray-500">Public URL: <span className="font-mono">/private-jobs/{form.watch("slug") || "your-slug"}</span></p>
                <Badge>{form.watch("status")}</Badge>
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
              {[["Company", viewItem.company.name], ["Type", viewItem.type.replace("_", " ")], ["Status", viewItem.status], ["Category", viewItem.category ?? "-"], ["Location", viewItem.location ?? "-"], ["Salary", viewItem.salary ?? "-"], ["Deadline", formatDate(viewItem.lastDate) || "-"]].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b py-1.5"><dt className="text-gray-500">{k}</dt><dd className="text-right font-medium">{v}</dd></div>
              ))}
            </dl>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Delete Private Job</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-500">Permanently delete this private job? This cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
