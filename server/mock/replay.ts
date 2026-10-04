import {
  badgeSeed,
  DEFAULT_CONFIG,
  type Intent,
  type MatchPartner,
  type Mode,
  OTHER_INTENT,
  type Plan,
  parseClientMsg,
  parsePlanInvite,
  parseSearchOn,
  type ServerMsg,
} from "@justmate/protocol"
import type { ServerWebSocket } from "bun"

import { bucketFor } from "../src/matching/geo"
import { KRAKOW_VENUES } from "../test/venues"

// replays the PROTOCOL.md happy path so mobile can run without the real backend

const port = Number(process.env.MOCK_PORT || 3001)

const config = { ...DEFAULT_CONFIG, demo: true }

const ZONES = [
  { h: "u2yhyf", n: 7 },
  { h: "u2yhyg", n: 4 },
  { h: "u2yhz4", n: 3 },
  { h: "u2yhz1", n: 5 },
]

const PARTNERS: Record<Mode, MatchPartner> = {
  date: {
    vibe: "early bird with a film camera — opinions on oat milk",
    interests: ["photography", "coffee", "travel"],
    badgeSeed: badgeSeed(["photography", "coffee", "travel"], []),
    tags: { verified: true, adult: true },
  },
  mate: {
    vibe: "techno on fridays — crosswords on sundays",
    interests: ["concerts", "pub quiz", "coding"],
    badgeSeed: badgeSeed(["concerts", "pub quiz", "coding"], []),
    tags: { verified: true, adult: true },
  },
}

const OFFER_DELAY_MS = 6000
const START_DISTANCE_M = 450
const WALK_M_PER_TICK = 10

const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR
const TAKEN_DELAY_MS = 6000
const THEY_ACCEPT_MS = 1500

const TAKER: MatchPartner = {
  vibe: "early bird with a film camera — opinions on oat milk",
  interests: ["photography", "running", "coffee"],
  badgeSeed: badgeSeed(["photography", "running", "coffee"], []),
  tags: { verified: true, adult: true },
}

type State = { timers: Timer[]; mode: Mode; intent: Intent; plans: Plan[]; planId?: string }

type Socket = ServerWebSocket<State>

function send(ws: Socket, msg: ServerMsg) {
  ws.send(JSON.stringify(msg))
}

function stop(ws: Socket) {
  for (const timer of ws.data.timers) clearInterval(timer)
  ws.data.timers = []
}

function offer(ws: Socket) {
  const timer = setTimeout(() => {
    send(ws, {
      t: "match_offer",
      offerId: "o1",
      sharedIntent: ws.data.intent,
      partner: PARTNERS[ws.data.mode],
      expiresInMs: config.offerTtlMs,
    })
  }, OFFER_DELAY_MS)
  ws.data.timers.push(timer)
}

// the prototype's seed, relative to now: two proposals, one confirmed (compass open), one invitation
function seedPlans(): Plan[] {
  const at = (ms: number) => ({ startsAt: new Date(Date.now() + ms).toISOString(), startsInMs: ms })
  return [
    {
      id: "p1",
      kind: "proposal",
      state: "proposed",
      mine: false,
      mode: "date",
      category: "food",
      intents: ["wine"],
      ...at(2 * DAY),
      venueId: "dvor",
      alts: ["altitude"],
      partner: PARTNERS.date,
      partnerWalkMin: 7,
      expiresInMs: 6 * HOUR,
      accepted: false,
      suggested: false,
    },
    {
      id: "p2",
      kind: "proposal",
      state: "proposed",
      mine: false,
      mode: "mate",
      category: "games",
      intents: ["board games"],
      ...at(4 * DAY),
      venueId: "meeple",
      alts: ["tap", "corner"],
      partner: PARTNERS.mate,
      partnerWalkMin: 9,
      expiresInMs: DAY,
      accepted: false,
      suggested: false,
    },
    {
      id: "c1",
      kind: "proposal",
      state: "confirmed",
      mine: false,
      mode: "mate",
      category: "sports",
      intents: ["climbing"],
      ...at(10 * MIN),
      venueId: "boulder",
      partner: PARTNERS.mate,
      alts: [],
      accepted: true,
      suggested: false,
    },
    {
      id: "i1",
      kind: "invite",
      state: "open",
      mine: true,
      mode: "mate",
      category: "sports",
      intents: ["running"],
      ...at(5 * DAY),
      venueId: "steps",
      slots: [5 * DAY, 6 * DAY, 6 * DAY + 2 * HOUR].map((ms) => at(ms).startsAt),
      flex: true,
      until: "day",
    },
  ]
}

function upsert(ws: Socket, plan: Plan) {
  ws.data.plans = [...ws.data.plans.filter((p) => p.id !== plan.id), plan]
  send(ws, { t: "plan_update", plan })
}

function removePlan(ws: Socket, planId: string, reason: "expired" | "cancelled" | "done") {
  ws.data.plans = ws.data.plans.filter((p) => p.id !== planId)
  send(ws, { t: "plan_removed", planId, reason })
}

function later(ws: Socket, ms: number, planId: string, patch: (p: Plan) => Partial<Plan>) {
  setTimeout(() => {
    const plan = ws.data.plans.find((p) => p.id === planId)
    if (plan) upsert(ws, { ...plan, ...patch(plan) })
  }, ms)
}

function planMsg(
  ws: Socket,
  msg: Extract<ReturnType<typeof parseClientMsg>, { t: `plan${string}` }>,
) {
  if (msg.t === "plans_get") return send(ws, { t: "plans", plans: ws.data.plans })

  if (msg.t === "plan_invite") {
    const parsed = parsePlanInvite(msg)
    if (!parsed.ok) return send(ws, { t: "error", code: parsed.error, message: "mock" })
    const { slots, mode, category, intents, venueId, flex, until } = parsed.value
    const id = `i${Date.now()}`
    const startsAt = slots[0] ?? new Date().toISOString()
    upsert(ws, {
      id,
      kind: "invite",
      state: "open",
      mine: true,
      mode,
      category,
      intents,
      startsAt,
      startsInMs: Date.parse(startsAt) - Date.now(),
      venueId,
      slots,
      flex,
      until,
    })
    return later(ws, TAKEN_DELAY_MS, id, (p) => {
      const pick = p.slots?.at(-1) ?? p.startsAt
      return {
        state: "taken",
        partner: TAKER,
        startsAt: pick,
        startsInMs: Date.parse(pick) - Date.now(),
      }
    })
  }

  const plan = ws.data.plans.find((p) => p.id === msg.planId)
  if (!plan) return send(ws, { t: "error", code: "invalid_plan", message: "mock" })

  switch (msg.t) {
    case "plan_accept": {
      const venueId = msg.venueId ?? plan.venueId
      const alts = (plan.alts ?? []).filter((id) => id !== venueId)
      upsert(ws, { ...plan, venueId, alts, accepted: true })
      return later(ws, THEY_ACCEPT_MS, plan.id, () => ({
        state: "confirmed",
        expiresInMs: undefined,
      }))
    }

    case "plan_pass":
      if (plan.kind === "invite" && plan.state === "taken") {
        return upsert(ws, { ...plan, state: "open", partner: undefined })
      }
      return removePlan(ws, plan.id, "expired")

    case "plan_confirm":
      return upsert(ws, { ...plan, state: "confirmed" })

    case "plan_cancel":
      return removePlan(ws, plan.id, "cancelled")

    case "plan_go":
      stop(ws)
      ws.data.planId = plan.id
      return walk(ws, plan.id)
  }
}

function walk(ws: Socket, planId?: string) {
  let distance = START_DISTANCE_M

  send(ws, {
    t: "session_start",
    sessionId: "s1",
    expiresInMs: planId ? config.planSessionTtlMs : config.sessionTtlMs,
    ...(planId && { planId }),
  })
  ws.data.timers.push(
    setInterval(() => {
      distance -= WALK_M_PER_TICK
      if (distance <= 0) {
        stop(ws)
        send(ws, { t: "session_end", sessionId: "s1", reason: "met", partnerName: "Sam" })
        endPlan(ws)
        return
      }

      send(ws, {
        t: "partner_position",
        sessionId: "s1",
        bearing: 271,
        bucket: bucketFor(distance, config.buckets),
        distanceM: distance,
      })
    }, config.sessionIntervalMs),
  )
}

function endPlan(ws: Socket) {
  if (ws.data.planId) removePlan(ws, ws.data.planId, "done")
  ws.data.planId = undefined
}

Bun.serve<State>({
  port,
  fetch(req, server) {
    if (new URL(req.url).pathname === "/api/venues") return Response.json(KRAKOW_VENUES)
    const data: State = { timers: [], mode: "mate", intent: "beer", plans: seedPlans() }
    if (server.upgrade(req, { data })) return
    return new Response("justmate mock: connect over ws", { status: 426 })
  },
  websocket: {
    message(ws, frame) {
      const msg = parseClientMsg(String(frame))
      if (!msg) return

      switch (msg.t) {
        case "hello":
          send(ws, { t: "ready", userId: "u_mock", config })
          return send(ws, { t: "plans", plans: ws.data.plans })

        case "search_on": {
          const search = parseSearchOn(msg)
          if (!search.ok) return send(ws, { t: "error", code: search.error, message: "mock" })
          stop(ws)
          ws.data.mode = search.value.mode
          ws.data.intent = search.value.intents[0] ?? OTHER_INTENT
          ws.data.timers.push(
            setInterval(() => send(ws, { t: "zones", cells: ZONES }), config.positionIntervalMs),
          )
          return offer(ws)
        }

        case "search_off":
          return stop(ws)

        case "accept":
          stop(ws)
          return walk(ws)

        case "dismiss":
          send(ws, { t: "offer_expired", offerId: msg.offerId })
          return offer(ws)

        case "vanish":
        case "met":
          stop(ws)
          send(ws, {
            t: "session_end",
            sessionId: msg.sessionId,
            reason: msg.t === "met" ? "met" : "vanished",
          })
          if (msg.t === "met") endPlan(ws)
          ws.data.planId = undefined
          return

        case "position":
          return

        default:
          return planMsg(ws, msg)
      }
    },

    close: stop,
  },
})

console.log(`mock on ws://localhost:${port}`)
