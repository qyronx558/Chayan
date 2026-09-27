"use client"

import { useState, useEffect, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api, fetcher } from "@/lib/api"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  featuredItemSchema, featuredItemTypes, featuredCtaLabels, type FeaturedItemInput,
} from "@/lib/validations"
import { FEATURED_TYPE_LABELS, FEATURED_TYPE_BADGES } from "@/lib/featured"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form"
import { toast } from "@/components/ui/toast"
import { formatDate } from "@/lib/utils"
import { FeaturedSlideView, type FeaturedSlideItem } from "@/components/featured/FeaturedSlideView"
import {
  Plus, Pencil, Trash2, Eye, Star, GripVertical, Upload, Replace,
} from "lucide-react"

interface Option {
  value: string
  label: string
  url: string
  org?: string
  info?: string
  dateText?: string
}

interface AdminFeaturedItem extends FeaturedSlideItem {
  sortOrder: number
  isActive: boolean
  startDate: string | null
  endDate: string | null
}

export default function AdminFeaturedSlider() {
  const queryClient = useQueryClient()
  const [items, setItems] = useState<AdminFeaturedItem[]>([])
  const [dragging, setDragging] = useState<number | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [previewItem, setPreviewItem] = useState<AdminFeaturedItem | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [optionType, setOptionType] = useState("JOB")
  const [options, setOptions] = useState<Option[]>([])
  const [optionsLoading, setOptionsLoading] = useState(false)

  const { data: featuredData, isLoading } = useQuery<{ success: boolean; data: AdminFeaturedItem[] }>({
    queryKey: ["admin-featured"],
    queryFn: () => fetcher("/api/featured"),
  })

  useEffect(() => {
    const data = featuredData?.data || []
    const sorted = [...data].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
      return a.sortOrder - b.sortOrder
    })
    setItems(sorted)
  }, [featuredData])

  const form = useForm<FeaturedItemInput>({
    resolver: zodResolver(featuredItemSchema) as any,
    defaultValues: {
      title: "", type: "JOB", badge: FEATURED_TYPE_BADGES.JOB, organization: "",
      info: "", dateText: "", image: "", ctaLabel: "View Details", ctaUrl: "",
      linkUrl: "", isActive: true, isPinned: false, startDate: null, endDate: null,
    },
  })

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["admin-featured"] })
  }, [queryClient])

  const createMutation = useMutation({
    mutationFn: (data: FeaturedItemInput) => api.post("/api/featured", data),
    onSuccess: () => { invalidate(); setDialogOpen(false); form.reset(); toast("Slide created", "success") },
    onError: (err: Error) => toast(err.message, "destructive"),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FeaturedItemInput }) => api.put(`/api/featured/${id}`, data),
    onSuccess: () => { invalidate(); setDialogOpen(false); setEditingId(null); form.reset(); toast("Slide updated", "success") },
    onError: (err: Error) => toast(err.message, "destructive"),
  })

  const patchMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => api.put(`/api/featured/${id}`, data),
    onSuccess: () => invalidate(),
    onError: (err: Error) => toast(err.message, "destructive"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/featured/${id}`),
    onSuccess: () => { invalidate(); setDeleteId(null); toast("Slide deleted", "success") },
    onError: (err: Error) => toast(err.message, "destructive"),
  })

  const toggleActive = (item: AdminFeaturedItem) => {
    patchMutation.mutate({ id: item.id, data: { isActive: !item.isActive } })
  }

  const loadOptions = useCallback(async (type: string) => {
    setOptionsLoading(true)
    try {
      const res = await fetcher<{ success: boolean; data: Option[] }>(`/api/featured/options?type=${type}`)
      setOptions(res.data || [])
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to load options", "destructive")
      setOptions([])
    } finally {
      setOptionsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (dialogOpen) loadOptions(optionType)
  }, [dialogOpen, optionType, loadOptions])

  const applyOption = (opt: Option) => {
    form.setValue("title", opt.label)
    form.setValue("linkUrl", opt.url)
    form.setValue("organization", opt.org || "")
    form.setValue("info", opt.info || "")
    form.setValue("dateText", opt.dateText || "")
    toast("Content linked to slide", "success")
  }

  const uploadImage = async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("folder", "featured")
      fd.append("transform", "slide")
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || "Upload failed")
      form.setValue("image", json.url)
      toast("Image uploaded", "success")
    } catch (err) {
      toast(err instanceof Error ? err.message : "Upload failed", "destructive")
    } finally {
      setUploading(false)
    }
  }

  const onSubmit = (data: FeaturedItemInput) => {
    const payload = { ...data, image: data.image || undefined, ctaUrl: data.ctaUrl || undefined }
    if (editingId) updateMutation.mutate({ id: editingId, data: payload })
    else createMutation.mutate(payload)
  }

  const openCreate = () => {
    setEditingId(null)
    form.reset({
      title: "", type: "JOB", badge: FEATURED_TYPE_BADGES.JOB, organization: "",
      info: "", dateText: "", image: "", ctaLabel: "View Details", ctaUrl: "",
      linkUrl: "", isActive: true, isPinned: false, startDate: null, endDate: null,
    })
    setDialogOpen(true)
  }

  const openEdit = (item: AdminFeaturedItem) => {
    setEditingId(item.id)
    form.reset({
      title: item.title,
      type: item.type as FeaturedItemInput["type"],
      badge: item.badge || "",
      organization: item.organization || "",
      info: item.info || "",
      dateText: item.dateText || "",
      image: item.image || "",
      ctaLabel: item.ctaLabel as FeaturedItemInput["ctaLabel"],
      ctaUrl: item.ctaUrl || "",
      linkUrl: item.linkUrl,
      isActive: item.isActive,
      isPinned: item.isPinned,
      startDate: item.startDate ? new Date(item.startDate) : null,
      endDate: item.endDate ? new Date(item.endDate) : null,
    })
    setDialogOpen(true)
  }

  const onDragStart = (index: number) => setDragging(index)
  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (dragging === null || dragging === index) return
    const reordered = [...items]
    const [moved] = reordered.splice(dragging, 1)
    reordered.splice(index, 0, moved)
    setDragging(index)
    setItems(reordered)
  }
  const onDragEnd = () => {
    setDragging(null)
    const patches = items.map((item, i) => ({ id: item.id, data: { sortOrder: i } }))
    const reqs = patches.map((p) => patchMutation.mutateAsync({ id: p.id, data: p.data }))
    Promise.all(reqs)
      .then(() => { invalidate(); toast("Order saved", "success") })
      .catch(() => toast("Failed to save order", "destructive"))
  }

  const typeBadgeClass = (type: string) => {
    switch (type) {
      case "RESULT": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "PRIVATE_JOB": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "ADMIT_CARD": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      default: return "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Featured Slider</h1>
          <p className="text-sm text-gray-500">Showcase selected content on the homepage slider</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-1 h-4 w-4" /> Add New Slide</Button>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle>Slides ({items.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-64" /> : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10" />
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow
                      key={item.id}
                      draggable
                      onDragStart={() => onDragStart(index)}
                      onDragOver={(e) => onDragOver(e, index)}
                      onDragEnd={onDragEnd}
                      className={dragging === index ? "bg-teal-50" : "cursor-grab"}
                    >
                      <TableCell>
                        <GripVertical className="h-4 w-4 text-gray-400" />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {item.isPinned && <Star className="h-4 w-4 fill-amber-400 text-amber-400" />}
                          <span className="font-medium">{item.title}</span>
                        </div>
                        {item.organization && (
                          <p className="text-xs text-gray-500">{item.organization}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={typeBadgeClass(item.type)}>
                          {FEATURED_TYPE_LABELS[item.type] || item.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={item.isActive}
                            onCheckedChange={() => toggleActive(item)}
                            aria-label="Toggle slide"
                          />
                          <span className={`text-xs font-medium ${item.isActive ? "text-green-600" : "text-gray-400"}`}>
                            {item.isActive ? "Active" : "Hidden"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => patchMutation.mutate({ id: item.id, data: { isPinned: !item.isPinned } })} title={item.isPinned ? "Unpin" : "Pin"}>
                            <Star className={`h-4 w-4 ${item.isPinned ? "fill-amber-400 text-amber-400" : "text-gray-400"}`} />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setPreviewItem(item)} title="Preview">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(item.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {items.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-gray-500">
                      No featured slides yet. Add one to see it on the homepage.
                    </TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit Slide" : "Add New Slide"}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
                <p className="mb-3 text-sm font-semibold text-teal-800">Link existing content (optional)</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={optionType} onValueChange={setOptionType}>
                    <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {featuredItemTypes.filter((t) => t !== "OTHER").map((t) => (
                        <SelectItem key={t} value={t}>{FEATURED_TYPE_LABELS[t]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select onValueChange={(v) => { const opt = options.find((o) => o.value === v); if (opt) applyOption(opt) }}>
                    <SelectTrigger className="min-w-52 flex-1">
                      <SelectValue placeholder={optionsLoading ? "Loading..." : "Choose item to link"} />
                    </SelectTrigger>
                    <SelectContent>
                      {options.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {options.slice(0, 6).map((o) => (
                    <Button key={o.value} type="button" variant="outline" size="sm" onClick={() => applyOption(o)}>
                      <Replace className="mr-1 h-3 w-3" /> {o.label.slice(0, 34)}{o.label.length > 34 ? "..." : ""}
                    </Button>
                  ))}
                </div>
              </div>

              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem><FormLabel>Content Type</FormLabel>
                    <Select
                      onValueChange={(v) => { field.onChange(v); form.setValue("badge", FEATURED_TYPE_BADGES[v]) }}
                      value={field.value}
                    >
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {featuredItemTypes.map((t) => <SelectItem key={t} value={t}>{FEATURED_TYPE_LABELS[t]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="badge" render={({ field }) => (
                  <FormItem><FormLabel>Badge Text</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="organization" render={({ field }) => (
                  <FormItem><FormLabel>Organization</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="dateText" render={({ field }) => (
                  <FormItem><FormLabel>Date / Last Date</FormLabel><FormControl><Input {...field} placeholder="Last Date: 25 Aug 2026" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <FormField control={form.control} name="info" render={({ field }) => (
                <FormItem><FormLabel>Important Information</FormLabel><FormControl><Input {...field} placeholder="14,582 Vacancies | Graduate | All India" /></FormControl><FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="image" render={({ field }) => (
                <FormItem>
                  <FormLabel>Slide Image (optional) <span className="text-xs font-normal text-gray-400">(1200x900 recommended, auto-cropped on upload)</span></FormLabel>
                  <div className="flex items-center gap-3">
                    <FormControl>
                      <Input type="file" accept="image/*" className="hidden" id="slide-image" disabled={uploading}
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f) }} />
                    </FormControl>
                    <label htmlFor="slide-image" className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <Upload className="h-4 w-4" /> {uploading ? "Uploading..." : "Upload Image"}
                    </label>
                    <Input placeholder="Or paste image URL" {...field} value={field.value || ""} onChange={field.onChange} />
                  </div>
                  {field.value ? (
                    <div className="mt-3 flex items-center gap-4">
                      <div className="relative aspect-[4/3] w-40 shrink-0 overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                        <img src={field.value} alt="Slide preview" className="h-full w-full object-cover object-center" />
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => form.setValue("image", "")}>Remove</Button>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-gray-400">No image. The slide will show without a visual.</p>
                  )}
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="ctaLabel" render={({ field }) => (
                  <FormItem><FormLabel>CTA Button</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {featuredCtaLabels.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="ctaUrl" render={({ field }) => (
                  <FormItem><FormLabel>CTA URL (optional)</FormLabel><FormControl><Input {...field} placeholder="https://example.com/apply" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <FormField control={form.control} name="linkUrl" render={({ field }) => (
                <FormItem><FormLabel>View Details URL</FormLabel><FormControl><Input {...field} placeholder="/jobs/example-slug or https://..." /></FormControl><FormMessage /></FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="startDate" render={({ field }) => (
                  <FormItem><FormLabel>Start Date (optional)</FormLabel>
                    <FormControl><Input type="date" value={field.value ? formatDate(field.value, "yyyy-MM-dd") : ""} onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="endDate" render={({ field }) => (
                  <FormItem><FormLabel>End Date (optional)</FormLabel>
                    <FormControl><Input type="date" value={field.value ? formatDate(field.value, "yyyy-MM-dd") : ""} onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="isActive" render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <FormLabel className="mb-0">Active on website</FormLabel>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="isPinned" render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <FormLabel className="mb-0">Pin to top</FormLabel>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )} />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending || uploading}>
                  {editingId ? "Update" : "Create"} Slide
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewItem} onOpenChange={(o) => { if (!o) setPreviewItem(null) }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="hidden"><DialogTitle>Slide Preview</DialogTitle></DialogHeader>
          {previewItem && (
            <div className="overflow-hidden rounded-lg bg-[#0a1628]">
              <FeaturedSlideView item={previewItem} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Delete Slide</DialogTitle></DialogHeader>
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