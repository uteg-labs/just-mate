import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import type { Profile, ServerMsg } from "@justmate/protocol"

import { type BlockRow, type BlockStore, resetBlocks } from "../src/matching/blocks"
import { offset } from "../src/matching/geo"
import { anchors, resetPlans } from "../src/plans/plans"
import { setVenues } from "../src/plans/venues"
import {
  type Client,
  clients,
  clock,
  connect,
  cooldowns,
  disconnect,
  pastSessions,
  receive,
  tick,
} from "../src/realtime/session"
import { makeProfile } from "./fixtures"
import { KRAKOW_VENUES } from "./venues"

type User = { client: Client; sent: ServerMsg[] }

type Of<T extends ServerMsg["t"]> = Extract<ServerMsg, { t: T }>

type MemoryBlocks = BlockStore & { rows: BlockRow[]; paused: string[] }

// Monday 5 Oct 2026, 10:00 in Kraków
const MONDAY_10 = Date.UTC(2026, 9, 5, 8, 0)
const MONDAY_17 = "2026-10-05T15:00:00.000Z"

const RYNEK = { lat: 50.0617, lng: 19.9373 }
const ARENA = { lat: 50.0676, lng: 19.9917 }

const beer = { t: "search_on", mode: "mate", category: "food", intents: ["beer"] }

let now = 0
let store: MemoryBlocks

beforeEach(() => {
  resetPlans()
  setVenues(KRAKOW_VENUES)
  now = MONDAY_10
  clock.now = () => now
  store = memoryBlocks()
})

afterEach(() => {
  for (const client of [...clients.values()]) disconnect(client)
  cooldowns.clear()
  pastSessions.clear()
  resetBlocks()
  resetPlans()
  clock.now = () => Date.now()
})

function memoryBlocks(rows: BlockRow[] = []): MemoryBlocks {
  const paused: string[] = []
  return {
    rows,
    paused,
    forUser: async (id) => rows.filter((r) => r.blockerId === id || r.blockedId === id),
    sessionPair: async () => undefined,
    add: async ({ blockerId, blockedId }) => {
      if (!rows.some((r) => r.blockerId === blockerId && r.blockedId === blockedId))
        rows.push({ blockerId, blockedId })
      return {
        blockedCount: rows.filter((r) => r.blockerId === blockerId).length,
        reporters: rows.filter((r) => r.blockedId === blockedId).length,
      }
    },
    pause: async (id) => void paused.push(id),
  }
}

async function join(id: string, profile: Profile = makeProfile()): Promise<User> {
  const sent: ServerMsg[] = []
  const client = connect(
    { send: (msg) => sent.push(msg), close: () => {} },
    { userIdForCookie: async () => id, profileFor: async () => profile, blockStore: store },
  )
  await receive(client, { t: "hello", sessionCookie: id })
  return { client, sent }
}

function all<T extends ServerMsg["t"]>(user: User, t: T): Of<T>[] {
  return user.sent.filter((msg): msg is Of<T> => msg.t === t)
}

function lastOf<T extends ServerMsg["t"]>(user: User, t: T): Of<T> | undefined {
  return all(user, t).at(-1)
}

async function search(user: User, metersEast: number) {
  await receive(user.client, beer)
  await receive(user.client, { t: "position", ...offset(ARENA, 90, metersEast), acc: 5 })
}

async function session(a: User, b: User) {
  await search(a, 0)
  await search(b, 100)
  tick()
  const offerId = lastOf(a, "match_offer")?.offerId ?? ""
  await receive(a.client, { t: "accept", offerId })
  await receive(b.client, { t: "accept", offerId })
  return lastOf(a, "session_start")?.sessionId ?? ""
}

describe("report", () => {
  test("ends a running session as a plain vanish and acks only the reporter", async () => {
    const a = await join("u_a")
    const b = await join("u_b")
    const sessionId = await session(a, b)

    await receive(a.client, { t: "report", sessionId, reason: "unsafe" })

    expect([lastOf(a, "session_end")?.reason, lastOf(b, "session_end")?.reason]).toEqual([
      "vanished",
      "vanished",
    ])
    expect(lastOf(a, "reported")).toEqual({ t: "reported", sessionId, blockedCount: 1 })
    expect(all(b, "reported")).toEqual([])
    expect(store.rows).toEqual([{ blockerId: "u_a", blockedId: "u_b" }])
  })

  test("works from post-meet, after the session ended", async () => {
    const a = await join("u_a")
    const b = await join("u_b")
    const sessionId = await session(a, b)
    await receive(b.client, { t: "met", sessionId })

    await receive(a.client, { t: "report", sessionId })
    expect(lastOf(a, "reported")?.sessionId).toBe(sessionId)
  })

  test("a session you weren't in is rejected", async () => {
    const a = await join("u_a")
    const b = await join("u_b")
    const c = await join("u_c")
    const sessionId = await session(a, b)

    await receive(c.client, { t: "report", sessionId })
    await receive(c.client, { t: "report", sessionId: "s_nope" })
    await receive(c.client, { t: "report", sessionId, reason: "rude" })

    expect(all(c, "error").map((e) => e.code)).toEqual([
      "invalid_session",
      "invalid_session",
      "invalid_reason",
    ])
    expect([all(c, "reported"), store.rows, a.client.session?.id]).toEqual([[], [], sessionId])
  })

  test("the second different reporter pauses the reported user", async () => {
    const a = await join("u_a")
    const b = await join("u_b")
    const c = await join("u_c")
    const x = await join("u_x")

    await receive(a.client, { t: "report", sessionId: await session(a, x) })
    await receive(a.client, { t: "report", sessionId: lastOf(a, "reported")?.sessionId ?? "" })
    expect([store.paused, x.client.dangerous]).toEqual([[], false])

    await receive(b.client, { t: "report", sessionId: await session(b, x) })
    expect([store.paused, x.client.dangerous]).toEqual([["u_x"], true])

    await search(c, 0)
    await search(x, 100)
    tick()
    expect([all(c, "match_offer"), all(x, "match_offer").length]).toEqual([[], 2])
  })
})

describe("blocked pairs", () => {
  test("are never paired, whoever blocked whom", async () => {
    store.rows.push({ blockerId: "u_b", blockedId: "u_a" })
    const a = await join("u_a")
    const b = await join("u_b")
    expect(lastOf(b, "ready")?.blockedCount).toBe(1)
    expect(lastOf(a, "ready")?.blockedCount).toBe(0)

    await search(a, 0)
    await search(b, 100)
    tick()
    expect([all(a, "match_offer"), all(b, "match_offer")]).toEqual([[], []])
  })

  test("are never matched again after a report, even past the cooldown", async () => {
    const a = await join("u_a")
    const b = await join("u_b")
    await receive(b.client, { t: "report", sessionId: await session(a, b) })

    now += 3_600_000
    await search(a, 0)
    await search(b, 100)
    tick()
    expect(all(a, "match_offer").length).toBe(1)
  })

  test("are never proposed a plan", async () => {
    store.rows.push({ blockerId: "u_a", blockedId: "u_b" })
    const a = await join("u_a", wineLover())
    const b = await join("u_b", wineLover())
    await receive(a.client, { t: "plans_get", ...RYNEK })
    await receive(b.client, { t: "plans_get", ...RYNEK })
    expect([all(a, "plan_update"), all(b, "plan_update")]).toEqual([[], []])
  })

  test("are never offered each other's invitations", async () => {
    store.rows.push({ blockerId: "u_b", blockedId: "u_a" })
    const a = await join("u_a", wineLover())
    const b = await join("u_b", wineLover())
    const c = await join("u_c", wineLover({ interests: ["wine", "cinema", "cooking", "art"] }))
    for (const id of ["u_a", "u_b", "u_c"]) anchors.set(id, RYNEK)

    await receive(a.client, {
      t: "plan_invite",
      mode: "date",
      category: "food",
      intents: ["wine"],
      slots: [MONDAY_17],
      flex: false,
      venueId: "dvor",
      until: "2h",
    })
    expect(all(b, "plan_update")).toEqual([])
    expect(lastOf(c, "plan_update")?.plan.state).toBe("offered")
  })

  test("lose the plans they had together", async () => {
    const a = await join("u_a", wineLover())
    const b = await join("u_b", wineLover())
    await receive(a.client, { t: "plans_get", ...RYNEK })
    await receive(b.client, { t: "plans_get", ...RYNEK })
    const planId = lastOf(a, "plan_update")?.plan.id ?? ""
    await receive(a.client, { t: "plan_accept", planId })
    await receive(b.client, { t: "plan_accept", planId })

    now = Date.parse(lastOf(a, "plan_update")?.plan.startsAt ?? "")
    await receive(a.client, { t: "plan_go", planId })
    await receive(b.client, { t: "plan_go", planId })
    await receive(b.client, { t: "report", sessionId: lastOf(b, "session_start")?.sessionId ?? "" })

    expect(lastOf(a, "plan_removed")).toEqual({ t: "plan_removed", planId, reason: "cancelled" })
    expect(lastOf(b, "reported")?.blockedCount).toBe(1)
  })
})

function wineLover(overrides: Partial<Profile> = {}): Profile {
  return makeProfile({ interests: ["wine", "cinema", "books", "travel"], ...overrides })
}
