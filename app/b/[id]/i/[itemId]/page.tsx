import type { Metadata } from "next"
import { ItemDetail } from "@/components/item-detail"

export const metadata: Metadata = { title: "Item" }

export default async function ItemPage({
  params,
}: {
  params: Promise<{ id: string; itemId: string }>
}) {
  const { id, itemId } = await params
  return <ItemDetail boardKey={id} itemId={itemId} />
}
