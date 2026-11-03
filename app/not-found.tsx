import Link from "next/link"
import { Screen } from "@/components/screen"

export default function NotFound() {
  return (
    <Screen>
      <p className="text-sm font-medium tracking-wide text-primary">Expiry Everything</p>
      <h1 className="mt-3 font-heading text-4xl text-balance">That page isn&apos;t here</h1>
      <p className="mt-3 text-base leading-relaxed text-muted-foreground">
        The link may be incomplete.
      </p>
      <Link href="/" className="mt-6 inline-flex h-12 items-center text-base font-medium text-primary">
        Back to the start
      </Link>
    </Screen>
  )
}
