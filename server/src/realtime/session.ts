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

import { canMatch, compat, matchRadiusM, partnerCard, sharedIntents } from "../matching/compat"
import { bearing, bucketFor, cellCentre, distanceM, geohash } from "../matching/geo"
import { MATCH_ALGORITHM_VERSION, type MatchScoreRecord, type MatchStore } from "../matching/match"
import { pairThreshold } from "../matching/scorer_http"
import {
  type PlanLink,
  planDisconnect,
  planHello,
  planReceive,
  planSessionEnded,
  planTick,
  purgeUser,
  rememberProfile,
} from "../plans/plans"
import { DEMO_PROFILES, demoAccountOf, demoPosition, ghostPositions } from "./demo"

export type Conn = {
  send(msg: ServerMsg): void
  close(code: number, reason: string): void
}

export type Deps = {
  userIdForCookie(cookie: string): Promise<string | undefined>
  profileFor(userId: string): Promise<Profile | undefined>
  matchScoresFor?(userId: string): Promise<MatchScoreRecord[]>
  isDangerous?(userId: string): Promise<boolean>
  matchStore?: MatchStore
}

type Pair = [Client, Client]

export type Offer = {
  id: string
  pair: Pair
  accepted: Set<Client>
  expiresAt: number
  persisted: Promise<void>
  store?: MatchStore
}

export type Session = {
  id: string
  matchId?: string
  pair: Pair
  startedAt: number
  expiresAt: number
  planId?: string
  persisted: Promise<void>
  store?: MatchStore
}

export type Client = {
  id: string
  conn: Conn
  deps: Deps
  demo?: "a" | "b"
  isGreeting?: boolean
  isClosed?: boolean
  profile?: Profile
  dangerous?: boolean
  search?: Search
  searchStartedAt?: number
  autoStop?: Timer
  position?: Position
  /** when `position` was kept */
  fixAt?: number
  offer?: Offer
  session?: Session
  /** the confirmed plan this client opened the compass for */
  planGo?: string
  zonesWindow?: number
}

type Searcher = Client & {
  profile: Profile
  search: Search
  searchStartedAt: number
  position: Position
}

type Candidate = {
  a: Searcher
  b: Searcher
  intent: Intent
  score: number
  rankingScore: number
  meters: number
}

const ZONE_RADIUS_M = 2000
const MAX_WAIT_BONUS = 0.1

// faster than a sprint is a spoofed fix, the kind that walks a fake baseline for triangulation
const MAX_SPEED_MPS = 10

// coarse enough that cold bearings from far-apart spots can't be intersected into a pin
const BEARING_STEP = 10
const COLD_CELL_PRECISION = 7

export const config: Config = { ...DEFAULT_CONFIG }

export const clock = { now: () => Date.now() }

export const clients = new Map<string, Client>()

// pair key → cooldown end
export const cooldowns = new Map<string, number>()

export const matchScores = new Map<string, MatchScoreRecord>()

export function cacheMatchScores(records: MatchScoreRecord[]) {
  for (const record of records)
    matchScores.set([record.userAId, record.userBId].sort().join("|"), record)
}

export function invalidateMatchScores(userId: string) {
  for (const [key, record] of matchScores)
    if (record.userAId === userId || record.userBId === userId) matchScores.delete(key)
}

const planLink: PlanLink = {
  now: () => clock.now(),
  config,
  send: (userId, msg) => clients.get(userId)?.conn.send(msg),
  startSession: startPlanSession,
}

export function connect(conn: Conn, deps: Deps, demo?: "a" | "b"): Client {
  const client: Client = { id: `u_${shortId()}`, conn, deps, demo }
  clients.set(client.id, client)
  return client
}

export function disconnect(client: Client) {
  client.isClosed = true
  leave(client, "disconnected")
  if (clients.get(client.id) !== client) return
  clients.delete(client.id)
  planDisconnect(client.id)
}

export function forgetUser(userId: string) {
  purgeUser(planLink, userId)
  for (const client of clients.values()) {
    if (client.id.split("~")[0] === userId)
      client.conn.close(CloseCode.Unauthorized, "account deleted")
  }
}

export function updateProfile(userId: string, profile: Profile, dangerous = false) {
  const client = clients.get(userId)
  rememberProfile(userId, profile, dangerous)
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
      if (client.offer && client.offer.id === msg.offerId) expireOffer(client.offer, "dismissed")
      return

    case "vanish":
    case "met":
      if (client.session && client.session.id === msg.sessionId) {
        endSession(client.session, msg.t === "met" ? "met" : "vanished")
      }
      return

    default:
      return planReceive(planLink, client, msg)
  }
}

async function hello(client: Client, msg: Extract<ClientMsg, { t: "hello" }>) {
  if (client.profile || client.isGreeting) return
  client.isGreeting = true
  try {
    await greet(client, msg.sessionCookie)
  } catch (err) {
    console.error("hello failed", err)
    if (!client.isClosed) client.conn.close(CloseCode.ServerError, "try again")
  } finally {
    client.isGreeting = false
  }
}

async function greet(client: Client, sessionCookie: string) {
  const userId = await client.deps.userIdForCookie(sessionCookie)
  if (client.isClosed) return
  if (!userId) return client.conn.close(CloseCode.Unauthorized, "authentication required")

  const [profile, isDangerous, scores] = client.demo
    ? [DEMO_PROFILES[client.demo], false, []]
    : await Promise.all([
        client.deps.profileFor(userId),
        client.deps.isDangerous?.(userId),
        client.deps.matchScoresFor?.(userId),
      ])
  if (client.isClosed) return
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
  client.dangerous = !!isDangerous
  cacheMatchScores(scores ?? [])
  clients.set(client.id, client)
  client.conn.send({
    t: "ready",
    userId: id,
    config: client.demo ? { ...config, demo: true } : config,
  })
  planHello(planLink, id, profile, client.dangerous)
}

function searchOn(client: Client, profile: Profile, msg: unknown) {
  const parsed = parseSearchOn(msg)
  if (!parsed.ok) return error(client, parsed.error, "see PROTOCOL.md › search_on")

  const { mode, category, intents, walkMin = profile.settings.walkMin } = parsed.value
  if (mode === "date" && !profile.adult) return error(client, "adult_required", "date mode is 18+")

  if (client.offer) expireOffer(client.offer, "vanished")
  if (client.session) endSession(client.session, "vanished")

  if (!client.search) {
    client.searchStartedAt = clock.now()
    if (profile.settings.autoStop)
      client.autoStop = setTimeout(() => autoStop(client), config.autoStopMs)
  }
  client.search = { mode, category, intents, walkMin }
}

function position(client: Client, msg: unknown) {
  if (!isLocating(client)) {
    return error(client, "position_before_search_on", "send search_on first")
  }
  if (client.demo) return

  const parsed = parsePosition(msg)
  if (!parsed.ok) return error(client, parsed.error, "see PROTOCOL.md › position")

  const now = clock.now()
  const last = client.position
  const elapsedMs = now - (client.fixAt ?? 0)
  if (last && elapsedMs < fixIntervalMs(client) / 2) return
  if (last && distanceM(last, parsed.value) > (MAX_SPEED_MPS * elapsedMs) / 1000) {
    return error(client, "position_too_fast", "see PROTOCOL.md › position")
  }

  client.position = parsed.value
  client.fixAt = now
}

function fixIntervalMs(client: Client): number {
  return client.session || client.planGo ? config.sessionIntervalMs : config.positionIntervalMs
}

function accept(client: Client, offerId: string) {
  const offer = client.offer
  if (!offer || offer.id !== offerId) return

  offer.accepted.add(client)
  if (offer.accepted.size === 2) startSession(offer)
}

function leave(client: Client, reason: SessionEndReason) {
  if (client.offer)
    expireOffer(client.offer, reason === "disconnected" ? "disconnected" : "vanished")
  if (client.session) endSession(client.session, reason)
  stopSearch(client)
}

function stopSearch(client: Client) {
  clearTimeout(client.autoStop)
  client.autoStop = undefined
  client.search = undefined
  client.searchStartedAt = undefined
  client.position = undefined
  client.fixAt = undefined
}

// the search ends with the session instead
function autoStop(client: Client) {
  if (client.session) return
  leave(client, "vanished")
  client.conn.send({ t: "search_stopped", reason: "auto_stop" })
}

function offer({ a, b, intent, score, rankingScore }: Candidate, now: number) {
  const store = a.demo ? undefined : a.deps.matchStore
  const offer: Offer = {
    id: `o_${shortId()}`,
    pair: [a, b],
    accepted: new Set(),
    expiresAt: now + config.offerTtlMs,
    persisted: Promise.resolve(),
    store,
  }
  if (store) {
    const userAId = a.id < b.id ? a.id : b.id
    const userBId = a.id < b.id ? b.id : a.id
    persist(offer, () =>
      store.create({
        id: offer.id,
        userAId,
        userBId,
        mode: a.search.mode,
        category: a.search.category,
        intent,
        compatibilityScore: score,
        rankingScore,
        algorithmVersion: MATCH_ALGORITHM_VERSION,
        createdAt: new Date(now),
      }),
    )
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

function expireOffer(offer: Offer, state: "expired" | "dismissed" | "vanished" | "disconnected") {
  for (const client of offer.pair) {
    client.offer = undefined
    client.conn.send({ t: "offer_expired", offerId: offer.id })
  }
  if (offer.store) persist(offer, () => offer.store?.finish(offer.id, state, new Date(clock.now())))
  coolDown(offer.pair)
}

function startSession(offer: Offer) {
  for (const client of offer.pair) client.offer = undefined
  openSession(offer.pair, config.sessionTtlMs, {
    matchId: offer.id,
    persisted: offer.persisted,
    store: offer.store,
  })
}

// a plan's compass ends whatever else either side had going
function startPlanSession(ids: [string, string], planId: string): boolean {
  const [a, b] = ids.map((id) => clients.get(id))
  if (!a?.profile || !b?.profile) return false

  for (const client of [a, b]) {
    if (client.offer) expireOffer(client.offer, "vanished")
    if (client.session) endSession(client.session, "vanished")
    if (client.search) stopSearch(client)
  }
  openSession([a, b], config.planSessionTtlMs, { planId })
  return true
}

function openSession(
  pair: Pair,
  ttlMs: number,
  source: {
    matchId?: string
    planId?: string
    persisted?: Promise<void>
    store?: MatchStore
  } = {},
) {
  const now = clock.now()
  const session: Session = {
    id: `s_${shortId()}`,
    matchId: source.matchId,
    pair,
    startedAt: now,
    expiresAt: now + ttlMs,
    planId: source.planId,
    persisted: source.persisted ?? Promise.resolve(),
    store: source.store,
  }
  const matchId = session.matchId
  if (session.store && matchId)
    persist(session, () => session.store?.activate(matchId, session.id, new Date(now)))
  for (const client of pair) {
    client.session = session
    client.conn.send({
      t: "session_start",
      sessionId: session.id,
      expiresInMs: ttlMs,
      ...(source.planId && { planId: source.planId }),
    })
  }
}

function endSession(session: Session, reason: SessionEndReason) {
  const [a, b] = session.pair
  for (const [client, them] of [
    [a, b],
    [b, a],
  ] as const) {
    const partnerName = reason === "met" ? them.profile?.name.split(" ")[0] : undefined
    client.session = undefined
    client.planGo = undefined
    stopSearch(client)
    client.conn.send({
      t: "session_end",
      sessionId: session.id,
      reason,
      ...(partnerName && { partnerName }),
    })
  }
  const matchId = session.matchId
  if (session.store && matchId)
    persist(session, () => session.store?.finish(matchId, reason, new Date(clock.now())))
  coolDown(session.pair)
  if (session.planId) planSessionEnded(planLink, session.planId, reason === "met")
}

function persist(record: { persisted: Promise<void> }, write: () => Promise<void> | undefined) {
  record.persisted = record.persisted
    .then(write)
    .then(() => undefined)
    .catch((error) => console.error("[matching] could not store match:", error))
}

function pairKey([a, b]: Pair): string {
  return [a.id, b.id].sort().join("|")
}

// demo pairs skip it so the stage run can be rehearsed back to back
function coolDown(pair: Pair) {
  if (!pair[0].demo) cooldowns.set(pairKey(pair), clock.now() + config.pairCooldownMs)
}

export function tick() {
  guarded("session", sessionTick)
  guarded("plans", () => planTick(planLink))
}

function guarded(name: string, step: () => void) {
  try {
    step()
  } catch (err) {
    console.error(`tick: ${name} failed`, err)
  }
}

function sessionTick() {
  const now = clock.now()
  for (const [key, until] of cooldowns) if (until <= now) cooldowns.delete(key)

  for (const client of clients.values()) {
    if (client.demo && isLocating(client))
      client.position = demoPosition(client.demo, walkingMs(client, now))
    if (client.offer && now >= client.offer.expiresAt) expireOffer(client.offer, "expired")
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

function isLocating(client: Client): boolean {
  return !!(client.search || client.session || client.planGo)
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
  const isSameSide = demoAccountOf(a.id) === demoAccountOf(b.id)
  return isSameSide && canMatch(a, b) && compatibilityScore(a, b) >= pairThreshold(config)
}

function compatibilityScore(a: Searcher, b: Searcher): number {
  // Demo sockets and tests without persistence retain the deterministic rule-based score.
  // Real clients only match once the background profile job has populated the ML matrix.
  if (a.demo || !a.deps.matchStore) return compat(a, b)
  const score = matchScores.get(pairKey([a, b]))
  return score?.algorithmVersion === MATCH_ALGORITHM_VERSION ? score.score : -Infinity
}

function relay(me: Client, session: Session) {
  const [a, b] = session.pair
  const them = a === me ? b : a
  if (!me.position || !them.position) return

  const meters = distanceM(me.position, them.position)
  const bucket = bucketFor(meters, config.buckets)
  const towards =
    me.demo || bucket !== "cold" ? them.position : cellCentre(them.position, COLD_CELL_PRECISION)
  const degrees = Math.round(bearing(me.position, towards) / BEARING_STEP) * BEARING_STEP
  me.conn.send({
    t: "partner_position",
    sessionId: session.id,
    bearing: degrees % 360,
    bucket,
    ...(me.demo && { distanceM: Math.round(meters) }),
  })
}

function pairUp(now: number) {
  const pool = [...clients.values()].filter((c): c is Searcher => isSearching(c) && !c.offer)
  const candidates = pool
    .flatMap((a, i) => pool.slice(i + 1).flatMap((b) => candidate(a, b, now)))
    .sort((x, y) => y.rankingScore - x.rankingScore || y.score - x.score || x.meters - y.meters)

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
  const score = compatibilityScore(a, b)
  const waitingMs = Math.max(now - a.searchStartedAt, now - b.searchStartedAt)
  const waitBonus = Math.min(waitingMs / config.autoStopMs, 1) * MAX_WAIT_BONUS
  return [{ a, b, intent, meters, score, rankingScore: score + waitBonus }]
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
