"use client"

import { cn, formatDate } from "@/lib/utils"
import { typeFont } from "@/components/home/fonts"
import { paperShadow } from "@/components/desk/DeskKit"
import { roleLabel } from "@/lib/profile"

interface AccountDetailsCardProps {
  accountType: string
  signInMethod: string
  emailVerified: boolean
  memberSince: string
}

export function AccountDetailsCard({ accountType, signInMethod, emailVerified, memberSince }: AccountDetailsCardProps) {
  const rows: [string, string][] = [
    ["ACCOUNT", roleLabel(accountType)],
    ["SIGNS IN WITH", signInMethod],
    ["EMAIL", emailVerified ? "Verified" : "Not verified yet"],
    ["JOINED", formatDate(new Date(memberSince), "MMM yyyy")],
  ]
  return (
    <section aria-label="Account details" className={cn(typeFont.className, "-rotate-[0.4deg] rounded-[2px] bg-[var(--hs-paper-slip)] px-5 py-4")} style={{ boxShadow: paperShadow }}>
      <h2 className="border-b-2 border-double border-[var(--hs-gov)] pb-1.5 text-center text-[11px] font-bold tracking-[0.2em] text-[var(--hs-gov)]">LIBRARY CARD</h2>
      <dl className="mt-1 text-[12.5px]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-3 border-b border-[color-mix(in_oklch,var(--hs-pvt)_25%,transparent)] py-1.5 last:border-b-0">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="text-right text-foreground">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
