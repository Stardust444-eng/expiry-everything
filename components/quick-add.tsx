"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CategoryIcon } from "@/components/category-icon"
import { BackLink, Screen } from "@/components/screen"
import { BoardStatus, useBoard } from "@/components/use-board"
import { CATEGORIES, categoryLabel } from "@/lib/categories"
import { daysPhrase, daysUntil, formatDisplay, urgencyOf } from "@/lib/dates"
import { parseLine, type ParseResult } from "@/lib/parse"
import type { Category } from "@/lib/types"

const fieldClass = "h-12 px-3 text-base md:text-base"

type FormState = {
  name: string
  person: string
  expiresOn: string
  category: Category
  notes: string
}

function formFromParse(parsed: ParseResult): FormState {
  return {
    name: parsed.name,
    person: parsed.person,
    expiresOn: parsed.expiresOn ?? "",
    category: parsed.category,
    notes: "",
  }
}

export function QuickAdd({ boardKey }: { boardKey: string }) {
  const router = useRouter()
  const { state, reload } = useBoard(boardKey)
  const [line, setLine] = useState("")
  const [mode, setMode] = useState<"line" | "form">("line")
  const [form, setForm] = useState<FormState>({
    name: "",
    person: "",
    expiresOn: "",
    category: "other",
    notes: "",
  })
  const [banner, setBanner] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  if (state.status !== "ready") {
    return (
      <Screen>
        <BackLink href={`/b/${boardKey}`}>Back to the board</BackLink>
        <BoardStatus state={state} onRetry={() => void reload()} />
      </Screen>
    )
  }

  if (state.board.access !== "edit") {
    return (
      <Screen>
        <BackLink href={`/b/${boardKey}`}>Back to the board</BackLink>
        <h1 className="mt-4 font-heading text-4xl text-balance">This link is view only</h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          You can see the dates, but you cannot add one from here. Ask for the family link.
        </p>
      </Screen>
    )
  }

  const parsed = parseLine(line)

  function openForm(message: string) {
    setForm(formFromParse(parsed))
    setBanner(message)
    setMode("form")
    setError("")
  }

  async function save(input: FormState) {
    setSaving(true)
    setError("")
    try {
      const response = await fetch(`/api/boards/${encodeURIComponent(boardKey)}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...input,
          datePrecision: mode === "line" ? parsed.datePrecision ?? "day" : "day",
        }),
      })
      const body = (await response.json().catch(() => null)) as { id?: string; error?: string } | null
      if (!response.ok || !body?.id) {
        setError(body?.error || "That didn't save.")
        setSaving(false)
        return
      }
      router.push(`/b/${boardKey}?added=${encodeURIComponent(body.id)}`)
    } catch {
      setError("That didn't save. Check the connection and try again.")
      setSaving(false)
    }
  }

  return (
    <Screen>
      <BackLink href={`/b/${boardKey}`}>Back to the board</BackLink>
      <p className="mt-4 text-sm text-muted-foreground">Adding to {state.board.name}</p>
      {mode === "line" ? (
        <>
          <h1 className="mt-1 font-heading text-4xl text-balance">Add in one line</h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Item, person, and date. For example, passport Mia jun 2027.
          </p>
          <form
            className="mt-5"
            onSubmit={(event) => {
              event.preventDefault()
              if (!parsed.ready) {
                openForm(
                  parsed.expiresOn
                    ? "Add a name below. The date is filled from your line."
                    : "No date in that line. Add the missing pieces below.",
                )
                return
              }
              void save({
                name: parsed.name,
                person: parsed.person,
                expiresOn: parsed.expiresOn ?? "",
                category: parsed.category,
                notes: "",
              })
            }}
          >
            <Label htmlFor="line" className="sr-only">
              Item, person, and date
            </Label>
            <Input
              id="line"
              value={line}
              onValueChange={setLine}
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              placeholder="passport Mia jun 2027"
              className={fieldClass}
            />
            <div className="mt-4" aria-live="polite">
              {parsed.ready && parsed.expiresOn && parsed.datePrecision ? (
                <Preview parsed={parsed} expiresOn={parsed.expiresOn} precision={parsed.datePrecision} />
              ) : line.trim() ? (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {parsed.name ? parsed.name : "No item yet"}
                  {parsed.person ? ` · ${parsed.person}` : ""}
                  {parsed.expiresOn ? "" : " · still needs a date"}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  The preview shows up once a date is in the line.
                </p>
              )}
            </div>
            {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="mt-5 h-12 w-full text-base" disabled={saving || !line.trim()}>
              {saving ? "Adding…" : parsed.ready ? "Add to board" : "Continue in the form"}
            </Button>
          </form>
          <button
            type="button"
            className="mt-4 h-11 text-left text-sm font-medium text-primary"
            onClick={() => openForm("Use the fields if the line is easier to fix than to retype.")}
          >
            Use a form instead
          </button>
        </>
      ) : (
        <>
          <h1 className="mt-1 font-heading text-4xl text-balance">Add with the form</h1>
          {banner ? <p className="mt-3 text-base leading-relaxed text-muted-foreground">{banner}</p> : null}
          <form
            className="mt-5 space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              if (!form.name.trim() || !form.expiresOn) {
                setError("A name and an expiry date are required.")
                return
              }
              void save(form)
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="name">What is it</Label>
              <Input
                id="name"
                value={form.name}
                onValueChange={(value) => setForm({ ...form, name: value })}
                className={fieldClass}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="person">Who is it for</Label>
              <Input
                id="person"
                value={form.person}
                onValueChange={(value) => setForm({ ...form, person: value })}
                placeholder="Leave blank for the household"
                className={fieldClass}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expires">Expiry date</Label>
              <Input
                id="expires"
                type="date"
                value={form.expiresOn}
                onValueChange={(value) => setForm({ ...form, expiresOn: value })}
                className={fieldClass}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={form.category}
                onChange={(event) =>
                  setForm({ ...form, category: event.target.value as Category })
                }
                className="h-12 w-full rounded-lg border border-input bg-transparent px-3 text-base"
              >
                {CATEGORIES.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
                placeholder="Where it lives, or what renewing takes"
                className="min-h-24 text-base md:text-base"
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="h-12 w-full text-base" disabled={saving}>
              {saving ? "Adding…" : "Add to board"}
            </Button>
          </form>
          <button
            type="button"
            className="mt-4 h-11 text-sm font-medium text-primary"
            onClick={() => {
              setMode("line")
              setError("")
            }}
          >
            Try one line instead
          </button>
        </>
      )}
    </Screen>
  )
}

function Preview({
  parsed,
  expiresOn,
  precision,
}: {
  parsed: ParseResult
  expiresOn: string
  precision: "day" | "month"
}) {
  const days = daysUntil(expiresOn) ?? 0
  return (
    <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
      <p className="text-sm font-medium text-muted-foreground">Preview</p>
      <div className="mt-3 flex items-center gap-3">
        <CategoryIcon category={parsed.category} />
        <div>
          <p className="font-heading text-2xl leading-tight">{parsed.name}</p>
          <p className="text-sm text-muted-foreground">
            {parsed.person.trim() || "Household"} · {categoryLabel(parsed.category)}
          </p>
        </div>
      </div>
      <p className="mt-3 text-base">
        {formatDisplay(expiresOn, precision)}
        <span className="text-muted-foreground"> · {daysPhrase(days)}</span>
      </p>
      <p className="text-sm text-muted-foreground">{urgencyLabel(days)}</p>
      {parsed.hints.length > 0 ? (
        <ul className="mt-3 space-y-1 text-sm leading-relaxed text-muted-foreground">
          {parsed.hints.map((hint) => (
            <li key={hint}>{hint}</li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function urgencyLabel(days: number) {
  const urgency = urgencyOf(days)
  if (urgency === "overdue") return "Overdue"
  if (urgency === "soon") return "Within 30 days"
  if (urgency === "upcoming") return "Within 90 days"
  return "Later"
}
