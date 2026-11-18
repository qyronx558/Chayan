import Link from "next/link"
import type { Metadata } from "next"
import { Clause, LegalPaper } from "@/components/legal/LegalPaper"

export const metadata: Metadata = {
  title: "Disclaimer",
  description: "Disclaimer for ChayanJobs. Important information about our relationship with government organizations and the accuracy of content.",
  openGraph: {
    title: "Disclaimer - ChayanJobs",
    description: "Read the disclaimer regarding our association with government bodies and information accuracy.",
  },
}

export default function DisclaimerPage() {
  return (
    <LegalPaper kind="disclaimer" title="Disclaimer">

      <Clause title="No Government Affiliation">
        <p>
          ChayanJobs is a private informational website and is NOT affiliated with any government
          organization, ministry, department, or public sector undertaking. We are not a government
          entity, nor do we represent any official government body. Our platform simply aggregates
          publicly available information from official sources for the convenience of job seekers.
        </p>
      </Clause>

      <Clause title="Accuracy of Information">
        <p>
          While we strive to ensure that all information on our website is accurate and up-to-date, we
          make no guarantees regarding the completeness, reliability, or timeliness of any content.
          Government recruitment notifications, exam dates, and application deadlines are subject to
          change at the discretion of the respective authorities.
        </p>
        <p>
          Users are strongly advised to verify all details - including eligibility criteria, application
          fees, exam patterns, and important dates - on the official website of the concerned department
          or recruiting body before applying for any position.
        </p>
      </Clause>

      <Clause title="No Guarantee of Job Placement">
        <p>
          ChayanJobs does not guarantee job placement, selection, or recruitment in any government
          organization. We provide information about vacancies and examinations only. The recruitment
          process, including shortlisting, examination, interview, and final selection, is solely the
          responsibility of the respective recruiting authority.
        </p>
      </Clause>

      <Clause title="No Fees Charged">
        <p>
          ChayanJobs does not charge any fees for job listings, application assistance, or exam
          registration. We do not ask for money, bank details, or any form of payment from job seekers.
          Beware of fraudulent individuals or entities claiming to represent ChayanJobs and asking
          for payment in exchange for job placements or application processing.
        </p>
        <div className="legal-warn">
          <p>
            Important: If anyone contacts you on behalf of ChayanJobs requesting payment, please
            report it to the local authorities immediately.
          </p>
        </div>
      </Clause>

      <Clause title="External Links">
        <p>
          Our website contains links to external third-party websites for your convenience and reference.
          We do not endorse, control, or take responsibility for the content, privacy practices, or
          availability of these external sites. Users access these links at their own risk.
        </p>
      </Clause>

      <Clause title="Limitation of Liability">
        <p>
          ChayanJobs, its owners, employees, or affiliates shall not be held liable for any direct,
          indirect, incidental, consequential, or punitive damages arising out of your access to, use of,
          or reliance on any information provided on this website. By using this site, you agree to
          indemnify and hold us harmless from any claims arising from your use of our content.
        </p>
      </Clause>

      <Clause title="Contact">
        <p>
          If you have any questions about this disclaimer, please{" "}
          <Link href="/contact">contact us</Link>.
        </p>
      </Clause>
    </LegalPaper>
  )
}
