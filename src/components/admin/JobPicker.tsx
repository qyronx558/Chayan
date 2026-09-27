"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { fetcher } from "@/lib/api"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import type { Control, FieldValues, Path } from "react-hook-form"

interface JobOption {
  id: string
  title: string
}

export function JobPickerField<T extends FieldValues>({
  control,
  name,
  label = "Linked Job (optional)",
}: {
  control: Control<T>
  name: Path<T>
  label?: string
}) {
  const [search, setSearch] = useState("")
  const { data } = useQuery<{ success: boolean; data: JobOption[] }>({
    queryKey: ["admin-job-picker", search],
    queryFn: () => fetcher(`/api/jobs?limit=50&search=${encodeURIComponent(search)}&scope=mine`),
  })
  const jobs = data?.data ?? []

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select
            onValueChange={(v) => field.onChange(v === "__none__" ? null : v)}
            value={(field.value as string | null) ?? "__none__"}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="No linked job" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <div className="p-2">
                <input
                  className="w-full rounded-md border px-2 py-1 text-sm outline-none"
                  placeholder="Search jobs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </div>
              <SelectItem value="__none__">No linked job</SelectItem>
              {jobs.map((j) => (
                <SelectItem key={j.id} value={j.id}>
                  {j.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
