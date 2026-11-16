/**
 * schema.org JobPosting for a private job, in the shape Google for Jobs reads:
 * https://developers.google.com/search/docs/appearance/structured-data/job-posting
 */

interface JobForLd {
  title: string
  slug: string
  description: string | null
  createdAt: Date
  lastDate: Date | null
  expiresAt: Date | null
  type: string
  location: string | null
  country?: string | null
  city?: string | null
  remotePolicy: string | null
  salaryMin: number | null
  salaryMax: number | null
  salaryCurrency?: string | null
  salaryLocalMin?: number | null
  salaryLocalMax?: number | null
  vacancies: number | null
  skills: string[]
  qualification: string | null
  expMin: number | null
  company: { name: string; website: string | null; logo: string | null }
}

const EMPLOYMENT_TYPE: Record<string, string> = {
  FULL_TIME: "FULL_TIME",
  PART_TIME: "PART_TIME",
  INTERNSHIP: "INTERN",
  CONTRACT: "CONTRACTOR",
}

import { jobDescriptionHtml } from "@/lib/private-jobs/description"
import { countryName } from "@/lib/private-jobs/geo"

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

export function buildPrivateJobPostingLd(job: JobForLd, baseUrl: string): Record<string, unknown> {
  const description = jobDescriptionHtml(job.description) ?? (job.description?.trim()
    ? job.description
        .trim()
        .split(/\n{2,}/)
        .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
        .join("")
    : `<p>${escapeHtml(`${job.title} at ${job.company.name}.`)}</p>`)
  const validThrough = job.lastDate ?? job.expiresAt
  const remote = job.remotePolicy === "REMOTE"
  const city = job.city || job.location?.split(",")[0]?.trim()
  // ISO code for Google; jobs without a known country are the Indian default.
  const country = job.country && /^[A-Z]{2}$/.test(job.country) ? job.country : "IN"

  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description,
    datePosted: job.createdAt.toISOString(),
    ...(validThrough ? { validThrough: validThrough.toISOString() } : {}),
    employmentType: EMPLOYMENT_TYPE[job.type] ?? "FULL_TIME",
    url: `${baseUrl}/private-jobs/${job.slug}`,
    hiringOrganization: {
      "@type": "Organization",
      name: job.company.name,
      ...(job.company.website ? { sameAs: job.company.website } : {}),
      ...(job.company.logo ? { logo: job.company.logo } : {}),
    },
    directApply: false,
  }
  if (city) {
    ld.jobLocation = {
      "@type": "Place",
      address: { "@type": "PostalAddress", addressLocality: city, addressCountry: country },
    }
  }
  if (remote) {
    ld.jobLocationType = "TELECOMMUTE"
    ld.applicantLocationRequirements = { "@type": "Country", name: countryName(country) }
  }
  if (!city && !remote) {
    ld.jobLocation = { "@type": "Place", address: { "@type": "PostalAddress", addressCountry: country } }
  }
  // Published currency when the job is abroad (Google wants the real one), else INR.
  const foreign = !!job.salaryCurrency && job.salaryCurrency !== "INR" && (job.salaryLocalMin != null || job.salaryLocalMax != null)
  const payMin = foreign ? job.salaryLocalMin : job.salaryMin
  const payMax = foreign ? job.salaryLocalMax : job.salaryMax
  if (payMin != null || payMax != null) {
    ld.baseSalary = {
      "@type": "MonetaryAmount",
      currency: foreign ? job.salaryCurrency : "INR",
      value: {
        "@type": "QuantitativeValue",
        ...(payMin != null ? { minValue: payMin } : {}),
        ...(payMax != null ? { maxValue: payMax } : {}),
        unitText: "YEAR",
      },
    }
  }
  if (job.vacancies) ld.totalJobOpenings = job.vacancies
  if (job.skills.length) ld.skills = job.skills.join(", ")
  if (job.qualification) ld.educationRequirements = job.qualification
  if (job.expMin != null) {
    ld.experienceRequirements = { "@type": "OccupationalExperienceRequirements", monthsOfExperience: job.expMin * 12 }
  }
  return ld
}
