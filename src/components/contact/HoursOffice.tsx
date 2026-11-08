import Link from "next/link"
import { OFFICE_ADDRESS, OFFICE_MAPS_URL, SUPPORT_HOURS } from "@/lib/channels"

export function HoursOffice() {
 return (
  <dl className="grid gap-6 sm:grid-cols-2">
   <div>
    <dt className="text-[14px] font-medium text-[var(--cp-ink)]">Support hours</dt>
    <dd className="mt-1 text-[15px] leading-relaxed text-[var(--cp-muted)]">{SUPPORT_HOURS}</dd>
   </div>
   <div>
    <dt className="text-[14px] font-medium text-[var(--cp-ink)]">Office</dt>
    <dd className="mt-1 text-[15px] leading-relaxed text-[var(--cp-muted)]">
     {OFFICE_ADDRESS}{" "}
     <Link
      href={OFFICE_MAPS_URL}
      target="_blank"
      rel="noreferrer"
      className="whitespace-nowrap text-[var(--cp-link)] underline decoration-[var(--cp-link)]/40 underline-offset-4 transition-colors hover:decoration-[var(--cp-link)]"
     >
      Get directions
     </Link>
    </dd>
   </div>
  </dl>
 )
}
