import type { Metadata } from "next"
import { CalendarPanel } from "@/components/calendar-panel"

export const metadata: Metadata = { title: "Calendar" }

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <CalendarPanel boardKey={id} />
}
