"use client"

import { PrivateJobDetailContent } from "@/components/private/PrivateJobDetailContent"

interface Company {
  id: string; name: string; slug?: string | null; logo?: string | null; website?: string | null; description?: string | null; verifiedStatus?: string
}

interface PrivateJob {
  id: string; title: string; slug: string; type: string; category?: string | null
  description?: string | null; location?: string | null; salary?: string | null
  salaryMin?: number | null; salaryMax?: number | null
  experience?: string | null; expMin?: number | null; expMax?: number | null
  qualification?: string | null; skills?: string[]; remotePolicy?: string | null
  vacancies?: number | null; views?: number | null; trustScore?: number | null
  isFresherFriendly?: boolean; isWalkIn?: boolean; walkInVenue?: string | null; walkInDate?: string | null
  proofUrl?: string | null
  applicationUrl?: string | null
  applicationEmail?: string | null; lastDate?: string | null; status: string
  company: Company; createdAt: string; updatedAt?: string | null
}

/** Back-compat wrapper - full gov-parity layout lives in PrivateJobDetailContent. */
export function PrivateJobDetail({ job }: { job: PrivateJob }) {
  return <PrivateJobDetailContent job={job} />
}
