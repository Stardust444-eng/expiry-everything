import { createBoard, isStoreError } from "@/lib/store"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { name?: unknown }
  const result = await createBoard(body.name)
  if (isStoreError(result)) {
    return Response.json({ error: result.error }, { status: result.status })
  }
  return Response.json(result, { headers: { "Cache-Control": "no-store" } })
}
