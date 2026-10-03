import {
  type Bucket,
  type ClientMsg,
  type Config,
  DEFAULT_CONFIG,
  type Intent,
  type MatchPartner,
  type Mode,
  type SearchStopReason,
  type ServerMsg,
  type SessionEndReason,
} from "@justmate/protocol"
import { useSyncExternalStore } from "react"

import { authClient } from "./auth-client"
import { type Demo, openSocket, type Socket } from "./ws"

export type Searching = { mode: Mode; category: string; intents: string[]; startedAt: number }

export type Match = { mode: Mode; sharedIntent: Intent; partner: MatchPartner }

export type Offer = { offerId: string; endsAt: number; state: "offered" | "accepted" | "expired" }

export type Session = { id: string; endsAt: number; bearing?: number; bucket?: Bucket }

export type Note = Exclude<SessionEndReason, "met"> | SearchStopReason

export type Link = "idle" | "open" | "lost"

export type Live = {
  link: Link
  config: Config
  search?: Searching
  zones: { h: string; n: number }[]
  offer?: Offer
  match?: Match
  session?: Session
  met: boolean
  note?: Note
  closedWith?: number
}

const raw = process.env.EXPO_PUBLIC_DEMO
const demo: Demo | undefined = raw === "a" || raw === "b" ? raw : undefined

const OFFER_EXPIRED_MS = 2400
const RETRY_MS = 2000

const IDLE: Live = { link: "idle", config: DEFAULT_CONFIG, zones: [], met: false }

const ENDED = {
  search: undefined,
  zones: [],
  offer: undefined,
  match: undefined,
  session: undefined,
} satisfies Partial<Live>

let state = IDLE
let socket: Socket | undefined
let isWanted = false
const listeners = new Set<() => void>()

function set(patch: Partial<Live>) {
  state = { ...state, ...patch }
  for (const listener of listeners) listener()
}

function clearExpired(offerId: string) {
  setTimeout(() => {
    if (state.offer?.offerId === offerId) set({ offer: undefined, match: undefined })
  }, OFFER_EXPIRED_MS)
}

function reduce(msg: ServerMsg) {
  switch (msg.t) {
    case "ready":
      return set({ link: "open", config: msg.config })

    case "search_stopped":
      return set({ ...ENDED, note: msg.reason })

    case "zones":
      if (!state.search) return
      return set({ zones: msg.cells })

    case "match_offer":
      if (!state.search) return
      return set({
        offer: { offerId: msg.offerId, endsAt: Date.now() + msg.expiresInMs, state: "offered" },
        match: { mode: state.search.mode, sharedIntent: msg.sharedIntent, partner: msg.partner },
      })

    case "offer_expired":
      if (state.offer?.offerId !== msg.offerId) return
      clearExpired(msg.offerId)
      return set({ offer: { ...state.offer, state: "expired" } })

    case "session_start":
      return set({
        offer: undefined,
        zones: [],
        session: { id: msg.sessionId, endsAt: Date.now() + msg.expiresInMs },
      })

    case "partner_position":
      if (state.session?.id !== msg.sessionId) return
      return set({ session: { ...state.session, bearing: msg.bearing, bucket: msg.bucket } })

    case "session_end":
      if (state.session?.id !== msg.sessionId) return
      if (msg.reason === "met") return set({ ...ENDED, match: state.match, met: true })
      return set({ ...ENDED, note: msg.reason })

    case "error":
      console.warn(`[ws] ${msg.code}: ${msg.message}`)
  }
}

function closed(from: Socket, code: number) {
  if (socket !== from) return
  socket = undefined
  set({ ...ENDED, link: "lost", closedWith: code })

  const isFinal = code === 1000 || code >= 4000
  if (isWanted && !isFinal) setTimeout(() => isWanted && !socket && connect(), RETRY_MS)
}

export async function connect() {
  isWanted = true
  if (socket) return
  const sessionCookie = await authClient.getCookie()
  if (!isWanted || socket) return

  const next: Socket = openSocket(
    { onMessage: reduce, onClose: (code) => closed(next, code) },
    demo,
  )
  socket = next
  set({ closedWith: undefined })
  next.send({ t: "hello", sessionCookie })
}

export function disconnect() {
  isWanted = false
  socket?.close()
  socket = undefined
  state = IDLE
  for (const listener of listeners) listener()
}

export function send(msg: ClientMsg) {
  socket?.send(msg)

  switch (msg.t) {
    case "search_on":
      return set({
        search: {
          mode: msg.mode,
          category: msg.category,
          intents: msg.intents,
          startedAt: state.search?.startedAt ?? Date.now(),
        },
        note: undefined,
        met: false,
      })

    case "search_off":
      return set(ENDED)

    case "accept":
      if (!state.offer) return
      return set({ offer: { ...state.offer, state: "accepted" } })

    case "dismiss":
      return set({ offer: undefined, match: undefined })

    case "vanish":
      return set({ ...ENDED, note: "vanished" })

    case "met":
      return set({ ...ENDED, match: state.match, met: true })
  }
}

export function leavePostMeet() {
  set({ met: false, match: undefined })
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useLive() {
  return useSyncExternalStore(subscribe, () => state)
}
