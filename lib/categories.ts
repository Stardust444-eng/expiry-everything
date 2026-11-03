import { CATEGORY_IDS, type Category } from "./types"

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: "passport", label: "Passport" },
  { id: "license", label: "License" },
  { id: "registration", label: "Registration" },
  { id: "insurance", label: "Insurance" },
  { id: "warranty", label: "Warranty" },
  { id: "medication", label: "Medication" },
  { id: "makeup", label: "Makeup" },
  { id: "id", label: "ID or visa" },
  { id: "home", label: "Home" },
  { id: "other", label: "Other" },
]

export function isCategory(value: string): value is Category {
  return (CATEGORY_IDS as readonly string[]).includes(value)
}

export function categoryLabel(id: Category): string {
  return CATEGORIES.find((category) => category.id === id)?.label ?? "Other"
}
