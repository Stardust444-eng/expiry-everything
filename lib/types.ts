export const CATEGORY_IDS = [
  "passport",
  "license",
  "registration",
  "insurance",
  "warranty",
  "medication",
  "makeup",
  "id",
  "home",
  "other",
] as const

export type Category = (typeof CATEGORY_IDS)[number]

export type DatePrecision = "day" | "month"

export type Renewal = {
  at: string
  from: string
  to: string
}

export type Item = {
  id: string
  name: string
  person: string
  category: Category
  expiresOn: string
  datePrecision: DatePrecision
  notes: string
  renewals: Renewal[]
  createdAt: string
  updatedAt: string
}

export type Board = {
  id: string
  viewId: string
  name: string
  isDemo: boolean
  seedVersion: number
  createdAt: string
  items: Item[]
}

export type Database = {
  boards: Board[]
}

export type Access = "edit" | "view"

export type BoardResponse = {
  access: Access
  name: string
  isDemo: boolean
  editId: string | null
  viewId: string
  items: Item[]
}
