import {
  type Bucket,
  type ClientMsg,
  CloseCode,
  type Config,
  DEFAULT_CONFIG,
  type Intent,
  type MatchPartner,
  type Mode,
  type Plan,
  type PlanRemovedReason,
  type Position,
  type SearchOn,
  type SearchStopReason,
  type ServerMsg,
  type SessionEndReason,
} from "@justmate/protocol"
import { useSyncExternalStore } from "react"

import { authClient } from "./auth-client"
import { metersBetween } from "./venues"
import { type Demo, openSocket, type Socket } from "./ws"

export type Searching = { mode: Mode; category: string; intents: string[]; startedAt: number }

export type Match = { mode: Mode; sharedIntent: Intent; partner: MatchPartner }

export type Offer = { offerId: string; endsAt: number; state: "offered" | "accepted" | "expired" }

export type Session = { id: string; endsAt: number; bearing?: number; bucket?: Bucket }

export type Note =
  | Exclude<SessionEndReason, "met">
  | SearchStopReason
  | "reported"
  | `plan_${Exclude<PlanRemovedReason, "done">}`

export type Zone = Extract<ServerMsg, { t: "zones" }>["cells"][number]

export type Link = "idle" | "open" | "lost"

// relative times turned absolute on arrival, so countdowns survive re-renders
export type LivePlan = Plan & { startsAtMs: number; expiresAt?: number }

export type Live = {
  link: Link
  config: Config
  search?: Searching
  zones: Zone[]
  offer?: Offer
  match?: Match
  session?: Session
  met: boolean
  /** the session post-meet is about, for a report */
  metSessionId?: string
  /** the last session you reported, once the server confirmed it */
  reportedId?: string
  /** people you reported, and so blocked */
  blockedCount: number
  /** the partner's first name, sent with `session_end {met}` */
  partnerName?: string
  /** your own walk during the compass, rounded */
  walkedM?: number
  note?: Note
  /** the last error the server answered with, worth telling the user */
  refused?: { code: string }
  closedWith?: number
  plans: LivePlan[]
  /** the plan whose compass you opened, until both have */
  going?: string
  /** the plan the running session came from */
  planId?: string
}

const raw = process.env.EXPO_PUBLIC_DEMO
const demo: Demo | undefined = raw === "a" || raw === "b" ? raw : undefined

const OFFER_EXPIRED_MS = 2400
const RETRY_MS = 2000
const RETRY_MAX_MS = 30_000
const STEP_MIN_M = 10
const WALK_ROUND_M = 10

// background reports and the compass's clock race are nothing the user can act on
const QUIET = new Set(["position_before_search_on", "invalid_position", "plan_not_yet"])

const IDLE: Live = {
  link: "idle",
  config: DEFAULT_CONFIG,
  zones: [],
  met: false,
  blockedCount: 0,
  plans: [],
}

const ENDED = {
  search: undefined,
  zones: [],
  offer: undefined,
  match: undefined,
  session: undefined,
  going: undefined,
  planId: undefined,
} satisfies Partial<Live>

let state = IDLE
let socket: Socket | undefined
let isWanted = false
let retryMs = RETRY_MS
let lastSearch: SearchOn | undefined
let metId: string | undefined
let trail: { at?: Position; m: number } = { m: 0 }
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

function arrived(plan: Plan): LivePlan {
  const now = Date.now()
  const expiresAt = plan.expiresInMs === undefined ? undefined : now + plan.expiresInMs
  return { ...plan, startsAtMs: now + plan.startsInMs, expiresAt }
}

function upsertPlan(plan: Plan) {
  return [...state.plans.filter((p) => p.id !== plan.id), arrived(plan)]
}

// a plan's compass needs the same match the live compass and post-meet read
function matchOf(planId: string): Match | undefined {
  const plan = state.plans.find((p) => p.id === planId)
  const intent = plan?.intents[0]
  if (!plan?.partner || !intent) return
  return { mode: plan.mode, sharedIntent: intent, partner: plan.partner }
}

// your own fixes during a compass, counted in steps past their accuracy so standing still adds nothing
export function ownFix(at: Position) {
  if (!state.session) return
  const step = trail.at ? metersBetween(trail.at, at) : 0
  if (trail.at && step < Math.max(at.acc, STEP_MIN_M)) return
  trail = { at, m: trail.m + step }
}

function metWith(sessionId: string, partnerName?: string): Partial<Live> {
  const walkedM = Math.round(trail.m / WALK_ROUND_M) * WALK_ROUND_M
  return { ...ENDED, match: state.match, met: true, metSessionId: sessionId, partnerName, walkedM }
}

function reduce(msg: ServerMsg) {
  switch (msg.t) {
    // nothing live survives a reconnect, so a search still on screen is asked for again
    case "ready":
      retryMs = RETRY_MS
      if (state.search && lastSearch) socket?.send(lastSearch)
      return set({ link: "open", config: msg.config, blockedCount: msg.blockedCount })

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
      trail = { m: 0 }
      return set({
        offer: undefined,
        zones: [],
        session: { id: msg.sessionId, endsAt: Date.now() + msg.expiresInMs },
        going: undefined,
        planId: msg.planId,
        ...(msg.planId && { match: matchOf(msg.planId), search: undefined }),
      })

    case "partner_position":
      if (state.session?.id !== msg.sessionId) return
      return set({ session: { ...state.session, bearing: msg.bearing, bucket: msg.bucket } })

    case "session_end":
      if (msg.sessionId === metId && state.met) return set({ partnerName: msg.partnerName })
      if (state.session?.id !== msg.sessionId) return
      if (msg.reason === "met") return set(metWith(msg.sessionId, msg.partnerName))
      return set({ ...ENDED, note: msg.reason })

    // post-meet shows it in place; from the compass it is the select footer's note
    case "reported":
      return set({
        reportedId: msg.sessionId,
        blockedCount: msg.blockedCount,
        ...(!state.met && { note: "reported" as const }),
      })

    case "plans":
      return set({ plans: msg.plans.map(arrived) })

    case "plan_update":
      return set({ plans: upsertPlan(msg.plan) })

    // a plan you dropped yourself is already gone, so only the other side's removals get a note
    case "plan_removed": {
      const isKnown = state.plans.some((p) => p.id === msg.planId)
      const plans = state.plans.filter((p) => p.id !== msg.planId)
      if (!isKnown || msg.reason === "done") return set({ plans })
      return set({ plans, note: `plan_${msg.reason}` })
    }

    case "error":
      console.warn(`[ws] ${msg.code}: ${msg.message}`)
      if (msg.code === "plan_not_yet") set({ going: undefined })
      if (QUIET.has(msg.code)) return
      return set({ refused: { code: msg.code } })
  }
}

function closed(from: Socket, code: number) {
  if (socket !== from) return
  socket = undefined
  const wasLive = !!state.search || !!state.session
  set({
    ...ENDED,
    link: "lost",
    closedWith: code,
    plans: [],
    ...(wasLive && { note: "disconnected" as const }),
  })

  // no profile may be a stale read: the surface reloads it and drops the socket if it is truly gone
  const isFinal = code === 1000 || (code >= 4000 && code !== CloseCode.NoProfile)
  if (!isWanted || isFinal) return
  setTimeout(() => isWanted && !socket && connect(), retryMs)
  retryMs = Math.min(retryMs * 2, RETRY_MAX_MS)
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
  if (msg.t === "search_on") lastSearch = msg
  if (msg.t !== "search_on" || state.link === "open") socket?.send(msg)

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
      metId = msg.sessionId
      return set(metWith(msg.sessionId))

    case "report":
      if (state.session?.id !== msg.sessionId) return
      return set(ENDED)

    case "plan_go":
      return set({ going: msg.planId })

    case "plan_pass":
    case "plan_cancel":
      return set({ plans: state.plans.filter((p) => p.id !== msg.planId || isOwnTaken(p, msg)) })
  }
}

// passing on someone who took your invitation keeps the invitation itself
function isOwnTaken(plan: LivePlan, msg: ClientMsg) {
  return msg.t === "plan_pass" && plan.mine && plan.state === "taken"
}

export function leavePostMeet() {
  set({
    met: false,
    metSessionId: undefined,
    match: undefined,
    partnerName: undefined,
    walkedM: undefined,
  })
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useLive() {
  return useSyncExternalStore(subscribe, () => state)
}
