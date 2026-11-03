import type { Metadata } from "next"
import { QuickAdd } from "@/components/quick-add"

export const metadata: Metadata = { title: "Add an item" }

export default async function AddPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <QuickAdd boardKey={id} />
}
