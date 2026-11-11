import { DocSection, Term } from "../DocPrimitives"
import type { DocMeta } from "../types"

export const meta: DocMeta = {
  slug: "glossary",
  title: "Glossary",
  description: "Plain meanings of the words you will see in notifications and on ChayanJobs.",
  group: "help",
  minutes: 5,
  toc: [
    { id: "recruitment", title: "Recruitment words" },
    { id: "eligibility", title: "Eligibility words" },
    { id: "exam", title: "Exam and result words" },
    { id: "site", title: "ChayanJobs words" },
  ],
}

export default function Body() {
  return (
    <>
      <DocSection id="recruitment" title="Recruitment words">
        <dl>
          <Term word="Notification">The official announcement of a recruitment, usually a PDF. It is the final word on dates, posts and rules.</Term>
          <Term word="Sarkari Naukri">Hindi for “government job”.</Term>
          <Term word="Vacancy">One open post. “500 vacancies” means 500 people will be selected.</Term>
          <Term word="Corrigendum">A correction to a notification, such as a new date or more posts.</Term>
          <Term word="Last date">The final day to submit the online form. The fee deadline can be a day or two later.</Term>
          <Term word="Registration number">The number you get when you sign up on the official site. You need it for the admit card and result.</Term>
        </dl>
      </DocSection>

      <DocSection id="eligibility" title="Eligibility words">
        <dl>
          <Term word="Eligibility">The conditions you must meet to apply: qualification, age, and sometimes experience or physical standards.</Term>
          <Term word="Cut-off date (for age)">The date your age is counted on. It is written in the notification as “age as on …”.</Term>
          <Term word="Age relaxation">Extra years allowed above the maximum age for some categories, such as OBC, SC, ST, PwBD and ex-servicemen.</Term>
          <Term word="Category">Reservation group: General (UR), OBC, SC, ST, EWS. It changes age limits, fees and cut-offs.</Term>
          <Term word="PwBD">Persons with Benchmark Disabilities.</Term>
          <Term word="Domicile">Being a permanent resident of a state. Some state jobs require it.</Term>
        </dl>
      </DocSection>

      <DocSection id="exam" title="Exam and result words">
        <dl>
          <Term word="Admit card / hall ticket">Your entry pass to the exam, with date, time and centre. Download it from the official site.</Term>
          <Term word="Tier / Phase / Stage">One round of a multi-round exam, such as Tier 1 and Tier 2.</Term>
          <Term word="Answer key">The list of correct answers released after the exam. Provisional first, final later.</Term>
          <Term word="Objection">A request to change an answer in the provisional key, usually with a small fee.</Term>
          <Term word="Negative marking">Marks taken away for each wrong answer.</Term>
          <Term word="Cut-off marks">The lowest marks needed to pass a stage, often different for each category.</Term>
          <Term word="Merit list">The ranked list of selected or qualified candidates.</Term>
          <Term word="DV">Document verification: checking your original certificates.</Term>
          <Term word="Pay level">The step on the government pay matrix that sets your basic pay, such as Level 6.</Term>
        </dl>
      </DocSection>

      <DocSection id="site" title="ChayanJobs words">
        <dl>
          <Term word="Quick summary">The box at the top of a job page with the key facts.</Term>
          <Term word="Tracker">Your list of applications and the stage each one is at.</Term>
          <Term word="Official-site viewer">The window that opens official websites and PDFs inside ChayanJobs.</Term>
          <Term word="Trust score">A rating on private jobs based on the apply link, company domain and scam signals.</Term>
          <Term word="Match score">How well your resume fits a private job.</Term>
          <Term word="Two-step login (2FA)">Signing in with your password plus a code from an app on your phone.</Term>
          <Term word="Digest">One email that bundles many updates together.</Term>
        </dl>
      </DocSection>
    </>
  )
}
