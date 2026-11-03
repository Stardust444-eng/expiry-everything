"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { CategoryIcon } from "@/components/category-icon"
import { DemoLine, Screen, Wordmark } from "@/components/screen"
import { BoardStatus, useBoard } from "@/components/use-board"
import { cn } from "@/lib/utils"
import {
  URGENCY_LABEL,
  URGENCY_ORDER,
  daysPhrase,
  daysUntil,
  formatDisplay,
  urgencyOf,
  type Urgency,
} from "@/lib/dates"
import type { Item } from "@/lib/types"

const TONE: Record<Urgency, { bar: string; text: string; dot: string }> = {
  overdue: { bar: "bg-rose-700", text: "text-rose-800", dot: "bg-rose-700" },
  soon: { bar: "bg-orange-600", text: "text-orange-900", dot: "bg-orange-600" },
  upcoming: { bar: "bg-sky-700", text: "text-sky-950", dot: "bg-sky-700" },
  later: { bar: "bg-emerald-700", text: "text-emerald-900", dot: "bg-emerald-700" },
}

function personName(person: string) {
  return person.trim() || "Household"
}

export function BoardScreen({ boardKey }: { boardKey: string }) {
  const { state, reload } = useBoard(boardKey)
  const [filter, setFilter] = useState("all")
  const [highlight, setHighlight] = useState<string | null>(null)

  useEffect(() => {
    if (state.status !== "ready") return
    const added = new URLSearchParams(window.location.search).get("added")
    if (!added) return
    setHighlight(added)
    document.getElementById(`item-${added}`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    })
  }, [state])

  const items = state.status === "ready" ? state.board.items : []
  const names = new Set<string>()
  let household = false
  for (const item of items) {
    if (item.person.trim()) names.add(item.person.trim())
    else household = true
  }
  const people = { list: [...names].sort((a, b) => a.localeCompare(b)), household }

  if (state.status !== "ready") {
    return (
      <Screen>
        <Wordmark />
        <BoardStatus state={state} onRetry={() => void reload()} />
      </Screen>
    )
  }

  const { board } = state
  const canEdit = board.access === "edit"
  const visible = items.filter((item) => {
    if (filter === "all") return true
    if (filter === "__household") return !item.person.trim()
    return item.person.trim() === filter
  })
  const now = new Date()
  const grouped = URGENCY_ORDER.map((urgency) => ({
    urgency,
    items: visible
      .filter((item) => {
        const days = daysUntil(item.expiresOn, now)
        return days !== null && urgencyOf(days) === urgency
      })
      .sort((a, b) => {
        const left = daysUntil(a.expiresOn, now) ?? 0
        const right = daysUntil(b.expiresOn, now) ?? 0
        if (left !== right) return left - right
        return a.name.localeCompare(b.name)
      }),
  })).filter((group) => group.items.length > 0)

  return (
    <Screen className="pb-40">
      <Wordmark />
      <h1 className="mt-3 font-heading text-4xl leading-tight text-balance">{board.name}</h1>
      {board.isDemo ? <div className="mt-2"><DemoLine /></div> : null}
      {!canEdit ? (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          View only. You can see every date and download the calendar. The family link is
          what adds or changes a date.
        </p>
      ) : null}
      <p className="mt-4 text-sm text-muted-foreground">
        {items.length === 0
          ? "Nothing dated yet."
          : `${items.length} ${items.length === 1 ? "date" : "dates"}, soonest first.`}
      </p>

      <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
        {URGENCY_ORDER.map((urgency) => (
          <li key={urgency} className="flex items-center gap-2">
            <span className={cn("size-2.5 rounded-full", TONE[urgency].dot)} />
            <span>{URGENCY_LABEL[urgency]}</span>
          </li>
        ))}
      </ul>

      {items.length > 0 ? (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter by person">
          <FilterChip selected={filter === "all"} onClick={() => setFilter("all")}>
            Everyone
          </FilterChip>
          {people.list.map((name) => (
            <FilterChip key={name} selected={filter === name} onClick={() => setFilter(name)}>
              {name}
            </FilterChip>
          ))}
          {people.household ? (
            <FilterChip
              selected={filter === "__household"}
              onClick={() => setFilter("__household")}
            >
              Household
            </FilterChip>
          ) : null}
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-card px-4 py-5 ring-1 ring-border">
          <p className="font-heading text-2xl">Nothing here yet.</p>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">
            Add a passport, a license, a warranty, a prescription, or a tube of mascara.
            One line is enough: passport Mia jun 2027.
          </p>
        </div>
      ) : grouped.length === 0 ? (
        <p className="mt-8 text-base text-muted-foreground">Nothing for that person is on this board.</p>
      ) : (
        grouped.map((group) => (
          <section key={group.urgency} className="mt-6" aria-label={URGENCY_LABEL[group.urgency]}>
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <span className={cn("size-2.5 rounded-full", TONE[group.urgency].dot)} />
              {URGENCY_LABEL[group.urgency]}
              <span className="font-normal text-muted-foreground">{group.items.length}</span>
            </h2>
            <ul className="mt-2 space-y-2">
              {group.items.map((item) => (
                <li key={item.id}>
                  <ItemCard
                    item={item}
                    href={`/b/${boardKey}/i/${item.id}`}
                    now={now}
                    highlighted={highlight === item.id}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-lg flex-col gap-1 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {canEdit ? (
            <Link
              href={`/b/${boardKey}/add`}
              className={cn(buttonVariants(), "h-12 w-full text-base")}
            >
              Add an item
            </Link>
          ) : (
            <p className="py-2 text-sm leading-snug text-muted-foreground">
              View only. Download the calendar, or ask for the family link to add a date.
            </p>
          )}
          <div className="flex items-center justify-between">
            <Link
              href={`/b/${boardKey}/calendar`}
              className="inline-flex h-11 items-center text-sm font-medium text-primary"
            >
              Add all to my calendar
            </Link>
            <Link
              href={`/b/${boardKey}/share`}
              className="inline-flex h-11 items-center text-sm font-medium text-primary"
            >
              Share
            </Link>
          </div>
        </div>
      </div>
    </Screen>
  )
}

function FilterChip({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "h-10 shrink-0 rounded-full px-3 text-sm font-medium",
        selected
          ? "bg-primary text-primary-foreground"
          : "bg-card text-foreground ring-1 ring-border",
      )}
    >
      {children}
    </button>
  )
}

function ItemCard({
  item,
  href,
  now,
  highlighted,
}: {
  item: Item
  href: string
  now: Date
  highlighted: boolean
}) {
  const days = daysUntil(item.expiresOn, now) ?? 0
  const urgency = urgencyOf(days)
  const tone = TONE[urgency]
  return (
    <Link
      id={`item-${item.id}`}
      href={href}
      className={cn(
        "flex scroll-mb-40 items-center gap-3 rounded-2xl bg-card px-3 py-3 ring-1 ring-border",
        urgency === "overdue" && "bg-rose-50",
        highlighted && "ring-2 ring-primary",
      )}
    >
      <span className={cn("h-14 w-1.5 shrink-0 rounded-full", tone.bar)} aria-hidden="true" />
      <CategoryIcon category={item.category} />
      <span className="min-w-0 flex-1">
        <span className="block font-heading text-lg leading-tight">{item.name}</span>
        <span className="mt-0.5 block text-sm text-muted-foreground">
          {personName(item.person)} · {formatDisplay(item.expiresOn, item.datePrecision)}
        </span>
        <span className={cn("mt-0.5 block text-sm font-semibold", tone.text)}>
          {daysPhrase(days)}
          {highlighted ? " · Just added" : ""}
        </span>
      </span>
    </Link>
  )
}
