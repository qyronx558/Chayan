"use client"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api, fetcher } from "@/lib/api"
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
import { Pagination } from "@/components/ui/pagination"
import { toast } from "@/components/ui/toast"
import { formatDate } from "@/lib/utils"
import { isSuperAdmin } from "@/lib/roles"
import { AdminIdBadge } from "@/components/admin/AdminIdBadge"
import { ModerationBadge } from "@/components/admin/ModerationBadge"
import { Search, CheckCircle2, XCircle } from "lucide-react"

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

interface QueueItem {
  id: string
  title: string
  slug: string
  moderation?: string | null
  reviewNote?: string | null
  createdAt: string
  createdBy?: { id: string; name: string | null; email: string } | null
  createdById?: string | null
}

interface OverviewData {
  admins: { adminId: string; name: string | null; email: string; role: string; total: number; pendingTotal: number; byType: Record<string, number> }[]
  pendingQueue: Record<string, number>
}

export default function AdminReview() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [entity, setEntity] = useState<(typeof ENTITIES)[number]>(ENTITIES[0])
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [moderation, setModeration] = useState("PENDING")
  const [adminId, setAdminId] = useState("")
  const [rejectTarget, setRejectTarget] = useState<QueueItem | null>(null)
  const [rejectNote, setRejectNote] = useState("")

  // Verification queue: ADMIN uploads only (never super-admin's own), pending first.
  // Reviewed items leave this queue automatically.
  const queueUrl =
    `${entity.endpoint}?scope=all&onlyAdmins=true&page=${page}&limit=10` +
    `${search ? `&search=${encodeURIComponent(search)}` : ""}` +
    `${moderation ? `&moderation=${moderation}` : ""}` +
    `${adminId ? `&createdById=${encodeURIComponent(adminId)}` : ""}`

  const { data: queueData, isLoading } = useQuery<{ success: boolean; data: QueueItem[]; pagination: { page: number; totalPages: number; total: number } }>({
    queryKey: ["review-queue", entity.value, page, search, moderation, adminId],
    queryFn: () => fetcher(queueUrl),
    enabled: status === "authenticated",
  })

  const { data: overviewData } = useQuery<{ success: boolean; data: OverviewData }>({
    queryKey: ["review-overview"],
    queryFn: () => fetcher("/api/admin/overview"),
    enabled: status === "authenticated",
  })

  const reviewMutation = useMutation({
    mutationFn: (input: { id: string; action: "APPROVE" | "REJECT"; note?: string }) =>
      api.post("/api/admin/review", { entity: entity.value, ...input }),
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ["review-queue"] })
      queryClient.invalidateQueries({ queryKey: ["review-overview"] })
      // Reviewed items must disappear from every admin upload section immediately.
      queryClient.invalidateQueries({
        predicate: (q) =>
          typeof q.queryKey[0] === "string" &&
          (q.queryKey[0].startsWith("admin-") || q.queryKey[0] === "review-overview"),
      })
      setRejectTarget(null)
      setRejectNote("")
      toast(
        vars.action === "APPROVE" ? "Content approved & live - removed from pending queue" : "Content rejected - removed from pending queue",
        "success"
      )
    },
    onError: (err: Error) => toast(err.message, "destructive"),
  })

  if (status === "loading") return <Skeleton className="h-96" />
  if (!session || !isSuperAdmin(session.user.role)) { router.push("/login"); return null }

  const items = queueData?.data || []
  const pagination = queueData?.pagination
  const pending = overviewData?.data.pendingQueue
  const admins = overviewData?.data.admins || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Content Verification</h1>
        <p className="text-sm text-gray-500">
          Admin uploads only - your own super-admin uploads never appear here. Reviewed items leave the queue automatically.
          Approve to publish, reject with feedback.
        </p>
      </div>

      {pending && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-9">
          <Card className="col-span-2 sm:col-span-4 lg:col-span-1">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{pending.total ?? 0}</p>
              <p className="text-xs text-gray-500">Pending total</p>
            </CardContent>
          </Card>
          {ENTITIES.map((e) => (
            <Card key={e.value} className={entity.value === e.value ? "border-teal-500" : ""}>
              <CardContent className="p-3 text-center">
                <p className="text-xl font-bold">{pending[e.value] ?? 0}</p>
                <p className="text-[11px] text-gray-500">{e.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={entity.value} onValueChange={(v) => { const found = ENTITIES.find((e) => e.value === v); if (found) { setEntity(found); setPage(1) } }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Content type" />
              </SelectTrigger>
              <SelectContent>
                {ENTITIES.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={moderation || "all"} onValueChange={(v) => { setModeration(v === "all" ? "" : v); setPage(1) }}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pending review</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="all">All statuses</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search title or slug…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-9" />
            </div>
            <Input
              className="w-[240px] font-mono text-xs"
              placeholder="Filter by Admin ID…"
              value={adminId}
              onChange={(e) => { setAdminId(e.target.value.trim()); setPage(1) }}
              title="Unique Admin ID (cuid)"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? <Skeleton className="h-64" /> : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Uploaded by</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Review note</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Verify</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium max-w-[260px] truncate" title={item.title}>
                        {item.title}
                        <span className="block truncate font-mono text-[11px] text-gray-400">/{item.slug}</span>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{item.createdBy?.name || "Unknown"}</p>
                        <p className="text-xs text-gray-400">{item.createdBy?.email || item.createdById || ""}</p>
                        <AdminIdBadge id={item.createdBy?.id || item.createdById} />
                      </TableCell>
                      <TableCell><ModerationBadge value={item.moderation} /></TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-gray-500" title={item.reviewNote || ""}>
                        {item.reviewNote || "-"}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">{formatDate(item.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            onClick={() => reviewMutation.mutate({ id: item.id, action: "APPROVE" })}
                            disabled={reviewMutation.isPending || item.moderation === "APPROVED"}
                            title="Approve & publish"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => { setRejectTarget(item); setRejectNote(item.reviewNote || "") }}
                            disabled={reviewMutation.isPending || item.moderation === "REJECTED"}
                            title="Reject with feedback"
                          >
                            <XCircle className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {items.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-gray-500">Queue is clear - nothing matches.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
              {pagination && (
                <div className="flex items-center justify-between p-4">
                  <p className="text-sm text-gray-500">Total: {pagination.total} items</p>
                  <Pagination currentPage={page} totalPages={pagination.totalPages} onPageChange={setPage} />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {admins.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Per-admin uploads (unique Admin ID)</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admin</TableHead>
                  <TableHead>Admin ID</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Pending</TableHead>
                  <TableHead>Breakdown</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((a) => (
                  <TableRow key={a.adminId}>
                    <TableCell>
                      <p className="font-medium">{a.name || "N/A"}</p>
                      <p className="text-xs text-gray-400">{a.email}</p>
                    </TableCell>
                    <TableCell><AdminIdBadge id={a.adminId} /></TableCell>
                    <TableCell><Badge variant={a.role === "SUPER_ADMIN" ? undefined : "secondary"}>{a.role}</Badge></TableCell>
                    <TableCell className="font-semibold">{a.total}</TableCell>
                    <TableCell>
                      <Badge className={a.pendingTotal > 0 ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-500"}>
                        {a.pendingTotal} pending
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {Object.entries(a.byType).filter(([, n]) => (n as number) > 0).map(([t, n]) => `${t}:${n}`).join(" · ") || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!rejectTarget} onOpenChange={(o) => { if (!o) { setRejectTarget(null); setRejectNote("") } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Reject with feedback</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-500">
            &ldquo;{rejectTarget?.title}&rdquo; will stay hidden from public until the admin fixes and resubmits.
          </p>
          <Input
            placeholder="Quality issue - e.g. wrong dates, missing PDF, poor description…"
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectNote("") }}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={!rejectNote.trim() || reviewMutation.isPending}
              onClick={() => rejectTarget && reviewMutation.mutate({ id: rejectTarget.id, action: "REJECT", note: rejectNote.trim() })}
            >
              {reviewMutation.isPending ? "Saving…" : "Reject"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
