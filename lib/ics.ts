import { categoryLabel } from "./categories"
import { formatDisplay, toIso } from "./dates"
import type { Item } from "./types"

function stamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")
}

function dayStamp(iso: string): string {
  return iso.replace(/-/g, "")
}

function nextDayStamp(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number)
  const date = new Date(year, month - 1, day + 1)
  return dayStamp(toIso(date.getFullYear(), date.getMonth() + 1, date.getDate()))
}

function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
}

function fold(line: string): string {
  if (line.length <= 73) return line
  const parts = [line.slice(0, 73)]
  let index = 73
  while (index < line.length) {
    parts.push(` ${line.slice(index, index + 72)}`)
    index += 72
  }
  return parts.join("\r\n")
}

function eventLines(item: Item, boardName: string, now: Date): string[] {
  const who = item.person.trim()
  const summary = who ? `${item.name} expires — ${who}` : `${item.name} expires`
  const when = formatDisplay(item.expiresOn, item.datePrecision)
  const description = [
    who ? `${item.name} for ${who}` : item.name,
    `Category: ${categoryLabel(item.category)}`,
    `Expires: ${when}`,
    item.notes ? `Notes: ${item.notes}` : "",
    `From Expiry Everything (${boardName}).`,
  ]
    .filter(Boolean)
    .join("\n")

  const lines = [
    "BEGIN:VEVENT",
    `UID:${item.id}@expiry-everything`,
    `DTSTAMP:${stamp(now)}`,
    `DTSTART;VALUE=DATE:${dayStamp(item.expiresOn)}`,
    `DTEND;VALUE=DATE:${nextDayStamp(item.expiresOn)}`,
    `SUMMARY:${escapeText(summary)}`,
    `DESCRIPTION:${escapeText(description)}`,
  ]

  for (const days of [90, 30, 7]) {
    lines.push(
      "BEGIN:VALARM",
      `TRIGGER:-P${days}D`,
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapeText(`${item.name} expires in ${days} days`)}`,
      "END:VALARM",
    )
  }

  lines.push("END:VEVENT")
  return lines.map(fold)
}

export function buildCalendar(boardName: string, items: Item[], now = new Date()): string {
  const events = [...items]
    .sort((a, b) => a.expiresOn.localeCompare(b.expiresOn) || a.name.localeCompare(b.name))
    .flatMap((item) => eventLines(item, boardName, now))

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Expiry Everything//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(`Expiry Everything — ${boardName}`)}`,
    ...events,
    "END:VCALENDAR",
  ]

  return lines.join("\r\n") + "\r\n"
}
