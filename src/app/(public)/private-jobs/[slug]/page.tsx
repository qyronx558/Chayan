import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { PrivateJobDetail } from "./private-job-detail"
import { DiscussionSection } from "@/components/discussion/DiscussionSection"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const job = await prisma.privateJob.findUnique({
    where: { slug },
    include: { company: true },
  })

  if (!job) return { title: "Not Found" }

  return {
    title: `${job.title} - ${job.company.name}`,
    description: `Apply for ${job.title} at ${job.company.name}. ${job.location ? `Location: ${job.location}.` : ""} ${job.salary ? `Salary: ${job.salary}.` : ""}`,
  }
}

export const dynamic = "force-dynamic"

export default async function PrivateJobPage({ params }: Props) {
  const { slug } = await params
  const job = await prisma.privateJob.findUnique({
    where: { slug },
    include: { company: true },
  })

  if (!job) notFound()

  return (
    <>
      <PrivateJobDetail job={JSON.parse(JSON.stringify(job))} />
      <div className="container mx-auto max-w-4xl px-4">
        <DiscussionSection postType="PRIVATE_JOB" postId={job.id} path={`/private-jobs/${job.slug}`} />
      </div>
    </>
  )
}