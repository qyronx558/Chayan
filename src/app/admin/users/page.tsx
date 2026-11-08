"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { api, fetcher } from "@/lib/api";
import { isSuperAdmin } from "@/lib/roles";
import { ADMIN_PAGE_SIZES, type Density } from "@/lib/admin/usePageSize";
import { formatDate, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/components/ui/toast";
import { PageHeader } from "@/components/admin/PageHeader";
import { RolePill } from "@/components/admin/RolePill";
import { AdminIdBadge } from "@/components/admin/AdminIdBadge";
import { TableFooter } from "@/components/admin/data-table/TableFooter";
import { DensityToggle } from "@/components/admin/data-table/DensityToggle";
import { ExportMenu } from "@/components/admin/data-table/ExportMenu";
import { AuditDialog, DeleteConfirm } from "@/components/admin/list/list-parts";
import { T_CARD, T_HEAD_CELL, initials } from "@/components/admin/list/tokens";
import { Search, History, Shield, ShieldOff, MoreHorizontal, Trash2, Inbox } from "lucide-react";

interface ContentCounts {
  bookmark: number;
  comments: number;
  jobs: number;
  privateJobs: number;
  results: number;
  admitCards: number;
  answerKeys: number;
  admissions: number;
  syllabi: number;
  blogPosts: number;
}

interface UserItem {
  id: string;
  name: string | null;
  email: string;
  role: string;
  image: string | null;
  createdAt: string;
  _count: ContentCounts;
}

interface UsersResponse {
  success: boolean;
  data: UserItem[];
  pagination: { page: number; totalPages: number; total: number };
}

function totalUploads(c?: ContentCounts | null): number {
  if (!c) return 0;
  return (
    (c.jobs || 0) + (c.privateJobs || 0) + (c.results || 0) + (c.admitCards || 0) +
    (c.answerKeys || 0) + (c.admissions || 0) + (c.syllabi || 0) + (c.blogPosts || 0)
  );
}

const DENSITY_KEY = "list:density:users";
const SIZE_KEY = "admin:pageSize:users";

export default function AdminUsers() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchRef = useRef<HTMLInputElement | null>(null);

  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(25);
  const [density, setDensity] = useState<Density>("comfortable");
  const [auditOpen, setAuditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    try {
      const d = window.localStorage.getItem(DENSITY_KEY);
      if (d === "compact" || d === "comfortable") setDensity(d);
      const s = parseInt(window.localStorage.getItem(SIZE_KEY) || "25", 10);
      if ((ADMIN_PAGE_SIZES as readonly number[]).includes(s)) setSize(s);
    } catch {
      
    }
  }, []);

  useEffect(() => {
    if (input === q) return;
    const t = setTimeout(() => {
      setQ(input);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [input, q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const queryUrl = `/api/users?page=${page}&limit=${size}&search=${encodeURIComponent(q)}${roleFilter ? `&role=${roleFilter}` : ""}`;
  const usersQuery = useQuery<UsersResponse>({
    queryKey: ["admin-users-v2", queryUrl],
    queryFn: () => fetcher<UsersResponse>(queryUrl),
    enabled: status === "authenticated" && !!session && isSuperAdmin(session.user.role),
  });

  if (status === "loading") {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }
  if (!session || !isSuperAdmin(session.user.role)) {
    router.push("/login");
    return null;
  }

  const users = usersQuery.data?.data ?? [];
  const pagination = usersQuery.data?.pagination;
  const total = pagination?.total ?? users.length;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-users-v2"] });

  const doRoleChange = async (user: UserItem, nextRole: "ADMIN" | "USER") => {
    const prevRole = user.role;
    if (prevRole === nextRole) return;
    setChanging(true);
    try {
      await api.put(`/api/users/${user.id}`, { role: nextRole });
      invalidate();
      toast(`${user.email} is now ${nextRole === "ADMIN" ? "an admin" : "a user"}`, "success", {
        label: "Undo",
        onClick: () => void doRoleChange({ ...user, role: nextRole }, prevRole as "ADMIN" | "USER"),
      });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Role change failed", "destructive");
    } finally {
      setChanging(false);
    }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/users/${deleteTarget.id}`);
      setDeleteTarget(null);
      invalidate();
      toast(`Deleted ${deleteTarget.email}`, "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Delete failed", "destructive");
    } finally {
      setDeleting(false);
    }
  };

  const setDensityPersist = (d: Density) => {
    setDensity(d);
    try {
      window.localStorage.setItem(DENSITY_KEY, d);
    } catch {
      
    }
  };

  const setSizePersist = (n: number) => {
    setSize(n);
    setPage(1);
    try {
      window.localStorage.setItem(SIZE_KEY, String(n));
    } catch {
      
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <PageHeader
          crumbs={[{ label: "Manage" }, { label: "Users and roles" }]}
          title="Users and roles"
          badge={
            <Badge variant="secondary" className="font-semibold tabular-nums">
              {total} user{total === 1 ? "" : "s"}
            </Badge>
          }
          description="Promote trusted users to admin - every change is audit-logged."
          actions={
            <>
              <Button type="button" variant="ghost" size="sm" onClick={() => setAuditOpen(true)}>
                <History className="mr-1.5 h-3.5 w-3.5" /> Audit trail
              </Button>
              <ExportMenu rows={users as unknown as Record<string, unknown>[]} filename="users-roles" variant="secondary" />
            </>
          }
        />

        <Card className={T_CARD}>
          <div className="border-b border-rule p-3 sm:p-4 ">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-52 flex-1">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={searchRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Search name, email, or admin ID…"
                  className="bg-background pl-8 pr-10 dark:bg-background/[0.03]"
                  aria-label="Search users"
                />
                <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-rule bg-paper-2 px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground sm:block  dark:bg-background/[0.05]">
                  /
                </kbd>
              </div>
              <Select value={roleFilter || "ALL"} onValueChange={(v) => { setRoleFilter(v === "ALL" ? "" : v); setPage(1); }}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All roles</SelectItem>
                  <SelectItem value="USER">Users</SelectItem>
                  <SelectItem value="ADMIN">Admins</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super admins</SelectItem>
                </SelectContent>
              </Select>
              <div className="ml-auto">
                <DensityToggle value={density} onChange={setDensityPersist} />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto saas-table-scroll">
            <Table className="saas-table" data-density={density}>
              <TableHeader className="sticky top-0 z-10">
                <TableRow className="bg-paper-2/95 hover:bg-paper-2/95 ">
                  <TableHead><span className={T_HEAD_CELL}>User</span></TableHead>
                  <TableHead><span className={T_HEAD_CELL}>Role</span></TableHead>
                  <TableHead><span className={T_HEAD_CELL}>Admin ID</span></TableHead>
                  <TableHead><span className={T_HEAD_CELL}>Activity</span></TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersQuery.isLoading && users.length === 0 ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={`sk-${i}`}>
                      <TableCell colSpan={5}><Skeleton className="h-9 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <div className="flex flex-col items-center gap-2 py-12 text-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-paper-3 dark:bg-background/[0.06]">
                          <Inbox className="h-6 w-6 text-muted-foreground" />
                        </span>
                        <p className="font-semibold text-foreground dark:text-muted-foreground">No users found</p>
                        <p className="max-w-xs text-sm text-muted-foreground">Try a different search or role filter.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => {
                    const isSelf = u.id === session.user.id;
                    const joined = new Date(u.createdAt).getTime();
                    const uploads = totalUploads(u._count);
                    return (
                      <TableRow
                        key={u.id}
                        className="group border-b border-rule transition-colors last:border-0 hover:bg-paper-3  dark:hover:bg-background/[0.03]"
                      >
                        <TableCell className={cn(density === "compact" && "py-2")}>
                          <span className="flex items-center gap-2.5">
                            <Avatar className="h-8 w-8 shrink-0 border border-rule ">
                              <AvatarFallback className="bg-paper-3 text-[11px] font-bold text-paper dark:bg-paper-3">
                                {initials(u.name, u.email)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="min-w-0">
                              <span className="block max-w-[200px] truncate text-[13.5px] font-semibold text-foreground dark:text-paper">
                                {u.name || "Unnamed"}
                              </span>
                              <span className="block max-w-[200px] truncate text-xs text-muted-foreground" title={u.email}>
                                {u.email}
                              </span>
                            </span>
                          </span>
                        </TableCell>
                        <TableCell className={cn(density === "compact" && "py-2")}>
                          <RolePill role={u.role} />
                        </TableCell>
                        <TableCell className={cn(density === "compact" && "py-2")}>
                          <AdminIdBadge id={u.id} />
                        </TableCell>
                        <TableCell className={cn(density === "compact" && "py-2")}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-default">
                                <span className="block text-[13px] font-semibold tabular-nums text-foreground dark:text-muted-foreground">
                                  {uploads} upload{uploads === 1 ? "" : "s"}
                                </span>
                                <span className="block text-xs tabular-nums text-muted-foreground" title={formatDate(u.createdAt)}>
                                  Joined {!Number.isNaN(joined) ? formatDistanceToNow(new Date(joined), { addSuffix: true }) : "-"}
                                </span>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">
                                {uploads} uploads · {u._count.bookmark} bookmarks · {u._count.comments} comments
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className={cn("text-right", density === "compact" && "py-2")}>
                          {isSelf ? (
                            <Badge variant="outline" className="font-semibold text-muted-foreground">
                              You
                            </Badge>
                          ) : (
                            <span className="flex items-center justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                              {u.role === "SUPER_ADMIN" ? (
                                <Badge variant="outline" className="font-semibold text-muted-foreground">
                                  Locked
                                </Badge>
                              ) : (
                                <>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant={u.role === "ADMIN" ? "outline" : "default"}
                                    disabled={changing}
                                    onClick={() => void doRoleChange(u, u.role === "ADMIN" ? "USER" : "ADMIN")}
                                    className={u.role === "ADMIN" ? "" : "bg-paper-3 hover:bg-paper-3 dark:bg-paper-3 dark:hover:bg-paper-3"}
                                  >
                                    {u.role === "ADMIN" ? (
                                      <>
                                        <ShieldOff className="mr-1.5 h-3.5 w-3.5" /> Remove admin
                                      </>
                                    ) : (
                                      <>
                                        <Shield className="mr-1.5 h-3.5 w-3.5" /> Make admin
                                      </>
                                    )}
                                  </Button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button
                                        type="button"
                                        aria-label={`Actions for ${u.email}`}
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-paper-3 hover:text-foreground dark:text-muted-foreground dark:hover:bg-background/[0.06] dark:hover:text-muted-foreground"
                                      >
                                        <MoreHorizontal className="h-4 w-4" />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-44">
                                      <DropdownMenuItem
                                        onClick={() => setDeleteTarget(u)}
                                        className="text-brick focus:text-brick dark:text-brick"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete user
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </>
                              )}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {pagination && (
            <TableFooter
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              pageSize={size}
              pageSizeOptions={ADMIN_PAGE_SIZES}
              onPageChange={(p) => setPage(p)}
              onPageSizeChange={setSizePersist}
              itemLabel="users"
            />
          )}
        </Card>

        <DeleteConfirm
          open={deleteTarget !== null}
          title="Delete user"
          message={`Permanently delete ${deleteTarget?.email ?? "this user"} and all of their data? This cannot be undone.`}
          pending={deleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void doDelete()}
        />

        <AuditDialog
          open={auditOpen}
          onOpenChange={setAuditOpen}
          title="Users and roles - audit trail"
          entity="User"
          mine={false}
        />
      </div>
    </TooltipProvider>
  );
}
