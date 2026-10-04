import { afterEach, describe, expect, test } from "bun:test"
import { CloseCode, DEFAULT_CONFIG, type ServerMsg } from "@justmate/protocol"

import { bearing, bucketFor, distanceM } from "../src/matching/geo"
import { DEMO_PROFILES } from "../src/realtime/demo"
import { type Client, clients, config, connect, disconnect, receive } from "../src/realtime/session"
import { makeProfile } from "./fixtures"

const USERS: Record<string, string> = { "session=test": "u_test", "session=new": "u_new" }

function fakeClient(
  profile = makeProfile(),
  demo?: "a" | "b",
  isDangerous: (userId: string) => Promise<boolean> = async () => false,
) {
  const sent: ServerMsg[] = []
  const closed: number[] = []
  const client = connect(
    { send: (msg) => sent.push(msg), close: (code) => closed.push(code) },
    {
      userIdForCookie: async (cookie) => USERS[cookie],
      profileFor: async (userId) => (userId === "u_test" ? profile : undefined),
      isDangerous,
    },
    demo,
  )
  return { client, sent, closed }
}

function hello(client: Client, sessionCookie = "session=test") {
  return receive(client, { t: "hello", sessionCookie })
}

const beerSearch = { t: "search_on", mode: "mate", category: "food", intents: ["beer"] }

afterEach(() => {
  config.autoStopMs = DEFAULT_CONFIG.autoStopMs
  for (const client of [...clients.values()]) disconnect(client)
})

describe("hello", () => {
  test("an invalid session closes with 4004", async () => {
    const { client, closed } = fakeClient()
    await hello(client, "session=invalid")
    expect(closed).toEqual([CloseCode.Unauthorized])
  })

  test("a stored profile gets ready with the config", async () => {
    const { client, sent } = fakeClient()
    await hello(client)
    expect(sent[0]).toEqual({ t: "ready", userId: "u_test", config, blockedCount: 0 })
    expect(sent[1]).toEqual({ t: "plans", plans: [] })
    expect(client.profile?.name).toBe("Alex")
  })

  test("no stored profile closes with 4002", async () => {
    const { client, closed } = fakeClient()
    await hello(client, "session=new")
    expect(closed).toEqual([CloseCode.NoProfile])
  })

  test("a demo socket uses the seeded profile", async () => {
    const { client, sent } = fakeClient(makeProfile(), "b")
    await hello(client, "session=new")
    expect(sent[0]?.t).toBe("ready")
    expect(client.profile).toBe(DEMO_PROFILES.b)
  })

  test("two quick hellos on one socket get one ready", async () => {
    const { client, sent } = fakeClient()
    await Promise.all([hello(client), hello(client)])
    expect(sent.filter((m) => m.t === "ready").length).toBe(1)
  })

  test("a socket that closes during hello is never registered", async () => {
    const { client, sent } = fakeClient()
    const pending = hello(client)
    disconnect(client)
    await pending
    expect([sent, clients.has("u_test")]).toEqual([[], false])
  })

  test("a failing lookup closes with 1011 and leaves nothing behind", async () => {
    const { client, sent, closed } = fakeClient(makeProfile(), undefined, async () => {
      throw new Error("db down")
    })
    await hello(client)
    expect([sent, closed, clients.has("u_test")]).toEqual([[], [CloseCode.ServerError], false])
  })

  test("any frame before hello closes with 4003", async () => {
    const { client, closed } = fakeClient()
    await receive(client, beerSearch)
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
  test("search_on takes the walk-up time from the profile by default", async () => {
    const { client } = fakeClient()
    await hello(client)
    await receive(client, beerSearch)
    expect(client.search).toEqual({
      mode: "mate",
      category: "food",
      intents: ["beer"],
      walkMin: 10,
    })
  })

  test("search_on again replaces the search", async () => {
    const { client } = fakeClient()
    await hello(client)
    await receive(client, beerSearch)
    await receive(client, { ...beerSearch, intents: ["coffee", "other"], walkMin: 15 })
    expect(client.search).toMatchObject({ intents: ["coffee", "other"], walkMin: 15 })
  })

  test("invalid searches are non-fatal errors and leave the state alone", async () => {
    const { client, sent, closed } = fakeClient()
    await hello(client)
    await receive(client, { ...beerSearch, category: "night" })
    await receive(client, { ...beerSearch, intents: ["gym"] })
    await receive(client, { ...beerSearch, walkMin: 7 })
    expect(sent.slice(2).map((m) => m.t === "error" && m.code)).toEqual([
      "invalid_category",
      "invalid_intents",
      "invalid_walk",
    ])
    expect([client.search, closed]).toEqual([undefined, []])
  })

  test("date mode needs an adult profile", async () => {
    const { client, sent } = fakeClient(makeProfile({ mode: "mate", age: 16, adult: false }))
    await hello(client)
    await receive(client, { t: "search_on", mode: "date", category: "food", intents: ["wine"] })
    await receive(client, beerSearch)
    expect(sent[2]).toMatchObject({ t: "error", code: "adult_required" })
    expect(client.search?.mode).toBe("mate")
  })

  test("position before search_on is a non-fatal error", async () => {
    const { client, sent, closed } = fakeClient()
    await hello(client)
    await receive(client, { t: "position", lat: 50, lng: 19, acc: 5 })
    expect(sent.at(-1)).toMatchObject({ t: "error", code: "position_before_search_on" })
    expect(closed).toEqual([])
  })

  test("auto-stop ends the search once the clock runs out", async () => {
    config.autoStopMs = 5
    const { client, sent } = fakeClient()
    await hello(client)
    await receive(client, beerSearch)
    await Bun.sleep(20)
    expect(client.search).toBeUndefined()
    expect(sent.at(-1)).toEqual({ t: "search_stopped", reason: "auto_stop" })
  })

  test("auto-stop off keeps searching", async () => {
    config.autoStopMs = 5
    const profile = makeProfile()
    const { client, sent } = fakeClient({
      ...profile,
      settings: { ...profile.settings, autoStop: false },
    })
    await hello(client)
    await receive(client, beerSearch)
    await Bun.sleep(20)
    expect(client.search).toBeDefined()
    expect(sent.at(-1)?.t).toBe("plans")
  })

  test("search_off cancels the auto-stop", async () => {
    config.autoStopMs = 5
    const { client, sent } = fakeClient()
    await hello(client)
    await receive(client, beerSearch)
    await receive(client, { t: "search_off" })
    await Bun.sleep(20)
    expect(sent.at(-1)?.t).toBe("plans")
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
