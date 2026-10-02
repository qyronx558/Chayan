import type { Metadata } from "next"
import { PrivateJobsClient } from "../private-jobs-client"

export const metadata: Metadata = {
  title: "Remote Private Jobs - Work From Home",
  description: "Remote and hybrid private jobs with trust scores, salary ranges and one-click tracking.",
}

export default function RemoteJobsPage() {
  return <PrivateJobsClient preset={{ remote: "REMOTE" }} />
}
