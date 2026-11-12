"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Pencil, Plus, Trash2, MapPin, ShieldAlert } from "lucide-react"
import { api, fetcher } from "@/lib/api"
import { districtSchema, stateSchema, type DistrictInput, type StateInput } from "@/lib/validations"
import { isAdmin, isSuperAdmin } from "@/lib/roles"
import { STATE_TYPE_LABEL, toSlug } from "@/lib/locations"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "@/components/ui/toast"

interface StateRow {
  id: string
  name: string
  slug: string
  type: "STATE" | "UNION_TERRITORY"
  districtCount: number
  jobCount: number
}

interface DistrictRow {
  id: string
  name: string
  slug: string
  jobCount?: number
}

const STATES_KEY = ["admin-locations-states"]

/**
 * Super-admin only: manage the State / UT / District master data that
 * admins pick from when posting state- and district-level jobs.
 */
export default function AdminLocations() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  const superAdmin = isSuperAdmin(session?.user?.role)

  const [search, setSearch] = useState("")
  const [stateDialog, setStateDialog] = useState<{ open: boolean; editing: StateRow | null }>({ open: false, editing: null })
  const [deleting, setDeleting] = useState<{ kind: "state" | "district"; id: string; name: string } | null>(null)
  const [districtState, setDistrictState] = useState<StateRow | null>(null)

  const statesQuery = useQuery<{ success: boolean; data: StateRow[] }>({
    queryKey: STATES_KEY,
    queryFn: () => fetcher("/api/states?all=1"),
    enabled: status === "authenticated" && superAdmin,
  })

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: STATES_KEY })
    queryClient.invalidateQueries({ queryKey: ["admin-locations-districts"] })
    queryClient.invalidateQueries({ queryKey: ["list-lookup", "/api/states"] })
    queryClient.invalidateQueries({ queryKey: ["state-districts"] })
  }

  const deleteMutation = useMutation({
    mutationFn: (target: { kind: "state" | "district"; id: string }) =>
      api.delete(target.kind === "state" ? `/api/states/${target.id}` : `/api/districts/${target.id}`),
    onSuccess: (_d, target) => {
      invalidateAll()
      setDeleting(null)
      toast(target.kind === "state" ? "State deleted" : "District deleted", "success")
    },
    onError: (err: Error) => toast(err.message, "destructive"),
  })

  const states = useMemo(() => statesQuery.data?.data ?? [], [statesQuery.data])
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? states.filter((s) => s.name.toLowerCase().includes(q) || s.slug.includes(q)) : states
  }, [states, search])

  if (status === "loading") return <Skeleton className="h-96" />
  if (!session || !isAdmin(session.user.role)) {
    router.push("/login")
    return null
  }
  if (!superAdmin) {
    return (
      <Card>
        <CardContent className="flex items-start gap-3 p-6">
          <ShieldAlert className="mt-0.5 h-5 w-5 text-brick" />
          <div>
            <h1 className="text-lg font-semibold">Super admins only</h1>
            <p className="text-sm text-muted-foreground">
              States and districts are managed by super admins. If a district is missing from the job form, ask a super admin to add it.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totals = {
    states: states.filter((s) => s.type === "STATE").length,
    uts: states.filter((s) => s.type === "UNION_TERRITORY").length,
    districts: states.reduce((n, s) => n + s.districtCount, 0),
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Locations</h1>
          <p className="text-sm text-muted-foreground">
            {totals.states} states · {totals.uts} union territories · {totals.districts} districts. Used for state- and district-level jobs.
          </p>
        </div>
        <Button onClick={() => setStateDialog({ open: true, editing: null })}>
          <Plus className="mr-1 h-4 w-4" /> Add state / UT
        </Button>
      </div>

      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search states and UTs…"
        className="max-w-sm"
        aria-label="Search states"
      />

      <Card>
        <CardContent className="p-0">
          {statesQuery.isLoading ? (
            <Skeleton className="h-64" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Districts</TableHead>
                  <TableHead className="text-right">Jobs</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{s.slug}</TableCell>
                    <TableCell>
                      <Badge variant={s.type === "STATE" ? "secondary" : "outline"}>{STATE_TYPE_LABEL[s.type]}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{s.districtCount}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.jobCount}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="outline" size="sm" onClick={() => setDistrictState(s)}>
                          <MapPin className="mr-1 h-3.5 w-3.5" /> Districts
                        </Button>
                        <Button variant="ghost" size="icon" aria-label={`Edit ${s.name}`} onClick={() => setStateDialog({ open: true, editing: s })}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Delete ${s.name}`}
                          disabled={s.districtCount > 0 || s.jobCount > 0}
                          title={s.districtCount > 0 || s.jobCount > 0 ? "Remove its districts and jobs first" : undefined}
                          onClick={() => setDeleting({ kind: "state", id: s.id, name: s.name })}
                        >
                          <Trash2 className="h-4 w-4 text-brick" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      {states.length === 0 ? "No states yet - run the \"seed-locations\" workflow to load all of India." : "No states match your search"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <StateDialog
        open={stateDialog.open}
        editing={stateDialog.editing}
        onClose={() => setStateDialog({ open: false, editing: null })}
        onSaved={invalidateAll}
      />

      <DistrictsSheet
        state={districtState}
        onClose={() => setDistrictState(null)}
        onChanged={invalidateAll}
        onDelete={(d) => setDeleting({ kind: "district", id: d.id, name: d.name })}
      />

      <Dialog open={!!deleting} onOpenChange={(o) => { if (!o) setDeleting(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {deleting?.kind === "state" ? "state" : "district"}</DialogTitle>
            <DialogDescription>
              Delete “{deleting?.name}”? This can&apos;t be undone. Items still used by jobs can&apos;t be deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleting && deleteMutation.mutate({ kind: deleting.kind, id: deleting.id })}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StateDialog({
  open,
  editing,
  onClose,
  onSaved,
}: {
  open: boolean
  editing: StateRow | null
  onClose: () => void
  onSaved: () => void
}) {
  const form = useForm<StateInput>({
    resolver: zodResolver(stateSchema) as never,
    values: editing
      ? { name: editing.name, slug: editing.slug, type: editing.type }
      : { name: "", slug: "", type: "STATE" },
  })

  const mutation = useMutation({
    mutationFn: (data: StateInput) => (editing ? api.put(`/api/states/${editing.id}`, data) : api.post("/api/states", data)),
    onSuccess: () => {
      onSaved()
      onClose()
      toast(editing ? "State updated" : "State created", "success")
    },
    onError: (err: Error) => toast(err.message, "destructive"),
  })

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? `Edit ${editing.name}` : "Add state / union territory"}</DialogTitle>
          {editing && (
            <DialogDescription>Changing the slug changes the public URL /jobs/state/&lt;slug&gt;.</DialogDescription>
          )}
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    onChange={(e) => {
                      field.onChange(e)
                      if (!editing) form.setValue("slug", toSlug(e.target.value))
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="slug" render={({ field }) => (
              <FormItem>
                <FormLabel>Slug</FormLabel>
                <FormControl><Input {...field} value={(field.value as string | null | undefined) ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="type" render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="STATE">State</SelectItem>
                    <SelectItem value="UNION_TERRITORY">Union Territory</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>{editing ? "Update" : "Create"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function DistrictsSheet({
  state,
  onClose,
  onChanged,
  onDelete,
}: {
  state: StateRow | null
  onClose: () => void
  onChanged: () => void
  onDelete: (d: DistrictRow) => void
}) {
  const [search, setSearch] = useState("")
  const [editing, setEditing] = useState<DistrictRow | null>(null)

  const districtsQuery = useQuery<{ success: boolean; data: DistrictRow[] }>({
    queryKey: ["admin-locations-districts", state?.id],
    queryFn: () => fetcher(`/api/states/${state!.id}/districts?withJobCounts=1`),
    enabled: !!state,
  })

  const form = useForm<DistrictInput>({
    resolver: zodResolver(districtSchema) as never,
    values: editing ? { name: editing.name, slug: editing.slug } : { name: "", slug: "" },
  })

  const mutation = useMutation({
    mutationFn: (data: DistrictInput) =>
      editing ? api.put(`/api/districts/${editing.id}`, data) : api.post(`/api/states/${state!.id}/districts`, data),
    onSuccess: () => {
      toast(editing ? "District updated" : "District added", "success")
      setEditing(null)
      form.reset({ name: "", slug: "" })
      onChanged()
    },
    onError: (err: Error) => toast(err.message, "destructive"),
  })

  const districts = districtsQuery.data?.data ?? []
  const q = search.trim().toLowerCase()
  const shown = q ? districts.filter((d) => d.name.toLowerCase().includes(q)) : districts

  return (
    <Sheet open={!!state} onOpenChange={(o) => { if (!o) { setEditing(null); setSearch(""); onClose() } }}>
      <SheetContent className="flex w-full flex-col gap-4 overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Districts in {state?.name}</SheetTitle>
          <SheetDescription>
            {districts.length} districts. Names must be unique within the state; the same name may exist in another state.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((d) => mutation.mutate(d))}
            className="space-y-3 rounded-xl border border-rule p-3 dark:border-ink"
          >
            <p className="text-sm font-medium">{editing ? `Edit “${editing.name}”` : "Add a district"}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(e) => {
                        field.onChange(e)
                        if (!editing) form.setValue("slug", toSlug(e.target.value))
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="slug" render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl><Input {...field} value={(field.value as string | null | undefined) ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="flex justify-end gap-2">
              {editing && (
                <Button type="button" variant="outline" size="sm" onClick={() => setEditing(null)}>Cancel edit</Button>
              )}
              <Button type="submit" size="sm" disabled={mutation.isPending}>
                {editing ? "Save" : <><Plus className="mr-1 h-3.5 w-3.5" /> Add</>}
              </Button>
            </div>
          </form>
        </Form>

        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search districts…" aria-label="Search districts" />

        {districtsQuery.isLoading ? (
          <Skeleton className="h-64" />
        ) : (
          <ul className="divide-y divide-rule rounded-xl border border-rule dark:divide-ink dark:border-ink">
            {shown.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-2 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{d.name}</p>
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    {d.slug}
                    {d.jobCount ? ` · ${d.jobCount} job${d.jobCount === 1 ? "" : "s"}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon" aria-label={`Edit ${d.name}`} onClick={() => setEditing(d)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${d.name}`}
                    disabled={!!d.jobCount}
                    title={d.jobCount ? "Jobs are posted for this district" : undefined}
                    onClick={() => onDelete(d)}
                  >
                    <Trash2 className="h-4 w-4 text-brick" />
                  </Button>
                </div>
              </li>
            ))}
            {shown.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted-foreground">No districts</li>}
          </ul>
        )}
      </SheetContent>
    </Sheet>
  )
}
