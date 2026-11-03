import { deleteItem, isStoreError, updateItem } from "@/lib/store"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; itemId: string }> },
) {
  const { id, itemId } = await context.params
  const body = await request.json().catch(() => null)
  const result = await updateItem(id, itemId, body)
  if (isStoreError(result)) {
    return Response.json({ error: result.error }, { status: result.status })
  }
  return Response.json(result, { headers: { "Cache-Control": "no-store" } })
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; itemId: string }> },
) {
  const { id, itemId } = await context.params
  const result = await deleteItem(id, itemId)
  if (isStoreError(result)) {
    return Response.json({ error: result.error }, { status: result.status })
  }
  return Response.json(result, { headers: { "Cache-Control": "no-store" } })
}
