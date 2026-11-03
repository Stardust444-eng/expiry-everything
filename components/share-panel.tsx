"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BackLink, DemoLine, Screen } from "@/components/screen"
import { BoardStatus, useBoard } from "@/components/use-board"

export function SharePanel({ boardKey }: { boardKey: string }) {
  const { state, reload } = useBoard(boardKey)
  const [origin, setOrigin] = useState("")
  const [copied, setCopied] = useState<"family" | "view" | "">("")
  const [copyError, setCopyError] = useState("")

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  if (state.status !== "ready") {
    return (
      <Screen>
        <BackLink href={`/b/${boardKey}`}>Back to the board</BackLink>
        <BoardStatus state={state} onRetry={() => void reload()} />
      </Screen>
    )
  }

  const familyPath = state.board.editId ? `/b/${state.board.editId}` : ""
  const viewPath = `/b/${state.board.viewId}`
  const familyUrl = origin && familyPath ? `${origin}${familyPath}` : familyPath
  const viewUrl = origin ? `${origin}${viewPath}` : viewPath

  async function copy(kind: "family" | "view", url: string) {
    setCopyError("")
    try {
      await navigator.clipboard.writeText(url)
      setCopied(kind)
    } catch {
      setCopied("")
      setCopyError("Select the link and copy it from there.")
    }
  }

  return (
    <Screen>
      <BackLink href={`/b/${boardKey}`}>Back to the board</BackLink>
      <h1 className="mt-4 font-heading text-4xl text-balance">Share this board</h1>
      <p className="mt-3 text-base leading-relaxed text-muted-foreground">
        Anyone with a link sees the same dates. There is no account to create.
      </p>
      {state.board.isDemo ? (
        <div className="mt-3">
          <DemoLine />
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            These demo links are public on purpose. A board you start gets a long link,
            and that link is the only key.
          </p>
        </div>
      ) : null}

      {state.board.access === "edit" && familyUrl ? (
        <section className="mt-6">
          <h2 className="font-heading text-2xl">Family link</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Add and update dates. Send this to the people who keep the household.
          </p>
          <Input
            readOnly
            value={familyUrl}
            aria-label="Family link"
            onFocus={(event) => event.currentTarget.select()}
            className="mt-3 h-12 px-3 text-base md:text-base"
          />
          <Button
            type="button"
            className="mt-3 h-12 w-full text-base"
            onClick={() => void copy("family", familyUrl)}
          >
            {copied === "family" ? "Copied family link" : "Copy family link"}
          </Button>
        </section>
      ) : (
        <p className="mt-6 text-base leading-relaxed">
          You opened the view-only link. You can look and download the calendar. Ask for
          the family link if a date needs to change.
        </p>
      )}

      <section className="mt-8">
        <h2 className="font-heading text-2xl">View-only link</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          For someone who should see the dates and not change them.
        </p>
        <Input
          readOnly
          value={viewUrl}
          aria-label="View-only link"
          onFocus={(event) => event.currentTarget.select()}
          className="mt-3 h-12 px-3 text-base md:text-base"
        />
        <Button
          type="button"
          variant="outline"
          className="mt-3 h-12 w-full text-base"
          onClick={() => void copy("view", viewUrl)}
        >
          {copied === "view" ? "Copied view-only link" : "Copy view-only link"}
        </Button>
      </section>
      {copyError ? <p className="mt-3 text-sm text-destructive">{copyError}</p> : null}
    </Screen>
  )
}
