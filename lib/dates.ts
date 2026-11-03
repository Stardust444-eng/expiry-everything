import type { DatePrecision } from "./types"

export type Urgency = "overdue" | "soon" | "upcoming" | "later"

export function todayStart(now = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

export function isValidDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false
  const date = new Date(year, month - 1, day)
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

export function toIso(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

export function formatIso(date: Date): string {
  return toIso(date.getFullYear(), date.getMonth() + 1, date.getDate())
}

export function parseIsoDate(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (!isValidDate(year, month, day)) return null
  return new Date(year, month - 1, day)
}

export function addDays(date: Date, days: number): Date {
  const next = todayStart(date)
  next.setDate(next.getDate() + days)
  return next
}

export function addMonths(date: Date, months: number): Date {
  const day = date.getDate()
  const next = new Date(date.getFullYear(), date.getMonth() + months, 1)
  const last = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()
  next.setDate(Math.min(day, last))
  return next
}

export function daysUntil(iso: string, now = new Date()): number | null {
  const target = parseIsoDate(iso)
  if (!target) return null
  const start = todayStart(now)
  return Math.round((target.getTime() - start.getTime()) / 86_400_000)
}

export function urgencyOf(days: number): Urgency {
  if (days < 0) return "overdue"
  if (days <= 30) return "soon"
  if (days <= 90) return "upcoming"
  return "later"
}

export const URGENCY_ORDER: Urgency[] = ["overdue", "soon", "upcoming", "later"]

export const URGENCY_LABEL: Record<Urgency, string> = {
  overdue: "Overdue",
  soon: "Within 30 days",
  upcoming: "Within 90 days",
  later: "Later",
}

export function daysPhrase(days: number): string {
  if (days <= -2) return `${Math.abs(days)} days overdue`
  if (days === -1) return "1 day overdue"
  if (days === 0) return "Expires today"
  if (days === 1) return "1 day left"
  return `${days} days left`
}

export function formatDisplay(iso: string, precision: DatePrecision): string {
  const date = parseIsoDate(iso)
  if (!date) return iso
  if (precision === "month") {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  }
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

export function formatTimestamp(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

export function suggestRenewalDate(iso: string, now = new Date()): string {
  const current = parseIsoDate(iso)
  const start = todayStart(now)
  const base = current && current.getTime() >= start.getTime() ? current : start
  return formatIso(new Date(base.getFullYear() + 1, base.getMonth(), base.getDate()))
}
