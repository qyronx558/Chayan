"use client"

import { useState } from "react"
import Link from "next/link"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"
import { ExternalLink } from "lucide-react"
import { fetcher } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { T_CARD, T_HEAD_CELL } from "@/components/admin/list/tokens"
import type { ActivityResponse } from "./types"

const STATUS_STYLE: Record<string, string> = {
  POSTED: "bg-paper-3 text-foreground",
  DUPLICATE: "bg-paper-2 text-muted-foreground",
  SKIPPED: "bg-paper-2 text-muted-foreground",
  FAILED: "bg-destructive/10 text-brick",
}

export function ActivityTab() {
  const [status, setStatus] = useState("all")
  const [source, setSource] = useState("")
  const [page, setPage] = useState(1)
  const params = new URLSearchParams({ page: String(page) })
  if (status !== "all") params.set("status", status)
  if (source.trim()) params.set("source", source.trim())

  const q = useQuery({
    queryKey: ["content-bot", "activity", params.toString()],
    queryFn: () => fetcher<ActivityResponse>(`/api/admin/content-bot/activity?${params}`),
    placeholderData: keepPreviousData,
  })
  const pages = q.data ? Math.max(1, Math.ceil(q.data.total / q.data.pageSize)) : 1

  return (
    <div className="space-y-4">
      <Card className={cn(T_CARD, "p-5")}>
        <h2 className="text-base font-semibold text-foreground">Bot runs</h2>
        <p className="text-sm text-muted-foreground">One row per run part (central, state, each district quarter).</p>
        {q.isLoading ? (
          <Skeleton className="mt-3 h-24" />
        ) : q.data?.runs.length ? (
          <ul className="mt-3 divide-y divide-rule">
            {q.data.runs.map((r) => (
              <li key={r.id} className="py-2.5 text-sm">
                <details>
                  <summary className="flex cursor-pointer flex-wrap items-center gap-3">
                    <span className="font-medium text-foreground">{r.source.replace(/^ingest:/, "")}</span>
                    <span className="text-muted-foreground">{formatDistanceToNow(new Date(r.startedAt), { addSuffix: true })}</span>
                    <span className="text-foreground">{r.imported} posted</span>
                    {r.errors > 0 && <span className="text-brick">{r.errors} errors</span>}
                  </summary>
                  {r.detail && <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-paper-2 p-3 text-xs text-foreground">{r.detail}</pre>}
                </details>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">No runs recorded yet.</p>
        )}
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
          <SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All results</SelectItem>
            <SelectItem value="POSTED">Posted</SelectItem>
            <SelectItem value="DUPLICATE">Duplicate</SelectItem>
            <SelectItem value="SKIPPED">Skipped</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Input value={source} onChange={(e) => { setSource(e.target.value); setPage(1) }} placeholder="Filter by exact source id, e.g. bpsc" className="sm:w-72" />
      </div>

      <Card className={T_CARD}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={T_HEAD_CELL}>Result</TableHead>
                <TableHead className={T_HEAD_CELL}>Notice</TableHead>
                <TableHead className={T_HEAD_CELL}>Type</TableHead>
                <TableHead className={cn(T_HEAD_CELL, "text-right")}>Quality</TableHead>
                <TableHead className={T_HEAD_CELL}>Why</TableHead>
                <TableHead className={T_HEAD_CELL}>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {q.isLoading
                ? Array.from({ length: 6 }).map((_, i) => <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-6" /></TableCell></TableRow>)
                : !q.data?.items.length
                  ? <TableRow><TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">Nothing here yet.</TableCell></TableRow>
                  : q.data.items.map((it) => (
                      <TableRow key={it.id}>
                        <TableCell>
                          <Badge variant="secondary" className={cn("border-0", STATUS_STYLE[it.status])}>{it.status.toLowerCase()}</Badge>
                          {it.autoApproved && <span className="ml-1 text-[11px] text-muted-foreground">auto</span>}
                        </TableCell>
                        <TableCell className="max-w-[340px]">
                          <a href={it.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-foreground hover:text-brick">
                            <span className="truncate">{decodeURIComponent(it.url.split("/").pop() || it.url)}</span>
                            <ExternalLink className="h-3 w-3 shrink-0" />
                          </a>
                          <span className="text-xs text-muted-foreground">{it.sourceId}</span>
                        </TableCell>
                        <TableCell className="text-sm text-foreground">{it.kind}</TableCell>
                        <TableCell className="text-right tabular-nums text-sm text-foreground">{it.quality ?? "—"}</TableCell>
                        <TableCell className="max-w-[260px] text-xs text-muted-foreground">
                          {it.status === "POSTED" && !it.autoApproved ? (
                            <Link href="/admin/review" className="text-brick hover:underline">Waiting in Content verification</Link>
                          ) : (
                            <span className="line-clamp-2">{it.reason ?? "—"}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(it.updatedAt), { addSuffix: true })}</TableCell>
                      </TableRow>
                    ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between border-t border-rule px-4 py-3 text-sm text-muted-foreground">
          <span>{q.data ? `${q.data.total} notices` : ""}</span>
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <span className="tabular-nums">{page} / {pages}</span>
            <Button type="button" size="sm" variant="ghost" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
