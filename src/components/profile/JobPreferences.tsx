"use client"

import type { UseFormReturn } from "react-hook-form"
import { DataCard } from "@/components/admin/dashboard/DataCard"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { PROFILE_CATEGORIES, PROFILE_QUALIFICATIONS } from "@/lib/profile"
import { INDIAN_STATES_28 } from "@/lib/states"
import type { ProfileUpdateInput } from "@/lib/profile-schemas"

interface JobPreferencesProps {
  form: UseFormReturn<ProfileUpdateInput>
}

export function JobPreferences({ form }: JobPreferencesProps) {
  const { register, watch, setValue } = form
  const states = watch("preferredStates") ?? []
  const cats = watch("interestedCategories") ?? []
  const qual = watch("qualification") ?? ""

  function toggle(list: string[], v: string, apply: (next: string[]) => void) {
    const next = list.includes(v) ? list.filter((x) => x !== v) : [...list, v]
    apply(next)
  }

  return (
    <DataCard
      title="Job preferences"
      subtitle="Used only to match jobs and alerts"
    >
      <div id="job-preferences" className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="profile-qualification">Highest qualification</Label>
            <Select value={qual || ""} onValueChange={(v) => setValue("qualification", v, { shouldDirty: true })}>
              <SelectTrigger id="profile-qualification">
                <SelectValue placeholder="Select qualification" />
              </SelectTrigger>
              <SelectContent>
                {PROFILE_QUALIFICATIONS.map((q) => (
                  <SelectItem key={q} value={q}>
                    {q}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-dob">Date of birth</Label>
            <Input id="profile-dob" type="date" {...register("dateOfBirth")} />
            <p className="text-xs text-muted-foreground dark:text-muted-foreground">Used for age eligibility.</p>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Preferred states</Label>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Preferred states">
            {INDIAN_STATES_28.map((s) => {
              const on = states.includes(s)
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(states, s, (next) => setValue("preferredStates", next, { shouldDirty: true, shouldValidate: true }))}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rule",
                    on
                      ? "border-rule bg-paper-3 text-paper dark:border-rule dark:bg-paper-3"
                      : "border-rule bg-background text-muted-foreground hover:border-rule hover:text-brick  dark:bg-transparent dark:text-muted-foreground"
                  )}
                >
                  {s}
                </button>
              )
            })}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Interested categories</Label>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Interested categories">
            {PROFILE_CATEGORIES.map((c) => {
              const on = cats.includes(c)
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(cats, c, (next) => setValue("interestedCategories", next, { shouldDirty: true, shouldValidate: true }))}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rule",
                    on
                      ? "border-rule bg-paper-3 text-paper dark:border-rule dark:bg-paper-3"
                      : "border-rule bg-background text-muted-foreground hover:border-rule hover:text-brick  dark:bg-transparent dark:text-muted-foreground"
                  )}
                >
                  {c}
                </button>
              )
            })}
          </div>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground dark:text-muted-foreground">
          These details are used only to match jobs and alerts. We do not collect caste or religion.
        </p>
      </div>
    </DataCard>
  )
}
