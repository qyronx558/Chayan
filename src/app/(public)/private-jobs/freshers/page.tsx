import type { Metadata } from "next"
import { PrivateJobsClient } from "../private-jobs-client"

export const metadata: Metadata = {
  title: "Fresher Private Jobs - 0-2 Years, Internships",
  description: "Fresher-friendly private jobs and internships with prep kits and resume match.",
}

export default function FresherJobsPage() {
  return <PrivateJobsClient preset={{ fresher: "1" }} />
}
