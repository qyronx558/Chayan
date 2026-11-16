/**
 * Country / city normalisation for private jobs (browser-safe, no Node APIs).
 *
 * Countries are stored as ISO 3166-1 alpha-2 codes ("IN", "US") and shown with
 * their English name; cities are stored in a canonical spelling ("Bengaluru").
 * `parseLocation` turns free text such as "SF, NYC, CHI", "Bangalore, Karnataka",
 * "Remote - US" or "Toronto, ON" into { city, country }, preferring structured
 * hints from the job board when it gives them.
 */

const ISO_CODES =
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW".split(" ")

const FALLBACK_NAMES: Record<string, string> = { XK: "Kosovo" }

let displayNames: Intl.DisplayNames | null = null
function regionName(code: string): string {
  try {
    displayNames ??= new Intl.DisplayNames(["en"], { type: "region" })
    return displayNames.of(code) ?? FALLBACK_NAMES[code] ?? code
  } catch {
    return FALLBACK_NAMES[code] ?? code
  }
}

export interface CountryOption {
  code: string
  name: string
}

let countryList: CountryOption[] | null = null
/** Every country, sorted by name (for dropdowns). */
export function allCountries(): CountryOption[] {
  countryList ??= ISO_CODES.map((code) => ({ code, name: regionName(code) })).sort((a, b) => a.name.localeCompare(b.name))
  return countryList
}

/** "IN" → "India"; unknown values are shown as entered (custom countries). */
export function countryName(value: string | null | undefined): string {
  if (!value) return ""
  return /^[A-Z]{2}$/.test(value) && ISO_CODES.includes(value) ? regionName(value) : value
}

const COUNTRY_ALIASES: Record<string, string> = {
  usa: "US", "u.s.": "US", "u.s.a.": "US", "u.s.a": "US", "united states of america": "US", america: "US", "the united states": "US",
  uk: "GB", "u.k.": "GB", england: "GB", scotland: "GB", wales: "GB", britain: "GB", "great britain": "GB", "northern ireland": "GB",
  uae: "AE", "u.a.e.": "AE", emirates: "AE", "united arab emirates": "AE", ksa: "SA", "saudi": "SA",
  "south korea": "KR", korea: "KR", "republic of korea": "KR", "czech republic": "CZ", czechia: "CZ", turkey: "TR", "türkiye": "TR",
  russia: "RU", vietnam: "VN", "viet nam": "VN", holland: "NL", "the netherlands": "NL", deutschland: "DE", "hong kong sar": "HK",
  "mainland china": "CN", prc: "CN", taiwan: "TW", "ivory coast": "CI", bharat: "IN", "republic of ireland": "IE", eire: "IE",
  "new zealand": "NZ", nz: "NZ", "south africa": "ZA", "philippines": "PH", "the philippines": "PH", macedonia: "MK", "north macedonia": "MK",
  "bosnia": "BA", "laos": "LA", "moldova": "MD", "syria": "SY", "iran": "IR", "tanzania": "TZ", "bolivia": "BO", "venezuela": "VE",
}

let countryIndex: Map<string, string> | null = null
function countryLookup(): Map<string, string> {
  if (countryIndex) return countryIndex
  const m = new Map<string, string>()
  for (const { code, name } of allCountries()) m.set(name.toLowerCase(), code)
  for (const [alias, code] of Object.entries(COUNTRY_ALIASES)) m.set(alias, code)
  countryIndex = m
  return m
}

/** "United States" / "usa" / "US" / "IN" → ISO code, else null. */
export function toCountryCode(value: string | null | undefined): string | null {
  if (!value) return null
  const v = value.trim()
  if (/^[A-Za-z]{2}$/.test(v)) {
    const up = v.toUpperCase() === "UK" ? "GB" : v.toUpperCase()
    return ISO_CODES.includes(up) ? up : null
  }
  return countryLookup().get(v.toLowerCase().replace(/\s+/g, " ")) ?? null
}

const US_STATES: Record<string, string> = {
  AL: "alabama", AK: "alaska", AZ: "arizona", AR: "arkansas", CA: "california", CO: "colorado", CT: "connecticut", DE: "delaware",
  FL: "florida", GA: "georgia", HI: "hawaii", ID: "idaho", IL: "illinois", IN: "indiana", IA: "iowa", KS: "kansas", KY: "kentucky",
  LA: "louisiana", ME: "maine", MD: "maryland", MA: "massachusetts", MI: "michigan", MN: "minnesota", MS: "mississippi",
  MO: "missouri", MT: "montana", NE: "nebraska", NV: "nevada", NH: "new hampshire", NJ: "new jersey", NM: "new mexico",
  NY: "new york", NC: "north carolina", ND: "north dakota", OH: "ohio", OK: "oklahoma", OR: "oregon", PA: "pennsylvania",
  RI: "rhode island", SC: "south carolina", SD: "south dakota", TN: "tennessee", TX: "texas", UT: "utah", VT: "vermont",
  VA: "virginia", WA: "washington", WV: "west virginia", WI: "wisconsin", WY: "wyoming", DC: "district of columbia",
}
const CA_PROVINCES: Record<string, string> = {
  AB: "alberta", BC: "british columbia", MB: "manitoba", NB: "new brunswick", NL: "newfoundland and labrador", NS: "nova scotia",
  ON: "ontario", PE: "prince edward island", QC: "quebec", SK: "saskatchewan",
}
const AU_STATES: Record<string, string> = { NSW: "new south wales", VIC: "victoria", QLD: "queensland", WA: "western australia", SA: "south australia", TAS: "tasmania", ACT: "australian capital territory" }
const IN_STATES = [
  "andhra pradesh", "arunachal pradesh", "assam", "bihar", "chhattisgarh", "goa", "gujarat", "haryana", "himachal pradesh", "jharkhand",
  "karnataka", "kerala", "madhya pradesh", "maharashtra", "manipur", "meghalaya", "mizoram", "nagaland", "odisha", "punjab", "rajasthan",
  "sikkim", "tamil nadu", "telangana", "tripura", "uttar pradesh", "uttarakhand", "west bengal", "delhi ncr", "ncr", "jammu and kashmir",
]

/** Region names / codes that tell the country but are not cities. */
const REGION_COUNTRY = new Map<string, string>([
  ...Object.values(US_STATES).map((s) => [s, "US"] as [string, string]),
  ...Object.values(CA_PROVINCES).map((s) => [s, "CA"] as [string, string]),
  ...Object.values(AU_STATES).map((s) => [s, "AU"] as [string, string]),
  ...IN_STATES.map((s) => [s, "IN"] as [string, string]),
  ["england", "GB"], ["scotland", "GB"], ["bavaria", "DE"], ["ile-de-france", "FR"], ["île-de-france", "FR"], ["noord-holland", "NL"],
  ["north holland", "NL"], ["catalonia", "ES"], ["lombardy", "IT"], ["ontario", "CA"],
])

/**
 * City aliases → [canonical city, country]. Covers the hubs most job boards use,
 * including the abbreviations Greenhouse boards like ("SF, NYC, CHI").
 */
const CITY_TABLE: [string[], string, string][] = [
  // India
  [["bengaluru", "bangalore", "blr", "bengaluru urban"], "Bengaluru", "IN"], [["mumbai", "bombay", "navi mumbai", "thane"], "Mumbai", "IN"],
  [["delhi", "new delhi", "ncr"], "Delhi", "IN"], [["gurugram", "gurgaon", "ggn"], "Gurugram", "IN"], [["noida", "greater noida"], "Noida", "IN"],
  [["hyderabad", "hyd", "secunderabad"], "Hyderabad", "IN"], [["chennai", "madras"], "Chennai", "IN"], [["pune", "poona"], "Pune", "IN"],
  [["kolkata", "calcutta"], "Kolkata", "IN"], [["ahmedabad"], "Ahmedabad", "IN"], [["jaipur"], "Jaipur", "IN"], [["kochi", "cochin"], "Kochi", "IN"],
  [["coimbatore"], "Coimbatore", "IN"], [["chandigarh", "mohali"], "Chandigarh", "IN"], [["indore"], "Indore", "IN"], [["lucknow"], "Lucknow", "IN"],
  [["thiruvananthapuram", "trivandrum"], "Thiruvananthapuram", "IN"], [["visakhapatnam", "vizag"], "Visakhapatnam", "IN"], [["nagpur"], "Nagpur", "IN"],
  [["bhubaneswar"], "Bhubaneswar", "IN"], [["mysuru", "mysore"], "Mysuru", "IN"], [["mangaluru", "mangalore"], "Mangaluru", "IN"],
  [["vadodara", "baroda"], "Vadodara", "IN"], [["surat"], "Surat", "IN"], [["bhopal"], "Bhopal", "IN"], [["guwahati"], "Guwahati", "IN"],
  [["faridabad"], "Faridabad", "IN"], [["ghaziabad"], "Ghaziabad", "IN"], [["nashik"], "Nashik", "IN"], [["patna"], "Patna", "IN"], [["ranchi"], "Ranchi", "IN"],
  [["dehradun"], "Dehradun", "IN"], [["madurai"], "Madurai", "IN"], [["vijayawada"], "Vijayawada", "IN"], [["raipur"], "Raipur", "IN"], [["goa", "panaji"], "Goa", "IN"],
  // United States
  [["san francisco", "sf", "sfo", "san francisco bay area", "bay area", "sf bay area"], "San Francisco", "US"], [["new york", "new york city", "nyc", "ny"], "New York", "US"],
  [["seattle", "sea"], "Seattle", "US"], [["chicago", "chi"], "Chicago", "US"], [["atlanta", "atl"], "Atlanta", "US"], [["austin"], "Austin", "US"],
  [["boston"], "Boston", "US"], [["los angeles", "la"], "Los Angeles", "US"], [["denver"], "Denver", "US"], [["washington dc", "washington, d.c.", "dc", "washington d.c."], "Washington, D.C.", "US"],
  [["san jose"], "San Jose", "US"], [["palo alto"], "Palo Alto", "US"], [["mountain view"], "Mountain View", "US"], [["menlo park"], "Menlo Park", "US"],
  [["sunnyvale"], "Sunnyvale", "US"], [["santa clara"], "Santa Clara", "US"], [["redwood city"], "Redwood City", "US"], [["san mateo"], "San Mateo", "US"],
  [["oakland"], "Oakland", "US"], [["san diego"], "San Diego", "US"], [["dallas"], "Dallas", "US"], [["houston"], "Houston", "US"], [["miami"], "Miami", "US"],
  [["philadelphia"], "Philadelphia", "US"], [["phoenix"], "Phoenix", "US"], [["portland"], "Portland", "US"], [["salt lake city", "slc"], "Salt Lake City", "US"],
  [["pittsburgh"], "Pittsburgh", "US"], [["raleigh"], "Raleigh", "US"], [["minneapolis"], "Minneapolis", "US"], [["detroit"], "Detroit", "US"], [["nashville"], "Nashville", "US"],
  [["boulder"], "Boulder", "US"], [["irvine"], "Irvine", "US"], [["bellevue"], "Bellevue", "US"], [["kirkland"], "Kirkland", "US"], [["cambridge, ma"], "Cambridge", "US"],
  [["charlotte"], "Charlotte", "US"], [["columbus"], "Columbus", "US"], [["st. louis", "st louis", "saint louis"], "St. Louis", "US"], [["las vegas"], "Las Vegas", "US"],
  [["baltimore"], "Baltimore", "US"], [["orlando"], "Orlando", "US"], [["tampa"], "Tampa", "US"], [["san antonio"], "San Antonio", "US"], [["kansas city"], "Kansas City", "US"],
  [["new jersey", "jersey city"], "Jersey City", "US"], [["arlington"], "Arlington", "US"], [["reston"], "Reston", "US"], [["herndon"], "Herndon", "US"],
  // Canada
  [["toronto"], "Toronto", "CA"], [["vancouver"], "Vancouver", "CA"], [["montreal", "montréal"], "Montreal", "CA"], [["ottawa"], "Ottawa", "CA"],
  [["calgary"], "Calgary", "CA"], [["waterloo", "kitchener"], "Waterloo", "CA"], [["edmonton"], "Edmonton", "CA"],
  // Europe
  [["london", "ldn"], "London", "GB"], [["manchester"], "Manchester", "GB"], [["edinburgh"], "Edinburgh", "GB"], [["cambridge, uk", "cambridge"], "Cambridge", "GB"],
  [["bristol"], "Bristol", "GB"], [["birmingham"], "Birmingham", "GB"], [["glasgow"], "Glasgow", "GB"], [["leeds"], "Leeds", "GB"], [["oxford"], "Oxford", "GB"], [["belfast"], "Belfast", "GB"],
  [["dublin"], "Dublin", "IE"], [["cork"], "Cork", "IE"], [["paris"], "Paris", "FR"], [["lyon"], "Lyon", "FR"], [["berlin"], "Berlin", "DE"], [["munich", "münchen", "muenchen"], "Munich", "DE"],
  [["hamburg"], "Hamburg", "DE"], [["frankfurt", "frankfurt am main"], "Frankfurt", "DE"], [["cologne", "köln"], "Cologne", "DE"], [["stuttgart"], "Stuttgart", "DE"], [["düsseldorf", "dusseldorf"], "Düsseldorf", "DE"],
  [["amsterdam"], "Amsterdam", "NL"], [["rotterdam"], "Rotterdam", "NL"], [["utrecht"], "Utrecht", "NL"], [["eindhoven"], "Eindhoven", "NL"], [["the hague", "den haag"], "The Hague", "NL"],
  [["madrid"], "Madrid", "ES"], [["barcelona"], "Barcelona", "ES"], [["lisbon", "lisboa"], "Lisbon", "PT"], [["porto"], "Porto", "PT"],
  [["milan", "milano"], "Milan", "IT"], [["rome", "roma"], "Rome", "IT"], [["zurich", "zürich"], "Zurich", "CH"], [["geneva", "genève"], "Geneva", "CH"],
  [["stockholm"], "Stockholm", "SE"], [["gothenburg", "göteborg"], "Gothenburg", "SE"], [["copenhagen", "københavn"], "Copenhagen", "DK"], [["oslo"], "Oslo", "NO"],
  [["helsinki"], "Helsinki", "FI"], [["warsaw", "warszawa"], "Warsaw", "PL"], [["krakow", "kraków"], "Kraków", "PL"], [["wroclaw", "wrocław"], "Wrocław", "PL"],
  [["prague", "praha"], "Prague", "CZ"], [["vienna", "wien"], "Vienna", "AT"], [["brussels", "bruxelles"], "Brussels", "BE"], [["budapest"], "Budapest", "HU"],
  [["bucharest"], "Bucharest", "RO"], [["athens"], "Athens", "GR"], [["tallinn"], "Tallinn", "EE"], [["vilnius"], "Vilnius", "LT"], [["riga"], "Riga", "LV"],
  [["kyiv", "kiev"], "Kyiv", "UA"], [["belgrade"], "Belgrade", "RS"], [["sofia"], "Sofia", "BG"], [["luxembourg"], "Luxembourg", "LU"], [["istanbul"], "Istanbul", "TR"],
  // Middle East & Africa
  [["dubai"], "Dubai", "AE"], [["abu dhabi"], "Abu Dhabi", "AE"], [["riyadh"], "Riyadh", "SA"], [["doha"], "Doha", "QA"], [["tel aviv", "tel aviv-yafo"], "Tel Aviv", "IL"],
  [["cairo"], "Cairo", "EG"], [["lagos"], "Lagos", "NG"], [["nairobi"], "Nairobi", "KE"], [["cape town"], "Cape Town", "ZA"], [["johannesburg"], "Johannesburg", "ZA"],
  // Asia-Pacific & Latin America
  [["singapore"], "Singapore", "SG"], [["hong kong"], "Hong Kong", "HK"], [["tokyo"], "Tokyo", "JP"], [["osaka"], "Osaka", "JP"], [["seoul"], "Seoul", "KR"],
  [["shanghai"], "Shanghai", "CN"], [["beijing"], "Beijing", "CN"], [["shenzhen"], "Shenzhen", "CN"], [["taipei"], "Taipei", "TW"], [["sydney", "syd"], "Sydney", "AU"],
  [["melbourne"], "Melbourne", "AU"], [["brisbane"], "Brisbane", "AU"], [["perth"], "Perth", "AU"], [["auckland"], "Auckland", "NZ"], [["wellington"], "Wellington", "NZ"],
  [["jakarta"], "Jakarta", "ID"], [["kuala lumpur", "kl"], "Kuala Lumpur", "MY"], [["bangkok"], "Bangkok", "TH"], [["manila"], "Manila", "PH"], [["ho chi minh city", "saigon"], "Ho Chi Minh City", "VN"],
  [["hanoi"], "Hanoi", "VN"], [["karachi"], "Karachi", "PK"], [["lahore"], "Lahore", "PK"], [["dhaka"], "Dhaka", "BD"], [["colombo"], "Colombo", "LK"], [["kathmandu"], "Kathmandu", "NP"],
  [["sao paulo", "são paulo"], "São Paulo", "BR"], [["rio de janeiro"], "Rio de Janeiro", "BR"], [["mexico city", "cdmx", "ciudad de méxico"], "Mexico City", "MX"],
  [["buenos aires"], "Buenos Aires", "AR"], [["bogota", "bogotá"], "Bogotá", "CO"], [["santiago"], "Santiago", "CL"], [["lima"], "Lima", "PE"], [["guadalajara"], "Guadalajara", "MX"],
]

const CITY_INDEX = new Map<string, { city: string; country: string }>()
for (const [aliases, city, country] of CITY_TABLE) for (const a of aliases) if (!CITY_INDEX.has(a)) CITY_INDEX.set(a, { city, country })

/** Abbreviations that are only safe as a whole location token ("SF", "LA"), never inside words. */
const REMOTE_WORD = /^(remote|hybrid|anywhere|worldwide|global|globally|on-?site|in-?office|office|wfh|work from home|multiple locations?|various|flexible|distributed|virtual|home based|home-based|emea|apac|amer|americas|europe|asia|latam|na|north america|eu)$/i

const titleCase = (s: string) => s.replace(/\b([a-zà-ÿ])([a-zà-ÿ'’]*)/gi, (_m, a: string, b: string) => a.toUpperCase() + b.toLowerCase())

/** Canonical spelling for a city typed or scraped in any form. */
export function canonicalCity(raw: string | null | undefined): string | null {
  if (!raw) return null
  const v = raw.trim().replace(/\s+/g, " ").replace(/\.$/, "")
  if (!v || v.length > 60 || !/[a-zà-ÿ]/i.test(v)) return null
  const hit = CITY_INDEX.get(v.toLowerCase())
  if (hit) return hit.city
  return v === v.toUpperCase() || v === v.toLowerCase() ? titleCase(v) : v
}

export interface ParsedLocation {
  city: string | null
  /** ISO code (or a custom country name). */
  country: string | null
}

/**
 * Free-text location → city + country. `hints` are structured values from the
 * job board (country name/code, city) and win over the text.
 */
export function parseLocation(raw: string | null | undefined, hints: { country?: string | null; city?: string | null } = {}): ParsedLocation {
  let country = toCountryCode(hints.country)
  let city = canonicalCity(hints.city)
  const text = (raw || "").trim()
  if (text && (!country || !city)) {
    // Multi-location postings: the first location decides.
    const first = text.split(/\s*(?:;|\||\n| or |·)\s*/i)[0]
    const segments = first
      .replace(/\b(remote|hybrid)\s*[-–:(]\s*/gi, "$1, ")
      .split(/\s*,\s*|\s*\/\s*|\s+[-–]\s+|\s*\(\s*|\s*\)\s*/)
      .map((s) => s.trim())
      .filter(Boolean)
    const consumed = new Set<number>()
    // Country: scan from the end ("City, State, Country").
    if (!country) {
      for (let i = segments.length - 1; i >= 0; i--) {
        const seg = segments[i]
        const lower = seg.toLowerCase()
        let cc: string | null = null
        if (/^[A-Z]{2,3}$/.test(seg) && i > 0) {
          cc = US_STATES[seg] ? "US" : CA_PROVINCES[seg] ? "CA" : AU_STATES[seg] ? "AU" : toCountryCode(seg)
        } else {
          cc = toCountryCode(seg) ?? REGION_COUNTRY.get(lower) ?? null
          // A lone "IN" / "CA" etc. at the start is a country code only when it is the whole location.
          if (cc && /^[A-Za-z]{2}$/.test(seg) && segments.length > 1 && i === 0) cc = null
        }
        if (cc) {
          country = cc
          consumed.add(i)
          break
        }
      }
    }
    if (!city) {
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i]
        if (consumed.has(i) || REMOTE_WORD.test(seg)) continue
        const lower = seg.toLowerCase()
        if (toCountryCode(seg) && !CITY_INDEX.has(lower)) continue
        if (REGION_COUNTRY.has(lower) && !CITY_INDEX.has(lower)) continue
        if (/^[A-Z]{2,3}$/.test(seg) && !CITY_INDEX.has(lower)) continue
        if (/\d/.test(seg) && !CITY_INDEX.has(lower)) continue
        city = canonicalCity(seg)
        if (city) break
      }
    }
  }
  if (!country && city) country = CITY_INDEX.get(city.toLowerCase())?.country ?? null
  // City-states.
  if (!city && country && ["SG", "HK", "LU", "MC"].includes(country)) city = countryName(country)
  return { city, country }
}

/** Location text built from a city + country (used when an admin fills only those). */
export function locationLabel(city: string | null | undefined, country: string | null | undefined): string | null {
  const parts = [city, countryName(country)].filter(Boolean)
  return parts.length ? [...new Set(parts)].join(", ") : null
}

/**
 * Normalises the location fields of a job being saved (in place). Country is
 * stored as an ISO code when it is a known country (custom names are kept),
 * city in canonical spelling; whichever of location / country / city is missing
 * is derived from the others. Untouched when none of them is in the payload
 * (partial updates).
 */
export function normalizeJobGeo(d: { location?: string | null; country?: string | null; city?: string | null }): void {
  if (d.location === undefined && d.country === undefined && d.city === undefined) return
  const typedCountry = typeof d.country === "string" ? d.country.trim() : d.country
  let country: string | null | undefined = typedCountry ? (toCountryCode(typedCountry) ?? typedCountry.slice(0, 60)) : typedCountry
  let city: string | null | undefined = typeof d.city === "string" ? canonicalCity(d.city) : d.city
  const location = typeof d.location === "string" ? d.location.trim() || null : d.location
  if (location && (!country || !city)) {
    const parsed = parseLocation(location, { country, city })
    country ||= parsed.country
    city ||= parsed.city
  }
  if (!country && city) country = parseLocation(null, { city }).country ?? country
  if (country !== undefined) d.country = country ?? null
  if (city !== undefined) d.city = city ?? null
  if (!location && (country || city)) d.location = locationLabel(city, country)
  else if (location !== undefined) d.location = location
}
