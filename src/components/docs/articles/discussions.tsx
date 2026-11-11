import Link from "next/link"
import { Callout, DocSection, InfoTable, Kbd } from "../DocPrimitives"
import type { DocMeta } from "../types"

export const meta: DocMeta = {
  slug: "discussions",
  title: "Discussions and the blog",
  description: "Ask questions under any post, help others, and read our preparation guides.",
  group: "community",
  minutes: 5,
  toc: [
    { id: "where", title: "Where discussions are" },
    { id: "posting", title: "Posting and replying" },
    { id: "best-answer", title: "Questions and best answers" },
    { id: "follow", title: "Following a thread" },
    { id: "rules", title: "Community rules" },
    { id: "blog", title: "The blog" },
  ],
}

export default function Body() {
  return (
    <>
      <DocSection id="where" title="Where discussions are">
        <p>
          Every job, private job, result, admit card, answer key, syllabus, admission and blog post has a discussion at the
          bottom. Reading is open to everyone; you need to be signed in to post.
        </p>
      </DocSection>

      <DocSection id="posting" title="Posting and replying">
        <ul>
          <li>Write in the box at the top of the discussion. Press <Kbd>Ctrl</Kbd> + <Kbd>Enter</Kbd> to post.</li>
          <li>Simple formatting works: bold, lists, links, inline code and strikethrough, and you can add an image.</li>
          <li>Reply under any comment. Replies nest into threads; collapse a long thread to skim past it.</li>
          <li>Edit or delete your own comments from the comment’s menu.</li>
          <li>Search comments to find whether your question was already answered.</li>
        </ul>
      </DocSection>

      <DocSection id="best-answer" title="Questions and best answers">
        <p>
          Mark your post as a <strong>question</strong> to make it stand out. When someone answers it well, it can be marked as the{" "}
          <strong>best answer</strong> and shown first, so the next person finds the answer quickly. Use the{" "}
          <em>Questions</em> view to see only questions.
        </p>
      </DocSection>

      <DocSection id="follow" title="Following a thread">
        <p>Tap <strong>Follow</strong> on a discussion and you will be notified of new comments. New comments and replies also appear live while the page is open.</p>
      </DocSection>

      <DocSection id="rules" title="Community rules">
        <InfoTable
          head={["Please do", "Please do not"]}
          rows={[
            ["Ask clear questions about the post", "Share phone numbers, Aadhaar, roll numbers or passwords"],
            ["Link to the official source when you can", "Post fake “inside” news, paper leaks or rumours"],
            ["Be kind to first-time aspirants", "Abuse, spam, or advertise coaching and paid services"],
          ]}
        />
        <p>
          Use <strong>Report</strong> on any comment that breaks these rules; our moderators review every report. Some comments
          are held for review before they appear, and you may be asked to confirm you are human. Comments are the views of the
          person who wrote them, not of ChayanJobs. See our <Link href="/editorial-policy">Editorial Policy</Link>.
        </p>
        <Callout tone="warning">
          If anyone in a discussion offers a “guaranteed” selection for money, it is a scam. Report it.
        </Callout>
      </DocSection>

      <DocSection id="blog" title="The blog">
        <p>
          The <Link href="/blog">Blog</Link> has preparation strategies, exam explainers and career guides. Browse by topic or tag.
          Articles have a table of contents and a reading progress bar, and you can share them on WhatsApp. Subscribe to new
          posts with the <Link href="/rss">RSS feed</Link>.
        </p>
      </DocSection>
    </>
  )
}
