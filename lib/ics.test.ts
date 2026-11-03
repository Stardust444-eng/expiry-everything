import assert from "node:assert/strict"
import test from "node:test"
import { buildCalendar } from "./ics"
import type { Item } from "./types"

function item(overrides: Partial<Item> = {}): Item {
  return {
    id: "item-1",
    name: "Passport",
    person: "Mia",
    category: "passport",
    expiresOn: "2027-06-01",
    datePrecision: "month",
    notes: "Blue folder",
    renewals: [],
    createdAt: "2026-11-03T00:00:00.000Z",
    updatedAt: "2026-11-03T00:00:00.000Z",
    ...overrides,
  }
}

test("calendar has one event and alerts 90, 30, and 7 days before", () => {
  const ics = buildCalendar("Demo household", [item()], new Date("2026-11-03T12:00:00.000Z"))
  assert.match(ics, /BEGIN:VCALENDAR\r\n/)
  assert.match(ics, /SUMMARY:Passport expires — Mia/)
  assert.match(ics, /DTSTART;VALUE=DATE:20270601/)
  assert.match(ics, /DTEND;VALUE=DATE:20270602/)
  assert.match(ics, /TRIGGER:-P90D/)
  assert.match(ics, /TRIGGER:-P30D/)
  assert.match(ics, /TRIGGER:-P7D/)
  assert.match(ics, /ACTION:DISPLAY/)
  assert.match(ics, /Blue folder/)
  assert.match(ics, /END:VCALENDAR\r\n$/)
  assert.equal((ics.match(/BEGIN:VALARM/g) || []).length, 3)
})

test("escapes commas and skips a blank person", () => {
  const ics = buildCalendar(
    "Home",
    [item({ id: "reg", name: "Car registration", person: "", notes: "A, B" })],
    new Date("2026-11-03T12:00:00.000Z"),
  )
  assert.match(ics, /SUMMARY:Car registration expires\r\n/)
  assert.match(ics, /A\\, B/)
})
