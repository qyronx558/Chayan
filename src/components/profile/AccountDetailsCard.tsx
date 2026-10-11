"use client"

import { DataCard } from "@/components/admin/dashboard/DataCard"
import { Separator } from "@/components/ui/separator"
import { formatDate } from "@/lib/utils"
import { roleLabel } from "@/lib/profile"

interface AccountDetailsCardProps {
  accountType: string
  signInMethod: string
  emailVerified: boolean
  memberSince: string
}

export function AccountDetailsCard({ accountType, signInMethod, emailVerified, memberSince }: AccountDetailsCardProps) {
  return (
    <DataCard title="Account details" subtitle="Read-only account facts">
      <dl className="space-y-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-slate-500 dark:text-slate-400">Account type</dt>
          <dd className="font-medium text-slate-900 dark:text-slate-50">{roleLabel(accountType)}</dd>
        </div>
        <Separator />
        <div className="flex items-center justify-between gap-3">
          <dt className="text-slate-500 dark:text-slate-400">Sign-in method</dt>
          <dd className="font-medium text-slate-900 dark:text-slate-50">{signInMethod}</dd>
        </div>
        <Separator />
        <div className="flex items-center justify-between gap-3">
          <dt className="text-slate-500 dark:text-slate-400">Email status</dt>
          <dd className={emailVerified ? "font-medium text-teal-700 dark:text-teal-300" : "font-medium text-amber-700 dark:text-amber-300"}>
            {emailVerified ? "Verified" : "Not verified"}
          </dd>
        </div>
        <Separator />
        <div className="flex items-center justify-between gap-3">
          <dt className="text-slate-500 dark:text-slate-400">Member since</dt>
          <dd className="font-medium text-slate-900 dark:text-slate-50">{formatDate(new Date(memberSince), "MMM yyyy")}</dd>
        </div>
      </dl>
    </DataCard>
  )
}
