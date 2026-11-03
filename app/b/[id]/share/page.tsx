import type { Metadata } from "next"
import { SharePanel } from "@/components/share-panel"

export const metadata: Metadata = { title: "Share" }

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <SharePanel boardKey={id} />
}
