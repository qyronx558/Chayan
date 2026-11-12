import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"

/**
 * CDN cache policy for anonymous, public catalogue responses.
 * Do not use this for personalised or authenticated responses.
 */
export function publicApiResponse<T>(body: T, maxAgeSeconds = 60) {
  return NextResponse.json(body, {
    headers: {
      "Cache-Control": `public, s-maxage=${maxAgeSeconds}, stale-while-revalidate=${maxAgeSeconds * 2}`,
    },
  })
}

type ContentKind =
  | "job"
  | "private-job"
  | "result"
  | "admit-card"
  | "admission"
  | "answer-key"
  | "syllabus"
  | "blog"
  | "featured"

/** State/district SEO pages (job counts + listings), also used after location edits. */
export function revalidateLocationPages() {
  revalidatePath("/jobs/states")
  revalidatePath("/jobs/state/[stateSlug]", "page")
  revalidatePath("/jobs/district/[stateSlug]/[districtSlug]", "page")
}

/** Revalidates every public route affected by a CMS write. */
export function revalidatePublicContent(kind: ContentKind, slug?: string) {
  revalidatePath("/")
  if (kind === "job") {
    revalidatePath("/category/[slug]", "page")
    revalidateLocationPages()
  }

  const routes: Record<ContentKind, string[]> = {
    job: ["/jobs", "/apply"],
    "private-job": ["/private-jobs"],
    result: ["/results", "/result"],
    "admit-card": ["/admit-cards", "/admit-card"],
    admission: ["/admissions", "/admission"],
    "answer-key": ["/answer-keys", "/answer-key"],
    syllabus: ["/syllabus"],
    blog: ["/blog"],
    featured: [],
  }

  for (const route of routes[kind]) revalidatePath(route)
  if (slug && routes[kind][1]) revalidatePath(`${routes[kind][1]}/${slug}`)
}
