import { Discussion } from "./Discussion"
import type { PostType } from "./types"

interface DiscussionSectionProps {
 postId: string
 postType: PostType
 path?: string
}

/**
 * Reusable discussion section mounted at the bottom of every detail page.
 * Comments are scoped per (postType, postId) - the same component is reused
 * across jobs, private jobs, results, admit cards, answer keys, syllabus,
 * admissions and blog posts.
 *
 * Hidden in print (print:hidden) - comments are interactive-only content
 * and must never appear on printed job / result sheets.
 */
export function DiscussionSection({ postId, postType, path }: DiscussionSectionProps) {
 return (
  <div id="discussion" className="print:hidden">
   <Discussion postId={postId} postType={postType} path={path} />
  </div>
 )
}
