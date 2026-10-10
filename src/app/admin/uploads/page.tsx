"use client"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { fetcher } from "@/lib/api"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatDate } from "@/lib/utils"
import { useAdminPageSize, useDensity } from "@/lib/admin/usePageSize"
import { TableFooter } from "@/components/admin/data-table/TableFooter"
import { DensityToggle } from "@/components/admin/data-table/DensityToggle"
import { PageSizeSelect } from "@/components/admin/data-table/PageSizeSelect"
import { isSuperAdmin } from "@/lib/roles"
import { AdminIdBadge } from "@/components/admin/AdminIdBadge"
import { ModerationBadge } from "@/components/admin/ModerationBadge"
import { Search, Eye } from "lucide-react"

const ENTITIES = [
  { value: "Job", label: "Gov Jobs", endpoint: "/api/jobs" },
  { value: "PrivateJob", label: "Private Jobs", endpoint: "/api/private-jobs" },
  { value: "Result", label: "Results", endpoint: "/api/results" },
  { value: "AdmitCard", label: "Admit Cards", endpoint: "/api/admit-cards" },
  { value: "AnswerKey", label: "Answer Keys", endpoint: "/api/answer-keys" },
  { value: "Admission", label: "Admissions", endpoint: "/api/admissions" },
  { value: "Syllabus", label: "Syllabus", endpoint: "/api/syllabus" },
  { value: "Blog", label: "Blog", endpoint: "/api/blog" },
] as const

interface UploadItem {
  id: string
  title: string
  slug: string
  description?: string | null
  content?: string | null
  excerpt?: string | null
  moderation?: string | null
  reviewNote?: string | null
  createdAt: string
  createdBy?: { id: string; name: string | null; email: string } | null
  createdById?: string | null
}

interface OverviewAdmin {
  adminId: string
  name: string | null
  email: string
  role: string
  total: number
  pendingTotal: number
}

function stripHtml(html?: string | null, max = 600): string {
  if (!html) return ""
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
  return text.length > max ? text.slice(0, max) + "…" : text
}

export default function AdminUploads() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [entity, setEntity] = useState<(typeof ENTITIES)[number]>(ENTITIES[0])
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [adminId, setAdminId] = useState("")
  const [preview, setPreview] = useState<UploadItem | null>(null)
  const { pageSize, setPageSize, options: pageSizeOptions } = useAdminPageSize("uploads", true)
  const { density, setDensity } = useDensity("uploads")

  const { data: overviewData } = useQuery<{ success: boolean; data: { admins: OverviewAdmin[] } }>({
    queryKey: ["uploads-admins"],
    queryFn: () => fetcher("/api/admin/overview"),
    enabled: status === "authenticated",
  })
  const admins = overviewData?.data.admins || []

  // Read-only verification: ADMIN uploads only, never super-admin's own.
  const listUrl =
    `${entity.endpoint}?scope=all&onlyAdmins=true&page=${page}&limit=${pageSize}` +
    `${search ? `&search=${encodeURIComponent(search)}` : ""}` +
    `${adminId ? `&createdById=${encodeURIComponent(adminId)}` : ""}`

  const { data: listData, isLoading } = useQuery<{
    success: boolean
    data: UploadItem[]
    pagination: { page: number; totalPages: number; total: number }
  }>({
    queryKey: ["admin-uploads", entity.value, page, pageSize, search, adminId],
    queryFn: () => fetcher(listUrl),
    enabled: status === "authenticated",
  })

  if (status === "loading") return <Skeleton className="h-96" />
  if (!session || !isSuperAdmin(session.user.role)) { router.push("/login"); return null }

  const items = listData?.data || []
  const pagination = listData?.pagination
  const activeAdmin = admins.find((a) => a.adminId === adminId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Uploads - Read Only</h1>
        <p className="text-sm text-gray-500">
          Verification view. Super-admins can inspect every admin&apos;s uploads here; nothing can be edited,
          approved, or deleted from this page - use Content Verification for moderation actions.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={entity.value} onValueChange={(v) => { const f = ENTITIES.find((e) => e.value === v); if (f) { setEntity(f); setPage(1) } }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Content type" />
              </SelectTrigger>
              <SelectContent>
                {ENTITIES.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={adminId || "all"} onValueChange={(v) => { setAdminId(v === "all" ? "" : v); setPage(1) }}>
              <SelectTrigger className="w-[260px]">
                <SelectValue placeholder="All admins" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All admins</SelectItem>
                {admins.map((a) => (
                  <SelectItem key={a.adminId} value={a.adminId}>
                    {a.name || a.email} · {a.total} uploads{a.pendingTotal > 0 ? ` · ${a.pendingTotal} pending` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search title or slug…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-9" />
            </div>
            <Input
              className="w-[240px] font-mono text-xs"
              placeholder="…or paste Admin ID"
              value={adminId}
              onChange={(e) => { setAdminId(e.target.value.trim()); setPage(1) }}
              title="Unique Admin ID (cuid)"
            />
            <DensityToggle value={density} onChange={setDensity} />
            <PageSizeSelect value={pageSize} options={pageSizeOptions} onChange={(n) => { setPageSize(n); setPage(1) }} />
          </div>
          {activeAdmin && (
            <p className="pt-2 text-sm text-gray-500">
              Showing uploads by <span className="font-medium text-gray-800">{activeAdmin.name || activeAdmin.email}</span>{" "}
              ({activeAdmin.email}) · <AdminIdBadge id={activeAdmin.adminId} /> ·{" "}
              <Badge variant="secondary">{activeAdmin.role}</Badge>
            </p>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? <Skeleton className="h-64" /> : (
            <>
              <div className="saas-table-scroll">
              <Table className="saas-table" data-density={density}>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Uploaded by</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium max-w-[300px] truncate" title={item.title}>
                        {item.title}
                        <span className="block truncate font-mono text-[11px] text-gray-400">/{item.slug}</span>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{item.createdBy?.name || "Unknown"}</p>
                        <p className="text-xs text-gray-400">{item.createdBy?.email || item.createdById || ""}</p>
                        <AdminIdBadge id={item.createdBy?.id || item.createdById} />
                      </TableCell>
                      <TableCell><ModerationBadge value={item.moderation} /></TableCell>
                      <TableCell className="text-xs text-gray-500">{formatDate(item.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => setPreview(item)} title="Read-only preview">
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {items.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-gray-500">No uploads found for this filter.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
              </div>
              {pagination && (
                <TableFooter page={page} totalPages={pagination.totalPages} total={pagination.total} pageSize={pageSize} pageSizeOptions={pageSizeOptions} onPageChange={setPage} onPageSizeChange={(n) => { setPageSize(n); setPage(1) }} itemLabel="uploads" />
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!preview} onOpenChange={(o) => { if (!o) setPreview(null) }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Read-only preview</DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="text-lg font-bold">{preview.title}</h3>
                <p className="font-mono text-xs text-gray-400">/{preview.slug}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <ModerationBadge value={preview.moderation} />
                <span className="text-xs text-gray-500">by {preview.createdBy?.name || "Unknown"} ({preview.createdBy?.email || preview.createdById})</span>
                <AdminIdBadge id={preview.createdBy?.id || preview.createdById} />
                <span className="text-xs text-gray-400">{formatDate(preview.createdAt)}</span>
              </div>
              {preview.reviewNote && (
                <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
                  <span className="font-semibold">Reviewer note: </span>{preview.reviewNote}
                </div>
              )}
              {(preview.description || preview.content || preview.excerpt) ? (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Content</CardTitle></CardHeader>
                  <CardContent className="whitespace-pre-wrap text-sm text-gray-700">
                    {stripHtml(preview.description || preview.content || preview.excerpt, 4000) || "-"}
                  </CardContent>
                </Card>
              ) : (
                <p className="text-xs text-gray-400">No text body on this item (it may be a file/link-based record).</p>
              )}
              <p className="text-xs text-gray-400">Read-only: no edits, approvals, or deletions can be made from this page.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
