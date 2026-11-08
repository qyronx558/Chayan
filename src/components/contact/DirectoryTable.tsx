"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { DIRECTORY_ROWS } from "@/lib/channels"

export function DirectoryTable() {
  const [copied, setCopied] = useState<string | null>(null)

  async function copy(email: string) {
    try {
      await navigator.clipboard.writeText(email)
      setCopied(email)
      setTimeout(() => setCopied((current) => (current === email ? null : current)), 1600)
    } catch {
      setCopied(null)
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">Official ChayanJobs email addresses by team</caption>
        <thead className="hidden md:table-header-group">
          <tr className="border-b border-[var(--cp-border)]">
            <th scope="col" className="w-[26%] py-2.5 pr-4 text-[13px] font-semibold text-[var(--cp-muted)]">
              Team
            </th>
            <th scope="col" className="w-[38%] py-2.5 pr-4 text-[13px] font-semibold text-[var(--cp-muted)]">
              Email
            </th>
            <th scope="col" className="w-[22%] py-2.5 pr-4 text-[13px] font-semibold text-[var(--cp-muted)]">
              Typical reply
            </th>
            <th scope="col" className="w-[14%] py-2.5 text-[13px] font-semibold text-[var(--cp-muted)]">
              <span className="sr-only">Copy address</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {DIRECTORY_ROWS.map((row) => (
            <tr
              key={row.email}
              className="block border-b border-[var(--cp-border)] py-4 last:border-0 md:table-row md:py-0"
            >
              <td className="block pr-4 md:table-cell md:py-3.5">
                <span className="block text-[15px] font-medium text-[var(--cp-ink)]">{row.team}</span>
                <span className="mt-0.5 block text-[13px] leading-relaxed text-[var(--cp-muted)]">
                  {row.description}
                </span>
              </td>
              <td className="mt-2 block pr-4 md:mt-0 md:table-cell md:py-3.5">
                <a
                  href={`mailto:${row.email}`}
                  className="font-mono text-[14px] text-[var(--cp-link)] underline decoration-[var(--cp-link)]/30 underline-offset-4 transition-colors hover:decoration-[var(--cp-link)]"
                >
                  {row.email}
                </a>
              </td>
              <td className="mt-1 block pr-4 text-[14px] text-[var(--cp-muted)] md:mt-0 md:table-cell md:py-3.5">
                {row.reply}
              </td>
              <td className="mt-2 block md:mt-0 md:table-cell md:py-3.5 md:text-right">
                <button
                  type="button"
                  onClick={() => copy(row.email)}
                  aria-label={copied === row.email ? `Copied ${row.email}` : `Copy ${row.email}`}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[var(--cp-border)] px-3 text-[13px] font-medium text-[var(--cp-ink)] transition-colors hover:bg-[var(--cp-soft)]"
                >
                  {copied === row.email ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-foreground" aria-hidden /> Copied
                    </>
                  ) : (
                    "Copy"
                  )}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
