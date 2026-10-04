import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import type { Profile, ServerMsg } from "@justmate/protocol"

import { partnerCard } from "../src/matching/compat"
import { geohash, type LatLng, offset } from "../src/matching/geo"
import { STAGE_A } from "../src/realtime/demo"
import {
  type Client,
  clients,
  clock,
  config,
  connect,
  cooldowns,
  disconnect,
  receive,
  tick,
} from "../src/realtime/session"
import { makeProfile } from "./fixtures"

type User = { client: Client; sent: ServerMsg[]; closed: number[] }

type Of<T extends ServerMsg["t"]> = Extract<ServerMsg, { t: T }>

const ARENA = { lat: 50.0676, lng: 19.9917 }

const beer = { t: "search_on", mode: "mate", category: "food", intents: ["beer"] }

let now = 0

beforeEach(() => {
  now = 1_000_000
  clock.now = () => now
})

afterEach(() => {
  for (const client of [...clients.values()]) disconnect(client)
  cooldowns.clear()
  clock.now = () => Date.now()
})

async function join(id: string, profile = makeProfile(), demo?: "a" | "b"): Promise<User> {
  const sent: ServerMsg[] = []
  const closed: number[] = []
  const client = connect(
    { send: (msg) => sent.push(msg), close: (code) => closed.push(code) },
    { userIdForCookie: async () => id, profileFor: async () => profile },
    demo,
  )
  await receive(client, { t: "hello", sessionCookie: id })
  return { client, sent, closed }
}

async function search(user: User, metersEast: number, msg: object = beer) {
  await receive(user.client, msg)
  await move(user, offset(ARENA, 90, metersEast))
}

function move(user: User, at: LatLng) {
  return receive(user.client, { t: "position", ...at, acc: 5 })
}

function advance(ms: number) {
  for (let elapsed = 0; elapsed < ms; elapsed += 1000) {
    now += 1000
    tick()
  }
}

function all<T extends ServerMsg["t"]>(user: User, t: T): Of<T>[] {
  return user.sent.filter((msg): msg is Of<T> => msg.t === t)
}

function lastOf<T extends ServerMsg["t"]>(user: User, t: T): Of<T> | undefined {
  return all(user, t).at(-1)
}

async function pair(metersApart = 150) {
  const a = await join("u_a")
  const b = await join("u_b")
  await search(a, 0)
  await search(b, metersApart)
  tick()
  return { a, b, offerId: lastOf(a, "match_offer")?.offerId ?? "" }
}

async function session(metersApart = 150) {
  const { a, b, offerId } = await pair(metersApart)
  await receive(a.client, { t: "accept", offerId })
  await receive(b.client, { t: "accept", offerId })
  return { a, b, sessionId: lastOf(a, "session_start")?.sessionId ?? "" }
}

describe("pairing", () => {
  test("two compatible searchers in range get the same offer in the same tick", async () => {
    const { a, b } = await pair(300)
    const offerA = lastOf(a, "match_offer")
    const offerB = lastOf(b, "match_offer")

    expect(offerA).toEqual({
      t: "match_offer",
      offerId: offerB?.offerId ?? "",
      sharedIntent: "beer",
      partner: partnerCard(b.client.profile as Profile),
      expiresInMs: config.offerTtlMs,
    })
    expect(offerB?.partner).toEqual(partnerCard(a.client.profile as Profile))
  })

  test("the match radius is the shorter of both walks", async () => {
    const a = await join("u_a")
    const b = await join("u_b")
    await search(a, 0, { ...beer, walkMin: 5 })
    await search(b, 500, { ...beer, walkMin: 15 })
    tick()
    expect(all(a, "match_offer")).toEqual([])
  })

  test("profile rules gate the loop: an adult is never offered a non-adult", async () => {
    const wide = { ...makeProfile().mate, ageMin: 16, ageMax: 99 }
    const a = await join("u_a", makeProfile({ mate: wide }))
    const b = await join("u_b", makeProfile({ mate: wide, age: 16, adult: false }))
    await search(a, 0)
    await search(b, 50)
    tick()
    expect([all(a, "match_offer"), all(b, "match_offer")]).toEqual([[], []])
  })

  test("the shared intent is the first in the category's order", async () => {
    const a = await join("u_a")
    const b = await join("u_b")
    await search(a, 0, { ...beer, intents: ["other", "pizza", "coffee"] })
    await search(b, 50, { ...beer, intents: ["pizza", "other", "coffee"] })
    tick()
    expect([
      lastOf(a, "match_offer")?.sharedIntent,
      lastOf(b, "match_offer")?.sharedIntent,
    ]).toEqual(["coffee", "coffee"])
  })

  test("the best score wins and nobody holds two offers", async () => {
    const a = await join("u_a")
    const b = await join("u_b", makeProfile({ interests: ["coffee", "wine", "cinema", "dogs"] }))
    const c = await join("u_c")
    await search(a, 0)
    await search(b, 20)
    await search(c, 40)
    tick()
    tick()

    expect(lastOf(a, "match_offer")?.offerId).toBe(lastOf(c, "match_offer")?.offerId ?? "")
    expect([all(a, "match_offer").length, all(b, "match_offer")]).toEqual([1, []])
  })

  test("a dismissed pair is not offered again until the cooldown ends", async () => {
    const { a, offerId } = await pair()
    await receive(a.client, { t: "dismiss", offerId })
    advance(config.pairCooldownMs - 1000)
    expect(all(a, "match_offer").length).toBe(1)

    advance(1000)
    expect(all(a, "match_offer").length).toBe(2)
  })
})

describe("offers", () => {
  test("accepted by both, the session starts for both", async () => {
    const { a, b, offerId } = await pair()
    await receive(a.client, { t: "accept", offerId })
    await receive(a.client, { t: "accept", offerId })
    expect(all(a, "session_start")).toEqual([])

    await receive(b.client, { t: "accept", offerId })
    const start = lastOf(a, "session_start")
    expect(start).toEqual({
      t: "session_start",
      sessionId: expect.any(String),
      expiresInMs: config.sessionTtlMs,
    })
    expect(lastOf(b, "session_start")).toEqual(start as Of<"session_start">)
  })

  test("a dismiss reaches both sides as a plain expiry and both keep searching", async () => {
    const { a, b, offerId } = await pair()
    const seen = b.sent.length
    await receive(b.client, { t: "dismiss", offerId })

    expect(a.sent.at(-1)).toEqual({ t: "offer_expired", offerId })
    expect(b.sent.slice(seen)).toEqual([{ t: "offer_expired", offerId }])
    expect([a.client.search?.mode, b.client.search?.mode]).toEqual(["mate", "mate"])
  })

  test("an unanswered offer expires after offerTtlMs, even if one side accepted", async () => {
    const { a, b, offerId } = await pair()
    await receive(a.client, { t: "accept", offerId })
    advance(config.offerTtlMs - 1000)
    expect(all(b, "offer_expired")).toEqual([])

    advance(1000)
    expect([lastOf(a, "offer_expired"), lastOf(b, "offer_expired")]).toEqual([
      { t: "offer_expired", offerId },
      { t: "offer_expired", offerId },
    ])
    await receive(b.client, { t: "accept", offerId })
    expect(all(b, "session_start")).toEqual([])
  })

  test("search_off expires the offer for the other side", async () => {
    const { a, b, offerId } = await pair()
    await receive(a.client, { t: "search_off" })
    expect(b.sent.at(-1)).toEqual({ t: "offer_expired", offerId })
  })

  test("a disconnect expires the offer for the other side", async () => {
    const { a, b, offerId } = await pair()
    disconnect(b.client)
    expect(a.sent.at(-1)).toEqual({ t: "offer_expired", offerId })
  })

  test("an accept for another offer is ignored", async () => {
    const { a, b, offerId } = await pair()
    await receive(a.client, { t: "accept", offerId: "o_nope" })
    await receive(b.client, { t: "accept", offerId })
    expect(all(a, "session_start")).toEqual([])
  })
})

describe("sessions", () => {
  test("partner_position carries bearing and bucket, never coordinates", async () => {
    const { a, b, sessionId } = await session(150)
    tick()

    expect(lastOf(a, "partner_position")).toEqual({
      t: "partner_position",
      sessionId,
      bearing: 90,
      bucket: "warm",
    })
    expect(lastOf(b, "partner_position")?.bearing).toBe(270)
    expect(JSON.stringify(all(a, "partner_position"))).not.toMatch(/lat|lng|distance/)
  })

  test("buckets follow the config thresholds as the partner closes in", async () => {
    const { a, b } = await session(300)
    const buckets = []
    for (const meters of [300, 150, 50, 10]) {
      await move(b, offset(ARENA, 90, meters))
      tick()
      buckets.push(lastOf(a, "partner_position")?.bucket)
    }
    expect(buckets).toEqual(["cold", "warm", "hot", "burning"])
  })

  test("met from one side ends it as met for both and ends both searches", async () => {
    const { a, b, sessionId } = await session()
    await receive(b.client, { t: "met", sessionId })
    await receive(b.client, { t: "met", sessionId })

    expect(all(a, "session_end")).toEqual([
      { t: "session_end", sessionId, reason: "met", partnerName: "Alex" },
    ])
    expect(all(b, "session_end")).toEqual([
      { t: "session_end", sessionId, reason: "met", partnerName: "Alex" },
    ])
    expect([a.client.search, b.client.position, a.client.autoStop]).toEqual([
      undefined,
      undefined,
      undefined,
    ])

    tick()
    expect(all(a, "partner_position").length).toBe(0)
  })

  test("vanish ends it as vanished for both", async () => {
    const { a, b, sessionId } = await session()
    await receive(a.client, { t: "vanish", sessionId })
    expect([lastOf(a, "session_end")?.reason, lastOf(b, "session_end")?.reason]).toEqual([
      "vanished",
      "vanished",
    ])
  })

  test("the session expires after sessionTtlMs", async () => {
    const { a, b } = await session()
    advance(config.sessionTtlMs - 1000)
    expect(all(a, "session_end")).toEqual([])

    advance(1000)
    expect([lastOf(a, "session_end")?.reason, lastOf(b, "session_end")?.reason]).toEqual([
      "expired",
      "expired",
    ])
  })

  test("a disconnect ends it as disconnected for the partner", async () => {
    const { a, b } = await session()
    disconnect(b.client)
    expect(lastOf(a, "session_end")?.reason).toBe("disconnected")
    expect(a.client.session).toBeUndefined()
  })

  test("a finished pair is in cooldown", async () => {
    const { a, b, sessionId } = await session()
    await receive(a.client, { t: "vanish", sessionId })
    await search(a, 0)
    await search(b, 150)
    tick()
    expect(all(a, "match_offer").length).toBe(1)
  })
})

describe("zones", () => {
  const spot = offset(ARENA, 0, 300)

  async function crowd(count: number, profile = makeProfile(), msg: object = beer) {
    for (let i = 0; i < count; i++) {
      const user = await join(`u_crowd${i}`, profile)
      await receive(user.client, msg)
      await move(user, spot)
    }
  }

  test("cells with fewer than k compatible searchers stay hidden; the recipient never counts", async () => {
    const me = await join("u_me")
    await search(me, 0)
    await crowd(config.kAnonymity - 1)
    tick()
    expect(lastOf(me, "zones")).toEqual({ t: "zones", cells: [] })

    await crowd(config.kAnonymity)
    advance(config.positionIntervalMs)
    expect(lastOf(me, "zones")?.cells).toEqual([
      { h: geohash(spot, config.zonePrecision), n: config.kAnonymity },
    ])
  })

  test("only searchers the recipient could be offered count", async () => {
    const me = await join("u_me")
    await search(me, 0)
    await crowd(3, makeProfile(), { ...beer, category: "games", intents: ["chess"] })
    await crowd(3, makeProfile({ age: 17, adult: false }))
    tick()
    expect(lastOf(me, "zones")?.cells).toEqual([])
  })

  test("zones go out once per positionIntervalMs, not to anyone in a session", async () => {
    const { a } = await session()
    const before = all(a, "zones").length
    const loner = await join("u_loner")
    await search(loner, 0)
    advance(10_000)

    expect(all(a, "zones").length).toBe(before)
    expect(all(loner, "zones").length).toBe(1 + 10_000 / config.positionIntervalMs)
  })
})

describe("positions", () => {
  test("an invalid position is a non-fatal error", async () => {
    const a = await join("u_a")
    await search(a, 0)
    await receive(a.client, { t: "position", lat: 91, lng: 0, acc: 5 })
    await receive(a.client, { t: "position", lat: "50", lng: 0, acc: 5 })
    expect(all(a, "error").map((e) => e.code)).toEqual(["invalid_position", "invalid_position"])
    expect(a.client.position?.lat).toBeCloseTo(ARENA.lat)
  })

  test("a newer hello closes the older socket for the same user", async () => {
    const first = await join("u_a")
    const second = await join("u_a")
    expect([first.closed, second.closed]).toEqual([[1000], []])
    expect(clients.get("u_a")).toBe(second.client)

    disconnect(first.client)
    expect(clients.get("u_a")).toBe(second.client)
  })
})

describe("demo", () => {
  test("the demo pair runs the whole happy path on the scripted track", async () => {
    const a = await join("u_demo", makeProfile(), "a")
    const b = await join("u_demo", makeProfile(), "b")
    const bystander = await join("u_real")
    expect(lastOf(a, "ready")?.config.demo).toBe(true)
    expect(lastOf(bystander, "ready")?.config.demo).toBe(false)

    await receive(a.client, beer)
    await receive(b.client, beer)
    await receive(bystander.client, beer)
    await move(bystander, STAGE_A)
    await move(a, ARENA)
    tick()

    const offerId = lastOf(a, "match_offer")?.offerId ?? ""
    expect(lastOf(b, "match_offer")?.offerId).toBe(offerId)
    expect(all(bystander, "match_offer")).toEqual([])
    expect(a.client.position).toMatchObject(STAGE_A)

    const ghosts = lastOf(a, "zones")?.cells.reduce((sum, cell) => sum + cell.n, 0)
    expect(ghosts).toBe(10)

    await receive(a.client, { t: "accept", offerId })
    await receive(b.client, { t: "accept", offerId })
    const sessionId = lastOf(b, "session_start")?.sessionId ?? ""
    advance(40_000)

    const relay = all(a, "partner_position")
    const dwell = Object.groupBy(relay, (msg) => msg.bucket)
    expect(Object.keys(dwell)).toEqual(["cold", "warm", "hot", "burning"])
    for (const seen of Object.values(dwell)) expect(seen?.length).toBeGreaterThanOrEqual(5)
    expect(relay.at(-1)?.distanceM).toBe(2)

    const heading = new Set(relay.map((msg) => msg.bearing))
    const back = lastOf(b, "partner_position")?.bearing ?? 0
    expect(heading.size).toBe(1)
    expect(Math.abs(((back - (relay[0]?.bearing ?? 0) + 360) % 360) - 180)).toBeLessThanOrEqual(1)

    await receive(b.client, { t: "met", sessionId })
    expect([lastOf(a, "session_end")?.reason, lastOf(b, "session_end")?.reason]).toEqual([
      "met",
      "met",
    ])
  })
})
