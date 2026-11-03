import Link from "next/link"
import { cn } from "@/lib/utils"

export function Screen({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className={cn("mx-auto flex w-full max-w-lg flex-col px-4 py-5", className)}>
        {children}
      </div>
    </div>
  )
}

export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="text-sm font-medium tracking-wide text-primary">
      Expiry Everything
    </Link>
  )
}

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex h-11 items-center text-sm font-medium text-primary">
      {children}
    </Link>
  )
}

export function DemoLine() {
  return (
    <p className="text-sm leading-snug text-amber-950">
      Demo data. Sample dates for a made-up household, not real documents.
    </p>
  )
}
