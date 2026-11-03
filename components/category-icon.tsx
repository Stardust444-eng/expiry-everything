import {
  BadgeCheck,
  BookOpen,
  CalendarClock,
  Car,
  House,
  IdCard,
  Pill,
  Shield,
  Sparkles,
  Umbrella,
} from "lucide-react"
import { categoryLabel } from "@/lib/categories"
import type { Category } from "@/lib/types"

const ICONS: Record<Category, typeof BookOpen> = {
  passport: BookOpen,
  license: IdCard,
  registration: Car,
  insurance: Umbrella,
  warranty: Shield,
  medication: Pill,
  makeup: Sparkles,
  id: BadgeCheck,
  home: House,
  other: CalendarClock,
}

export function CategoryIcon({ category }: { category: Category }) {
  const Icon = ICONS[category]
  const label = categoryLabel(category)
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-primary"
    >
      <Icon className="size-5" aria-hidden="true" />
    </span>
  )
}
