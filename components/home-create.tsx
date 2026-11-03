"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function HomeCreate() {
  const router = useRouter()
  const [name, setName] = useState("Our household")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  return (
    <form
      className="mt-8 rounded-2xl bg-card p-4 ring-1 ring-border"
      onSubmit={(event) => {
        event.preventDefault()
        setSaving(true)
        setError("")
        void fetch("/api/boards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        })
          .then(async (response) => {
            const body = (await response.json().catch(() => null)) as {
              editId?: string
              error?: string
            } | null
            if (!response.ok || !body?.editId) {
              setError(body?.error || "The board didn't start.")
              setSaving(false)
              return
            }
            router.push(`/b/${body.editId}`)
          })
          .catch(() => {
            setError("The board didn't start. Check the connection and try again.")
            setSaving(false)
          })
      }}
    >
      <h2 className="font-heading text-2xl">Or start a household</h2>
      <div className="mt-3 space-y-2">
        <Label htmlFor="household">Household name</Label>
        <Input
          id="household"
          value={name}
          onValueChange={setName}
          className="h-12 px-3 text-base md:text-base"
          autoComplete="off"
        />
      </div>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      <Button type="submit" variant="outline" className="mt-4 h-12 w-full text-base" disabled={saving}>
        {saving ? "Starting…" : "Start a board"}
      </Button>
    </form>
  )
}
