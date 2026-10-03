import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import type { Plan, Profile, ServerMsg } from "@justmate/protocol"

import { partnerCard } from "../src/matching/compat"
import { anchors, plans, resetPlans } from "../src/plans/plans"
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

type User = { client: Client; sent: ServerMsg[] }

type Of<T extends ServerMsg["t"]> = Extract<ServerMsg, { t: T }>

// Monday 5 Oct 2026, 10:00 in Kraków
const MONDAY_10 = Date.UTC(2026, 9, 5, 8, 0)
const MONDAY_17 = "2026-10-05T15:00:00.000Z"
const TUESDAY_19 = "2026-10-06T17:00:00.000Z"

const RYNEK = { lat: 50.0617, lng: 19.9373 }

const MIN = 60_000
const HOUR = 60 * MIN

let now = 0

beforeEach(() => {
  resetPlans()
  now = MONDAY_10
  clock.now = () => now
})

afterEach(() => {
  for (const client of [...clients.values()]) disconnect(client)
  cooldowns.clear()
  resetPlans()
  clock.now = () => Date.now()
})

async function join(
  id: string,
  profile = wineLover(),
  demo?: "a" | "b",
  isDangerous = false,
): Promise<User> {
  const sent: ServerMsg[] = []
  const client = connect(
    { send: (msg) => sent.push(msg), close: () => {} },
    {
      userIdForCookie: async () => id,
      profileFor: async () => profile,
      isDangerous: async () => isDangerous,
    },
    demo,
  )
  await receive(client, { t: "hello", sessionCookie: id })
  return { client, sent }
}

function wineLover(overrides: Partial<Profile> = {}): Profile {
  return makeProfile({ interests: ["wine", "cinema", "books", "travel"], ...overrides })
}

function all<T extends ServerMsg["t"]>(user: User, t: T): Of<T>[] {
  return user.sent.filter((msg): msg is Of<T> => msg.t === t)
}

function lastOf<T extends ServerMsg["t"]>(user: User, t: T): Of<T> | undefined {
  return all(user, t).at(-1)
}

function planOf(user: User, id?: string): Plan | undefined {
  return all(user, "plan_update")
    .map((m) => m.plan)
    .filter((p) => !id || p.id === id)
    .at(-1)
}

function jump(ms: number) {
  now += ms
  tick()
}

const send = (user: User, msg: object) => receive(user.client, msg)

async function proposed() {
  const a = await join("u_a")
  const b = await join("u_b")
  await send(a, { t: "plans_get", ...RYNEK })
  await send(b, { t: "plans_get", ...RYNEK })
  const plan = planOf(a)
  return { a, b, planId: plan?.id ?? "", plan }
}

async function confirmed() {
  const { a, b, planId } = await proposed()
  await send(a, { t: "plan_accept", planId })
  await send(b, { t: "plan_accept", planId })
  return { a, b, planId }
}

// owner u_a with candidates u_b (same interests) and u_c (fewer in common), all anchored
async function invited(overrides: object = {}) {
  const a = await join("u_a")
  const b = await join("u_b")
  const c = await join("u_c", wineLover({ interests: ["wine", "cinema", "cooking", "art"] }))
  for (const id of ["u_a", "u_b", "u_c"]) anchors.set(id, RYNEK)

  await send(a, {
    t: "plan_invite",
    mode: "date",
    category: "food",
    intents: ["wine"],
    slots: [MONDAY_17, TUESDAY_19],
    flex: false,
    venueId: "dvor",
    until: "2h",
    ...overrides,
  })
  const planId = planOf(a)?.id ?? ""
  return { a, b, c, planId }
}

describe("proposals", () => {
  test("two anchored, compatible people get the same proposal", async () => {
    const { a, b, plan } = await proposed()

    expect(plan).toMatchObject({
      kind: "proposal",
      state: "proposed",
      mine: false,
      mode: "date",
      category: "food",
      intents: ["wine"],
      startsAt: MONDAY_17,
      startsInMs: 7 * HOUR,
      partner: partnerCard(b.client.profile as Profile),
      expiresInMs: config.planProposalTtlMs,
      accepted: false,
      suggested: false,
    })
    expect(["dvor", "altitude"]).toContain(plan?.venueId ?? "")
    expect(plan?.partnerWalkMin).toBeGreaterThan(0)
    expect(planOf(b, plan?.id)?.partner).toEqual(partnerCard(a.client.profile as Profile))
  })

  test("nobody is proposed without an anchor", async () => {
    const a = await join("u_a")
    await join("u_b")
    await send(a, { t: "plans_get", ...RYNEK })
    expect(all(a, "plan_update")).toEqual([])
    expect(lastOf(a, "plans")).toEqual({ t: "plans", plans: [] })
  })

  test("a proposal confirms only once both accept", async () => {
    const { a, b, planId } = await proposed()
    await send(a, { t: "plan_accept", planId })
    expect(planOf(a, planId)).toMatchObject({ state: "proposed", accepted: true })
    expect(planOf(b, planId)).toMatchObject({ state: "proposed", accepted: false })

    await send(b, { t: "plan_accept", planId })
    expect(planOf(a, planId)?.state).toBe("confirmed")
    expect(planOf(b, planId)?.state).toBe("confirmed")
  })

  test("suggesting another venue resets the other side's yes", async () => {
    const { a, b, planId, plan } = await proposed()
    const other = plan?.alts?.[0] ?? ""
    await send(a, { t: "plan_accept", planId })
    await send(b, { t: "plan_accept", planId, venueId: other })

    expect(planOf(a, planId)).toMatchObject({
      venueId: other,
      accepted: false,
      suggested: true,
      alts: [plan?.venueId],
    })
    expect(planOf(b, planId)).toMatchObject({ accepted: true, suggested: false })
  })

  test("passing removes it for both, and the pair isn't proposed again", async () => {
    const { a, b, planId } = await proposed()
    await send(b, { t: "plan_pass", planId })

    const removed = { t: "plan_removed", planId, reason: "expired" } as const
    expect(lastOf(a, "plan_removed")).toEqual(removed)
    expect(lastOf(b, "plan_removed")).toEqual(removed)

    jump(config.planProposeIntervalMs)
    expect(plans.size).toBe(0)
  })

  test("an unanswered proposal expires for both", async () => {
    const { a, planId } = await proposed()
    jump(config.planProposalTtlMs)
    expect(lastOf(a, "plan_removed")).toEqual({ t: "plan_removed", planId, reason: "expired" })
  })

  test("plans come back in the snapshot after a reconnect", async () => {
    const { b, planId } = await confirmed()
    disconnect(b.client)
    const again = await join("u_b")
    expect(lastOf(again, "plans")?.plans.map((p) => [p.id, p.state])).toEqual([
      [planId, "confirmed"],
    ])
  })
})

describe("invitations", () => {
  test("the owner sees it open with all its times", async () => {
    const { a, planId } = await invited()
    expect(planOf(a, planId)).toMatchObject({
      kind: "invite",
      state: "open",
      mine: true,
      startsAt: MONDAY_17,
      slots: [MONDAY_17, TUESDAY_19],
      until: "2h",
    })
    expect(planOf(a, planId)?.partner).toBeUndefined()
  })

  test("it is offered to the best match first, at one time", async () => {
    const { a, b, c, planId } = await invited()
    expect(planOf(b, planId)).toMatchObject({
      state: "offered",
      mine: false,
      startsAt: MONDAY_17,
      expiresInMs: config.planOfferTtlMs,
      partner: partnerCard(a.client.profile as Profile),
    })
    expect(planOf(b, planId)?.slots).toBeUndefined()
    expect(planOf(c, planId)).toBeUndefined()
    expect(planOf(a, planId)?.state).toBe("open")
  })

  test("a pass moves it on to the next person, unseen by the owner", async () => {
    const { a, b, c, planId } = await invited()
    await send(b, { t: "plan_pass", planId })

    expect(lastOf(b, "plan_removed")).toEqual({ t: "plan_removed", planId, reason: "expired" })
    expect(planOf(c, planId)?.state).toBe("offered")
    expect(planOf(a, planId)).toMatchObject({ state: "open" })
    expect(all(a, "plan_removed")).toEqual([])
  })

  test("an unanswered offer moves on after its TTL", async () => {
    const { c, planId } = await invited()
    jump(config.planOfferTtlMs)
    expect(planOf(c, planId)?.state).toBe("offered")
  })

  test("the owner confirms whoever took it", async () => {
    const { a, b, planId } = await invited()
    await send(b, { t: "plan_accept", planId })
    expect(planOf(a, planId)).toMatchObject({
      state: "taken",
      partner: partnerCard(b.client.profile as Profile),
    })
    expect(planOf(b, planId)?.state).toBe("taken")

    await send(a, { t: "plan_confirm", planId })
    expect(planOf(a, planId)?.state).toBe("confirmed")
    expect(planOf(b, planId)?.state).toBe("confirmed")
  })

  test("passing on a taker tells them only 'filled' and offers it again", async () => {
    const { a, b, c, planId } = await invited()
    await send(b, { t: "plan_accept", planId })
    await send(a, { t: "plan_pass", planId })

    expect(lastOf(b, "plan_removed")).toEqual({ t: "plan_removed", planId, reason: "filled" })
    expect(planOf(c, planId)?.state).toBe("offered")
  })

  test("it ends once none of its times can still be offered", async () => {
    const { a, planId } = await invited()
    jump(Date.parse(TUESDAY_19) - 2 * HOUR - now)
    expect(lastOf(a, "plan_removed")).toEqual({ t: "plan_removed", planId, reason: "expired" })
  })

  test("times that can't be offered any more are refused", async () => {
    const { a } = await invited({ slots: ["2026-10-05T09:00:00.000Z"] })
    expect(lastOf(a, "error")?.code).toBe("invalid_until")
  })

  test("the venue must exist in the plan's mode", async () => {
    const { a } = await invited({ venueId: "meeple" })
    expect(lastOf(a, "error")?.code).toBe("invalid_venue")
  })

  test("withdrawing tells whoever took it that it's cancelled", async () => {
    const { a, b, planId } = await invited()
    await send(b, { t: "plan_accept", planId })
    await send(a, { t: "plan_cancel", planId })
    expect(lastOf(b, "plan_removed")).toEqual({ t: "plan_removed", planId, reason: "cancelled" })
  })
})

describe("plan compass", () => {
  test("it doesn't open before start − 15 min", async () => {
    const { a, planId } = await confirmed()
    await send(a, { t: "plan_go", planId })
    expect(lastOf(a, "error")?.code).toBe("plan_not_yet")
  })

  test("both opening it starts a session with the plan id, without a search", async () => {
    const { a, b, planId } = await confirmed()
    now = Date.parse(MONDAY_17) - 10 * MIN
    await send(a, { t: "plan_go", planId })
    await send(b, { t: "plan_go", planId })

    expect(lastOf(a, "session_start")).toMatchObject({
      planId,
      expiresInMs: config.planSessionTtlMs,
    })
    await send(a, { t: "position", ...RYNEK, acc: 5 })
    await send(b, { t: "position", lat: RYNEK.lat + 0.001, lng: RYNEK.lng, acc: 5 })
    jump(1000)
    expect(lastOf(a, "partner_position")?.bucket).toBe("warm")
  })

  test("meeting ends the plan", async () => {
    const { a, b, planId } = await confirmed()
    now = Date.parse(MONDAY_17) - 10 * MIN
    await send(a, { t: "plan_go", planId })
    await send(b, { t: "plan_go", planId })
    const sessionId = lastOf(a, "session_start")?.sessionId
    await send(b, { t: "met", sessionId })

    expect(lastOf(a, "plan_removed")).toEqual({ t: "plan_removed", planId, reason: "done" })
    expect(plans.size).toBe(0)
  })

  test("cancelling a confirmed plan tells the other side", async () => {
    const { a, b, planId } = await confirmed()
    await send(a, { t: "plan_cancel", planId })
    expect(lastOf(b, "plan_removed")).toEqual({ t: "plan_removed", planId, reason: "cancelled" })
  })

  test("someone else's plan id is invalid", async () => {
    const { planId } = await confirmed()
    const c = await join("u_c")
    await send(c, { t: "plan_go", planId })
    expect(lastOf(c, "error")?.code).toBe("invalid_plan")
  })
})

test("a flagged profile is never proposed or offered", async () => {
  const a = await join("u_a")
  const b = await join("u_b", wineLover(), undefined, true)
  await send(a, { t: "plans_get", ...RYNEK })
  await send(b, { t: "plans_get", ...RYNEK })
  expect(plans.size).toBe(0)

  await send(a, {
    t: "plan_invite",
    mode: "date",
    category: "food",
    intents: ["wine"],
    slots: [MONDAY_17],
    flex: false,
    venueId: "dvor",
    until: "2h",
  })
  jump(1000)
  expect(planOf(b)).toBeUndefined()
})

test("demo sockets get a proposal two minutes out, only with each other", async () => {
  const a = await join("acct", wineLover(), "a")
  const b = await join("acct", wineLover(), "b")
  await join("u_c")
  anchors.set("u_c", RYNEK)
  await send(a, { t: "plans_get" })

  const plan = planOf(b)
  expect(plan?.startsInMs).toBe(2 * MIN)
  expect(planOf(a, plan?.id)).toBeDefined()
  expect([...plans.values()].map((p) => [p.ownerId, p.guestId])).toEqual([["acct~a", "acct~b"]])
})
