import type { Metadata } from "next"
import { PrivateJobsClient } from "../private-jobs-client"

export const metadata: Metadata = {
  title: "Walk-in Interviews - Private Jobs",
  description: "Walk-in private jobs with venue and date, trust-checked.",
}

export default function WalkinJobsPage() {
  return <PrivateJobsClient preset={{ walkin: "1" }} />
}
