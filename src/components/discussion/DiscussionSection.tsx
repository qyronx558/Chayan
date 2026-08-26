import { Discussion } from "./Discussion"
import type { PostType } from "./types"

interface DiscussionSectionProps {
  postId: string
  postType: PostType
  path?: string
}

/**
 * Reusable discussion section mounted at the bottom of every detail page.
 * Comments are scoped per (postType, postId) — the same component is reused
 * across jobs, private jobs, results, admit cards, answer keys, syllabus,
 * admissions and blog posts.
 */
export function DiscussionSection({ postId, postType, path }: DiscussionSectionProps) {
  return (
    <div id="discussion">
      <Discussion postId={postId} postType={postType} path={path} />
    </div>
  )
}
