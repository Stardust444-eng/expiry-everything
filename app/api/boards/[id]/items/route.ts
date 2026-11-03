import { addItem, isStoreError } from "@/lib/store"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  const body = await request.json().catch(() => null)
  const result = await addItem(id, body)
  if (isStoreError(result)) {
    return Response.json({ error: result.error }, { status: result.status })
  }
  return Response.json(result, { status: 201, headers: { "Cache-Control": "no-store" } })
}
