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
  parseReport,
  parseSearchOn,
  type Search,
  type ServerMsg,
  type SessionEndReason,
} from "@justmate/protocol"

import { type BlockStore, isBlocked, rememberBlocks } from "../matching/blocks"
import { compat, gateMiss, matchRadiusM, partnerCard, sharedIntents } from "../matching/compat"
import { bearing, bucketFor, cellCentre, distanceM, geohash } from "../matching/geo"
import {
  type MatchScoreRecord,
  type MatchStore,
  matchAlgorithmVersion,
  RULES_MATCH_ALGORITHM_VERSION,
} from "../matching/match"
import { pairThreshold, rulesThreshold } from "../matching/scorer_http"
import {
  type PlanLink,
  pausePlans,
  planBlocked,
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
  blockStore?: BlockStore
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
  wasBurning?: boolean
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
  algorithmVersion: string
  rankingScore: number
  meters: number
}

const ZONE_RADIUS_M = 2000
const MAX_WAIT_BONUS = 0.1
// the date scorer's pair score sums both directions, so it tops out at 2 where the rest top out at 1
const DATE_SCORE_MAX = 2

// faster than a sprint is a spoofed fix, the kind that walks a fake baseline for triangulation
const MAX_SPEED_MPS = 10
// caps the accuracy slack, so a spoofed `acc` can't buy a jump
const MAX_FIX_SLACK_M = 100
// slack accrues with time, so fixes every 500 ms can't each claim the full cap
const FIX_SLACK_MPS = 10

// coarse enough that cold bearings from far-apart spots can't be intersected into a pin
const BEARING_STEP = 10
const COLD_CELL_PRECISION = 7
// buckets measure to the partner's ~20 m cell, so walking a bucket edge traces the cell, not a pin
const BUCKET_CELL_PRECISION = 8

const REPORTABLE_MS = 86_400_000
const PAUSE_REPORTERS = 2

const RELAXED_RADIUS_M = 50_000
const RELAXED_COOLDOWN_MS = 30_000

export const config: Config = { ...DEFAULT_CONFIG }

export const clock = { now: () => Date.now() }

export const STALE_FIX_MS = Number(process.env.MATCH_STALE_FIX_MS ?? 30_000)

export const matching = {
  relaxed: (process.env.MATCH_RELAXED ?? "0") === "1",
  mateInterest: (process.env.MATE_INTEREST_MATCHING ?? "0") === "1",
}

if (matching.relaxed)
  console.info(
    `[matching] relaxed matching is on: any same-mode pair within ${RELAXED_RADIUS_M / 1000} km, ${RELAXED_COOLDOWN_MS / 1000} s cooldown`,
  )

export const clients = new Map<string, Client>()

// pair key → cooldown end
export const cooldowns = new Map<string, number>()

export const matchScores = new Map<string, MatchScoreRecord>()

// pair key, or a positionless searcher's id → why the last tick did not offer it
let misses = new Map<string, string>()

// sessionId → both user ids, kept after the end so post-meet can still report
export const pastSessions = new Map<string, { ids: string[]; endedAt: number }>()

export function cacheMatchScores(records: MatchScoreRecord[]) {
  for (const record of records)
    matchScores.set(`${[record.userAId, record.userBId].sort().join("|")}|${record.mode}`, record)
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

    case "report":
      return report(client, msg)

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

  const [profile, isDangerous, scores, blocks] = client.demo
    ? [DEMO_PROFILES[client.demo], false, [], []]
    : await Promise.all([
        client.deps.profileFor(userId),
        client.deps.isDangerous?.(userId),
        client.deps.matchScoresFor?.(userId),
        client.deps.blockStore?.forUser(userId),
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
  rememberBlocks(blocks ?? [])
  clients.set(client.id, client)
  client.conn.send({
    t: "ready",
    userId: id,
    config: client.demo ? { ...config, demo: true } : config,
    blockedCount: blocks?.filter((row) => row.blockerId === id).length ?? 0,
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
  if (last && isTooFast(last, parsed.value, elapsedMs)) {
    return error(client, "position_too_fast", "see PROTOCOL.md › position")
  }

  client.position = parsed.value
  client.fixAt = now
}

// two fixes of one standing phone sit up to their accuracies apart, so that much is not movement
function isTooFast(from: Position, to: Position, elapsedMs: number): boolean {
  const slackM = Math.min(from.acc + to.acc, MAX_FIX_SLACK_M, (FIX_SLACK_MPS * elapsedMs) / 1000)
  return distanceM(from, to) > (MAX_SPEED_MPS * elapsedMs) / 1000 + slackM
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

async function report(client: Client, msg: unknown) {
  const parsed = parseReport(msg)
  if (!parsed.ok) return error(client, parsed.error, "see PROTOCOL.md › report")

  const { sessionId, reason } = parsed.value
  const ids = await pairOf(client, sessionId)
  const them = ids?.includes(client.id) && ids.find((id) => id !== client.id)
  if (!them) return error(client, "invalid_session", "see PROTOCOL.md › report")

  if (client.session?.id === sessionId) endSession(client.session, "vanished")
  if (client.demo) return client.conn.send({ t: "reported", sessionId, blockedCount: 0 })

  const row = { blockerId: client.id, blockedId: them }
  rememberBlocks([row])
  planBlocked(planLink, client.id, them)
  const store = client.deps.blockStore
  const stored = await store?.add({ ...row, reason })
  if (store && stored && stored.reporters >= PAUSE_REPORTERS) await pause(store, them)
  client.conn.send({ t: "reported", sessionId, blockedCount: stored?.blockedCount ?? 0 })
}

async function pairOf(client: Client, sessionId: string): Promise<string[] | undefined> {
  if (client.session?.id === sessionId) return client.session.pair.map((c) => c.id)
  return pastSessions.get(sessionId)?.ids ?? client.deps.blockStore?.sessionPair(sessionId)
}

// the same flag moderation sets: out of matching and plans at once
async function pause(store: BlockStore, userId: string) {
  await store.pause(userId)
  const client = clients.get(userId)
  if (client) client.dangerous = true
  pausePlans(userId)
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

function offer({ a, b, intent, score, rankingScore, algorithmVersion }: Candidate, now: number) {
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
        algorithmVersion,
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

type OfferEnd = "expired" | "dismissed" | "vanished" | "disconnected"

function expireOffer(offer: Offer, state: OfferEnd) {
  dropOffer(offer, state)
  coolDown(offer.pair)
}

// no cooldown, so the active side can meet the same person again once they report
function dropOffer(offer: Offer, state: OfferEnd) {
  for (const client of offer.pair) {
    client.offer = undefined
    client.conn.send({ t: "offer_expired", offerId: offer.id })
  }
  if (offer.store) persist(offer, () => offer.store?.finish(offer.id, state, new Date(clock.now())))
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
    const partnerName =
      reason === "met" && session.wasBurning ? them.profile?.name.split(" ")[0] : undefined
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
  pastSessions.set(session.id, { ids: [a.id, b.id], endedAt: clock.now() })
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
  const ms = matching.relaxed ? RELAXED_COOLDOWN_MS : config.pairCooldownMs
  if (!pair[0].demo) cooldowns.set(pairKey(pair), clock.now() + ms)
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
  for (const [id, past] of pastSessions)
    if (past.endedAt + REPORTABLE_MS <= now) pastSessions.delete(id)

  for (const client of clients.values()) {
    if (client.demo && isLocating(client))
      client.position = demoPosition(client.demo, walkingMs(client, now))
    if (client.offer?.pair.some((c) => isStale(c, now))) dropOffer(client.offer, "disconnected")
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

// a backgrounded phone stops reporting but keeps its socket open
function isStale(client: Client, now: number): boolean {
  return !client.demo && now - (client.fixAt ?? 0) > STALE_FIX_MS
}

function isCompatible(a: Searcher, b: Searcher): boolean {
  return !incompatibility(a, b)
}

function incompatibility(a: Searcher, b: Searcher): string | undefined {
  if (a.dangerous || b.dangerous) return "paused"
  if (isBlocked(a.id, b.id)) return "blocked"
  if (demoAccountOf(a.id) !== demoAccountOf(b.id)) return "demo split"

  const gate = gateMiss(a, b, matching.relaxed)
  if (gate) return gate
  if (matching.relaxed) return

  const scored = compatibilityScore(a, b)
  const { score, threshold } = scored
  if (score >= threshold) return
  return `score ${score.toFixed(2)} < ${threshold} (${scored.source})`
}

// the rules-based score stands in until the scorer has written this pair's current row
function compatibilityScore(a: Searcher, b: Searcher) {
  const score = matchScores.get(`${pairKey([a, b])}|${a.search.mode}`)
  const usesStored = a.search.mode === "date" || matching.mateInterest
  if (usesStored && score?.algorithmVersion === matchAlgorithmVersion(a.search.mode))
    return {
      score: score.score,
      threshold: pairThreshold(a.search.mode),
      scale: a.search.mode === "date" ? DATE_SCORE_MAX : 1,
      algorithmVersion: score.algorithmVersion,
      source: a.search.mode,
    }
  return {
    score: compat(a, b),
    threshold: rulesThreshold(),
    scale: 1,
    algorithmVersion: RULES_MATCH_ALGORITHM_VERSION,
    source: "rules",
  }
}

function relay(me: Client, session: Session) {
  const [a, b] = session.pair
  const them = a === me ? b : a
  if (!me.position || !them.position) return

  const meters = distanceM(me.position, them.position)
  const cellM = distanceM(me.position, cellCentre(them.position, BUCKET_CELL_PRECISION))
  const bucket = bucketFor(me.demo ? meters : cellM, config.buckets)
  if (bucket === "burning") session.wasBurning = true
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
  const pool = [...clients.values()].filter(
    (c): c is Searcher => isSearching(c) && !c.offer && !isStale(c, now),
  )
  const candidates: Candidate[] = []
  const missed = new Map<string, string>()
  for (const client of clients.values()) {
    if (!client.search || client.session) continue
    if (!client.position) missed.set(client.id, "no position")
    else if (isStale(client, now)) missed.set(client.id, "stale position")
  }
  for (const [i, a] of pool.entries()) {
    for (const b of pool.slice(i + 1)) {
      const pick = candidate(a, b, now)
      if (typeof pick === "string") missed.set(pairKey([a, b]), pick)
      else candidates.push(pick)
    }
  }
  logMisses(missed)
  candidates.sort(
    (x, y) => y.rankingScore - x.rankingScore || y.score - x.score || x.meters - y.meters,
  )

  const taken = new Set<Client>()
  for (const pick of candidates) {
    if (taken.has(pick.a) || taken.has(pick.b)) continue
    taken.add(pick.a).add(pick.b)
    offer(pick, now)
  }
}

// one line per miss each time its reason changes, so production logs explain a missed match
function logMisses(next: Map<string, string>) {
  for (const [key, why] of next)
    if (misses.get(key) !== why) console.info(`[matching] ${key} not offered: ${why}`)
  misses = next
}

// a candidate, or why the pair is not one
function candidate(a: Searcher, b: Searcher, now: number): Candidate | string {
  const miss = incompatibility(a, b)
  if (miss) return miss
  if ((cooldowns.get(pairKey([a, b])) ?? 0) > now) return "cooldown"

  const radiusM = matching.relaxed ? RELAXED_RADIUS_M : matchRadiusM(a.search, b.search, config)
  const meters = distanceM(a.position, b.position)
  if (meters > radiusM) return `beyond ${radiusM} m`

  const intent = sharedIntents(a.search, b.search)[0] ?? a.search.intents[0]
  if (!intent) return "intents"
  const { score, scale, algorithmVersion } = compatibilityScore(a, b)
  const waitingMs = Math.max(now - a.searchStartedAt, now - b.searchStartedAt)
  const waitBonus = Math.min(waitingMs / config.autoStopMs, 1) * MAX_WAIT_BONUS
  const rankingScore = score / scale + waitBonus
  return { a, b, intent, meters, score, rankingScore, algorithmVersion }
}

function sendZones(me: Searcher, now: number) {
  const others = [...clients.values()].flatMap((c) =>
    c !== me && isSearching(c) && !isStale(c, now) && isCompatible(me, c) ? [c.position] : [],
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
