"use client"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api, fetcher } from "@/lib/api"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/toast"
import { formatDate } from "@/lib/utils"
import { isSuperAdmin } from "@/lib/roles"
import { AdminIdBadge } from "@/components/admin/AdminIdBadge"
import { Search, Shield, ShieldOff, Trash2 } from "lucide-react"
import { useAdminPageSize, useDensity } from "@/lib/admin/usePageSize"
import { TableFooter } from "@/components/admin/data-table/TableFooter"
import { DensityToggle } from "@/components/admin/data-table/DensityToggle"
import { PageSizeSelect } from "@/components/admin/data-table/PageSizeSelect"

interface ContentCounts {
  bookmark: number; comments: number; jobs: number; privateJobs: number
  results: number; admitCards: number; answerKeys: number; admissions: number
  syllabi: number; blogPosts: number
}

interface UserItem {
  id: string; name: string | null; email: string; role: string; image: string | null; createdAt: string
  _count: ContentCounts
}

function totalUploads(c?: ContentCounts | null) {
  if (!c) return 0
  return (
    (c.jobs || 0) + (c.privateJobs || 0) + (c.results || 0) + (c.admitCards || 0) +
    (c.answerKeys || 0) + (c.admissions || 0) + (c.syllabi || 0) + (c.blogPosts || 0)
  )
}

export default function AdminUsers() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [promoteTarget, setPromoteTarget] = useState<UserItem | null>(null)
  const superView = isSuperAdmin(session?.user?.role)
  const { pageSize, setPageSize, options: pageSizeOptions } = useAdminPageSize("users", superView)
  const { density, setDensity } = useDensity("users")

  const queryUrl = `/api/users?page=${page}&limit=${pageSize}&search=${encodeURIComponent(search)}${roleFilter ? `&role=${roleFilter}` : ""}`
  const { data: usersData, isLoading } = useQuery<{ success: boolean; data: UserItem[]; pagination: { page: number; totalPages: number; total: number } }>({
    queryKey: ["admin-users", page, pageSize, search, roleFilter],
    queryFn: () => fetcher(queryUrl),
  })

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => api.put(`/api/users/${id}`, { role }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      setPromoteTarget(null)
      try { await update() } catch { /* session refresh best-effort */ }
      toast("User role updated", "success")
    },
    onError: (err: Error) => toast(err.message, "destructive"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/users/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-users"] }); setDeleteId(null); toast("User deleted", "success") },
    onError: (err: Error) => toast(err.message, "destructive"),
  })

  if (status === "loading") return <Skeleton className="h-96" />
  if (!session || !isSuperAdmin(session.user.role)) { router.push("/login"); return null }

  const users = usersData?.data || []
  const pagination = usersData?.pagination

  const requestToggleRole = (user: UserItem) => {
    if (user.role === "SUPER_ADMIN") {
      toast("Super admins cannot be demoted", "destructive")
      return
    }
    if (user.id === session.user.id) {
      toast("You cannot change your own role", "destructive")
      return
    }
    // Single-button promote: one click opens a confirm, confirm performs the change.
    setPromoteTarget(user)
  }

  const confirmToggleRole = () => {
    if (!promoteTarget) return
    const newRole = promoteTarget.role === "ADMIN" ? "USER" : "ADMIN"
    updateRoleMutation.mutate({ id: promoteTarget.id, role: newRole })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users & Roles</h1>
          <p className="text-sm text-gray-500">Single-click promote to admin. Unique Admin ID is the user&apos;s permanent cuid.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 max-w-sm min-w-[220px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search name, email, or Admin ID…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter || "all"} onValueChange={(v) => { setRoleFilter(v === "all" ? "" : v); setPage(1) }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="USER">Users</SelectItem>
                <SelectItem value="ADMIN">Admins</SelectItem>
                <SelectItem value="SUPER_ADMIN">Super admins</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <DensityToggle value={density} onChange={setDensity} />
            <PageSizeSelect value={pageSize} options={pageSizeOptions} onChange={(n) => { setPageSize(n); setPage(1) }} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? <Skeleton className="h-64" /> : (
            <>
              <div className="overflow-x-auto saas-table-scroll">
              <Table className="saas-table" data-density={density}>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Admin ID</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name || "N/A"}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell><AdminIdBadge id={user.id} /></TableCell>
                      <TableCell>
                        {user.role === "SUPER_ADMIN" ? (
                          <Badge className="bg-violet-100 text-violet-700">SUPER_ADMIN</Badge>
                        ) : (
                          <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>{user.role}</Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell className="text-gray-500 text-xs">
                        {totalUploads(user._count)} uploads · {user._count.bookmark} bookmarks · {user._count.comments} comments
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant={user.role === "ADMIN" ? "outline" : "default"}
                            size="sm"
                            onClick={() => requestToggleRole(user)}
                            disabled={user.id === session.user.id || user.role === "SUPER_ADMIN" || updateRoleMutation.isPending}
                            title={user.role === "ADMIN" ? "Remove admin" : user.role === "SUPER_ADMIN" ? "Super admin cannot be changed" : "Make admin"}
                          >
                            {user.role === "ADMIN" ? <ShieldOff className="h-4 w-4 mr-1" /> : <Shield className="h-4 w-4 mr-1" />}
                            {user.role === "ADMIN" ? "Remove" : "Make admin"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(user.id)}
                            disabled={user.id === session.user.id || user.role === "SUPER_ADMIN"}
                            title={user.role === "SUPER_ADMIN" ? "Super admin cannot be deleted" : "Delete user"}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {users.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-gray-500">No users found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
              </div>
              {pagination && (
                <TableFooter
                  page={page}
                  totalPages={pagination.totalPages}
                  total={pagination.total}
                  pageSize={pageSize}
                  pageSizeOptions={pageSizeOptions}
                  onPageChange={setPage}
                  onPageSizeChange={(n) => { setPageSize(n); setPage(1) }}
                  itemLabel="users"
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!promoteTarget} onOpenChange={(o) => { if (!o) setPromoteTarget(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {promoteTarget?.role === "ADMIN" ? "Remove admin?" : "Make admin?"}
            </DialogTitle>
          </DialogHeader>
          {promoteTarget && (
            <div className="space-y-3 text-sm">
              <p className="text-gray-600">
                {promoteTarget.role === "ADMIN"
                  ? "This admin will lose content-upload access immediately (takes effect on their next session refresh)."
                  : "This user will gain content-upload access. Their uploads will require super-admin approval before going public."}
              </p>
              <div className="rounded-lg bg-gray-50 p-3 space-y-1">
                <p><span className="text-gray-500">Name:</span> <span className="font-medium">{promoteTarget.name || "N/A"}</span></p>
                <p><span className="text-gray-500">Email:</span> <span className="font-medium">{promoteTarget.email}</span></p>
                <p className="flex items-center gap-2"><span className="text-gray-500">Admin ID:</span> <AdminIdBadge id={promoteTarget.id} /></p>
                <p><span className="text-gray-500">Current role:</span> <Badge variant="secondary">{promoteTarget.role}</Badge></p>
                <p><span className="text-gray-500">Uploads:</span> {totalUploads(promoteTarget._count)} items</p>
              </div>
              <p className="text-xs text-gray-400">This change is written to Activity Logs with your super-admin identity.</p>
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" onClick={() => setPromoteTarget(null)}>Cancel</Button>
                <Button onClick={confirmToggleRole} disabled={updateRoleMutation.isPending}>
                  {updateRoleMutation.isPending ? "Saving…" : promoteTarget.role === "ADMIN" ? "Remove admin" : "Make admin"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Delete User</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-500">Are you sure? This will permanently delete the user and all their data.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
