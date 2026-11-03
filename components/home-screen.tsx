"use client"

import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { CategoryIcon } from "@/components/category-icon"
import { HomeCreate } from "@/components/home-create"
import { Screen } from "@/components/screen"
import { categoryLabel } from "@/lib/categories"
import { formatDisplay } from "@/lib/dates"
import { parseLine } from "@/lib/parse"
import { cn } from "@/lib/utils"

export function HomeScreen() {
  const example = parseLine("passport Mia jun 2027")

  return (
    <Screen className="pb-10">
      <p className="text-sm font-medium tracking-wide text-primary">Expiry Everything</p>
      <h1 className="mt-3 font-heading text-4xl leading-tight text-balance">
        The dates that are not on a food label.
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
        Passports, licenses, warranties, medications, and makeup. One shared board for
        the household, opened from a link. No account.
      </p>

      <div className="mt-6 rounded-2xl bg-card p-4 ring-1 ring-border">
        <p className="text-sm text-muted-foreground">One line is enough</p>
        <p className="mt-2 font-heading text-2xl">passport Mia jun 2027</p>
        {example.ready && example.expiresOn && example.datePrecision ? (
          <div className="mt-4 flex items-center gap-3 border-t border-border pt-4">
            <CategoryIcon category={example.category} />
            <div>
              <p className="font-medium">
                {example.name} · {example.person}
              </p>
              <p className="text-sm text-muted-foreground">
                {categoryLabel(example.category)} ·{" "}
                {formatDisplay(example.expiresOn, example.datePrecision)}
              </p>
            </div>
          </div>
        ) : null}
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          No day was in that line, so the board uses the 1st. You confirm before it is saved.
        </p>
      </div>

      <Link
        href="/b/demo"
        className={cn(buttonVariants(), "mt-6 h-12 w-full text-base")}
      >
        Open the demo board
      </Link>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        The demo is a made-up household. The dates are samples, not real documents.
      </p>

      <HomeCreate />

      <p className="mt-8 text-sm leading-relaxed text-muted-foreground">
        Reminders are a calendar file, with alerts 90, 30, and 7 days before each date.
        This is not a food tracker.
      </p>
    </Screen>
  )
}
