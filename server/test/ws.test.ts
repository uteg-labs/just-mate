import { describe, expect, test } from "bun:test"
import { CloseCode, type ServerMsg } from "@justmate/protocol"

import { compat } from "../src/matching/compat"
import { bearing, bucketFor, distanceM } from "../src/matching/geo"
import { type Client, connect, receive } from "../src/realtime/session"

function fakeClient() {
  const sent: ServerMsg[] = []
  const closed: number[] = []
  const client = connect(
    { send: (msg) => sent.push(msg), close: (code) => closed.push(code) },
    undefined,
    async (cookie) => (cookie === "session=test" ? "u_test" : undefined),
  )
  return { client, sent, closed }
}

function hello(client: Client) {
  return receive(client, {
    t: "hello",
    sessionCookie: "session=test",
    interests: ["rock", "hiking", "food", "dogs"],
    adult: true,
  })
}

describe("hello", () => {
  test("an invalid session closes with 4004", async () => {
    const { client, closed } = fakeClient()
    await receive(client, {
      t: "hello",
      sessionCookie: "session=invalid",
      interests: ["rock", "hiking", "food"],
      adult: true,
    })
    expect(closed).toEqual([CloseCode.Unauthorized])
  })

  test("a valid profile gets ready with the config", async () => {
    const { client, sent } = fakeClient()
    await hello(client)
    expect(sent[0]).toMatchObject({ t: "ready", userId: client.id, config: { matchRadiusM: 400 } })
  })

  test("adult not true closes with 4001", async () => {
    const { client, closed } = fakeClient()
    await receive(client, {
      t: "hello",
      sessionCookie: "session=test",
      interests: ["rock", "hiking", "food"],
      adult: false,
    })
    expect(closed).toEqual([CloseCode.AdultRequired])
  })

  test("fewer than 3 known interests closes with 4002", async () => {
    const { client, closed } = fakeClient()
    await receive(client, {
      t: "hello",
      sessionCookie: "session=test",
      interests: ["rock", "rock", "knitting"],
      adult: true,
    })
    expect(closed).toEqual([CloseCode.InvalidProfile])
  })

  test("any frame before hello closes with 4003", async () => {
    const { client, closed } = fakeClient()
    await receive(client, { t: "search_on", intents: ["beer"] })
    expect(closed).toEqual([CloseCode.ProtocolViolation])
  })

  test("unknown frames are ignored", async () => {
    const { client, sent, closed } = fakeClient()
    await receive(client, '{"t":"nope"}')
    await receive(client, "not json")
    expect([sent, closed]).toEqual([[], []])
  })
})

describe("search", () => {
  test("search_on with known intents makes the client searching", async () => {
    const { client } = fakeClient()
    await hello(client)
    await receive(client, { t: "search_on", intents: ["beer"] })
    expect(client).toMatchObject({ searching: true, intents: ["beer"] })
  })

  test("search_on again replaces the intents", async () => {
    const { client } = fakeClient()
    await hello(client)
    await receive(client, { t: "search_on", intents: ["beer"] })
    await receive(client, { t: "search_on", intents: ["coffee", "friends"] })
    expect(client.intents).toEqual(["coffee", "friends"])
  })

  test("unknown or too many intents are rejected", async () => {
    const { client, sent } = fakeClient()
    await hello(client)
    await receive(client, { t: "search_on", intents: ["attractions"] })
    await receive(client, { t: "search_on", intents: ["beer", "coffee", "date"] })
    expect(sent.slice(1).map((m) => m.t === "error" && m.code)).toEqual([
      "invalid_intents",
      "invalid_intents",
    ])
    expect(client.searching).toBe(false)
  })

  test("position before search_on is a non-fatal error", async () => {
    const { client, sent, closed } = fakeClient()
    await hello(client)
    await receive(client, { t: "position", lat: 50, lng: 19, acc: 5 })
    expect(sent.at(-1)).toMatchObject({ t: "error", code: "position_before_search_on" })
    expect(closed).toEqual([])
  })
})

describe("compat", () => {
  test("identical interests and a shared intent score 1", () => {
    expect(
      compat(
        { interests: ["a", "b"], intents: ["beer"] },
        { interests: ["a", "b"], intents: ["beer"] },
      ),
    ).toBe(1)
  })

  test("half the interests and no shared intent score 0.7 × 1/3", () => {
    const score = compat(
      { interests: ["a", "b"], intents: ["beer"] },
      { interests: ["b", "c"], intents: ["coffee"] },
    )
    expect(score).toBeCloseTo(0.7 / 3)
  })
})

describe("geo", () => {
  const arena = { lat: 50.0676, lng: 19.9917 }

  test("0.001° of latitude is about 111 m due north", () => {
    const north = { lat: arena.lat + 0.001, lng: arena.lng }
    expect(distanceM(arena, north)).toBeCloseTo(111.2, 0)
    expect(bearing(arena, north)).toBeCloseTo(0)
  })

  test("due west is 270°", () => {
    expect(bearing(arena, { lat: arena.lat, lng: arena.lng - 0.01 })).toBeCloseTo(270, 0)
  })

  test("buckets follow the config thresholds", () => {
    const buckets = { warm: 200, hot: 80, burning: 30 }
    expect([250, 150, 50, 10].map((m) => bucketFor(m, buckets))).toEqual([
      "cold",
      "warm",
      "hot",
      "burning",
    ])
  })
})
