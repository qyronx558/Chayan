import { afterEach, describe, expect, it, vi } from "vitest"
import {
  decodeEntities,
  extractJobLinks,
  extractSectionLines,
  extractTextBetween,
  fetchHtml,
  parseAdvertisementNo,
  parseAgeLimit,
  parseApplicationFee,
  parseCategoryAndState,
  parseDescription,
  parseEducation,
  parseHowToApply,
  parseImportantDates,
  parseImportantLinks,
  parseLocation,
  parseOrganization,
  parseSalary,
  parseSelectionProcess,
  parseSubjects,
  parseTitle,
  parseTotalVacancies,
  stripHtml,
} from "@/lib/fetchers/sarkariShared"

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("fetchHtml", () => {
  it("returns the body for ok responses and null otherwise", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<p>x</p>")))
    expect(await fetchHtml("https://x.example")).toBe("<p>x</p>")
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 500 })))
    expect(await fetchHtml("https://x.example")).toBeNull()
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("network")
    }))
    expect(await fetchHtml("https://x.example")).toBeNull()
  })
})

describe("html to text", () => {
  it("decodes numeric and named entities", () => {
    expect(decodeEntities("&#65;&#x42;&amp;&lt;&gt;&quot;&nbsp;")).toBe('AB&<>" ')
  })

  it("strips tags, scripts and styles, keeping line breaks", () => {
    const text = stripHtml("<style>a{}</style><script>x()</script><p>One</p><div>Two&amp;</div>\t<table><tr><td>A</td><td>B</td></tr></table>")
    expect(text.trim()).toBe("One\nTwo&\nA B")
  })
})

describe("extractJobLinks", () => {
  it("keeps real post links, skips navigation, short titles and duplicates", () => {
    const html = `
      <a href="http://sarkariresult.com.cm/ssc-cgl-2026/">SSC CGL 2026 Online Form</a>
      <a href="https://sarkariresult.com.cm/ssc-cgl-2026/">SSC CGL 2026 Online Form</a>
      <a href="https://sarkariresult.com.cm/latest-jobs/">Latest Jobs Section</a>
      <a href="https://sarkariresult.com.cm/x/">Home page link here</a>
      <a href="https://sarkariresult.com.cm/y/">Short</a>
      <a href="https://other.example/z/">Other site long title</a>`
    expect(extractJobLinks(html)).toEqual([{ title: "SSC CGL 2026 Online Form", url: "https://sarkariresult.com.cm/ssc-cgl-2026/" }])
  })
})

const PAGE = [
  "RRB NTPC Recruitment 2026",
  "Post Date: 01/01/2026",
  "10:30 AM",
  "Download App",
  "Railway Recruitment Board has released the NTPC notification for 11558 Posts.",
  "Important Dates",
  "Application Start : 01/01/2026",
  "Last Date : 31/01/2026",
  "Last Date Fee Payment : 02/02/2026",
  "Exam Date : March 2026",
  "Result Date : May 2026",
  "Application Fee",
  "General : 500",
  "Age Limits",
  "Minimum Age : 18 Years",
  "Maximum Age : 33 Years",
  "Age relaxation as per rules",
  "Education Qualification",
  "Graduate degree from any recognised university in India.",
  "How To Apply",
  "Fill the online form on the official website carefully.",
  "Mode Of Selection",
  "CBT and Document Verification",
  "Section Wise Syllabus",
  "Maths",
  "Reasoning",
  "Download PDF",
  "SOME USEFUL IMPORTANT LINKS",
  "Apply Online",
  "https://rrb.gov.in/apply",
  "Download Notification",
  "https://rrb.gov.in/notice.pdf",
  "Official Website",
  "https://rrb.gov.in",
  "Syllabus",
  "https://rrb.gov.in/sy.pdf",
  "Admit Card download https://rrb.gov.in/admit",
  "Related Posts",
].join("\n")

describe("section parsing", () => {
  it("extracts text between markers", () => {
    expect(extractTextBetween("a START b END c", "START", ["END", "c"])).toBe("b")
    expect(extractTextBetween("abc", "X", ["Y"])).toBe("")
    expect(extractSectionLines(PAGE, "Application Fee")).toEqual(["General : 500"])
    expect(extractSectionLines(PAGE, "Not There")).toEqual([])
  })

  it("parses title, description and organisation", () => {
    expect(parseTitle(PAGE)).toBe("RRB NTPC Recruitment 2026")
    const desc = parseDescription(PAGE)
    expect(desc).toMatch(/^Railway Recruitment Board has released/)
    expect(parseDescription("no post date")).toBe("")
    expect(parseOrganization(desc)).toBe("Railway Recruitment Board")
    expect(parseOrganization("Staff Selection Commission notice")).toBe("Staff Selection")
    expect(parseOrganization("nothing")).toBe("")
  })

  it("parses dates, fees and ages", () => {
    const dates = parseImportantDates(extractSectionLines(PAGE, "Important Dates"))
    expect(dates).toMatchObject({ startDate: "01/01/2026", lastDate: "31/01/2026", examDate: "March 2026", resultDate: "May 2026" })
    expect(dates.importantDates?.["Last Date Fee Payment"]).toBe("02/02/2026")
    expect(parseImportantDates([]).importantDates).toBeUndefined()

    expect(parseApplicationFee(["a", "b"])).toBe("a\nb")
    expect(parseApplicationFee([])).toBeUndefined()

    expect(parseAgeLimit(extractSectionLines(PAGE, "Age Limits"))).toEqual({ ageLimit: "Min: 18 Years, Max: 33 Years", ageRelaxation: "Age relaxation as per rules" })
    expect(parseAgeLimit(["Max Age : 40"]).ageLimit).toBe("Max: 40")
    expect(parseAgeLimit([])).toEqual({ ageLimit: undefined, ageRelaxation: undefined })
  })

  it("parses vacancies, salary and advertisement number", () => {
    expect(parseTotalVacancies("Total 11,558 Posts")).toBe(11558)
    expect(parseTotalVacancies("no number")).toBeUndefined()
    expect(parseSalary("Pay Scale: ₹ 25,500 to 81,100")).toBe("25,500 to 81,100")
    expect(parseSalary("none")).toBeUndefined()
    expect(parseAdvertisementNo("RRB NTPC (CEN 05/2026)")).toBe("CEN 05/2026")
    expect(parseAdvertisementNo("Notice CEN - 03/ 2026")).toBe("CEN - 03/ 2026")
    expect(parseAdvertisementNo("nothing")).toBeUndefined()
  })

  it("parses selection, education, how to apply and subjects", () => {
    expect(parseSelectionProcess(["CBT", "DV"])).toBe("CBT\nDV")
    expect(parseSelectionProcess(["x"])).toBeUndefined()
    expect(parseEducation(PAGE)).toBe("Graduate degree from any recognised university in India.")
    expect(parseEducation("none")).toBeUndefined()
    expect(parseHowToApply(PAGE)).toBe("Fill the online form on the official website carefully.")
    expect(parseHowToApply("none")).toBeUndefined()
    expect(parseSubjects(PAGE)).toBe("Maths\nReasoning")
    expect(parseSubjects("none")).toBeUndefined()
  })

  it("parses the important links block", () => {
    expect(parseImportantLinks(PAGE)).toEqual({
      applyLink: "https://rrb.gov.in/apply",
      notificationUrl: "https://rrb.gov.in/notice.pdf",
      officialWebsite: "https://rrb.gov.in",
      syllabusUrl: "https://rrb.gov.in/sy.pdf",
      downloadUrl: "https://rrb.gov.in/admit",
    })
    expect(parseImportantLinks("no links")).toEqual({})
  })
})

describe("category, state and location", () => {
  it("detects the category from title or description", () => {
    expect(parseCategoryAndState("RRB NTPC 2026", "")).toEqual({ category: "Railway", state: undefined })
    expect(parseCategoryAndState("IBPS PO", "")).toEqual({ category: "Banking", state: undefined })
    expect(parseCategoryAndState("Army Agniveer", "")).toEqual({ category: "Defence", state: undefined })
    expect(parseCategoryAndState("Job", "for nursing officers")).toEqual({ category: "Medical", state: undefined })
  })

  it("falls back to state government for state names", () => {
    expect(parseCategoryAndState("Uttar Pradesh Lekhpal", "").category).toBe("State Government")
    expect(parseCategoryAndState("Uttar Pradesh Lekhpal", "").state).toBe("Uttar Pradesh")
    expect(parseCategoryAndState("Generic", "nothing")).toEqual({ category: undefined, state: undefined })
  })

  it("derives a location", () => {
    expect(parseLocation("Any", "Bihar")).toBe("Bihar")
    expect(parseLocation("High Court Patna")).toBe("Patna")
    expect(parseLocation("DSSSB")).toBe("Delhi")
    expect(parseLocation("Govt of Maharashtra")).toBe("Maharashtra")
    expect(parseLocation("Somewhere")).toBeUndefined()
  })
})
