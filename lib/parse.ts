import { isValidDate, toIso, todayStart, addDays, addMonths } from "./dates"
import type { Category, DatePrecision } from "./types"

export type ParseResult = {
  name: string
  person: string
  category: Category
  expiresOn: string | null
  datePrecision: DatePrecision | null
  hints: string[]
  ready: boolean
}

type Spec = {
  phrase: string
  category: Category
  label: string
}

const SPECS: Spec[] = [
  { phrase: "driver's license", category: "license", label: "Driver's license" },
  { phrase: "drivers license", category: "license", label: "Driver's license" },
  { phrase: "driver's licence", category: "license", label: "Driver's license" },
  { phrase: "drivers licence", category: "license", label: "Driver's license" },
  { phrase: "driver license", category: "license", label: "Driver's license" },
  { phrase: "driver licence", category: "license", label: "Driver's license" },
  { phrase: "driving license", category: "license", label: "Driver's license" },
  { phrase: "driving licence", category: "license", label: "Driver's license" },
  { phrase: "car registration", category: "registration", label: "Car registration" },
  { phrase: "vehicle registration", category: "registration", label: "Vehicle registration" },
  { phrase: "health insurance", category: "insurance", label: "Health insurance" },
  { phrase: "car insurance", category: "insurance", label: "Car insurance" },
  { phrase: "home insurance", category: "insurance", label: "Home insurance" },
  { phrase: "renters insurance", category: "insurance", label: "Renters insurance" },
  { phrase: "green card", category: "id", label: "Green card" },
  { phrase: "id card", category: "id", label: "ID card" },
  { phrase: "smoke alarm", category: "home", label: "Smoke alarm" },
  { phrase: "smoke detector", category: "home", label: "Smoke detector" },
  { phrase: "fire extinguisher", category: "home", label: "Fire extinguisher" },
  { phrase: "passport", category: "passport", label: "Passport" },
  { phrase: "license", category: "license", label: "License" },
  { phrase: "licence", category: "license", label: "License" },
  { phrase: "warranty", category: "warranty", label: "Warranty" },
  { phrase: "prescription", category: "medication", label: "Prescription" },
  { phrase: "medication", category: "medication", label: "Medication" },
  { phrase: "medicine", category: "medication", label: "Medicine" },
  { phrase: "inhaler", category: "medication", label: "Inhaler" },
  { phrase: "epipen", category: "medication", label: "EpiPen" },
  { phrase: "epi-pen", category: "medication", label: "EpiPen" },
  { phrase: "mascara", category: "makeup", label: "Mascara" },
  { phrase: "lipstick", category: "makeup", label: "Lipstick" },
  { phrase: "foundation", category: "makeup", label: "Foundation" },
  { phrase: "concealer", category: "makeup", label: "Concealer" },
  { phrase: "sunscreen", category: "makeup", label: "Sunscreen" },
  { phrase: "moisturizer", category: "makeup", label: "Moisturizer" },
  { phrase: "moisturiser", category: "makeup", label: "Moisturiser" },
  { phrase: "eyeliner", category: "makeup", label: "Eyeliner" },
  { phrase: "makeup", category: "makeup", label: "Makeup" },
  { phrase: "make-up", category: "makeup", label: "Makeup" },
  { phrase: "serum", category: "makeup", label: "Serum" },
  { phrase: "registration", category: "registration", label: "Registration" },
  { phrase: "rego", category: "registration", label: "Registration" },
  { phrase: "insurance", category: "insurance", label: "Insurance" },
  { phrase: "visa", category: "id", label: "Visa" },
  { phrase: "membership", category: "other", label: "Membership" },
]
SPECS.sort((a, b) => b.phrase.length - a.phrase.length)

const MONTHS: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
}

const MONTH_RE = Object.keys(MONTHS)
  .sort((a, b) => b.length - a.length)
  .join("|")

const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "my",
  "our",
  "for",
  "on",
  "at",
  "of",
  "and",
  "to",
  "item",
  "expires",
  "expiry",
  "expire",
  "expiration",
  "expired",
  "renewal",
  "renew",
  "renewed",
  "due",
])

const NOT_NAMES = new Set([
  "pro",
  "max",
  "mini",
  "air",
  "plus",
  "ultra",
  "new",
  "old",
  "spf",
])

type DateHit = {
  start: number
  end: number
  iso: string
  precision: DatePrecision
  hints: string[]
}

function normalize(input: string): string {
  return input
    .replace(/[‘’‛`]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim()
}

function blankSpan(text: string, start: number, end: number): string {
  return text.slice(0, start) + " ".repeat(Math.max(0, end - start)) + text.slice(end)
}

function monthNumber(name: string): number {
  return MONTHS[name.toLowerCase()]
}

function inferred(
  month: number,
  day: number,
  today: Date,
  precision: DatePrecision,
): DateHit | "invalid" | null {
  const thisYear = today.getFullYear()
  const candidate = new Date(thisYear, month - 1, day)
  const start = todayStart(today)
  const diff = Math.round((candidate.getTime() - start.getTime()) / 86_400_000)
  const year = diff < -60 ? thisYear + 1 : thisYear
  if (!isValidDate(year, month, day)) return "invalid"
  return {
    start: 0,
    end: 0,
    iso: toIso(year, month, day),
    precision,
    hints: [`No year was in the line, so this uses ${year}.`],
  }
}

function attach(match: RegExpExecArray, hit: Omit<DateHit, "start" | "end">): DateHit {
  return { ...hit, start: match.index, end: match.index + match[0].length }
}

function findDate(text: string, today: Date): DateHit | null {
  const monthDayYear = new RegExp(
    `\\b(${MONTH_RE})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?\\,?\\s+(20\\d{2})\\b`,
    "i",
  )
  const dayMonthYear = new RegExp(
    `\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MONTH_RE})\\.?\\,?\\s+(20\\d{2})\\b`,
    "i",
  )
  const iso = /\b(20\d{2})-(0?[1-9]|1[0-2])-(0?[1-9]|[12]\d|3[01])\b/
  const numeric = /\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](20\d{2})\b/
  const monthYear = new RegExp(`\\b(${MONTH_RE})\\.?\\s+(20\\d{2})\\b`, "i")
  const slashYear = /\b(0?[1-9]|1[0-2])\/(20\d{2})\b/
  const relative = /\bin\s+(\d{1,3})\s+(day|days|week|weeks|month|months|year|years)\b/i
  const nextMonth = new RegExp(`\\bnext\\s+(${MONTH_RE})\\b`, "i")
  const monthDay = new RegExp(`\\b(${MONTH_RE})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`, "i")
  const dayMonth = new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MONTH_RE})\\b`, "i")
  const bareMonth = new RegExp(`\\b(${MONTH_RE})\\b`, "i")
  const bareYear = /\b(20\d{2})\b/

  const isoMatch = iso.exec(text)
  if (isoMatch) {
    const year = Number(isoMatch[1])
    const month = Number(isoMatch[2])
    const day = Number(isoMatch[3])
    if (!isValidDate(year, month, day)) return null
    return attach(isoMatch, { iso: toIso(year, month, day), precision: "day", hints: [] })
  }

  const mdy = monthDayYear.exec(text)
  if (mdy) {
    const month = monthNumber(mdy[1])
    const day = Number(mdy[2])
    const year = Number(mdy[3])
    if (!isValidDate(year, month, day)) return null
    return attach(mdy, { iso: toIso(year, month, day), precision: "day", hints: [] })
  }

  const dmy = dayMonthYear.exec(text)
  if (dmy) {
    const day = Number(dmy[1])
    const month = monthNumber(dmy[2])
    const year = Number(dmy[3])
    if (!isValidDate(year, month, day)) return null
    return attach(dmy, { iso: toIso(year, month, day), precision: "day", hints: [] })
  }

  const num = numeric.exec(text)
  if (num) {
    const a = Number(num[1])
    const b = Number(num[2])
    const year = Number(num[3])
    let month = a
    let day = b
    const hints: string[] = []
    if (a > 12 && b <= 12) {
      day = a
      month = b
    } else if (b > 12 && a <= 12) {
      month = a
      day = b
    } else if (a <= 12 && b <= 12) {
      month = a
      day = b
      hints.push("Read as month/day/year. Use the form if the day and month are swapped.")
    } else {
      return null
    }
    if (!isValidDate(year, month, day)) return null
    return attach(num, { iso: toIso(year, month, day), precision: "day", hints })
  }

  const my = monthYear.exec(text)
  if (my) {
    const month = monthNumber(my[1])
    const year = Number(my[2])
    if (!isValidDate(year, month, 1)) return null
    return attach(my, {
      iso: toIso(year, month, 1),
      precision: "month",
      hints: ["No day was in the line, so this uses the 1st."],
    })
  }

  const sy = slashYear.exec(text)
  if (sy) {
    const month = Number(sy[1])
    const year = Number(sy[2])
    if (!isValidDate(year, month, 1)) return null
    return attach(sy, {
      iso: toIso(year, month, 1),
      precision: "month",
      hints: ["No day was in the line, so this uses the 1st."],
    })
  }

  const rel = relative.exec(text)
  if (rel) {
    const count = Number(rel[1])
    const unit = rel[2].toLowerCase()
    if (count > 240 && (unit.startsWith("year") || unit.startsWith("month"))) return null
    let date = todayStart(today)
    if (unit.startsWith("day")) date = addDays(date, count)
    else if (unit.startsWith("week")) date = addDays(date, count * 7)
    else if (unit.startsWith("month")) date = addMonths(date, count)
    else date = addMonths(date, count * 12)
    return attach(rel, {
      iso: toIso(date.getFullYear(), date.getMonth() + 1, date.getDate()),
      precision: "day",
      hints: ["Counted from today."],
    })
  }

  const next = nextMonth.exec(text)
  if (next) {
    const month = monthNumber(next[1])
    const thisYear = today.getFullYear()
    const year = month > today.getMonth() + 1 ? thisYear : thisYear + 1
    const guessed = inferred(month, 1, new Date(year, 0, 1), "month")
    if (guessed === "invalid" || !guessed) return null
    return attach(next, {
      iso: toIso(year, month, 1),
      precision: "month",
      hints: [
        `No year was in the line, so this uses ${year}.`,
        "No day was in the line, so this uses the 1st.",
      ],
    })
  }

  const md = monthDay.exec(text)
  if (md) {
    const month = monthNumber(md[1])
    const day = Number(md[2])
    const guessed = inferred(month, day, today, "day")
    if (guessed === "invalid") return null
    if (!guessed) return null
    return attach(md, guessed)
  }

  const dm = dayMonth.exec(text)
  if (dm) {
    const day = Number(dm[1])
    const month = monthNumber(dm[2])
    const guessed = inferred(month, day, today, "day")
    if (guessed === "invalid" || !guessed) return null
    return attach(dm, guessed)
  }

  const bare = bareMonth.exec(text)
  if (bare) {
    const month = monthNumber(bare[1])
    const guessed = inferred(month, 1, today, "month")
    if (guessed === "invalid" || !guessed) return null
    return attach(bare, {
      ...guessed,
      hints: [...guessed.hints, "No day was in the line, so this uses the 1st."],
    })
  }

  const yearOnly = bareYear.exec(text)
  if (yearOnly) {
    const year = Number(yearOnly[1])
    return attach(yearOnly, {
      iso: toIso(year, 1, 1),
      precision: "month",
      hints: ["Only a year was given, so this uses January 1."],
    })
  }

  return null
}

function findCategory(text: string): { spec: Spec; start: number; end: number } | null {
  const lower = text.toLowerCase()
  for (const spec of SPECS) {
    const index = lower.indexOf(spec.phrase)
    if (index < 0) continue
    const before = index === 0 || !/[a-z0-9]/i.test(text[index - 1] ?? "")
    const afterIndex = index + spec.phrase.length
    const after = afterIndex >= text.length || !/[a-z0-9]/i.test(text[afterIndex] ?? "")
    if (before && after) return { spec, start: index, end: afterIndex }
  }
  return null
}

function tokens(text: string): string[] {
  return text.match(/[A-Za-z0-9][A-Za-z0-9'’-]+|[A-Za-z0-9]/g) ?? []
}

function prettyToken(word: string): string {
  if (/^[A-Z0-9]{2,5}$/.test(word)) return word
  if (word.includes("-")) return word.split("-").map(prettyToken).join("-")
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
}

function isSimpleName(word: string): boolean {
  if (!/^[A-Z][a-z'’-]{1,}$/.test(word)) return false
  return !NOT_NAMES.has(word.toLowerCase())
}

function buildName(spec: Spec | null, descriptors: string[]): string {
  const desc = descriptors.map(prettyToken).join(" ")
  if (!spec) return desc
  if (!desc) return spec.label
  const lowerFirst = spec.label.charAt(0).toLowerCase() + spec.label.slice(1)
  return `${desc} ${lowerFirst}`
}

export function parseLine(input: string, today = new Date()): ParseResult {
  const text = normalize(input)
  const empty: ParseResult = {
    name: "",
    person: "",
    category: "other",
    expiresOn: null,
    datePrecision: null,
    hints: [],
    ready: false,
  }
  if (!text) return empty

  const date = findDate(text, today)
  let working = date ? blankSpan(text, date.start, date.end) : text
  const category = findCategory(working)
  if (category) working = blankSpan(working, category.start, category.end)

  let person = ""
  const forMatch = /\bfor\s+([A-Za-z][A-Za-z'’-]+)/i.exec(working)
  const possessive = /\b([A-Za-z][A-Za-z'’-]+)'s\b/i.exec(working)
  if (forMatch) {
    person = prettyToken(forMatch[1])
    working = blankSpan(working, forMatch.index, forMatch.index + forMatch[0].length)
  } else if (possessive) {
    person = prettyToken(possessive[1])
    working = blankSpan(working, possessive.index, possessive.index + possessive[0].length)
  }

  let descriptorTokens = tokens(working).filter((token) => {
    const lower = token.toLowerCase()
    if (STOPWORDS.has(lower)) return false
    if (MONTHS[lower]) return false
    if (/^20\d{2}$/.test(token)) return false
    if (/^\d+$/.test(token)) return false
    return true
  })

  if (!person) {
    const named = descriptorTokens.filter(isSimpleName)
    if (named.length === 1) {
      person = prettyToken(named[0])
      descriptorTokens = descriptorTokens.filter((token) => token !== named[0])
    } else if (
      descriptorTokens.length === 1 &&
      category &&
      !NOT_NAMES.has(descriptorTokens[0].toLowerCase())
    ) {
      person = prettyToken(descriptorTokens[0])
      descriptorTokens = []
    }
  }

  const name = buildName(category?.spec ?? null, descriptorTokens)
  const hints = date?.hints ?? []
  if (!date) hints.push("No date in that line yet.")
  if (!name) hints.push("No item name in that line yet.")

  return {
    name,
    person,
    category: category?.spec.category ?? "other",
    expiresOn: date?.iso ?? null,
    datePrecision: date?.precision ?? null,
    hints,
    ready: Boolean(date && name),
  }
}
