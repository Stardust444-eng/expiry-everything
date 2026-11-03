"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CategoryIcon } from "@/components/category-icon"
import { BackLink, DemoLine, Screen } from "@/components/screen"
import { BoardStatus, useBoard } from "@/components/use-board"
import { categoryLabel } from "@/lib/categories"
import {
  daysPhrase,
  daysUntil,
  formatDisplay,
  formatTimestamp,
  suggestRenewalDate,
  urgencyOf,
} from "@/lib/dates"
import { downloadFile } from "@/lib/download"
import type { Item } from "@/lib/types"

export function ItemDetail({ boardKey, itemId }: { boardKey: string; itemId: string }) {
  const router = useRouter()
  const { state, reload } = useBoard(boardKey)
  const [item, setItem] = useState<Item | null>(null)
  const [notes, setNotes] = useState("")
  const [notesDirty, setNotesDirty] = useState(false)
  const [renewOpen, setRenewOpen] = useState(false)
  const [nextDate, setNextDate] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState("")
  const [status, setStatus] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (state.status !== "ready") return
    const found = state.board.items.find((entry) => entry.id === itemId) ?? null
    setItem(found)
    if (found) {
      setNotes(found.notes)
      setNotesDirty(false)
      setNextDate(suggestRenewalDate(found.expiresOn))
    }
  }, [state, itemId])

  if (state.status !== "ready") {
    return (
      <Screen>
        <BackLink href={`/b/${boardKey}`}>Back to the board</BackLink>
        <BoardStatus state={state} onRetry={() => void reload()} />
      </Screen>
    )
  }

  if (!item) {
    return (
      <Screen>
        <BackLink href={`/b/${boardKey}`}>Back to the board</BackLink>
        <h1 className="mt-4 font-heading text-4xl text-balance">That item is not on this board</h1>
        <p className="mt-3 text-base text-muted-foreground">It may have been removed.</p>
      </Screen>
    )
  }

  const canEdit = state.board.access === "edit"
  const days = daysUntil(item.expiresOn) ?? 0
  const urgency = urgencyOf(days)
  const who = item.person.trim() || "Household"

  async function patch(body: Record<string, string>) {
    setBusy(true)
    setError("")
    try {
      const response = await fetch(
        `/api/boards/${encodeURIComponent(boardKey)}/items/${encodeURIComponent(itemId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      )
      const payload = (await response.json().catch(() => null)) as (Item & { error?: string }) | null
      if (!response.ok || !payload || payload.error) {
        setError(payload?.error || "That didn't save.")
        setBusy(false)
        return null
      }
      setItem(payload)
      setBusy(false)
      return payload
    } catch {
      setError("That didn't save. Check the connection and try again.")
      setBusy(false)
      return null
    }
  }

  return (
    <Screen className="pb-10">
      <BackLink href={`/b/${boardKey}`}>Back to the board</BackLink>
      {state.board.isDemo ? (
        <div className="mt-3">
          <DemoLine />
        </div>
      ) : null}
      <div className="mt-4 flex items-center gap-3">
        <CategoryIcon category={item.category} />
        <p className="text-sm text-muted-foreground">{categoryLabel(item.category)}</p>
      </div>
      <h1 className="mt-3 font-heading text-4xl leading-tight text-balance">{item.name}</h1>
      <p className="mt-1 text-base text-muted-foreground">{who}</p>

      <div className="mt-5 rounded-2xl bg-card p-4 ring-1 ring-border">
        <p className="text-sm text-muted-foreground">Expires</p>
        <p className="mt-1 font-heading text-3xl leading-tight">
          {formatDisplay(item.expiresOn, item.datePrecision)}
        </p>
        <p className="mt-1 text-base font-medium">
          {daysPhrase(days)} ·{" "}
          {urgency === "overdue"
            ? "Overdue"
            : urgency === "soon"
              ? "Within 30 days"
              : urgency === "upcoming"
                ? "Within 90 days"
                : "Later"}
        </p>
        {item.datePrecision === "month" ? (
          <p className="mt-2 text-sm text-muted-foreground">
            The day was not set, so this counts to the 1st.
          </p>
        ) : null}
      </div>

      {item.renewals.length > 0 ? (
        <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
          {[...item.renewals].reverse().map((renewal) => (
            <li key={`${renewal.at}-${renewal.to}`}>
              Renewed {formatTimestamp(renewal.at)}, replacing {formatDisplay(renewal.from, "day")}.
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-6">
        <Label htmlFor="notes">Notes</Label>
        {canEdit ? (
          <>
            <Textarea
              id="notes"
              value={notes}
              onChange={(event) => {
                setNotes(event.target.value)
                setNotesDirty(true)
              }}
              placeholder="Where it lives, or what renewing takes"
              className="mt-2 min-h-28 text-base md:text-base"
            />
            {notesDirty ? (
              <Button
                type="button"
                variant="outline"
                className="mt-3 h-11 text-base"
                disabled={busy}
                onClick={() => {
                  void patch({ notes }).then((saved) => {
                    if (saved) {
                      setNotesDirty(false)
                      setStatus("Notes saved.")
                    }
                  })
                }}
              >
                Save notes
              </Button>
            ) : null}
          </>
        ) : (
          <p id="notes" className="mt-2 text-base leading-relaxed">
            {item.notes || "No notes."}
          </p>
        )}
      </div>

      {canEdit ? (
        <div className="mt-8">
          <Button
            type="button"
            className="h-12 w-full text-base"
            aria-expanded={renewOpen}
            onClick={() => {
              setRenewOpen((open) => !open)
              setConfirmDelete(false)
              setError("")
            }}
          >
            Renewed
          </Button>
          {renewOpen ? (
            <form
              className="mt-3 rounded-2xl bg-card p-4 ring-1 ring-border"
              onSubmit={(event) => {
                event.preventDefault()
                void patch({ expiresOn: nextDate }).then((saved) => {
                  if (!saved) return
                  setRenewOpen(false)
                  setStatus(`Saved. The new date is ${formatDisplay(saved.expiresOn, "day")}.`)
                })
              }}
            >
              <Label htmlFor="renewed-date">New expiry date</Label>
              <p className="mt-1 text-sm text-muted-foreground">
                This replaces {formatDisplay(item.expiresOn, item.datePrecision)}.
              </p>
              <Input
                id="renewed-date"
                type="date"
                value={nextDate}
                onValueChange={setNextDate}
                className="mt-3 h-12 px-3 text-base md:text-base"
                autoFocus
                required
              />
              <div className="mt-3 flex gap-2">
                <Button type="submit" className="h-11 flex-1 text-base" disabled={busy}>
                  {busy ? "Saving…" : "Save new date"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 text-base"
                  onClick={() => setRenewOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      {status ? (
        <p className="mt-3 text-sm text-primary" role="status">
          {status}
        </p>
      ) : null}

      <button
        type="button"
        className="mt-6 h-11 text-sm font-medium text-primary"
        onClick={() => {
          downloadFile(
            `/api/boards/${encodeURIComponent(boardKey)}/calendar?item=${encodeURIComponent(item.id)}`,
            "expiry-everything.ics",
          )
          setStatus("Downloaded this date. Alerts are 90, 30, and 7 days before.")
        }}
      >
        Add this date to my calendar
      </button>

      {canEdit ? (
        <div className="mt-6 border-t border-border pt-4">
          {confirmDelete ? (
            <div>
              <p className="text-sm">Remove {item.name}? This cannot be undone.</p>
              <div className="mt-2 flex gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  className="h-11"
                  disabled={busy}
                  onClick={() => {
                    setBusy(true)
                    void fetch(
                      `/api/boards/${encodeURIComponent(boardKey)}/items/${encodeURIComponent(item.id)}`,
                      { method: "DELETE" },
                    )
                      .then(async (response) => {
                        if (!response.ok) {
                          const payload = (await response.json().catch(() => null)) as {
                            error?: string
                          } | null
                          setError(payload?.error || "That didn't remove.")
                          setBusy(false)
                          return
                        }
                        router.push(`/b/${boardKey}`)
                      })
                      .catch(() => {
                        setError("That didn't remove. Check the connection and try again.")
                        setBusy(false)
                      })
                  }}
                >
                  Remove
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="h-11 text-sm text-muted-foreground"
              onClick={() => {
                setConfirmDelete(true)
                setRenewOpen(false)
              }}
            >
              Remove from board
            </button>
          )}
        </div>
      ) : null}
    </Screen>
  )
}
