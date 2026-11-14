import type { IngestKind } from "./types"

/**
 * Cheap keyword triage that runs before any LLM call. Government notice
 * boards mix recruitment with tenders, transfers, meetings and RTI replies;
 * dropping those here saves most of the free-tier LLM budget.
 */

export interface Triage {
  relevant: boolean
  kind: IngestKind | null
  reason: string
}

// Order matters: the first matching rule wins.
const KIND_RULES: { kind: IngestKind; re: RegExp }[] = [
  { kind: "answer-keys", re: /\b(answer[\s-]*key|provisional\s+key|final\s+key)\b|उत्तर\s*कुंजी/i },
  { kind: "admit-cards", re: /\b(admit[\s-]*card|hall[\s-]*ticket|call[\s-]*letter|e-?admit)\b|प्रवेश\s*पत्र/i },
  { kind: "results", re: /\b(result|merit[\s-]*list|select(ed|ion)[\s-]*list|final[\s-]*selection|marks|cut[\s-]*off|score[\s-]*card)\b|परिणाम|मेधा\s*सूची|चयन\s*सूची/i },
  { kind: "syllabus", re: /\b(syllabus|exam(ination)?\s+(pattern|scheme))\b|पाठ्यक्रम/i },
  { kind: "admissions", re: /\b(admission|prospectus|counsel+ing)\b|प्रवेश\s*(सूचना|हेतु)|नामांकन/i },
  {
    kind: "jobs",
    re: /\b(recruit(ment)?|vacanc(y|ies)|walk[\s-]*in|interview|engagement|appointment|empanel+ment\s+of\s+(doctors|teachers|staff)|apply|application\s+(form|invited)|posts?\s+of|hiring|contractual|on\s+contract|outsourc(e|ing)\s+(staff|manpower))\b|भर्ती|रिक्ति|नियुक्ति|नियोजन|आवेदन/i,
  },
]

const NOISE =
  /\b(tender|e-?tender|nit\b|quotation|auction|e-?auction|bid|rfp|corrigendum\s+to\s+tender|work\s+order|rate\s+contract|transfer|posting\s+order|meeting|minutes|holiday|rti\b|court\s+order|land\s+acquisition|electoral\s+roll|voter|budget|annual\s+report|press\s+release|gazette\s+notification\s+of\s+land)\b|निविदा|नीलामी|स्थानांतरण|बैठक/i

/** "Advertisement" alone usually means a recruitment advert - but only when nothing says tender. */
const WEAK_JOBS = /\b(advertisement|advt)\b|विज्ञापन/i

/** Classifies a notice title (+ optional description). */
export function triageNotice(rawTitle: string, description = ""): Triage {
  // File-name style titles ("MICRO_BIOLOGIST-2026_ADVERTISEMENT") must still match word keywords.
  const title = rawTitle.replace(/_+/g, " ")
  const text = `${title} ${description.replace(/_+/g, " ")}`.replace(/\s+/g, " ").trim()
  if (text.length < 8) return { relevant: false, kind: null, reason: "too short" }
  const kind = KIND_RULES.find((r) => r.re.test(text))?.kind ?? (WEAK_JOBS.test(text) && !NOISE.test(text) ? "jobs" : null)
  // A tender that mentions "apply" is still a tender; a recruitment that mentions
  // a meeting is still a recruitment - so noise only wins when no strong kind matched in the title.
  const titleKind = KIND_RULES.find((r) => r.re.test(title))?.kind ?? null
  if (NOISE.test(title) && !titleKind) return { relevant: false, kind: null, reason: "noise keyword" }
  if (!kind) return { relevant: false, kind: null, reason: "no recruitment keyword" }
  return { relevant: true, kind, reason: "keyword" }
}
