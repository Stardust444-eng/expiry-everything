import type { Metadata } from "next"
import { HomeScreen } from "@/components/home-screen"

export const metadata: Metadata = {
  title: "Expiry Everything",
  description:
    "A shared board for passports, licenses, warranties, medications, and makeup. No account. One line adds a date.",
}

export default function Home() {
  return <HomeScreen />
}
