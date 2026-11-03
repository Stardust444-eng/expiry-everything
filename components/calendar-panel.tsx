"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { BackLink, DemoLine, Screen } from "@/components/screen"
import { BoardStatus, useBoard } from "@/components/use-board"
import { daysUntil, formatDisplay } from "@/lib/dates"
import { downloadFile } from "@/lib/download"

export function CalendarPanel({ boardKey }: { boardKey: string }) {
  const { state, reload } = useBoard(boardKey)
  const [downloaded, setDownloaded] = useState(false)

  const items = useMemo(() => {
    if (state.status !== "ready") return []
    return [...state.board.items].sort((a, b) => {
      const left = daysUntil(a.expiresOn) ?? 0
      const right = daysUntil(b.expiresOn) ?? 0
      return left - right
    })
  }, [state])

  if (state.status !== "ready") {
    return (
      <Screen>
        <BackLink href={`/b/${boardKey}`}>Back to the board</BackLink>
        <BoardStatus state={state} onRetry={() => void reload()} />
      </Screen>
    )
  }

  const filename = "expiry-everything.ics"
  const href = `/api/boards/${encodeURIComponent(boardKey)}/calendar`

  return (
    <Screen>
      <BackLink href={`/b/${boardKey}`}>Back to the board</BackLink>
      <h1 className="mt-4 font-heading text-4xl text-balance">Add all to my calendar</h1>
      <p className="mt-3 text-base leading-relaxed text-muted-foreground">
        One all-day event per date. Each event alerts you 90 days, 30 days, and 7 days
        before. Open the file in Apple Calendar, Google Calendar, or Outlook.
      </p>
      {state.board.isDemo ? (
        <div className="mt-3">
          <DemoLine />
        </div>
      ) : null}

      {items.length === 0 ? (
        <p className="mt-6 text-base">Nothing to add yet. Put a date on the board first.</p>
      ) : (
        <Button
          type="button"
          className="mt-6 h-12 w-full text-base"
          onClick={() => {
            downloadFile(href, filename)
            setDownloaded(true)
          }}
        >
          Download calendar file
        </Button>
      )}
      {downloaded ? (
        <p className="mt-3 text-sm leading-relaxed text-primary" role="status">
          Downloaded {filename}. It has {items.length}{" "}
          {items.length === 1 ? "event" : "events"}, each with alerts 90, 30, and 7 days
          before.
        </p>
      ) : null}
      {items.length > 0 ? (
        <ul className="mt-6 divide-y divide-border rounded-2xl bg-card px-4 ring-1 ring-border">
          {items.map((item) => (
            <li key={item.id} className="py-3">
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-muted-foreground">
                {item.person.trim() || "Household"} ·{" "}
                {formatDisplay(item.expiresOn, item.datePrecision)}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </Screen>
  )
}
