"use client"

import { Button } from "@/components/ui/button"
import { Screen } from "@/components/screen"

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <Screen>
      <h1 className="font-heading text-4xl text-balance">Something went wrong</h1>
      <p className="mt-3 text-base leading-relaxed text-muted-foreground">
        The page didn&apos;t load. Try again.
      </p>
      <Button type="button" className="mt-6 h-12 text-base" onClick={() => reset()}>
        Try again
      </Button>
    </Screen>
  )
}
