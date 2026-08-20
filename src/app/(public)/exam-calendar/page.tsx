import type { Metadata } from "next"
import { ExamCalendarClient } from "./exam-calendar-client"

export const metadata: Metadata = {
  title: "Exam Calendar | Upcoming Deadlines, Exams, Admit Cards & Results",
  description:
    "Monthly exam calendar for government jobs - application deadlines, exam dates, admit card release dates and result dates all in one place.",
}

export default function ExamCalendarPage() {
  return <ExamCalendarClient />
}