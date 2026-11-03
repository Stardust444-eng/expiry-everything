"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import type { BoardResponse } from "@/lib/types"

export type BoardState =
  | { status: "loading" }
  | { status: "missing" }
  | { status: "error"; message: string }
  | { status: "ready"; board: BoardResponse }

export function useBoard(boardKey: string) {
  const [state, setState] = useState<BoardState>({ status: "loading" })

  const reload = useCallback(async () => {
    try {
      const response = await fetch(`/api/boards/${encodeURIComponent(boardKey)}`, {
        cache: "no-store",
      })
      if (response.status === 404) {
        setState({ status: "missing" })
        return
      }
      const body = (await response.json().catch(() => null)) as
        | (BoardResponse & { error?: string })
        | null
      if (!response.ok || !body || !body.items) {
        setState({
          status: "error",
          message: body?.error || "This board didn't load.",
        })
        return
      }
      setState({ status: "ready", board: body })
    } catch {
      setState({
        status: "error",
        message: "This board didn't load. Check the connection and try again.",
      })
    }
  }, [boardKey])

  useEffect(() => {
    void reload()
  }, [reload])

  return { state, reload, setBoard: setState }
}

export function BoardStatus({
  state,
  onRetry,
}: {
  state: Exclude<BoardState, { status: "ready" }>
  onRetry?: () => void
}) {
  if (state.status === "loading") {
    return (
      <div className="mt-8 space-y-3" aria-live="polite">
        <p className="text-sm text-muted-foreground">Loading the board…</p>
        {[0, 1, 2].map((row) => (
          <div key={row} className="h-16 animate-pulse rounded-2xl bg-secondary" />
        ))}
      </div>
    )
  }

  if (state.status === "missing") {
    return (
      <div className="mt-10">
        <h1 className="font-heading text-3xl text-balance">No board at this link</h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          The address may be incomplete. Ask the person who made the board to send the
          link again.
        </p>
        <Link href="/" className="mt-6 inline-flex text-base font-medium text-primary">
          Start from the beginning
        </Link>
      </div>
    )
  }

  return (
    <div className="mt-10">
        <h1 className="font-heading text-3xl text-balance">The board did not load</h1>
      <p className="mt-3 text-base leading-relaxed text-muted-foreground">{state.message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 h-12 rounded-xl bg-primary px-4 text-base font-medium text-primary-foreground"
        >
          Try again
        </button>
      ) : null}
    </div>
  )
}
