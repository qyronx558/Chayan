import Link from "next/link"
import { Callout, DocSection, Step, Steps } from "../DocPrimitives"
import type { DocMeta } from "../types"

export const meta: DocMeta = {
  slug: "free-tools",
  title: "Free tools",
  description: "Check your exact age, see your take-home pay, resize photos for forms, and find jobs you qualify for.",
  group: "apply",
  minutes: 6,
  toc: [
    { id: "age", title: "Age Calculator" },
    { id: "eligibility", title: "Eligibility Checker" },
    { id: "photo", title: "Photo Resizer" },
    { id: "salary", title: "Salary Explorer" },
  ],
}

export default function Body() {
  return (
    <>
      <p className="text-[1.0625rem] leading-relaxed text-ink-2">
        All tools are free, need no account, and live at <Link href="/tools" className="text-brick underline">/tools</Link>.
      </p>

      <DocSection id="age" title="Age Calculator">
        <p>Age limits are counted on a fixed <strong>cut-off date</strong> written in the notification, not on today’s date. This tool does that maths for you.</p>
        <Steps>
          <Step title="Enter your birth date" />
          <Step title="Enter the cut-off date">Use the date given in the notification (“age as on …”).</Step>
          <Step title="Choose your category">The tool adds the standard relaxation for your category.</Step>
          <Step title="Read the answer">You see your exact age, the minimum and maximum allowed, and whether you are too young, too old or within the limit.</Step>
        </Steps>
        <Callout tone="note">Some notifications set different limits for each post. Always confirm with the notification PDF.</Callout>
        <p><Link href="/tools/age-calculator">Open the Age Calculator</Link></p>
      </DocSection>

      <DocSection id="eligibility" title="Eligibility Checker">
        <p>
          Tell it about yourself (birth date, category and qualification, from 10th to ITI or Diploma to higher study) and it
          shows the kinds of jobs you can apply for now, with a <strong>See jobs</strong> button that opens the matching list.
        </p>
        <p><Link href="/tools/eligibility-checker">Open the Eligibility Checker</Link></p>
      </DocSection>

      <DocSection id="photo" title="Photo Resizer">
        <p>Online forms reject photos and signatures that are the wrong size. This tool makes them ready in seconds.</p>
        <Steps>
          <Step title="Choose what you are making">Photo, signature, or compress any image.</Step>
          <Step title="Choose the image">Pick it from your phone or computer.</Step>
          <Step title="Set the size limit">Enter the maximum size in KB from the form (for example, up to 30 KB for a signature).</Step>
          <Step title="Download">Save the result. You can also save a printable PDF of your photo.</Step>
        </Steps>
        <Callout tone="tip" title="Private by design">
          Your photo never leaves your device. The resizing happens inside your browser and nothing is uploaded to ChayanJobs.
        </Callout>
        <p><Link href="/tools/photo-resizer">Open the Photo Resizer</Link></p>
      </DocSection>

      <DocSection id="salary" title="Salary Explorer">
        <p>
          Government jobs state pay as a <strong>pay level</strong> (for example, Level 6 or 7 for many SSC CGL and SI posts).
          Choose the level and the kind of city you will live in (a big city, a medium city or a small town), and the tool shows:
        </p>
        <ul>
          <li>The total salary, including house rent and other allowances.</li>
          <li>What is cut: retirement contribution, medical and insurance, and an approximate tax.</li>
          <li>Your estimated take-home pay per month.</li>
        </ul>
        <Callout tone="note">This is an estimate. Overtime and special allowances are extra, and official pay rules may change.</Callout>
        <p><Link href="/tools/salary-calculator">Open the Salary Explorer</Link></p>
      </DocSection>
    </>
  )
}
