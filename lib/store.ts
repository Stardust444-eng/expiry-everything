import fs from "fs"
import path from "path"
import crypto from "crypto"
import { addDays, formatIso, parseIsoDate, todayStart } from "./dates"
import type { Access, Board, BoardResponse, Database, Item } from "./types"
import { cleanLine, isSafeId, parseItemInput } from "./validate"

const DATA_PATH =
  process.env.BOARDS_PATH || path.join(process.cwd(), "data", "boards.json")

const DEMO_SEED = 1
const ITEM_LIMIT = 200

export type StoreError = { error: string; status: number }

export function isStoreError(value: unknown): value is StoreError {
  return Boolean(
    value &&
      typeof value === "object" &&
      "error" in value &&
      "status" in value &&
      typeof (value as StoreError).error === "string",
  )
}

function fail(error: string, status: number): StoreError {
  return { error, status }
}

let chain: Promise<unknown> = Promise.resolve()

function withLock<T>(fn: () => T | Promise<T>): Promise<T> {
  const run = chain.then(() => fn())
  chain = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

function createId(): string {
  return crypto.randomBytes(16).toString("base64url")
}

function demoItem(
  days: number,
  fields: Pick<Item, "id" | "name" | "person" | "category" | "notes">,
  now: Date,
): Item {
  const stamp = now.toISOString()
  return {
    ...fields,
    expiresOn: formatIso(addDays(todayStart(now), days)),
    datePrecision: "day",
    renewals: [],
    createdAt: stamp,
    updatedAt: stamp,
  }
}

function buildDemo(now = new Date()): Board {
  return {
    id: "demo",
    viewId: "demo-view",
    name: "Demo household",
    isDemo: true,
    seedVersion: DEMO_SEED,
    createdAt: now.toISOString(),
    items: [
      demoItem(-18, {
        id: "demo-mascara",
        name: "Mascara",
        person: "Mia",
        category: "makeup",
        notes: "Opened tube in the upstairs bathroom.",
      }, now),
      demoItem(-4, {
        id: "demo-smoke",
        name: "Smoke alarm batteries",
        person: "",
        category: "home",
        notes: "Hallway and upstairs landings.",
      }, now),
      demoItem(12, {
        id: "demo-registration",
        name: "Car registration",
        person: "",
        category: "registration",
        notes: "Renewal notice is on the fridge.",
      }, now),
      demoItem(26, {
        id: "demo-license",
        name: "Driver's license",
        person: "Sam",
        category: "license",
        notes: "Needs a new photo at the DMV.",
      }, now),
      demoItem(52, {
        id: "demo-inhaler",
        name: "Inhaler",
        person: "Leo",
        category: "medication",
        notes: "Rescue inhaler, kitchen drawer.",
      }, now),
      demoItem(74, {
        id: "demo-sunscreen",
        name: "Sunscreen",
        person: "Mia",
        category: "makeup",
        notes: "SPF 50 in the beach bag.",
      }, now),
      demoItem(214, {
        id: "demo-passport",
        name: "Passport",
        person: "Mia",
        category: "passport",
        notes: "Blue folder, top drawer of the desk.",
      }, now),
      demoItem(640, {
        id: "demo-warranty",
        name: "Laptop warranty",
        person: "Sam",
        category: "warranty",
        notes: "ThinkPad bought for work.",
      }, now),
    ],
  }
}

function ensureDemo(db: Database): boolean {
  const index = db.boards.findIndex((board) => board.id === "demo")
  if (index >= 0 && db.boards[index].seedVersion === DEMO_SEED) return false
  const demo = buildDemo()
  if (index >= 0) db.boards[index] = demo
  else db.boards.unshift(demo)
  return true
}

function load(): Database {
  let db: Database = { boards: [] }
  if (fs.existsSync(DATA_PATH)) {
    const raw = fs.readFileSync(DATA_PATH, "utf8")
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      throw new Error("The board file is unreadable.")
    }
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !Array.isArray((parsed as Database).boards)
    ) {
      throw new Error("The board file is unreadable.")
    }
    db = parsed as Database
  }
  if (ensureDemo(db)) write(db)
  return db
}

function write(db: Database) {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true })
  const tmp = `${DATA_PATH}.${process.pid}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2))
  fs.renameSync(tmp, DATA_PATH)
}

export function toResponse(board: Board, access: Access): BoardResponse {
  return {
    access,
    name: board.name,
    isDemo: board.isDemo,
    editId: access === "edit" ? board.id : null,
    viewId: board.viewId,
    items: board.items,
  }
}

function locate(db: Database, key: string): { board: Board; access: Access } | null {
  const byId = db.boards.find((board) => board.id === key)
  if (byId) return { board: byId, access: "edit" }
  const byView = db.boards.find((board) => board.viewId === key)
  if (byView) return { board: byView, access: "view" }
  return null
}

export function getBoard(key: string): Promise<BoardResponse | StoreError> {
  if (!isSafeId(key)) return Promise.resolve(fail("No board at this link.", 404))
  return withLock(() => {
    const db = load()
    const found = locate(db, key)
    if (!found) return fail("No board at this link.", 404)
    return toResponse(found.board, found.access)
  })
}

export function createBoard(nameInput: unknown): Promise<BoardResponse | StoreError> {
  const name = cleanLine(nameInput, 60) || "Our household"
  return withLock(() => {
    const db = load()
    const now = new Date().toISOString()
    const board: Board = {
      id: createId(),
      viewId: createId(),
      name,
      isDemo: false,
      seedVersion: 0,
      createdAt: now,
      items: [],
    }
    db.boards.push(board)
    write(db)
    return toResponse(board, "edit")
  })
}

export function addItem(key: string, body: unknown): Promise<Item | StoreError> {
  if (!isSafeId(key)) return Promise.resolve(fail("No board at this link.", 404))
  const input = parseItemInput(body)
  if (typeof input === "string") return Promise.resolve(fail(input, 400))
  return withLock(() => {
    const db = load()
    const found = locate(db, key)
    if (!found) return fail("No board at this link.", 404)
    if (found.access !== "edit") {
      return fail("This link is view only. Open the family link to add a date.", 403)
    }
    if (found.board.items.length >= ITEM_LIMIT) {
      return fail("This board is full. Remove an item before adding another.", 400)
    }
    const now = new Date()
    const item: Item = {
      ...input,
      id: createId(),
      renewals: [],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }
    found.board.items.push(item)
    write(db)
    return item
  })
}

export function updateItem(
  key: string,
  itemId: string,
  body: unknown,
): Promise<Item | StoreError> {
  if (!isSafeId(key) || !isSafeId(itemId)) {
    return Promise.resolve(fail("That item isn't on this board.", 404))
  }
  if (!body || typeof body !== "object") {
    return Promise.resolve(fail("That change couldn't be read.", 400))
  }
  const record = body as Record<string, unknown>
  return withLock(() => {
    const db = load()
    const found = locate(db, key)
    if (!found) return fail("No board at this link.", 404)
    if (found.access !== "edit") {
      return fail("This link is view only. Open the family link to change a date.", 403)
    }
    const item = found.board.items.find((entry) => entry.id === itemId)
    if (!item) return fail("That item isn't on this board.", 404)

    if (typeof record.expiresOn === "string") {
      const next = cleanLine(record.expiresOn, 10)
      if (!parseIsoDate(next)) return fail("Enter a real expiry date.", 400)
      if (next === item.expiresOn) return fail("That is already the expiry date.", 400)
      const now = new Date().toISOString()
      item.renewals.push({ at: now, from: item.expiresOn, to: next })
      item.expiresOn = next
      item.datePrecision = "day"
      item.updatedAt = now
      write(db)
      return item
    }

    if (typeof record.notes === "string") {
      item.notes = cleanLine(record.notes, 2000)
      item.updatedAt = new Date().toISOString()
      write(db)
      return item
    }

    return fail("Nothing to change.", 400)
  })
}

export function deleteItem(key: string, itemId: string): Promise<{ ok: true } | StoreError> {
  if (!isSafeId(key) || !isSafeId(itemId)) {
    return Promise.resolve(fail("That item isn't on this board.", 404))
  }
  return withLock(() => {
    const db = load()
    const found = locate(db, key)
    if (!found) return fail("No board at this link.", 404)
    if (found.access !== "edit") {
      return fail("This link is view only. Open the family link to remove an item.", 403)
    }
    const index = found.board.items.findIndex((entry) => entry.id === itemId)
    if (index < 0) return fail("That item isn't on this board.", 404)
    found.board.items.splice(index, 1)
    write(db)
    return { ok: true }
  })
}
