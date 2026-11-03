import assert from "node:assert/strict"
import test from "node:test"
import { daysUntil, formatDisplay, urgencyOf } from "./dates"
import { parseLine } from "./parse"

const TODAY = new Date(2026, 10, 3)

test("parses the hero line passport Mia jun 2027", () => {
  const result = parseLine("passport Mia jun 2027", TODAY)
  assert.equal(result.ready, true)
  assert.equal(result.name, "Passport")
  assert.equal(result.person, "Mia")
  assert.equal(result.category, "passport")
  assert.equal(result.expiresOn, "2027-06-01")
  assert.equal(result.datePrecision, "month")
  assert.ok(result.hints.some((hint) => hint.includes("1st")))
})

test("parses a lowercase person when the item is a known category", () => {
  const result = parseLine("passport mia jun 2027", TODAY)
  assert.equal(result.person, "Mia")
  assert.equal(result.name, "Passport")
  assert.equal(result.expiresOn, "2027-06-01")
})

test("parses a driver's license with a specific day", () => {
  const result = parseLine("driver's license Sam Dec 1 2026", TODAY)
  assert.equal(result.name, "Driver's license")
  assert.equal(result.person, "Sam")
  assert.equal(result.category, "license")
  assert.equal(result.expiresOn, "2026-12-01")
  assert.equal(result.datePrecision, "day")
  assert.deepEqual(result.hints, [])
})

test("keeps product words and a capitalized person", () => {
  const result = parseLine("laptop warranty Sam Aug 2028", TODAY)
  assert.equal(result.name, "Laptop warranty")
  assert.equal(result.person, "Sam")
  assert.equal(result.category, "warranty")
  assert.equal(result.expiresOn, "2028-08-01")
})

test("guesses makeup from mascara", () => {
  const result = parseLine("mascara Mia oct 2026", TODAY)
  assert.equal(result.name, "Mascara")
  assert.equal(result.person, "Mia")
  assert.equal(result.category, "makeup")
  assert.equal(result.expiresOn, "2026-10-01")
})

test("reads for-person and a comma date", () => {
  const result = parseLine("inhaler for Leo Jan 15, 2027", TODAY)
  assert.equal(result.name, "Inhaler")
  assert.equal(result.person, "Leo")
  assert.equal(result.category, "medication")
  assert.equal(result.expiresOn, "2027-01-15")
  assert.equal(result.datePrecision, "day")
})

test("reads a possessive person", () => {
  const result = parseLine("Leo's passport June 2027", TODAY)
  assert.equal(result.name, "Passport")
  assert.equal(result.person, "Leo")
  assert.equal(result.expiresOn, "2027-06-01")
})

test("reads an ISO date and a household item", () => {
  const result = parseLine("car registration 2027-01-20", TODAY)
  assert.equal(result.name, "Car registration")
  assert.equal(result.person, "")
  assert.equal(result.category, "registration")
  assert.equal(result.expiresOn, "2027-01-20")
  assert.equal(result.datePrecision, "day")
})

test("reads a day-first numeric date when the day is past 12", () => {
  const result = parseLine("15/6/2027 sunscreen", TODAY)
  assert.equal(result.expiresOn, "2027-06-15")
  assert.equal(result.name, "Sunscreen")
  assert.equal(result.category, "makeup")
})

test("assumes month/day/year when both numbers could be a month", () => {
  const result = parseLine("warranty 6/7/2027", TODAY)
  assert.equal(result.expiresOn, "2027-06-07")
  assert.ok(result.hints.some((hint) => hint.includes("month/day/year")))
})

test("parses visa Noah sep 2028", () => {
  const result = parseLine("visa Noah sep 2028", TODAY)
  assert.equal(result.ready, true)
  assert.equal(result.name, "Visa")
  assert.equal(result.person, "Noah")
  assert.equal(result.category, "id")
  assert.equal(result.expiresOn, "2028-09-01")
})

test("counts relative months from today", () => {
  const result = parseLine("in 3 months passport Mia", TODAY)
  assert.equal(result.expiresOn, "2027-02-03")
  assert.equal(result.person, "Mia")
  assert.ok(result.hints.some((hint) => hint.includes("Counted from today")))
})

test("is not ready without a date", () => {
  const result = parseLine("passport Mia", TODAY)
  assert.equal(result.ready, false)
  assert.equal(result.name, "Passport")
  assert.equal(result.person, "Mia")
  assert.equal(result.expiresOn, null)
})

test("empty input is not ready", () => {
  assert.equal(parseLine("   ", TODAY).ready, false)
})

test("days and urgency bands", () => {
  const now = new Date(2026, 10, 3, 15, 30)
  assert.equal(daysUntil("2026-11-03", now), 0)
  assert.equal(daysUntil("2026-11-02", now), -1)
  assert.equal(daysUntil("2026-12-03", now), 30)
  assert.equal(daysUntil("2026-12-04", now), 31)
  assert.equal(urgencyOf(-1), "overdue")
  assert.equal(urgencyOf(0), "soon")
  assert.equal(urgencyOf(30), "soon")
  assert.equal(urgencyOf(31), "upcoming")
  assert.equal(urgencyOf(90), "upcoming")
  assert.equal(urgencyOf(91), "later")
  assert.equal(formatDisplay("2027-06-01", "month"), "June 2027")
  assert.equal(formatDisplay("2026-12-01", "day"), "December 1, 2026")
})
