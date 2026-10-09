"use client"
import { useState, useEffect } from "react"
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
import { formatDate, getStatusColor, slugify } from "@/lib/utils"
import { isAdmin, isSuperAdmin } from "@/lib/roles"
import { ScopeToolbar } from "@/components/admin/ScopeToolbar"
import { UploaderCell } from "@/components/admin/UploaderCell"
import { ModerationBadge } from "@/components/admin/ModerationBadge"
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

interface Department { id: string; name: string }
interface Category { id: string; name: string }
interface State { id: string; name: string }
interface JobItem {
  id: string; title: string; slug: string; status: string; advertisementNo: string | null; totalVacancies: number | null; salary: string | null; location: string | null; ageLimit: string | null; ageRelaxation: string | null; education: string | null; selectionProcess: string | null; applicationFee: string | null; importantDates: Record<string, string> | null; documentsRequired: string | null; howToApply: string | null; officialNotification: string | null; officialWebsite: string | null; applyLink: string | null; experience: string | null; startDate: string | null; lastDate: string | null; createdAt: string
  department: Department; category: Category; state: State | null
  moderation?: string | null; reviewNote?: string | null; createdBy?: { id: string; name: string | null; email: string; role?: string | null } | null; createdById?: string | null
}

const WIZARD_STEPS = ["Basic info", "Details & content", "Links & dates", "Review"]
const EMPTY_FORM: JobInput = {
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
  const [scope, setScope] = useState<"mine" | "all">("mine")
  const [moderationFilter, setModerationFilter] = useState("")
  const [adminIdFilter, setAdminIdFilter] = useState("")
  const [queueOnly, setQueueOnly] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [wizardStep, setWizardStep] = useState(0)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const superView = isSuperAdmin(session?.user?.role)
  useEffect(() => {
    if (superView) {
      // Full listing by default — super-admin (manual + bulk) uploads included.
      setScope("all")
      setModerationFilter("")
      setQueueOnly(false)
    }
  }, [superView])

  const { data: jobsData, isLoading } = useQuery<{ success: boolean; data: JobItem[]; pagination: { page: number; totalPages: number; total: number } }>({
    queryKey: ["admin-jobs", page, search, statusFilter, scope, moderationFilter, adminIdFilter, queueOnly],
    queryFn: () => fetcher(`/api/jobs?page=${page}&limit=10&search=${search}&status=${statusFilter}&scope=${scope}${moderationFilter ? `&moderation=${moderationFilter}` : ""}${scope === "all" && adminIdFilter ? `&createdById=${encodeURIComponent(adminIdFilter)}` : ""}${queueOnly ? "&onlyAdmins=true" : ""}`),
  })

  const { data: deptsData } = useQuery<{ success: boolean; data: Department[] }>({
    queryKey: ["admin-departments"],
    queryFn: () => fetcher("/api/departments"),
  })

  const { data: catsData } = useQuery<{ success: boolean; data: Category[] }>({
    queryKey: ["admin-categories"],
    queryFn: () => fetcher("/api/categories"),
  })

  const { data: statesData } = useQuery<{ success: boolean; data: State[] }>({
    queryKey: ["admin-states"],
    queryFn: () => fetcher("/api/states"),
  })

  const form = useForm<JobInput>({
    resolver: zodResolver(jobSchema) as any,
    defaultValues: EMPTY_FORM,
  })

  const createMutation = useMutation({
    mutationFn: (data: JobInput) => api.post("/api/jobs", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-jobs"] }); setDialogOpen(false); form.reset(); toast("Job created", "success") },
    onError: (err: Error) => toast(err.message, "destructive"),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: JobInput }) => api.put(`/api/jobs/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-jobs"] }); setDialogOpen(false); setEditingId(null); form.reset(); toast("Job updated", "success") },
    onError: (err: Error) => toast(err.message, "destructive"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/jobs/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-jobs"] }); setDeleteId(null); toast("Job deleted", "success") },
    onError: (err: Error) => toast(err.message, "destructive"),
  })

  if (status === "loading") return <Skeleton className="h-96" />
  if (!session || !isAdmin(session.user.role)) { router.push("/login"); return null }

  const jobs = jobsData?.data || []
  const pagination = jobsData?.pagination
  const departments = deptsData?.data || []
  const categories = catsData?.data || []
  const states = statesData?.data || []

  const onSubmit = (data: JobInput) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const openEdit = (job: JobItem) => {
    setEditingId(job.id)
    setWizardStep(0)
    form.reset({
      title: job.title,
      slug: job.slug,
      departmentId: job.department.id,
      categoryId: job.category.id,
      stateId: job.state?.id || null,
      advertisementNo: job.advertisementNo,
      totalVacancies: job.totalVacancies,
      salary: job.salary,
      location: job.location,
      ageLimit: job.ageLimit,
      ageRelaxation: job.ageRelaxation,
      education: job.education,
      selectionProcess: job.selectionProcess,
      applicationFee: job.applicationFee,
      importantDates: job.importantDates,
      documentsRequired: job.documentsRequired,
      howToApply: job.howToApply,
      officialNotification: job.officialNotification,
      officialWebsite: job.officialWebsite,
      applyLink: job.applyLink,
      status: job.status as "ACTIVE" | "EXPIRED" | "UPCOMING",
      experience: job.experience,
      startDate: job.startDate ? new Date(job.startDate) : null,
      lastDate: job.lastDate ? new Date(job.lastDate) : null,
    })
    setDialogOpen(true)
  }

  const openCreate = () => {
    setEditingId(null)
    setWizardStep(0)
    form.reset({ ...EMPTY_FORM })
    setDialogOpen(true)
  }

  const toggleStatus = async (job: JobItem) => {
    const next = job.status === "ACTIVE" ? "EXPIRED" : "ACTIVE"
    setTogglingId(job.id)
    try {
      const payload: JobInput = {
        title: job.title, slug: job.slug,
        departmentId: job.department.id, categoryId: job.category.id,
        stateId: job.state?.id ?? null, advertisementNo: job.advertisementNo,
        totalVacancies: job.totalVacancies, salary: job.salary, location: job.location,
        ageLimit: job.ageLimit, ageRelaxation: job.ageRelaxation, education: job.education,
        selectionProcess: job.selectionProcess, applicationFee: job.applicationFee,
        importantDates: job.importantDates, documentsRequired: job.documentsRequired,
        howToApply: job.howToApply, officialNotification: job.officialNotification,
        officialWebsite: job.officialWebsite, applyLink: job.applyLink,
        status: next as "ACTIVE" | "EXPIRED" | "UPCOMING", experience: job.experience,
        startDate: job.startDate ? new Date(job.startDate) : null,
        lastDate: job.lastDate ? new Date(job.lastDate) : null,
      }
      await api.put(`/api/jobs/${job.id}`, payload)
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] })
      toast(`Job marked ${next}`, "success")
    } catch (e) {
      toast(e instanceof Error ? e.message : "Status update failed", "destructive")
    } finally {
      setTogglingId(null)
    }
  }

  const copyLink = async (job: JobItem) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/apply/${job.slug}`)
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
      for (const id of selected) {
        await api.delete(`/api/jobs/${id}`)
      }
      setSelected(new Set())
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] })
      toast(`${selected.size} jobs deleted`, "success")
    } catch (e) {
      toast(e instanceof Error ? e.message : "Bulk delete failed", "destructive")
    } finally {
      setBulkDeleting(false)
    }
  }

  const handleExport = () => {
    const rows = jobs.filter((j) => selected.size === 0 || selected.has(j.id)).map((j) => flattenForCsv(j as unknown as Record<string, unknown>))
    exportToCsv(rows, "jobs-export")
    toast("CSV exported", "success")
  }

  const nextStep = async () => {
    const stepFields: Record<number, (keyof JobInput)[]> = {
      0: ["title", "slug", "departmentId", "categoryId", "status"],
      1: ["education", "selectionProcess", "applicationFee", "documentsRequired", "howToApply"],
      2: ["officialNotification", "officialWebsite", "applyLink", "startDate", "lastDate"],
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
        title="Jobs"
        subtitle="Government job postings - plain text or styled HTML, previewed exactly as readers see it."
        total={pagination?.total}
        totalLabel="jobs"
        actionLabel="Add New Job"
        onAction={openCreate}
      />

      <Card className="overflow-hidden rounded-2xl border-gray-200 shadow-sm dark:border-gray-800">
        <CardHeader className="space-y-3 border-b border-gray-100 bg-white pb-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search jobs by title, department..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="bg-gray-50 pl-9 dark:bg-gray-800"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="UPCOMING">Upcoming</SelectItem>
              </SelectContent>
            </Select>
            <ScopeToolbar role={session?.user?.role} scope={scope} onScopeChange={(s)=>{setScope(s); setPage(1)}} moderation={moderationFilter} onModerationChange={(m)=>{setModerationFilter(m);setPage(1)}} adminId={adminIdFilter} onAdminIdChange={(v)=>{setAdminIdFilter(v);setPage(1)}} queueOnly={queueOnly} onQueueOnlyChange={(v)=>{setQueueOnly(v); if (v) setModerationFilter("PENDING"); setPage(1)}} />
          </div>
          <BulkActionBar
            selectedCount={selected.size}
            onClear={() => setSelected(new Set())}
            onDelete={handleBulkDelete}
            onExport={handleExport}
            deleting={bulkDeleting}
          />
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? <div className="p-4"><Skeleton className="h-64" /></div> : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/80 hover:bg-gray-50/80 dark:bg-gray-800/40">
                      <TableHead className="w-10">
                        <Checkbox checked={jobs.length > 0 && selected.size === jobs.length} onCheckedChange={toggleSelectAll} aria-label="Select all" />
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide">Title</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide">Department</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide">Category</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide">Status</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide">Last Date</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide">Vacancies</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide">Uploaded by</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide">Status</TableHead>
                      <TableHead className="text-right text-xs font-semibold uppercase tracking-wide">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="popLayout">
                      {jobs.map((job) => (
                        <motion.tr
                          key={job.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="border-b border-gray-100 transition-colors last:border-0 hover:bg-teal-50/40 dark:border-gray-800 dark:hover:bg-gray-800/50"
                        >
                          <TableCell>
                            <Checkbox checked={selected.has(job.id)} onCheckedChange={() => toggleSelect(job.id)} aria-label={`Select ${job.title}`} />
                          </TableCell>
                          <TableCell className="max-w-[260px] truncate font-medium">{job.title}</TableCell>
                          <TableCell className="whitespace-nowrap text-gray-600 dark:text-gray-400">{job.department.name}</TableCell>
                          <TableCell className="whitespace-nowrap text-gray-600 dark:text-gray-400">{job.category.name}</TableCell>
                          <TableCell><Badge className={getStatusColor(job.status)}>{job.status}</Badge></TableCell>
                          <TableCell className="whitespace-nowrap">{formatDate(job.lastDate) || "-"}</TableCell>
                          <TableCell className="tabular-nums">{job.totalVacancies ?? "N/A"}</TableCell>
                          <TableCell><UploaderCell name={job.createdBy?.name} email={job.createdBy?.email} id={job.createdBy?.id || job.createdById} role={job.createdBy?.role} /></TableCell>
                          <TableCell><ModerationBadge value={job.moderation} /></TableCell>
                          <TableCell className="text-right">
                            <RowActions
                              onEdit={() => openEdit(job)}
                              viewHref={`/apply/${job.slug}`}
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
                    {jobs.length === 0 && (
                      <TableRow><TableCell colSpan={10} className="py-10 text-center text-gray-500">No jobs found. Try a different search or add a new job.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              {pagination && (
                <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 p-4 sm:flex-row dark:border-gray-800">
                  <p className="text-sm text-gray-500">Total: {pagination.total} jobs</p>
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
            <DialogTitle className="text-lg">{editingId ? "Edit Job" : "Add New Job"}</DialogTitle>
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
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                    <FormField control={form.control} name="stateId" render={({ field }) => (
                      <FormItem><FormLabel>State (optional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger></FormControl>
                          <SelectContent><SelectItem value=" ">None</SelectItem>{states.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
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
                    <div><dt className="text-xs uppercase tracking-wide text-gray-400">Title</dt><dd className="font-medium">{watched.title || "-"}</dd></div>
                    <div><dt className="text-xs uppercase tracking-wide text-gray-400">Slug</dt><dd className="font-mono text-xs">{watched.slug || "-"}</dd></div>
                    <div><dt className="text-xs uppercase tracking-wide text-gray-400">Status</dt><dd><Badge className={getStatusColor(watched.status || "ACTIVE")}>{watched.status}</Badge></dd></div>
                    <div><dt className="text-xs uppercase tracking-wide text-gray-400">Vacancies</dt><dd>{watched.totalVacancies ?? "N/A"}</dd></div>
                    <div><dt className="text-xs uppercase tracking-wide text-gray-400">Last date</dt><dd>{watched.lastDate ? formatDate(watched.lastDate) : "-"}</dd></div>
                    <div><dt className="text-xs uppercase tracking-wide text-gray-400">Apply link</dt><dd className="truncate text-teal-700">{watched.applyLink || "-"}</dd></div>
                  </dl>
                </FormSection>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
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
                      {editingId ? "Update" : "Create"} Job
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!deleteId}
        title="Delete Job"
        itemLabel={jobs.find((j) => j.id === deleteId)?.title}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        pending={deleteMutation.isPending}
      />
    </div>
  )
}
