"use client"
export const dynamic = "force-dynamic"
import { useMemo, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api, fetcher } from "@/lib/api"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { toast } from "@/components/ui/toast"
import { formatDate } from "@/lib/utils"
import { isAdmin, isSuperAdmin } from "@/lib/roles"
import { Trash2, Search, Eye, Download, Copy, ShieldAlert } from "lucide-react"
import { exportToCsv, flattenForCsv } from "@/lib/admin-export"
import { useAdminPageSize, useDensity } from "@/lib/admin/usePageSize"
import { TableFooter } from "@/components/admin/data-table/TableFooter"
import { DensityToggle } from "@/components/admin/data-table/DensityToggle"

interface LogItem {
  id: string; action: string; entity: string; entityId: string; details: string | null; createdAt: string
  user: { id: string; name: string | null; email: string } | null
}

const ACTIONS = ["CREATE", "UPDATE", "DELETE", "STATUS", "APPROVE", "REJECT", "ROLE_CHANGE", "LOGIN", "LOGOUT", "VIEW", "IMPORT"]
const ENTITIES = ["Job", "PrivateJob", "Result", "AdmitCard", "AnswerKey", "Syllabus", "Admission", "Blog", "Notification", "User", "Featured", "Log"]

function badgeVariant(action: string) {
  switch (action) {
    case "CREATE": return "default" as const
    case "APPROVE": return "default" as const
    case "UPDATE": return "secondary" as const
    case "DELETE": return "destructive" as const
    case "REJECT": return "destructive" as const
    case "ROLE_CHANGE": return "secondary" as const
    case "STATUS": return "outline" as const
    case "LOGIN":
    case "LOGOUT": return "outline" as const
    default: return "outline" as const
  }
}

export default function AdminLogs() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState("")
  const [entityFilter, setEntityFilter] = useState("")
  const [search, setSearch] = useState("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [clearDialogOpen, setClearDialogOpen] = useState(false)
  const [retention, setRetention] = useState("90")
  const [detail, setDetail] = useState<LogItem | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const superView = isSuperAdmin(session?.user?.role)
  const { pageSize, setPageSize, options: pageSizeOptions } = useAdminPageSize("logs", superView)
  const { density, setDensity } = useDensity("logs")

  const queryUrl = useMemo(() => {
    const p = new URLSearchParams({ page: String(page), limit: String(pageSize) })
    if (actionFilter) p.set("action", actionFilter)
    if (entityFilter) p.set("entity", entityFilter)
    if (search) p.set("search", search)
    if (from) p.set("from", from)
    if (to) p.set("to", to)
    return `/api/logs?${p.toString()}`
  }, [page, pageSize, actionFilter, entityFilter, search, from, to])

  const { data: logsData, isLoading } = useQuery<{ success: boolean; data: LogItem[]; pagination: { page: number; totalPages: number; total: number } }>({
    queryKey: ["admin-logs", queryUrl], queryFn: () => fetcher(queryUrl),
  })

  const clearMutation = useMutation({
    mutationFn: () => api.delete("/api/logs"),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-logs"] }); setClearDialogOpen(false); toast("All logs cleared", "success") },
    onError: (err: Error) => toast(err.message, "destructive"),
  })
  const retentionMutation = useMutation({
    mutationFn: (days: string) => {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - Number(days))
      return api.delete(`/api/logs?before=${cutoff.toISOString()}`)
    },
    onSuccess: (res: unknown) => {
      queryClient.invalidateQueries({ queryKey: ["admin-logs"] })
      const count = (res as { data?: { deleted?: number } })?.data?.deleted ?? 0
      toast(`Deleted ${count} logs older than ${retention} days`, "success")
    },
    onError: (err: Error) => toast(err.message, "destructive"),
  })
  const deleteOneMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/logs/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-logs"] }); setDeleteId(null); toast("Log deleted", "success") },
    onError: (err: Error) => toast(err.message, "destructive"),
  })

  if (status === "loading") return <Skeleton className="h-96" />
  if (!session || !isAdmin(session.user.role)) { router.push("/login"); return null }
  const superAdmin = isSuperAdmin(session.user.role)

  const logs = logsData?.data || []
  const pagination = logsData?.pagination
  const resetFilters = () => { setActionFilter(""); setEntityFilter(""); setSearch(""); setFrom(""); setTo(""); setPage(1) }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">System Logs</h1>
          <p className="text-sm text-gray-500">
            {pagination ? `${pagination.total} total events` : ""} · every create / update / delete / approve / reject / role change from the 8 admin sections is recorded here
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { exportToCsv(logs.map((l) => flattenForCsv(l as unknown as Record<string, unknown>)), "audit-logs"); toast(`Exported ${logs.length} logs`, "success") }}>
            <Download className="mr-1 h-4 w-4" /> Export CSV
          </Button>
          {superAdmin && (
            <Button variant="destructive" size="sm" onClick={() => setClearDialogOpen(true)}>
              <Trash2 className="mr-1 h-4 w-4" /> Clear Logs
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 xl:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search details, entity, user email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-9" />
            </div>
            <Select value={actionFilter || "all"} onValueChange={(v) => { setActionFilter(v === "all" ? "" : v); setPage(1) }}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All Actions" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {ACTIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={entityFilter || "all"} onValueChange={(v) => { setEntityFilter(v === "all" ? "" : v); setPage(1) }}>
              <SelectTrigger className="w-44"><SelectValue placeholder="All Entities" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                {ENTITIES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1) }} className="w-40" />
            <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1) }} className="w-40" />
            <Button variant="ghost" size="sm" onClick={resetFilters}>Reset</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <DensityToggle value={density} onChange={setDensity} />
          </div>
          {superAdmin && (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-amber-50 p-2 text-sm">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
              <span className="font-medium">Retention:</span>
              <Select value={retention} onValueChange={setRetention}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">Older than 30d</SelectItem>
                  <SelectItem value="90">Older than 90d</SelectItem>
                  <SelectItem value="180">Older than 180d</SelectItem>
                  <SelectItem value="365">Older than 1y</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={() => retentionMutation.mutate(retention)} disabled={retentionMutation.isPending}>
                {retentionMutation.isPending ? "Deleting..." : "Delete old logs"}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? <Skeleton className="h-64" /> : (
            <>
              <div className="saas-table-scroll">
              <Table className="saas-table" data-density={density}>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Entity ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead className="text-right">View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setDetail(log)}>
                      <TableCell><Badge variant={badgeVariant(log.action)}>{log.action}</Badge></TableCell>
                      <TableCell className="font-medium">{log.entity}</TableCell>
                      <TableCell className="font-mono text-xs text-gray-500" title={log.entityId}>{log.entityId.substring(0, 8)}...</TableCell>
                      <TableCell>{log.user ? log.user.name || log.user.email : "System"}</TableCell>
                      <TableCell className="max-w-[260px] truncate text-gray-500">{log.details || "-"}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(log.createdAt, "dd MMM yyyy HH:mm")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" onClick={() => setDetail(log)}><Eye className="h-4 w-4" /></Button>
                          {superAdmin && (
                            <Button variant="ghost" size="icon" onClick={() => setDeleteId(log.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {logs.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-gray-500">No logs found - adjust filters, or perform a create/update/delete in Jobs, Results, Admit Cards, etc. to generate audit events.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
              </div>
              {pagination && (
                <TableFooter page={page} totalPages={pagination.totalPages} total={pagination.total} pageSize={pageSize} pageSizeOptions={pageSizeOptions} onPageChange={setPage} onPageSizeChange={(n) => { setPageSize(n); setPage(1) }} itemLabel="logs" />
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!detail} onOpenChange={(o) => { if (!o) setDetail(null) }}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {detail && <Badge variant={badgeVariant(detail.action)}>{detail.action}</Badge>} {detail?.entity}
            </SheetTitle>
            <SheetDescription>{detail && formatDate(detail.createdAt, "dd MMM yyyy HH:mm:ss")}</SheetDescription>
          </SheetHeader>
          {detail && (
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <p className="text-xs font-medium uppercase text-gray-400">Entity ID</p>
                <div className="mt-1 flex items-center gap-2">
                  <code className="flex-1 break-all rounded bg-gray-100 p-2 font-mono text-xs">{detail.entityId}</code>
                  <Button size="icon" variant="outline" onClick={() => { navigator.clipboard.writeText(detail.entityId); toast("Copied", "success") }}><Copy className="h-4 w-4" /></Button>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-gray-400">Actor</p>
                <p className="mt-1 font-medium">{detail.user ? `${detail.user.name || "-"} (${detail.user.email})` : "System"}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-gray-400">Details</p>
                <p className="mt-1 whitespace-pre-wrap rounded bg-gray-50 p-3 text-gray-700">{detail.details || "-"}</p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={clearDialogOpen} onOpenChange={(o) => { if (!o) setClearDialogOpen(false) }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Clear All Logs</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-500">Are you sure? This will permanently delete <strong>all</strong> system logs. Prefer the retention rule (delete older than N days) to keep a recent audit trail. This action cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setClearDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => clearMutation.mutate()} disabled={clearMutation.isPending}>
              {clearMutation.isPending ? "Clearing..." : "Clear All Logs"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Delete Log Entry</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-500">Delete this single audit entry? Super-admin only.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && deleteOneMutation.mutate(deleteId)} disabled={deleteOneMutation.isPending}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
