"use client"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api, fetcher } from "@/lib/api"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { notificationSchema, type NotificationInput } from "@/lib/validations"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
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
import { isAdmin } from "@/lib/roles"
import { Plus, Pencil, Trash2, TrendingUp, ExternalLink } from "lucide-react"

interface NotificationItem {
  id: string; title: string; slug: string; content: string | null
  categoryId: string; type: string | null; officialUrl: string | null
  isTrending: boolean; views: number
  createdAt: string
  category: { id: string; name: string; slug: string }
}

interface CategoryItem {
  id: string; name: string; slug: string; description: string | null; createdAt: string
}

const NOTIFICATION_TYPES = [
  { value: "JOB", label: "Job" },
  { value: "PRIVATE_JOB", label: "Private Job" },
  { value: "RESULT", label: "Result" },
  { value: "ADMIT_CARD", label: "Admit Card" },
  { value: "ADMISSION", label: "Admission" },
  { value: "SYLLABUS", label: "Syllabus" },
  { value: "ANSWER_KEY", label: "Answer Key" },
  { value: "BLOG", label: "Blog Post" },
  { value: "GENERAL", label: "General" },
]

const TYPE_CONTENT_ENDPOINTS: Record<string, string> = {
  JOB: "/api/jobs?limit=200",
  PRIVATE_JOB: "/api/private-jobs?limit=200",
  RESULT: "/api/results?limit=200",
  ADMIT_CARD: "/api/admit-cards?limit=200",
  ADMISSION: "/api/admissions?limit=200",
  SYLLABUS: "/api/syllabus?limit=200",
  ANSWER_KEY: "/api/answer-keys?limit=200",
  BLOG: "/api/blog?limit=200&scope=mine",
}

export default function AdminNotifications() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: notifData, isLoading } = useQuery<{ success: boolean; data: NotificationItem[] }>({
    queryKey: ["admin-notifications"],
    queryFn: () => fetcher("/api/notifications?limit=100"),
  })

  const { data: categoriesData } = useQuery<{ success: boolean; data: CategoryItem[] }>({
    queryKey: ["admin-notification-categories"],
    queryFn: () => fetcher("/api/categories"),
  })

  const form = useForm<NotificationInput>({
    resolver: zodResolver(notificationSchema) as any,
    defaultValues: { title: "", slug: "", content: null, categoryId: "", type: null, officialUrl: null, isTrending: false },
  })

  const watchedType = form.watch("type")
  const watchedSlug = form.watch("slug")

  const { data: contentData } = useQuery<{
    success: boolean
    data: { id: string; title: string; slug: string }[]
  }>({
    queryKey: ["notification-content-options", watchedType],
    queryFn: () => fetcher(TYPE_CONTENT_ENDPOINTS[watchedType as string]),
    enabled: !!watchedType && watchedType !== "GENERAL" && !!TYPE_CONTENT_ENDPOINTS[watchedType as string],
  })

  const createMutation = useMutation({
    mutationFn: (data: NotificationInput) => api.post("/api/notifications", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-notifications"] }); setDialogOpen(false); form.reset(); toast("Notification created", "success") },
    onError: (err: Error) => toast(err.message, "destructive"),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: NotificationInput }) => api.put(`/api/notifications/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-notifications"] }); setDialogOpen(false); setEditingId(null); form.reset(); toast("Notification updated", "success") },
    onError: (err: Error) => toast(err.message, "destructive"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/notifications/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-notifications"] }); setDeleteId(null); toast("Notification deleted", "success") },
    onError: (err: Error) => toast(err.message, "destructive"),
  })

  if (status === "loading") return <Skeleton className="h-96" />
  if (!session || !isAdmin(session.user.role)) { router.push("/login"); return null }

  const notifications = notifData?.data || []
  const categories = categoriesData?.data || []
  const matchedContent = contentData?.data?.find((c) => c.slug === watchedSlug)

  const onSubmit = (data: NotificationInput) => {
    if (editingId) { updateMutation.mutate({ id: editingId, data }) }
    else { createMutation.mutate(data) }
  }

  const openEdit = (n: NotificationItem) => {
    setEditingId(n.id)
    form.reset({ title: n.title, slug: n.slug, content: n.content, categoryId: n.categoryId, type: n.type, officialUrl: n.officialUrl, isTrending: n.isTrending })
    setDialogOpen(true)
  }

  const openCreate = () => {
    setEditingId(null)
    form.reset({ title: "", slug: "", content: null, categoryId: categories[0]?.id || "", type: null, officialUrl: null, isTrending: false })
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-gray-500">Users with notification permissions enabled receive these instantly.</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-1 h-4 w-4" /> Add Notification</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? <Skeleton className="h-64" /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell className="max-w-[280px]">
                      <div className="flex items-center gap-1.5 font-medium">
                        <span className="truncate">{n.title}</span>
                        {n.isTrending && (
                          <Badge variant="outline" className="shrink-0 gap-1 text-[10px] text-orange-600">
                            <TrendingUp className="h-3 w-3" /> Trending
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-500">{n.category.name}</TableCell>
                    <TableCell>
                      {n.type ? (
                        <Badge variant="secondary" className="text-[10px]">{n.type.replace(/_/g, " ")}</Badge>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {n.officialUrl ? (
                        <a href={n.officialUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline" title={n.officialUrl}>
                          <ExternalLink className="h-3 w-3" /> Official
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-500">{n.views}</TableCell>
                    <TableCell>{formatDate(n.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(n)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(n.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {notifications.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-gray-500">No notifications found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Edit Notification" : "Add Notification"}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} onChange={(e) => { field.onChange(e); form.setValue("slug", slugify(e.target.value)) }} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="slug" render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  {matchedContent ? (
                    <p className="text-xs text-emerald-600">View Details button will link to: {matchedContent.title}</p>
                  ) : watchedSlug && contentData?.data?.length ? (
                    <p className="text-xs text-amber-600">No content with this slug — the View Details button will be hidden.</p>
                  ) : null}
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="categoryId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select value={field.value || ""} onValueChange={(v) => field.onChange(v || null)}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {NOTIFICATION_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              {watchedType && watchedType !== "GENERAL" && TYPE_CONTENT_ENDPOINTS[watchedType] && (
                <div className="space-y-2">
                  <Label>Link to Existing Content (optional)</Label>
                  <Select
                    value={matchedContent ? watchedSlug : undefined}
                    onValueChange={(v) => { if (v) form.setValue("slug", v, { shouldValidate: true }) }}
                  >
                    <SelectTrigger><SelectValue placeholder="Select content — fills the slug automatically" /></SelectTrigger>
                    <SelectContent>
                      {(contentData?.data || []).map((c) => (
                        <SelectItem key={c.id} value={c.slug}>{c.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">Choosing an item links this notification to the exact content so the "View Details" button works. You can also type the slug manually.</p>
                </div>
              )}
              <FormField control={form.control} name="content" render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value || null)} rows={4} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="officialUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>Official Link (PDF / Notification URL)</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value || null)} placeholder="https://bpsc.bih.nic.in/notification.pdf" />
                  </FormControl>
                  <p className="text-xs text-gray-500">The "Official Link" button on the public notification card points here. Leave empty if not needed.</p>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="isTrending" render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label htmlFor="isTrending" className="text-sm font-medium">Trending</Label>
                    <p className="text-xs text-gray-500">Show in the trending notifications section</p>
                  </div>
                  <FormControl>
                    <Switch id="isTrending" checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
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
          <DialogHeader><DialogTitle>Delete Notification</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-500">Are you sure? This action cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
