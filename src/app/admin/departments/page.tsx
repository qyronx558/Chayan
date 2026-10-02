"use client"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api, fetcher } from "@/lib/api"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { departmentSchema, type DepartmentInput } from "@/lib/validations"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form"
import { toast } from "@/components/ui/toast"
import { formatDate, slugify } from "@/lib/utils"
import { isAdmin, isSuperAdmin } from "@/lib/roles"
import { AdminIdBadge } from "@/components/admin/AdminIdBadge"
import { Plus, Pencil, Trash2, Search } from "lucide-react"

interface DepartmentItem {
  id: string
  name: string
  slug: string
  description: string | null
  createdAt: string
  createdById: string | null
  createdBy?: { id: string; name: string | null; email: string } | null
  _count?: { job: number; result: number; admitCard: number; answerKey: number; admission: number; syllabus: number }
}

export default function AdminDepartments() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  const { data: deptsData, isLoading } = useQuery<{ success: boolean; data: DepartmentItem[] }>({
    queryKey: ["admin-departments"],
    queryFn: () => fetcher("/api/departments"),
  })

  const form = useForm<DepartmentInput>({
    resolver: zodResolver(departmentSchema) as any,
    defaultValues: { name: "", slug: "", description: null },
  })

  const createMutation = useMutation({
    mutationFn: (data: DepartmentInput) => api.post("/api/departments", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-departments"] }); setDialogOpen(false); form.reset(); toast("Department created", "success") },
    onError: (err: Error) => toast(err.message, "destructive"),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: DepartmentInput }) => api.put(`/api/departments/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-departments"] }); setDialogOpen(false); setEditingId(null); form.reset(); toast("Department updated", "success") },
    onError: (err: Error) => toast(err.message, "destructive"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/departments/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-departments"] }); setDeleteId(null); toast("Department deleted", "success") },
    onError: (err: Error) => toast(err.message, "destructive"),
  })

  if (status === "loading") return <Skeleton className="h-96" />
  if (!session || !isAdmin(session.user.role)) { router.push("/login"); return null }

  const superView = isSuperAdmin(session?.user?.role)
  const myId = session?.user?.id
  const all = deptsData?.data || []
  const q = search.trim().toLowerCase()
  const departments = q
    ? all.filter((d) => d.name.toLowerCase().includes(q) || d.slug.toLowerCase().includes(q))
    : all

  const canManage = (d: DepartmentItem) => superView || (d.createdById != null && d.createdById === myId)

  const onSubmit = (data: DepartmentInput) => {
    if (editingId) { updateMutation.mutate({ id: editingId, data }) }
    else { createMutation.mutate(data) }
  }

  const openEdit = (dept: DepartmentItem) => {
    if (!canManage(dept)) {
      toast("You can only edit departments you uploaded", "destructive")
      return
    }
    setEditingId(dept.id)
    form.reset({ name: dept.name, slug: dept.slug, description: dept.description })
    setDialogOpen(true)
  }

  const openCreate = () => {
    setEditingId(null)
    form.reset({ name: "", slug: "", description: null })
    setDialogOpen(true)
  }

  const usageOf = (d: DepartmentItem) =>
    (d._count?.job ?? 0) + (d._count?.result ?? 0) + (d._count?.admitCard ?? 0) +
    (d._count?.answerKey ?? 0) + (d._count?.admission ?? 0) + (d._count?.syllabus ?? 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Departments</h1>
          <p className="text-sm text-gray-500">
            Used as a filter on the gov-jobs page. You can only edit or delete departments you uploaded.
          </p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-1 h-4 w-4" /> Add Department</Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search departments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? <Skeleton className="h-64" /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Uploaded by</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((dept) => {
                  const allowed = canManage(dept)
                  return (
                    <TableRow key={dept.id}>
                      <TableCell className="font-medium">{dept.name}</TableCell>
                      <TableCell className="text-gray-500">{dept.slug}</TableCell>
                      <TableCell className="tabular-nums text-gray-600">{usageOf(dept)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="whitespace-nowrap text-xs text-gray-600">{dept.createdBy?.name || dept.createdBy?.email || (dept.createdById ? dept.createdById : "System")}</p>
                          <AdminIdBadge id={dept.createdBy?.id || dept.createdById} />
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(dept.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(dept)}
                            disabled={!allowed}
                            title={allowed ? "Edit department" : "Only the uploader (or super admin) can edit this"}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (!allowed) { toast("You can only delete departments you uploaded", "destructive"); return }
                              setDeleteId(dept.id)
                            }}
                            disabled={!allowed}
                            title={allowed ? "Delete department" : "Only the uploader (or super admin) can delete this"}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {departments.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-gray-500">No departments found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Edit Department" : "Add Department"}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} onChange={(e) => { field.onChange(e); form.setValue("slug", slugify(e.target.value)) }} placeholder="e.g. Staff Selection Commission" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="slug" render={({ field }) => (
                <FormItem><FormLabel>Slug</FormLabel><FormControl><Input {...field} placeholder="staff-selection-commission" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value || null)} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingId ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Delete Department</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-500">Are you sure? Departments in use by jobs or other content cannot be deleted. This action cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
