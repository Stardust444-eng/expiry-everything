import { isCategory } from "./categories"
import { parseIsoDate } from "./dates"
import type { Category, DatePrecision, Item } from "./types"

export function isSafeId(id: string): boolean {
  return /^[A-Za-z0-9_-]{1,80}$/.test(id)
}

export function cleanLine(value: unknown, max: number): string {
  if (typeof value !== "string") return ""
  return value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max)
}

export type ItemInput = {
  name: string
  person: string
  category: Category
  expiresOn: string
  datePrecision: DatePrecision
  notes: string
}

export function parseItemInput(body: unknown): ItemInput | string {
  if (!body || typeof body !== "object") return "That item couldn't be read."
  const record = body as Record<string, unknown>
  const name = cleanLine(record.name, 80)
  if (!name) return "Add a name for this item."
  const person = cleanLine(record.person, 40)
  const categoryRaw = cleanLine(record.category, 40)
  if (!isCategory(categoryRaw)) return "Pick a category."
  const expiresOn = cleanLine(record.expiresOn, 10)
  if (!parseIsoDate(expiresOn)) return "Enter a real expiry date."
  const precision = record.datePrecision === "month" ? "month" : "day"
  const notes = cleanLine(record.notes, 2000)
  return {
    name,
    person,
    category: categoryRaw,
    expiresOn,
    datePrecision: precision,
    notes,
  }
}

export function newItem(input: ItemInput, now = new Date()): Item {
  const stamp = now.toISOString()
  return {
    id: "",
    ...input,
    renewals: [],
    createdAt: stamp,
    updatedAt: stamp,
  }
}
