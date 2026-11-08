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
    dot: "bg-brick",
    badge: "border-brick/40 bg-paper-2 text-brick",
    pill: "border-brick bg-paper-2 text-brick hover:bg-paper-3",
    label: "Last Date",
  },
  exam: {
    dot: "bg-ink",
    badge: "border-rule bg-paper-2 text-foreground",
    pill: "border-ink bg-paper-2 text-foreground hover:bg-paper-3",
    label: "Exam Date",
  },
  admit_card: {
    dot: "bg-rule-2",
    badge: "border-rule bg-paper-2 text-foreground",
    pill: "border-rule-2 bg-paper-2 text-foreground hover:bg-paper-3",
    label: "Admit Card",
  },
  result: {
    dot: "bg-ink-2",
    badge: "border-rule bg-paper-2 text-foreground",
    pill: "border-ink-2 bg-paper-2 text-foreground hover:bg-paper-3",
    label: "Result",
  },
  admission_begin: {
    dot: "bg-rule",
    badge: "border-rule bg-paper-2 text-foreground",
    pill: "border-rule bg-paper-2 text-foreground hover:bg-paper-3",
    label: "Admission Begin",
  },
  admission_last: {
    dot: "bg-rule",
    badge: "border-rule bg-paper-2 text-foreground",
    pill: "border-rule bg-paper-2 text-foreground hover:bg-paper-3",
    label: "Admission",
  },
}
