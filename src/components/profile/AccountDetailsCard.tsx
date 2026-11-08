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
          <dt className="text-muted-foreground dark:text-muted-foreground">Account type</dt>
          <dd className="font-medium text-foreground dark:text-paper">{roleLabel(accountType)}</dd>
        </div>
        <Separator />
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground dark:text-muted-foreground">Sign-in method</dt>
          <dd className="font-medium text-foreground dark:text-paper">{signInMethod}</dd>
        </div>
        <Separator />
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground dark:text-muted-foreground">Email status</dt>
          <dd className={emailVerified ? "font-medium text-brick dark:text-brick" : "font-medium text-brick dark:text-brick"}>
            {emailVerified ? "Verified" : "Not verified"}
          </dd>
        </div>
        <Separator />
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground dark:text-muted-foreground">Member since</dt>
          <dd className="font-medium text-foreground dark:text-paper">{formatDate(new Date(memberSince), "MMM yyyy")}</dd>
        </div>
      </dl>
    </DataCard>
  )
}
