import { getBoard, isStoreError } from "@/lib/store"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  const result = await getBoard(id)
  if (isStoreError(result)) {
    return Response.json({ error: result.error }, { status: result.status })
  }
  return Response.json(result, { headers: { "Cache-Control": "no-store" } })
}
