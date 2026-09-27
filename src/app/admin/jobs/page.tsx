"use client"
import { useMemo, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api, fetcher } from "@/lib/api"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { jobSchema, type JobInput } from "@/lib/validations"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Pagination } from "@/components/ui/pagination"
import { toast } from "@/components/ui/toast"
import { formatDate, getStatusColor, slugify, cn } from "@/lib/utils"
import { isAdmin } from "@/lib/roles"
import { Plus, Pencil, Trash2, Search, Eye, Copy, Download, AlertTriangle } from "lucide-react"
import { AdminFormDialog } from "@/components/admin/AdminFormDialog"
import {
  FormTextField,
  FormTextareaField,
  FormRichField,
  FormSelectField,
  FormDateField,
  FormUrlField,
  ImportantDatesEditor,
} from "@/components/admin/fields"
import { audit, isOverdue, isExpiringSoon } from "@/components/admin/collection-helpers"
import { exportToCsv, flattenForCsv } from "@/lib/admin-export"

interface Department { id: string; name: string }
interface Category { id: string; name: string }
interface State { id: string; name: string }
interface JobItem {
  id: string; title: string; slug: string; status: string; advertisementNo: string | null; totalVacancies: number | null; salary: string | null; location: string | null; ageLimit: string | null; ageRelaxation: string | null; education: string | null; selectionProcess: string | null; applicationFee: string | null; importantDates: Record<string, string> | null; documentsRequired: string | null; howToApply: string | null; officialNotification: string | null; officialWebsite: string | null; applyLink: string | null; experience: string | null; startDate: string | null; lastDate: string | null; createdAt: string
  department: Department; category: Category; state: State | null
}

const EMPTY: JobInput = {
  title: "", slug: "", departmentId: "", categoryId: "", stateId: null,
  advertisementNo: null, totalVacancies: null, salary: null, location: null,
  ageLimit: null, ageRelaxation: null, education: null, selectionProcess: null,
  applicationFee: null, importantDates: null, documentsRequired: null,
  howToApply: null, officialNotification: null, officialWebsite: null,
  applyLink: null, status: "ACTIVE", experience: null, startDate: null, lastDate: null,
}

export default function AdminJobs() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [deptFilter, setDeptFilter] = useState("")
  const [catFilter, setCatFilter] = useState("")
  const [sort, setSort] = useState("latest")
  const [expiringOnly, setExpiringOnly] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [viewItem, setViewItem] = useState<JobItem | null>(null)
  const [selected, setSelected] = useState<string[]>([])

  const queryUrl = useMemo(() => {
    const p = new URLSearchParams({ page: String(page), limit: "10", scope: "mine" })
    if (search) p.set("search", search)
    if (statusFilter) p.set("status", statusFilter)
    if (deptFilter) p.set("departmentId", deptFilter)
    if (catFilter) p.set("categoryId", catFilter)
    if (sort) p.set("sort", sort)
    return `/api/jobs?${p.toString()}`
  }, [page, search, statusFilter, deptFilter, catFilter, sort])

  const { data: jobsData, isLoading } = useQuery<{ success: boolean; data: JobItem[]; pagination: { page: number; totalPages: number; total: number } }>({
    queryKey: ["admin-jobs", queryUrl],
    queryFn: () => fetcher(queryUrl),
  })
  const { data: deptsData } = useQuery<{ success: boolean; data: Department[] }>({ queryKey: ["admin-departments"], queryFn: () => fetcher("/api/departments") })
  const { data: catsData } = useQuery<{ success: boolean; data: Category[] }>({ queryKey: ["admin-categories"], queryFn: () => fetcher("/api/categories") })
  const { data: statesData } = useQuery<{ success: boolean; data: State[] }>({ queryKey: ["admin-states"], queryFn: () => fetcher("/api/states") })

  const form = useForm<JobInput>({ resolver: zodResolver(jobSchema) as any, defaultValues: EMPTY })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-jobs"] })
    setSelected([])
  }

  const createMutation = useMutation({
    mutationFn: (data: JobInput) => api.post<{ success: boolean; data: JobItem }>("/api/jobs", data),
    onSuccess: (res) => { invalidate(); setDialogOpen(false); form.reset(EMPTY); audit("CREATE", "Job", res.data.id, res.data.title); toast("Job created", "success") },
    onError: (err: Error) => toast(err.message, "destructive"),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: JobInput }) => api.put(`/api/jobs/${id}`, data),
    onSuccess: (_, v) => { invalidate(); setDialogOpen(false); setEditingId(null); form.reset(EMPTY); audit("UPDATE", "Job", v.id, v.data.title); toast("Job updated", "success") },
    onError: (err: Error) => toast(err.message, "destructive"),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/jobs/${id}`),
    onSuccess: (_, id) => { invalidate(); setDeleteId(null); audit("DELETE", "Job", id); toast("Job deleted", "success") },
    onError: (err: Error) => toast(err.message, "destructive"),
  })
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.put(`/api/jobs/${id}`, { ...(jobs.find((j) => j.id === id) ? toInput(jobs.find((j) => j.id === id)!) : {}), status }),
    onSuccess: (_, v) => { invalidate(); audit("STATUS", "Job", v.id, `status=${v.status}`); toast(`Status → ${v.status}`, "success") },
    onError: (err: Error) => toast(err.message, "destructive"),
  })
  const bulkDelete = useMutation({
    mutationFn: async (ids: string[]) => { for (const id of ids) await api.delete(`/api/jobs/${id}`); return ids },
    onSuccess: (ids) => { invalidate(); ids.forEach((id) => audit("DELETE", "Job", id, "bulk delete")); toast(`${ids.length} jobs deleted`, "success") },
    onError: (err: Error) => toast(err.message, "destructive"),
  })
  const bulkStatus = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      for (const id of ids) {
        const j = jobs.find((x) => x.id === id)
        if (j) await api.put(`/api/jobs/${id}`, { ...toInput(j), status })
      }
      return { ids, status }
    },
    onSuccess: ({ ids, status }) => { invalidate(); ids.forEach((id) => audit("STATUS", "Job", id, `bulk status=${status}`)); toast(`${ids.length} jobs → ${status}`, "success") },
    onError: (err: Error) => toast(err.message, "destructive"),
  })

  if (status === "loading") return <Skeleton className="h-96" />
  if (!session || !isAdmin(session.user.role)) { router.push("/login"); return null }

  const allJobs = jobsData?.data || []
  const jobs = expiringOnly ? allJobs.filter((j) => isOverdue(j.lastDate) || isExpiringSoon(j.lastDate)) : allJobs
  const pagination = jobsData?.pagination
  const departments = deptsData?.data || []
  const categories = catsData?.data || []
  const states = statesData?.data || []

  function toInput(job: JobItem): JobInput {
    return {
      title: job.title, slug: job.slug, departmentId: job.department.id, categoryId: job.category.id,
      stateId: job.state?.id || null, advertisementNo: job.advertisementNo, totalVacancies: job.totalVacancies,
      salary: job.salary, location: job.location, ageLimit: job.ageLimit, ageRelaxation: job.ageRelaxation,
      education: job.education, selectionProcess: job.selectionProcess, applicationFee: job.applicationFee,
      importantDates: job.importantDates, documentsRequired: job.documentsRequired, howToApply: job.howToApply,
      officialNotification: job.officialNotification, officialWebsite: job.officialWebsite, applyLink: job.applyLink,
      status: job.status as JobInput["status"], experience: job.experience,
      startDate: job.startDate ? new Date(job.startDate) : null, lastDate: job.lastDate ? new Date(job.lastDate) : null,
    }
  }

  const openEdit = (job: JobItem) => { setEditingId(job.id); form.reset(toInput(job)); setDialogOpen(true) }
  const openCreate = () => { setEditingId(null); form.reset(EMPTY); setDialogOpen(true) }
  const onSubmit = (data: JobInput) => {
    const payload = { ...data, stateId: data.stateId === " " ? null : data.stateId }
    if (editingId) updateMutation.mutate({ id: editingId, data: payload })
    else createMutation.mutate(payload)
  }
  const cloneJob = async (job: JobItem) => {
    try {
      const input = toInput(job)
      const copy = { ...input, title: `${job.title} (Copy)`, slug: `${job.slug}-copy-${Date.now().toString(36)}`, status: "UPCOMING" as const }
      const res = await api.post<{ success: boolean; data: JobItem }>("/api/jobs", copy)
      invalidate(); audit("CREATE", "Job", res.data.id, `cloned from ${job.id}`); toast("Job duplicated as Upcoming", "success")
    } catch (e) { toast(e instanceof Error ? e.message : "Clone failed", "destructive") }
  }
  const toggleAll = (on: boolean) => setSelected(on ? jobs.map((j) => j.id) : [])
  const exportCsv = (rows: JobItem[]) => {
    exportToCsv(rows.map((r) => flattenForCsv(r as unknown as Record<string, unknown>)), `jobs-page${page}`)
    toast(`Exported ${rows.length} jobs`, "success")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Jobs</h1>
          <p className="text-sm text-gray-500">{pagination?.total ?? 0} total postings · multi-select for bulk actions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportCsv(jobs)}><Download className="mr-1 h-4 w-4" /> Export</Button>
          <Button onClick={openCreate}><Plus className="mr-1 h-4 w-4" /> Add New Job</Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search title, advt no, department..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-9" />
            </div>
            <Select value={statusFilter || "all"} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1) }}>
              <SelectTrigger className="w-36"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="UPCOMING">Upcoming</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={deptFilter || "all"} onValueChange={(v) => { setDeptFilter(v === "all" ? "" : v); setPage(1) }}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={catFilter || "all"} onValueChange={(v) => { setCatFilter(v === "all" ? "" : v); setPage(1) }}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => { setSort(v); setPage(1) }}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Sort" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="last_date_asc">Last date ↑</SelectItem>
                <SelectItem value="last_date_desc">Last date ↓</SelectItem>
                <SelectItem value="name_asc">Title A–Z</SelectItem>
                <SelectItem value="name_desc">Title Z–A</SelectItem>
              </SelectContent>
            </Select>
            <Button variant={expiringOnly ? "default" : "outline"} size="sm" onClick={() => setExpiringOnly(!expiringOnly)}>
              <AlertTriangle className="mr-1 h-4 w-4" /> Expiring
            </Button>
          </div>
          {selected.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-teal-50 p-2 text-sm">
              <span className="font-medium">{selected.length} selected</span>
              <Button size="sm" variant="outline" onClick={() => bulkStatus.mutate({ ids: selected, status: "ACTIVE" })}>Set Active</Button>
              <Button size="sm" variant="outline" onClick={() => bulkStatus.mutate({ ids: selected, status: "EXPIRED" })}>Set Expired</Button>
              <Button size="sm" variant="outline" onClick={() => exportCsv(jobs.filter((j) => selected.includes(j.id)))}>Export selected</Button>
              <Button size="sm" variant="destructive" onClick={() => bulkDelete.mutate(selected)}>Delete selected</Button>
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
                    <TableHead className="w-8"><Checkbox checked={jobs.length > 0 && selected.length === jobs.length} onCheckedChange={(v) => toggleAll(!!v)} /></TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Date</TableHead>
                    <TableHead>Vacancies</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => {
                    const overdue = isOverdue(job.lastDate)
                    const soon = isExpiringSoon(job.lastDate)
                    return (
                      <TableRow key={job.id} className={cn(overdue && "bg-red-50/50")}>
                        <TableCell><Checkbox checked={selected.includes(job.id)} onCheckedChange={(v) => setSelected(v ? [...selected, job.id] : selected.filter((s) => s !== job.id))} /></TableCell>
                        <TableCell className="max-w-[260px]">
                          <span className="block truncate font-medium">{job.title}</span>
                          <span className="text-xs text-gray-400">{job.advertisementNo || job.slug}</span>
                        </TableCell>
                        <TableCell>{job.department.name}</TableCell>
                        <TableCell>
                          <Select value={job.status} onValueChange={(v) => statusMutation.mutate({ id: job.id, status: v })}>
                            <SelectTrigger className={cn("h-7 w-28 text-xs", getStatusColor(job.status))}><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ACTIVE">Active</SelectItem>
                              <SelectItem value="UPCOMING">Upcoming</SelectItem>
                              <SelectItem value="EXPIRED">Expired</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className={cn(overdue && "font-semibold text-red-600", soon && "font-semibold text-amber-600")}>
                          {formatDate(job.lastDate) || "-"}
                          {overdue && <span className="ml-1 text-xs">(overdue)</span>}
                          {soon && <span className="ml-1 text-xs">(soon)</span>}
                        </TableCell>
                        <TableCell>{job.totalVacancies ?? "N/A"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" title="View" onClick={() => setViewItem(job)}><Eye className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" title="Edit" onClick={() => openEdit(job)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" title="Duplicate" onClick={() => cloneJob(job)}><Copy className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" title="Delete" onClick={() => setDeleteId(job.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {jobs.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-gray-500">No jobs found. Adjust filters or add a new job.</TableCell></TableRow>}
                </TableBody>
              </Table>
              {pagination && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-gray-500">Total: {pagination.total} jobs</p>
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
          title={editingId ? "Edit Job" : "Add New Job"}
          onSubmit={form.handleSubmit(onSubmit)}
          saving={createMutation.isPending || updateMutation.isPending}
          submitLabel={editingId ? "Update Job" : "Create Job"}
          tabs={[
            {
              id: "basic", label: "Basic Info", content: (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="title" render={({ field }) => (
                      <FormItem><FormLabel>Title *</FormLabel><FormControl><Input {...field} placeholder="e.g. SSC CGL 2026, 14,582 Posts" onChange={(e) => { field.onChange(e); if (!editingId) form.setValue("slug", slugify(e.target.value)) }} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormTextField control={form.control} name="slug" label="Slug *" placeholder="ssc-cgl-2026" nullable={false} />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <FormSelectField control={form.control} name="departmentId" label="Department *" options={departments} />
                    <FormSelectField control={form.control} name="categoryId" label="Category *" options={categories} />
                    <FormSelectField control={form.control} name="stateId" label="State" options={states} allowClear clearLabel="No state (All India)" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <FormSelectField control={form.control} name="status" label="Status" options={[{ value: "ACTIVE", label: "Active" }, { value: "UPCOMING", label: "Upcoming" }, { value: "EXPIRED", label: "Expired" }]} />
                    <FormTextField control={form.control} name="advertisementNo" label="Advertisement No" placeholder="Advt. No. 12/2026" />
                    <FormTextField control={form.control} name="totalVacancies" label="Total Vacancies" type="number" placeholder="14582" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <FormTextField control={form.control} name="salary" label="Salary / Pay Scale" placeholder="₹35,400 – ₹1,12,400" />
                    <FormTextField control={form.control} name="location" label="Location" placeholder="New Delhi" />
                    <FormTextField control={form.control} name="experience" label="Experience" placeholder="0–2 years" />
                  </div>
                </div>
              ),
            },
            {
              id: "dates", label: "Dates & Fees", content: (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormDateField control={form.control} name="startDate" label="Application Start" />
                    <FormDateField control={form.control} name="lastDate" label="Last Date *" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormTextField control={form.control} name="ageLimit" label="Age Limit" placeholder="18–32 years" />
                    <FormTextField control={form.control} name="ageRelaxation" label="Age Relaxation" placeholder="SC/ST: 5 yrs, OBC: 3 yrs" />
                  </div>
                  <FormTextareaField control={form.control} name="applicationFee" label="Application Fee" rows={3} placeholder="General/OBC: ₹100 · SC/ST/Women: Nil" />
                  <div>
                    <p className="mb-2 text-sm font-medium">Important Dates</p>
                    <FormField control={form.control} name="importantDates" render={({ field }) => (
                      <FormItem><FormControl><ImportantDatesEditor value={field.value as Record<string, string> | null} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                </div>
              ),
            },
            {
              id: "content", label: "Content & Details", content: (
                <div className="space-y-4">
                  <FormRichField control={form.control} name="education" label="Eligibility / Education" />
                  <FormRichField control={form.control} name="selectionProcess" label="Selection Process" />
                  <FormRichField control={form.control} name="documentsRequired" label="Documents Required" />
                  <FormRichField control={form.control} name="howToApply" label="How to Apply" />
                </div>
              ),
            },
            {
              id: "links", label: "Links & SEO", content: (
                <div className="space-y-4">
                  <FormUrlField control={form.control} name="officialNotification" label="Official Notification URL" />
                  <FormUrlField control={form.control} name="officialWebsite" label="Official Website URL" />
                  <FormUrlField control={form.control} name="applyLink" label="Apply Online Link" />
                  <p className="rounded-md bg-gray-50 p-3 text-xs text-gray-500">Public URL preview: <span className="font-mono">/jobs/{form.watch("slug") || "your-slug"}</span>. The slug must be unique.</p>
                </div>
              ),
            },
          ]}
        />
      </Form>

      <Sheet open={!!viewItem} onOpenChange={(o) => { if (!o) setViewItem(null) }}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader><SheetTitle>{viewItem?.title}</SheetTitle><SheetDescription className="font-mono text-xs">{viewItem?.slug}</SheetDescription></SheetHeader>
          {viewItem && (
            <dl className="mt-4 space-y-2 text-sm">
              {[["Department", viewItem.department.name], ["Category", viewItem.category.name], ["State", viewItem.state?.name ?? "All India"], ["Status", viewItem.status], ["Advt No", viewItem.advertisementNo ?? "-"], ["Vacancies", String(viewItem.totalVacancies ?? "-")], ["Salary", viewItem.salary ?? "-"], ["Location", viewItem.location ?? "-"], ["Start", formatDate(viewItem.startDate) || "-"], ["Last date", formatDate(viewItem.lastDate) || "-"]].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b py-1.5"><dt className="text-gray-500">{k}</dt><dd className="text-right font-medium">{v}</dd></div>
              ))}
            </dl>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Delete Job</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-500">Permanently delete this job? Linked results, admit cards and bookmarks may also be affected. This cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
