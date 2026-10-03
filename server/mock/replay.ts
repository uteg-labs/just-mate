import {
  badgeSeed,
  DEFAULT_CONFIG,
  type Intent,
  type MatchPartner,
  type Mode,
  OTHER_INTENT,
  parseClientMsg,
  parseSearchOn,
  type ServerMsg,
} from "@justmate/protocol"
import type { ServerWebSocket } from "bun"

import { bucketFor } from "../src/matching/geo"

// replays the PROTOCOL.md happy path so mobile can run without the real backend

const port = Number(process.env.MOCK_PORT ?? 3001)

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

type State = { timers: Timer[]; mode: Mode; intent: Intent }

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

function walk(ws: Socket) {
  let distance = START_DISTANCE_M

  send(ws, { t: "session_start", sessionId: "s1", expiresInMs: config.sessionTtlMs })
  ws.data.timers.push(
    setInterval(() => {
      distance -= WALK_M_PER_TICK
      if (distance <= 0) {
        stop(ws)
        send(ws, { t: "session_end", sessionId: "s1", reason: "met" })
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

Bun.serve<State>({
  port,
  fetch(req, server) {
    if (server.upgrade(req, { data: { timers: [], mode: "mate", intent: "beer" } })) return
    return new Response("justmate mock: connect over ws", { status: 426 })
  },
  websocket: {
    message(ws, frame) {
      const msg = parseClientMsg(String(frame))
      if (!msg) return

      switch (msg.t) {
        case "hello":
          return send(ws, { t: "ready", userId: "u_mock", config })

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
          return send(ws, {
            t: "session_end",
            sessionId: msg.sessionId,
            reason: msg.t === "met" ? "met" : "vanished",
          })
      }
    },

    close: stop,
  },
})

console.log(`mock on ws://localhost:${port}`)
