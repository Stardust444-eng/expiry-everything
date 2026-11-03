import { buildCalendar } from "@/lib/ics"
import { getBoard, isStoreError } from "@/lib/store"
import { isSafeId } from "@/lib/validate"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  const result = await getBoard(id)
  if (isStoreError(result)) {
    return Response.json({ error: result.error }, { status: result.status })
  }

  const itemId = new URL(request.url).searchParams.get("item")
  let items = result.items
  if (itemId) {
    if (!isSafeId(itemId)) {
      return Response.json({ error: "That item isn't on this board." }, { status: 404 })
    }
    items = items.filter((item) => item.id === itemId)
    if (items.length === 0) {
      return Response.json({ error: "That item isn't on this board." }, { status: 404 })
    }
  }

  const ics = buildCalendar(result.name, items)
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="expiry-everything.ics"',
      "Cache-Control": "no-store",
    },
  })
}
