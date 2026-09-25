export type CalendarEventType =
  | "last_date"
  | "exam"
  | "admit_card"
  | "result"
  | "admission_begin"
  | "admission_last"

export interface CalendarEvent {
  date: string
  type: CalendarEventType
  label: string
  title: string
  department: string
  href: string
}

/** Bold professional pill: tinted bg + strong left border + dark text. */
export const CALENDAR_TYPE_STYLES: Record<CalendarEventType, { dot: string; badge: string; pill: string; label: string }> = {
  last_date: {
    dot: "bg-red-500",
    badge: "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
    pill: "border-red-500 bg-red-50 text-red-800 hover:bg-red-100 dark:border-red-500 dark:bg-red-950/60 dark:text-red-200 dark:hover:bg-red-950",
    label: "Last Date",
  },
  exam: {
    dot: "bg-blue-600",
    badge: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200",
    pill: "border-blue-600 bg-blue-50 text-blue-900 hover:bg-blue-100 dark:border-blue-500 dark:bg-blue-950/60 dark:text-blue-200 dark:hover:bg-blue-950",
    label: "Exam Date",
  },
  admit_card: {
    dot: "bg-amber-500",
    badge: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
    pill: "border-amber-500 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-500 dark:bg-amber-950/60 dark:text-amber-200 dark:hover:bg-amber-950",
    label: "Admit Card",
  },
  result: {
    dot: "bg-green-600",
    badge: "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200",
    pill: "border-green-600 bg-green-50 text-green-900 hover:bg-green-100 dark:border-green-500 dark:bg-green-950/60 dark:text-green-200 dark:hover:bg-green-950",
    label: "Result",
  },
  admission_begin: {
    dot: "bg-purple-500",
    badge: "border-purple-200 bg-purple-50 text-purple-800 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-200",
    pill: "border-purple-500 bg-purple-50 text-purple-900 hover:bg-purple-100 dark:border-purple-500 dark:bg-purple-950/60 dark:text-purple-200 dark:hover:bg-purple-950",
    label: "Admission Begin",
  },
  admission_last: {
    dot: "bg-purple-600",
    badge: "border-purple-200 bg-purple-50 text-purple-800 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-200",
    pill: "border-purple-600 bg-purple-50 text-purple-900 hover:bg-purple-100 dark:border-purple-500 dark:bg-purple-950/60 dark:text-purple-200 dark:hover:bg-purple-950",
    label: "Admission",
  },
}
