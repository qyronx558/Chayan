"use client"

import { useState } from "react"
import type { Control, FieldValues, Path } from "react-hook-form"
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { RichEditor } from "@/components/admin/RichEditor"
import { FileUpload } from "@/components/admin/FileUpload"
import { ImageUpload } from "@/components/admin/ImageUpload"
import { Plus, Trash2, ExternalLink } from "lucide-react"

export interface Option {
  id: string
  name: string
}

/* ---------- Text ---------- */
export function FormTextField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  type = "text",
  nullable = true,
  description,
}: {
  control: Control<T>
  name: Path<T>
  label: string
  placeholder?: string
  type?: string
  nullable?: boolean
  description?: string
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type={type}
              placeholder={placeholder}
              {...field}
              value={(field.value as string | number | null) ?? ""}
              onChange={(e) => {
                const v = e.target.value
                if (!nullable) return field.onChange(v)
                if (type === "number") return field.onChange(v === "" ? null : Number(v))
                field.onChange(v === "" ? null : v)
              }}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

/* ---------- Textarea ---------- */
export function FormTextareaField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  rows = 3,
}: {
  control: Control<T>
  name: Path<T>
  label: string
  placeholder?: string
  rows?: number
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Textarea
              rows={rows}
              placeholder={placeholder}
              value={(field.value as string | null) ?? ""}
              onChange={(e) => field.onChange(e.target.value || null)}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

/* ---------- Rich text ---------- */
export function FormRichField<T extends FieldValues>({
  control,
  name,
  label,
}: {
  control: Control<T>
  name: Path<T>
  label: string
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <RichEditor value={(field.value as string | null) ?? ""} onChange={(v) => field.onChange(v || null)} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

/* ---------- Select ---------- */
export function FormSelectField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder = "Select",
  options,
  allowClear = false,
  clearLabel = "None",
}: {
  control: Control<T>
  name: Path<T>
  label: string
  placeholder?: string
  options: readonly { value: string; label: string }[] | Option[]
  allowClear?: boolean
  clearLabel?: string
}) {
  const normalized = options.map((o) =>
    "value" in o ? o : { value: (o as Option).id, label: (o as Option).name }
  )
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select onValueChange={(v) => field.onChange(v === "__clear__" ? null : v)} value={(field.value as string | null) ?? ""}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {allowClear && <SelectItem value="__clear__">{clearLabel}</SelectItem>}
              {normalized.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
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

/* ---------- Date ---------- */
export function FormDateField<T extends FieldValues>({
  control,
  name,
  label,
}: {
  control: Control<T>
  name: Path<T>
  label: string
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="date"
              value={field.value ? formatDate(field.value as Date | string, "yyyy-MM-dd") : ""}
              onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

/* ---------- PDF upload ---------- */
export function FormPdfField<T extends FieldValues>({
  control,
  name,
  label,
  folder,
}: {
  control: Control<T>
  name: Path<T>
  label: string
  folder?: string
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <FileUpload value={(field.value as string | null) ?? null} onChange={field.onChange} folder={folder} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

/* ---------- Image upload ---------- */
export function FormImageField<T extends FieldValues>({
  control,
  name,
  label,
  folder,
}: {
  control: Control<T>
  name: Path<T>
  label: string
  folder?: string
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <ImageUpload value={(field.value as string | null) ?? null} onChange={field.onChange} folder={folder} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

/* ---------- URL with preview ---------- */
export function FormUrlField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder = "https://...",
}: {
  control: Control<T>
  name: Path<T>
  label: string
  placeholder?: string
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const val = (field.value as string | null) ?? ""
        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <div className="flex gap-2">
                <Input
                  placeholder={placeholder}
                  value={val}
                  onChange={(e) => field.onChange(e.target.value || null)}
                />
                {val && (
                  <a href={val} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border text-teal-700 hover:bg-teal-50">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}

/* ---------- Important dates key-value editor ---------- */
export function ImportantDatesEditor({
  value,
  onChange,
}: {
  value: Record<string, string> | null | undefined
  onChange: (v: Record<string, string> | null) => void
}) {
  const entries = Object.entries(value ?? {})
  const [rows, setRows] = useState<{ key: string; val: string }[]>(
    entries.length ? entries.map(([key, val]) => ({ key, val })) : [{ key: "", val: "" }]
  )

  const commit = (next: { key: string; val: string }[]) => {
    setRows(next)
    const obj: Record<string, string> = {}
    for (const r of next) {
      if (r.key.trim()) obj[r.key.trim()] = r.val
    }
    onChange(Object.keys(obj).length ? obj : null)
  }

  return (
    <div className="space-y-2 rounded-lg border p-3">
      {rows.map((r, i) => (
        <div key={i} className="flex gap-2">
          <Input
            placeholder="Event (e.g. Application Begin)"
            value={r.key}
            onChange={(e) => {
              const next = [...rows]
              next[i] = { ...next[i], key: e.target.value }
              commit(next)
            }}
          />
          <Input
            placeholder="Date (e.g. 01 Jan 2026)"
            value={r.val}
            onChange={(e) => {
              const next = [...rows]
              next[i] = { ...next[i], val: e.target.value }
              commit(next)
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => commit(rows.filter((_, j) => j !== i))}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => commit([...rows, { key: "", val: "" }])}>
        <Plus className="mr-1 h-3 w-3" /> Add date row
      </Button>
    </div>
  )
}
