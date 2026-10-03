import {
  type ClientMsg,
  CloseCode,
  type Config,
  DEFAULT_CONFIG,
  type Intent,
  type Position,
  type Profile,
  parseClientMsg,
  parsePosition,
  parseSearchOn,
  type Search,
  type ServerMsg,
  type SessionEndReason,
} from "@justmate/protocol"

import {
  COMPAT_THRESHOLD,
  canMatch,
  compat,
  matchRadiusM,
  partnerCard,
  sharedIntents,
} from "../matching/compat"
import { bearing, bucketFor, distanceM, geohash } from "../matching/geo"
import { DEMO_PROFILES, demoPosition, ghostPositions } from "./demo"

export type Conn = {
  send(msg: ServerMsg): void
  close(code: number, reason: string): void
}

export type Deps = {
  userIdForCookie(cookie: string): Promise<string | undefined>
  profileFor(userId: string): Promise<Profile | undefined>
  isDangerous?(userId: string): Promise<boolean>
}

type Pair = [Client, Client]

export type Offer = { id: string; pair: Pair; accepted: Set<Client>; expiresAt: number }

export type Session = { id: string; pair: Pair; startedAt: number; expiresAt: number }

export type Client = {
  id: string
  conn: Conn
  deps: Deps
  demo?: "a" | "b"
  profile?: Profile
  dangerous?: boolean
  search?: Search
  autoStop?: Timer
  position?: Position
  offer?: Offer
  session?: Session
  zonesWindow?: number
}

type Searcher = Client & { profile: Profile; search: Search; position: Position }

type Candidate = { a: Searcher; b: Searcher; intent: Intent; score: number; meters: number }

const ZONE_RADIUS_M = 2000

export const config: Config = { ...DEFAULT_CONFIG }

export const clock = { now: () => Date.now() }

export const clients = new Map<string, Client>()

// pair key → cooldown end
export const cooldowns = new Map<string, number>()

export function connect(conn: Conn, deps: Deps, demo?: "a" | "b"): Client {
  const client: Client = { id: `u_${shortId()}`, conn, deps, demo }
  clients.set(client.id, client)
  return client
}

export function disconnect(client: Client) {
  leave(client, "disconnected")
  if (clients.get(client.id) === client) clients.delete(client.id)
}

export function closeUser(userId: string, code: number, reason: string) {
  for (const client of clients.values()) {
    if (client.id.split("~")[0] === userId) client.conn.close(code, reason)
  }
}

export function updateProfile(userId: string, profile: Profile, dangerous = false) {
  const client = clients.get(userId)
  if (!client?.profile || client.demo) return
  client.profile = profile
  client.dangerous = dangerous
}

export async function receive(client: Client, frame: unknown) {
  const msg = parseClientMsg(frame)
  if (!msg) return

  if (msg.t === "hello") return hello(client, msg)

  const profile = client.profile
  if (!profile) {
    client.conn.close(CloseCode.ProtocolViolation, "hello first")
    return
  }

  switch (msg.t) {
    case "search_on":
      return searchOn(client, profile, msg)

    case "search_off":
      return leave(client, "vanished")

    case "position":
      return position(client, msg)

    case "accept":
      return accept(client, msg.offerId)

    case "dismiss":
      if (client.offer && client.offer.id === msg.offerId) expireOffer(client.offer)
      return

    case "vanish":
    case "met":
      if (client.session && client.session.id === msg.sessionId) {
        endSession(client.session, msg.t === "met" ? "met" : "vanished")
      }
      return
  }
}

async function hello(client: Client, msg: Extract<ClientMsg, { t: "hello" }>) {
  if (client.profile) return

  const userId = await client.deps.userIdForCookie(msg.sessionCookie)
  if (!userId) return client.conn.close(CloseCode.Unauthorized, "authentication required")

  const profile = client.demo ? DEMO_PROFILES[client.demo] : await client.deps.profileFor(userId)
  if (!profile) return client.conn.close(CloseCode.NoProfile, "finish onboarding first")

  const id = client.demo ? `${userId}~${client.demo}` : userId
  const previous = clients.get(id)
  if (previous && previous !== client) {
    leave(previous, "disconnected")
    previous.conn.close(1000, "replaced by a newer socket")
  }

  clients.delete(client.id)
  client.id = id
  client.profile = profile
  client.dangerous = !client.demo && (await client.deps.isDangerous?.(userId))
  clients.set(client.id, client)
  client.conn.send({
    t: "ready",
    userId: id,
    config: client.demo ? { ...config, demo: true } : config,
  })
}

function searchOn(client: Client, profile: Profile, msg: unknown) {
  const parsed = parseSearchOn(msg)
  if (!parsed.ok) return error(client, parsed.error, "see PROTOCOL.md › search_on")

  const { mode, category, intents, walkMin = profile.settings.walkMin } = parsed.value
  if (mode === "date" && !profile.adult) return error(client, "adult_required", "date mode is 18+")

  if (client.offer) expireOffer(client.offer)
  if (client.session) endSession(client.session, "vanished")

  if (!client.search && profile.settings.autoStop) {
    client.autoStop = setTimeout(() => autoStop(client), config.autoStopMs)
  }
  client.search = { mode, category, intents, walkMin }
}

function position(client: Client, msg: unknown) {
  if (!client.search) return error(client, "position_before_search_on", "send search_on first")
  if (client.demo) return

  const parsed = parsePosition(msg)
  if (!parsed.ok) return error(client, parsed.error, "see PROTOCOL.md › position")
  client.position = parsed.value
}

function accept(client: Client, offerId: string) {
  const offer = client.offer
  if (!offer || offer.id !== offerId) return

  offer.accepted.add(client)
  if (offer.accepted.size === 2) startSession(offer)
}

function leave(client: Client, reason: SessionEndReason) {
  if (client.offer) expireOffer(client.offer)
  if (client.session) endSession(client.session, reason)
  stopSearch(client)
}

function stopSearch(client: Client) {
  clearTimeout(client.autoStop)
  client.autoStop = undefined
  client.search = undefined
  client.position = undefined
}

// the search ends with the session instead
function autoStop(client: Client) {
  if (client.session) return
  leave(client, "vanished")
  client.conn.send({ t: "search_stopped", reason: "auto_stop" })
}

function offer({ a, b, intent }: Candidate, now: number) {
  const offer: Offer = {
    id: `o_${shortId()}`,
    pair: [a, b],
    accepted: new Set(),
    expiresAt: now + config.offerTtlMs,
  }
  for (const [me, them] of [
    [a, b],
    [b, a],
  ] as const) {
    me.offer = offer
    me.conn.send({
      t: "match_offer",
      offerId: offer.id,
      sharedIntent: intent,
      partner: partnerCard(them.profile),
      expiresInMs: config.offerTtlMs,
    })
  }
}

function expireOffer(offer: Offer) {
  for (const client of offer.pair) {
    client.offer = undefined
    client.conn.send({ t: "offer_expired", offerId: offer.id })
  }
  coolDown(offer.pair)
}

function startSession(offer: Offer) {
  const now = clock.now()
  const session: Session = {
    id: `s_${shortId()}`,
    pair: offer.pair,
    startedAt: now,
    expiresAt: now + config.sessionTtlMs,
  }
  for (const client of offer.pair) {
    client.offer = undefined
    client.session = session
    client.conn.send({
      t: "session_start",
      sessionId: session.id,
      expiresInMs: config.sessionTtlMs,
    })
  }
}

function endSession(session: Session, reason: SessionEndReason) {
  for (const client of session.pair) {
    client.session = undefined
    stopSearch(client)
    client.conn.send({ t: "session_end", sessionId: session.id, reason })
  }
  coolDown(session.pair)
}

function pairKey([a, b]: Pair): string {
  return [a.id, b.id].sort().join("|")
}

// demo pairs skip it so the stage run can be rehearsed back to back
function coolDown(pair: Pair) {
  if (!pair[0].demo) cooldowns.set(pairKey(pair), clock.now() + config.pairCooldownMs)
}

export function tick() {
  const now = clock.now()
  for (const [key, until] of cooldowns) if (until <= now) cooldowns.delete(key)

  for (const client of clients.values()) {
    if (client.demo && client.search)
      client.position = demoPosition(client.demo, walkingMs(client, now))
    if (client.offer && now >= client.offer.expiresAt) expireOffer(client.offer)
    if (client.session && now >= client.session.expiresAt) endSession(client.session, "expired")
  }

  for (const client of clients.values()) if (client.session) relay(client, client.session)

  pairUp(now)

  const window = Math.floor(now / config.positionIntervalMs)
  for (const client of clients.values()) {
    if (!isSearching(client) || client.zonesWindow === window) continue
    client.zonesWindow = window
    sendZones(client, now)
  }
}

function walkingMs(client: Client, now: number): number {
  return client.session ? now - client.session.startedAt : 0
}

function isSearching(client: Client): client is Searcher {
  return (
    client.profile !== undefined &&
    client.search !== undefined &&
    client.position !== undefined &&
    !client.session
  )
}

function isCompatible(a: Searcher, b: Searcher): boolean {
  if (a.dangerous || b.dangerous) return false
  return !a.demo === !b.demo && canMatch(a, b) && compat(a, b) >= COMPAT_THRESHOLD
}

function relay(me: Client, session: Session) {
  const [a, b] = session.pair
  const them = a === me ? b : a
  if (!me.position || !them.position) return

  const meters = distanceM(me.position, them.position)
  me.conn.send({
    t: "partner_position",
    sessionId: session.id,
    bearing: Math.round(bearing(me.position, them.position)) % 360,
    bucket: bucketFor(meters, config.buckets),
    ...(me.demo && { distanceM: Math.round(meters) }),
  })
}

function pairUp(now: number) {
  const pool = [...clients.values()].filter((c): c is Searcher => isSearching(c) && !c.offer)
  const candidates = pool
    .flatMap((a, i) => pool.slice(i + 1).flatMap((b) => candidate(a, b, now)))
    .sort((x, y) => y.score - x.score || x.meters - y.meters)

  const taken = new Set<Client>()
  for (const pick of candidates) {
    if (taken.has(pick.a) || taken.has(pick.b)) continue
    taken.add(pick.a).add(pick.b)
    offer(pick, now)
  }
}

function candidate(a: Searcher, b: Searcher, now: number): Candidate[] {
  const intent = sharedIntents(a.search, b.search)[0]
  const meters = distanceM(a.position, b.position)
  if (!intent || !isCompatible(a, b) || (cooldowns.get(pairKey([a, b])) ?? 0) > now) return []
  if (meters > matchRadiusM(a.search, b.search, config)) return []
  return [{ a, b, intent, meters, score: compat(a, b) }]
}

function sendZones(me: Searcher, now: number) {
  const others = [...clients.values()].flatMap((c) =>
    c !== me && isSearching(c) && isCompatible(me, c) ? [c.position] : [],
  )
  const ghosts = me.demo ? ghostPositions(now) : []

  const counts = new Map<string, number>()
  for (const at of [...others, ...ghosts]) {
    if (distanceM(me.position, at) > ZONE_RADIUS_M) continue
    const h = geohash(at, config.zonePrecision)
    counts.set(h, (counts.get(h) ?? 0) + 1)
  }

  const k = me.demo ? 1 : config.kAnonymity
  const cells = [...counts].filter(([, n]) => n >= k).map(([h, n]) => ({ h, n }))
  me.conn.send({ t: "zones", cells })
}

function error(client: Client, code: string, message: string) {
  client.conn.send({ t: "error", code, message })
}

function shortId(): string {
  return crypto.randomUUID().slice(0, 8)
}
