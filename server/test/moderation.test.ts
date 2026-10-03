import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import type { ServerMsg } from "@justmate/protocol"

import { offset } from "../src/matching/geo"
import {
  clients,
  clock,
  connect,
  cooldowns,
  disconnect,
  receive,
  tick,
} from "../src/realtime/session"
import { makeProfile } from "./fixtures"

delete process.env.OPENAI_API_KEY
const { isDangerous } = await import("../src/onboarding/moderation")

const ARENA = { lat: 50.0676, lng: 19.9917 }

const beer = { t: "search_on", mode: "mate", category: "food", intents: ["beer"] }

beforeEach(() => {
  clock.now = () => 1_000_000
})

afterEach(() => {
  for (const client of [...clients.values()]) disconnect(client)
  cooldowns.clear()
  clock.now = () => Date.now()
})

async function searcher(id: string, metersEast: number, dangerous: boolean) {
  const sent: ServerMsg[] = []
  const client = connect(
    { send: (msg) => sent.push(msg), close: () => {} },
    {
      userIdForCookie: async () => id,
      profileFor: async () => makeProfile(),
      isDangerous: async () => dangerous,
    },
  )
  await receive(client, { t: "hello", sessionCookie: id })
  await receive(client, beer)
  await receive(client, { t: "position", ...offset(ARENA, 90, metersEast), acc: 5 })
  return sent
}

const offers = (sent: ServerMsg[]) => sent.filter((msg) => msg.t === "match_offer")

describe("dangerous profiles", () => {
  test("two safe users near each other get an offer", async () => {
    const a = await searcher("u_a", 0, false)
    const b = await searcher("u_b", 150, false)
    tick()
    expect([offers(a).length, offers(b).length]).toEqual([1, 1])
  })

  test("a dangerous user is never offered, and nobody is offered to them", async () => {
    const a = await searcher("u_a", 0, false)
    const b = await searcher("u_b", 150, true)
    tick()
    expect([offers(a).length, offers(b).length]).toEqual([0, 0])
  })
})

describe("moderation without a key", () => {
  test("nothing is flagged", async () => {
    expect(await isDangerous(["anything at all"])).toBe(false)
  })
})
