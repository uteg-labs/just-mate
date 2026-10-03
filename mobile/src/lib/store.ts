import {
  type Bucket,
  type ClientMsg,
  type Config,
  DEFAULT_CONFIG,
  type ServerMsg,
} from "@justmate/protocol"
import { useSyncExternalStore } from "react"

import { openSocket, type Socket } from "./ws"

type Offer = Extract<ServerMsg, { t: "match_offer" }> & { accepted: boolean }

type Session = { id: string; endsAt: number; bearing?: number; bucket?: Bucket }

export type State = {
  userId?: string
  vibe?: string
  config: Config
  intents: string[]
  zones: { h: string; n: number }[]
  offer?: Offer
  session?: Session
}

let state: State = { config: DEFAULT_CONFIG, intents: [], zones: [] }
let socket: Socket | undefined
const listeners = new Set<() => void>()

function set(patch: Partial<State>) {
  state = { ...state, ...patch }
  for (const listener of listeners) listener()
}

function reduce(msg: ServerMsg) {
  switch (msg.t) {
    case "ready":
      return set({ userId: msg.userId, vibe: msg.vibe, config: msg.config })

    case "zones":
      return set({ zones: msg.cells })

    case "match_offer":
      return set({ offer: { ...msg, accepted: false } })

    case "offer_expired":
      return set({ offer: undefined })

    case "session_start":
      return set({
        offer: undefined,
        session: { id: msg.sessionId, endsAt: Date.now() + msg.expiresInMs },
      })

    case "partner_position":
      if (state.session?.id !== msg.sessionId) return
      return set({ session: { ...state.session, bearing: msg.bearing, bucket: msg.bucket } })

    case "session_end":
      return set({ session: undefined })

    case "error":
      console.warn(`[ws] ${msg.code}: ${msg.message}`)
  }
}

export function send(msg: ClientMsg) {
  socket ??= openSocket(reduce)
  socket.send(msg)

  if (msg.t === "search_on") set({ intents: msg.intents })
  if (msg.t === "search_off") set({ intents: [], zones: [], offer: undefined })
  if (msg.t === "accept" && state.offer) set({ offer: { ...state.offer, accepted: true } })
  if (msg.t === "dismiss") set({ offer: undefined })
  if (msg.t === "vanish") set({ session: undefined })
}

export function useStore<T>(select: (state: State) => T): T {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => select(state),
  )
}
