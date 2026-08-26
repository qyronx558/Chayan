"use client"

import { useState } from "react"
import { ShieldCheck, Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface FAQItem {
  question: string
  answer: string
}

interface FAQProps {
  items?: FAQItem[]
  className?: string
}

const defaultItems: FAQItem[] = [
  {
    question: "What is the eligibility criteria for government jobs in India?",
    answer:
      "Eligibility criteria vary by job and department. Generally, candidates must be Indian citizens with specific educational qualifications (10th, 12th, graduate, postgraduate, etc.), age limits typically between 18-40 years (with relaxations for reserved categories), and sometimes physical standards for defence/police roles. Each notification specifies detailed eligibility requirements.",
  },
  {
    question: "How can I apply for government jobs online?",
    answer:
      "Most government job applications are submitted online through official websites of recruiting bodies like SSC (ssc.nic.in), UPSC (upsc.gov.in), Indian Railways (rrb.gov.in), IBPS (ibps.in), and state government portals. You need to register, fill the application form, upload documents, pay fees (if applicable), and submit before the deadline.",
  },
  {
    question: "What documents are required for government job applications?",
    answer:
      "Commonly required documents include: educational certificates, caste/category certificate, date of birth proof, domicile certificate, passport-size photographs, signature image, ID proof (Aadhaar, PAN, Voter ID), experience certificates (if required), and disability certificate (if applicable). All documents should be scanned in prescribed format and size.",
  },
  {
    question: "How are government job exam results published?",
    answer:
      "Results are published on the official websites of the respective recruiting bodies. They are usually released in PDF format containing roll numbers or names of selected candidates. You can check results on our portal or directly on official websites. Results are also sometimes published in leading newspapers.",
  },
  {
    question: "What is the application fee for government exams?",
    answer:
      "Application fees vary by exam and category. General/OBC candidates typically pay ₹100-₹500, while SC/ST/PWD/Women candidates often have reduced fees or full exemptions. Fees can be paid online via debit/credit card, net banking, or UPI. Some exams are completely free for all categories.",
  },
  {
    question: "How can I download my admit card for government exams?",
    answer:
      "Admit cards are uploaded on the official website of the conducting body before the exam date. You need to log in using your registration number and date of birth to download the hall ticket. We also provide direct download links on our Admit Cards page as soon as they are released.",
  },
]

const relatedQuestions: FAQItem[] = [
  {
    question: "What is the selection process for government jobs?",
    answer:
      "The selection process typically involves multiple stages: written examination (prelims and mains), skill test/typing test (where applicable), physical efficiency test (for police/defence), document verification, and medical examination. The final selection is based on merit in all stages combined.",
  },
  {
    question: "Are there age relaxations for reserved categories?",
    answer:
      "Yes, the government provides age relaxation for reserved categories as per rules. SC/ST candidates typically get 5 years relaxation, OBC gets 3 years, PWD gets 10 years, and Ex-Servicemen get relaxation based on service duration. Age relaxation varies by exam and department.",
  },
  {
    question: "How often are job notifications released?",
    answer:
      "Government job notifications are released throughout the year. Major recruitments like SSC CGL, UPSC Civil Services, and Banking exams follow annual cycles. State-level and department-specific notifications are released as per vacancies. You can subscribe to our notifications to get real-time alerts.",
  },
]

export function FAQ({ items = defaultItems, className }: FAQProps) {
  const [extraItems, setExtraItems] = useState<FAQItem[]>([])
  const [openQuestions, setOpenQuestions] = useState<Set<string>>(new Set())

  const allItems = [...items, ...extraItems]

  const toggleQuestion = (question: string) => {
    setOpenQuestions((prev) => {
      const next = new Set(prev)
      if (next.has(question)) {
        next.delete(question)
      } else {
        next.add(question)
      }
      return next
    })
  }

  const handleRelatedClick = (item: FAQItem) => {
    setExtraItems((prev) => {
      if (prev.some((extra) => extra.question === item.question)) {
        return prev
      }
      return [...prev, item]
    })
    setOpenQuestions((prev) => new Set(prev).add(item.question))
  }

  const visibleRelated = relatedQuestions.filter(
    (related) => !extraItems.some((extra) => extra.question === related.question)
  )

  return (
    <section className={cn("bg-muted/50 py-16", className)}>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {/* Header */}
          <div className="flex items-start gap-3 border-b border-gray-100 px-4 py-5 sm:px-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
              <ShieldCheck className="h-5 w-5 text-gray-700" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-gray-900 sm:text-xl">
                Frequently asked questions
              </h2>
              <p className="mt-0.5 text-sm text-gray-500">
                Verified answers from official sources.
              </p>
            </div>
          </div>

          {/* Chat thread */}
          <div className="space-y-4 px-4 py-6 sm:px-6">
            {allItems.map((item, index) => {
              const isOpen = openQuestions.has(item.question)
              return (
                <div key={item.question} className="space-y-2">
                  {/* User question (toggle) */}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => toggleQuestion(item.question)}
                      aria-expanded={isOpen}
                      aria-controls={`faq-answer-${index}`}
                      className={cn(
                        "group flex max-w-[85%] items-center gap-2 rounded-2xl rounded-tr-sm border px-4 py-2.5 text-left text-sm font-medium text-gray-900 transition-colors sm:max-w-[75%]",
                        isOpen
                          ? "border-gray-400 bg-gray-50"
                          : "border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50/60"
                      )}
                    >
                      <span>{item.question}</span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 group-hover:text-gray-600",
                          isOpen && "rotate-180"
                        )}
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                  {/* Verified answer */}
                  {isOpen && (
                    <div id={`faq-answer-${index}`} className="flex items-end gap-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-50">
                        <Check className="h-3.5 w-3.5 text-gray-600" aria-hidden="true" />
                      </div>
                      <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-gray-200 bg-gray-50/60 px-4 py-2.5 text-sm leading-relaxed text-gray-600 sm:max-w-[80%]">
                        {item.answer}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Related questions */}
          {visibleRelated.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-5 sm:px-6">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Related questions
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {visibleRelated.map((item) => (
                  <button
                    key={item.question}
                    type="button"
                    onClick={() => handleRelatedClick(item)}
                    className="rounded-full border border-gray-300 px-3 py-1.5 text-xs text-gray-600 transition-colors hover:border-gray-400 hover:text-gray-900 sm:text-sm"
                  >
                    {item.question}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
