import { afterEach, beforeEach, describe, expect, type Mock, spyOn, test } from "bun:test"
import type { Profile, ServerMsg } from "@justmate/protocol"

import { rememberBlocks, resetBlocks } from "../src/matching/blocks"
import { partnerCard } from "../src/matching/compat"
import { cellCentre, geohash, type LatLng, offset } from "../src/matching/geo"
import {
  DATE_MATCH_ALGORITHM_VERSION,
  MATE_MATCH_ALGORITHM_VERSION,
  type MatchScoreRecord,
  type MatchStore,
  RULES_MATCH_ALGORITHM_VERSION,
} from "../src/matching/match"
import { STAGE_A } from "../src/realtime/demo"
import {
  type Client,
  clients,
  clock,
  config,
  connect,
  cooldowns,
  type Deps,
  disconnect,
  matching,
  matchScores,
  receive,
  STALE_FIX_MS,
  tick,
} from "../src/realtime/session"
import { makeProfile } from "./fixtures"

type User = { client: Client; sent: ServerMsg[]; closed: number[] }

type Of<T extends ServerMsg["t"]> = Extract<ServerMsg, { t: T }>

const ARENA = { lat: 50.0676, lng: 19.9917 }

const beer = { t: "search_on", mode: "mate", category: "food", intents: ["beer"] }

let now = 0
let info: Mock<typeof console.info>

beforeEach(() => {
  now = 1_000_000
  clock.now = () => now
  info = spyOn(console, "info").mockImplementation(() => {})
})

afterEach(() => {
  for (const client of [...clients.values()]) disconnect(client)
  cooldowns.clear()
  matchScores.clear()
  resetBlocks()
  matching.relaxed = false
  matching.mateInterest = false
  clock.now = () => Date.now()
  info.mockRestore()
})

async function join(
  id: string,
  profile = makeProfile(),
  demo?: "a" | "b",
  matching: Pick<Deps, "matchScoresFor" | "matchStore"> = {},
): Promise<User> {
  const sent: ServerMsg[] = []
  const closed: number[] = []
  const client = connect(
    { send: (msg) => sent.push(msg), close: (code) => closed.push(code) },
    { userIdForCookie: async () => id, profileFor: async () => profile, ...matching },
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

// phones keep re-sending their last fix every second, except the ones gone quiet
function advance(ms: number, quiet: User[] = []) {
  for (let elapsed = 0; elapsed < ms; elapsed += 1000) {
    now += 1000
    for (const client of clients.values())
      if (client.position && !quiet.some((user) => user.client === client))
        receive(client, { t: "position", ...client.position })
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
  test("mate matching uses its interest score instead of the date score", async () => {
    matching.mateInterest = true
    const records: MatchScoreRecord[] = [
      {
        userAId: "u_a",
        userBId: "u_b",
        mode: "date",
        scoreAToB: 0.1,
        scoreBToA: 0.1,
        score: 0.2,
        algorithmVersion: DATE_MATCH_ALGORITHM_VERSION,
        calculatedAt: new Date(now),
      },
      {
        userAId: "u_a",
        userBId: "u_b",
        mode: "mate",
        scoreAToB: 0.84,
        scoreBToA: 0.77,
        score: 0.805,
        algorithmVersion: MATE_MATCH_ALGORITHM_VERSION,
        calculatedAt: new Date(now),
      },
    ]
    const created: Parameters<MatchStore["create"]>[0][] = []
    const activated: string[] = []
    const finished: string[] = []
    const store: MatchStore = {
      create: async (record) => {
        created.push(record)
      },
      activate: async (id) => {
        activated.push(id)
      },
      finish: async (_id, state) => {
        finished.push(state)
      },
    }
    const deps = { matchScoresFor: async () => records, matchStore: store }
    const a = await join("u_a", makeProfile(), undefined, deps)
    const b = await join("u_b", makeProfile(), undefined, deps)

    await search(a, 0)
    await search(b, 50)
    tick()
    await Promise.resolve()

    expect(lastOf(a, "match_offer")?.offerId).toBeString()
    expect(created).toHaveLength(1)
    expect(created[0]?.compatibilityScore).toBe(0.805)

    const offerId = lastOf(a, "match_offer")?.offerId ?? ""
    await receive(a.client, { t: "accept", offerId })
    await receive(b.client, { t: "accept", offerId })
    const activeSession = a.client.session
    await activeSession?.persisted
    expect(activated).toEqual([offerId])

    await receive(a.client, { t: "met", sessionId: activeSession?.id ?? "" })
    await activeSession?.persisted
    expect(finished).toEqual(["met"])
  })

  test("date matching uses its match scorer score instead of the mate score", async () => {
    const records: MatchScoreRecord[] = [
      {
        userAId: "u_a",
        userBId: "u_b",
        mode: "date",
        scoreAToB: 0.42,
        scoreBToA: 0.38,
        score: 0.8,
        algorithmVersion: DATE_MATCH_ALGORITHM_VERSION,
        calculatedAt: new Date(now),
      },
      {
        userAId: "u_a",
        userBId: "u_b",
        mode: "mate",
        scoreAToB: 0.1,
        scoreBToA: 0.1,
        score: 0.1,
        algorithmVersion: MATE_MATCH_ALGORITHM_VERSION,
        calculatedAt: new Date(now),
      },
    ]
    const created: Parameters<MatchStore["create"]>[0][] = []
    const store: MatchStore = {
      create: async (record) => {
        created.push(record)
      },
      activate: async () => {},
      finish: async () => {},
    }
    const matching = { matchScoresFor: async () => records, matchStore: store }
    const a = await join("u_a", makeProfile(), undefined, matching)
    const b = await join("u_b", makeProfile(), undefined, matching)
    const wine = { t: "search_on", mode: "date", category: "food", intents: ["wine"] }

    await search(a, 0, wine)
    await search(b, 50, wine)
    tick()
    await Promise.resolve()

    expect(lastOf(a, "match_offer")?.offerId).toBeString()
    expect(created[0]?.compatibilityScore).toBe(0.8)
    expect(created[0]?.algorithmVersion).toBe(DATE_MATCH_ALGORITHM_VERSION)
  })

  test("real clients fall back to the rules-based score before their ML row exists", async () => {
    const created: Parameters<MatchStore["create"]>[0][] = []
    const store: MatchStore = {
      create: async (record) => {
        created.push(record)
      },
      activate: async () => {},
      finish: async () => {},
    }
    const matching = { matchScoresFor: async () => [], matchStore: store }
    const a = await join("u_a", makeProfile(), undefined, matching)
    const b = await join("u_b", makeProfile(), undefined, matching)

    await search(a, 0)
    await search(b, 50)
    tick()
    await Promise.resolve()

    expect(lastOf(a, "match_offer")?.offerId).toBe(lastOf(b, "match_offer")?.offerId ?? "")
    expect(created[0]?.algorithmVersion).toBe(RULES_MATCH_ALGORITHM_VERSION)
  })

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

describe("missed matches", () => {
  test("nearby searchers outside the default age range are not offered, and the log says why", async () => {
    const a = await join("u_young_a", makeProfile({ age: 22 }))
    const b = await join("u_young_b", makeProfile({ age: 23 }))
    await search(a, 0)
    await search(b, 50)
    tick()

    expect([all(a, "match_offer"), all(b, "match_offer")]).toEqual([[], []])
    expect(info).toHaveBeenCalledWith("[matching] u_young_a|u_young_b not offered: age range")
  })

  test("a score under the threshold is logged with where it came from", async () => {
    const a = await join("u_chess", makeProfile({ interests: ["chess"] }))
    const b = await join("u_climb", makeProfile({ interests: ["climbing"] }))
    await search(a, 0)
    await search(b, 50)
    tick()

    expect(all(a, "match_offer")).toEqual([])
    expect(info).toHaveBeenCalledWith(
      "[matching] u_chess|u_climb not offered: score 0.30 < 0.4 (rules)",
    )
  })

  test("a reason is logged once, not every tick", async () => {
    const a = await join("u_far_a")
    const b = await join("u_far_b")
    await search(a, 0)
    await search(b, 1000)
    advance(3000)

    expect(info.mock.calls).toEqual([["[matching] u_far_a|u_far_b not offered: beyond 800 m"]])
  })

  test("a searcher without an accepted position is logged", async () => {
    const a = await join("u_blind")
    await receive(a.client, beer)
    tick()

    expect(info).toHaveBeenCalledWith("[matching] u_blind not offered: no position")
  })
})

describe("stale positions", () => {
  async function awayAndHere() {
    const away = await join("u_away")
    const here = await join("u_here")
    await search(away, 0)
    advance(STALE_FIX_MS + 1000, [away])
    await search(here, 150)
    tick()
    return { away, here }
  }

  test("a searcher who stopped reporting is not offered, and the log says why", async () => {
    const { away, here } = await awayAndHere()

    expect([all(away, "match_offer"), all(here, "match_offer")]).toEqual([[], []])
    expect(info).toHaveBeenCalledWith("[matching] u_away not offered: stale position")
  })

  test("their next fix makes them matchable again at once", async () => {
    const { away, here } = await awayAndHere()
    await move(away, offset(ARENA, 90, 0))
    tick()

    expect([all(away, "match_offer").length, all(here, "match_offer").length]).toEqual([1, 1])
  })

  test("an open offer ends when one side goes stale, without a cooldown for the pair", async () => {
    const { a, b, offerId } = await pair()
    advance(STALE_FIX_MS, [a])
    expect(all(b, "offer_expired")).toEqual([])

    advance(1000, [a])
    expect([lastOf(a, "offer_expired"), lastOf(b, "offer_expired")]).toEqual([
      { t: "offer_expired", offerId },
      { t: "offer_expired", offerId },
    ])
    expect(cooldowns.size).toBe(0)

    await move(a, offset(ARENA, 90, 0))
    tick()
    expect(all(b, "match_offer").length).toBe(2)
  })

  test("a session outlives a partner who stopped reporting", async () => {
    const { a, b } = await session()
    advance(STALE_FIX_MS * 2, [a])

    expect(all(b, "session_end")).toEqual([])
    expect(lastOf(b, "partner_position")?.bucket).toBeDefined()
  })
})

describe("relaxed matching", () => {
  beforeEach(() => {
    matching.relaxed = true
  })

  test("same-mode searchers who share nothing else are offered 5 km apart", async () => {
    const mate = { ...makeProfile().mate, who: "same gender" as const }
    const young = makeProfile({ age: 19, gender: "man", interests: ["chess"] })
    const a = await join("u_young", young)
    const b = await join("u_older", makeProfile({ age: 50, interests: ["climbing"], mate }))
    await search(a, 0)
    await search(b, 5000, { ...beer, category: "games", intents: ["chess"] })
    tick()

    expect(lastOf(b, "match_offer")).toEqual({
      t: "match_offer",
      offerId: expect.any(String),
      sharedIntent: "beer",
      partner: partnerCard(young),
      expiresInMs: config.offerTtlMs,
    })
    expect(lastOf(a, "match_offer")?.sharedIntent).toBe("beer")
  })

  test("a dismissed pair is offered again after 30 s", async () => {
    const { a, offerId } = await pair()
    await receive(a.client, { t: "dismiss", offerId })
    advance(29_000)
    expect(all(a, "match_offer").length).toBe(1)

    advance(1000)
    expect(all(a, "match_offer").length).toBe(2)
  })

  test("a minor never searches in date mode, nor meets an adult", async () => {
    const minor = await join("u_minor", makeProfile({ age: 16, adult: false }))
    const adult = await join("u_adult")
    await receive(minor.client, { ...beer, mode: "date" })
    expect(lastOf(minor, "error")?.code).toBe("adult_required")

    await search(minor, 0)
    await search(adult, 50)
    tick()

    expect([all(minor, "match_offer"), all(adult, "match_offer")]).toEqual([[], []])
    expect(info).toHaveBeenCalledWith("[matching] u_adult|u_minor not offered: adult")
  })

  test("a blocked pair is never offered", async () => {
    rememberBlocks([{ blockerId: "u_a", blockedId: "u_b" }])
    const { a } = await pair()

    expect(all(a, "match_offer")).toEqual([])
    expect(info).toHaveBeenCalledWith("[matching] u_a|u_b not offered: blocked")
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
      now += 20_000
      await move(b, offset(ARENA, 90, meters))
      tick()
      buckets.push(lastOf(a, "partner_position")?.bucket)
    }
    expect(buckets).toEqual(["cold", "warm", "hot", "burning"])
  })

  test("a cold partner's bearing points at their geohash-7 cell, in steps of 10°", async () => {
    const { a, b } = await session(150)
    const cell = cellCentre(offset(ARENA, 90, 700), 7)
    const bearings = []
    for (const at of [offset(cell, 0, 70), offset(cell, 180, 70)]) {
      now += 60_000
      await move(b, at)
      tick()
      bearings.push(lastOf(a, "partner_position")?.bearing)
    }
    expect(lastOf(a, "partner_position")?.bucket).toBe("cold")
    expect(bearings[0]).toBe(bearings[1] ?? -1)
    expect((bearings[0] ?? 1) % 10).toBe(0)
  })

  test("a bucket measures to the partner's geohash-8 cell, so its edge can't pin them", async () => {
    const { a, b } = await session(150)
    const centre = cellCentre(offset(ARENA, 90, 100), 8)
    now += 60_000
    await move(a, offset(centre, 270, 32))
    const buckets = []
    for (const at of [offset(centre, 270, 5), offset(centre, 90, 5)]) {
      now += 60_000
      await move(b, at)
      tick()
      buckets.push(lastOf(a, "partner_position")?.bucket)
    }
    expect(buckets).toEqual(["hot", "hot"])
  })

  test("met from one side ends it as met for both and ends both searches", async () => {
    const { a, b, sessionId } = await session()
    await receive(b.client, { t: "met", sessionId })
    await receive(b.client, { t: "met", sessionId })

    expect(all(a, "session_end")).toEqual([{ t: "session_end", sessionId, reason: "met" }])
    expect(all(b, "session_end")).toEqual([{ t: "session_end", sessionId, reason: "met" }])
    expect([a.client.search, b.client.position, a.client.autoStop]).toEqual([
      undefined,
      undefined,
      undefined,
    ])

    tick()
    expect(all(a, "partner_position").length).toBe(0)
  })

  test("met unlocks the partner's first name only once the compass reached burning", async () => {
    const { a, b, sessionId } = await session(10)
    tick()
    expect(lastOf(a, "partner_position")?.bucket).toBe("burning")

    now += 60_000
    await move(b, offset(ARENA, 90, 150))
    tick()
    await receive(a.client, { t: "met", sessionId })
    expect([lastOf(a, "session_end"), lastOf(b, "session_end")]).toEqual([
      { t: "session_end", sessionId, reason: "met", partnerName: "Alex" },
      { t: "session_end", sessionId, reason: "met", partnerName: "Alex" },
    ])
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

  test("a fix faster than 10 m/s from the last kept one is refused", async () => {
    const a = await join("u_a")
    await search(a, 0)
    now += 2000
    await move(a, offset(ARENA, 90, 5000))
    expect(lastOf(a, "error")?.code).toBe("position_too_fast")
    expect(a.client.position?.lng).toBeCloseTo(ARENA.lng)

    now += 2000
    await move(a, offset(ARENA, 90, 15))
    expect(a.client.position?.lng).toBeGreaterThan(ARENA.lng)
  })

  test("indoor jitter within both fixes' accuracy is kept, a spoofed accuracy is not", async () => {
    const a = await join("u_a")
    await receive(a.client, beer)
    await receive(a.client, { t: "position", ...ARENA, acc: 40 })
    now += 4000
    await receive(a.client, { t: "position", ...offset(ARENA, 90, 60), acc: 40 })
    expect(all(a, "error")).toEqual([])
    expect(a.client.position?.lng).toBeGreaterThan(ARENA.lng)

    now += 1000
    await receive(a.client, { t: "position", ...offset(ARENA, 90, 5000), acc: 9000 })
    expect(lastOf(a, "error")?.code).toBe("position_too_fast")
  })

  test("accuracy slack accrues with time, so quick fixes can't stack it into a fast walk", async () => {
    const a = await join("u_a")
    await receive(a.client, beer)
    await receive(a.client, { t: "position", ...ARENA, acc: 50 })
    for (let step = 1; step <= 5; step++) {
      now += 1000
      await receive(a.client, { t: "position", ...offset(ARENA, 90, 50 * step), acc: 50 })
    }
    expect(lastOf(a, "error")?.code).toBe("position_too_fast")
    expect(a.client.position?.lng).toBeCloseTo(ARENA.lng, 6)
  })

  test("a standing phone's jitter and a walker are never refused", async () => {
    const a = await join("u_a")
    await receive(a.client, beer)
    for (let second = 0; second < 10; second++) {
      now += 1000
      const jitter = offset(ARENA, second % 2 ? 0 : 180, 8)
      await receive(a.client, { t: "position", ...jitter, acc: 10 })
    }
    for (let second = 1; second <= 10; second++) {
      now += 1000
      await receive(a.client, { t: "position", ...offset(ARENA, 90, 1.5 * second), acc: 10 })
    }
    expect(all(a, "error")).toEqual([])
    expect(a.client.position?.lng).toBeGreaterThan(ARENA.lng)
  })

  test("fixes sent faster than the interval are dropped", async () => {
    const a = await join("u_a")
    await search(a, 0)
    now += 200
    await move(a, offset(ARENA, 90, 1))
    expect(a.client.position?.lng).toBeCloseTo(ARENA.lng, 6)
    expect(all(a, "error")).toEqual([])
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
  test("demo sockets of different accounts are never paired", async () => {
    const a = await join("u_one", makeProfile(), "a")
    const b = await join("u_two", makeProfile(), "b")
    await receive(a.client, beer)
    await receive(b.client, beer)
    tick()
    expect([all(a, "match_offer"), all(b, "match_offer")]).toEqual([[], []])
  })

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
    expect([lastOf(a, "session_end")?.partnerName, lastOf(b, "session_end")?.partnerName]).toEqual([
      "Ola",
      "Tomek",
    ])
  })
})
