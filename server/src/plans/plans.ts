import {
  CATEGORIES,
  type ClientMsg,
  type Config,
  type Intent,
  type LatLng,
  type Mode,
  type Plan,
  type PlanRemovedReason,
  type Profile,
  parsePlanInvite,
  parsePlansGet,
  type Search,
  type ServerMsg,
  type Venue,
} from "@justmate/protocol"

import { isBlocked } from "../matching/blocks"
import { COMPAT_THRESHOLD, canMatch, compat, partnerCard } from "../matching/compat"
import { cellCentre, distanceM } from "../matching/geo"
import { demoAccountOf, STAGE_A, STAGE_B } from "../realtime/demo"
import type { Client } from "../realtime/session"
import { atLocal, DAY_MS, HOUR_MS, isOpen, MIN_MS } from "./city"
import { isFree } from "./free"
import { memoryRepo, type PlanRepo, type PlanRow } from "./repo"
import { setVenues, venueById, venues } from "./venues"

export type PlanLink = {
  now(): number
  config: Config
  send(userId: string, msg: ServerMsg): void
  startSession(ids: [string, string], planId: string): boolean
}

type PlanMsg = Extract<ClientMsg, { t: `plan${string}` }>

const ANCHOR_PRECISION = 6
const WALK_M_PER_MIN = 80
const MAX_WALK_M = 15 * WALK_M_PER_MIN
const PROPOSE_AHEAD_MS = 3 * HOUR_MS
const PROPOSE_WITHIN_MS = 7 * DAY_MS
const GRID_MS = 30 * MIN_MS
const DEMO_LEAD_MS = 2 * MIN_MS
const PASSED_PAIR_MS = 7 * DAY_MS
const CLASH_MS = 2 * HOUR_MS
const FLEX_MIN = 30
const OPEN_INVITES_MAX = Number(process.env.PLAN_OPEN_INVITES_MAX ?? 5)

export const planStore: { repo: PlanRepo } = { repo: memoryRepo() }

export const plans = new Map<string, PlanRow>()

// geohash-6 cell centres, never a raw position
export const anchors = new Map<string, LatLng>()

const profiles = new Map<string, Profile>()

// PROTOCOL.md › Profile moderation: flagged people are never proposed, offered or offered to
const dangerous = new Set<string>()

// pair key → no new proposal for the pair before then
const passedPairs = new Map<string, number>()

// planId → who has opened the compass
const going = new Map<string, Set<string>>()

let proposedAt = 0

export async function loadPlans(
  repo: PlanRepo,
  profileFor: (userId: string) => Promise<Profile | undefined>,
  isDangerous: (userId: string) => Promise<boolean>,
) {
  planStore.repo = repo
  const saved = await repo.load()
  setVenues(saved.venues)
  for (const row of saved.rows) plans.set(row.id, row)
  for (const [userId, at] of saved.anchors) anchors.set(userId, at)

  const ids = new Set([...anchors.keys(), ...saved.rows.flatMap((r) => [r.ownerId, r.guestId])])
  await Promise.all(
    [...ids].map(async (id) => {
      const profile = id && (await profileFor(id))
      if (profile) rememberProfile(id, profile, await isDangerous(id))
    }),
  )
}

export function resetPlans() {
  plans.clear()
  anchors.clear()
  profiles.clear()
  dangerous.clear()
  passedPairs.clear()
  going.clear()
  proposedAt = 0
  planStore.repo = memoryRepo()
}

// moderation is sticky, so a flag is only ever added
export function rememberProfile(userId: string, profile: Profile, isDangerous = false) {
  profiles.set(userId, profile)
  if (isDangerous) dangerous.add(userId)
}

export function pausePlans(userId: string) {
  dangerous.add(userId)
}

// what the pair still had planned ends as if the reporter called it off
export function planBlocked(link: PlanLink, me: string, them: string) {
  for (const row of [...plans.values()]) {
    if (!isMember(row, me) || !isMember(row, them)) continue
    const isOwnOpenInvite = row.kind === "invite" && row.ownerId === me && row.state !== "confirmed"
    if (isOwnOpenInvite) skipGuest(link, row, row.state === "taken" ? "filled" : "expired")
    else cancel(link, row, me)
  }
}

export function planHello(link: PlanLink, userId: string, profile: Profile, isDangerous = false) {
  rememberProfile(userId, profile, isDangerous)
  if (isDemo(userId)) anchors.set(userId, userId.endsWith("~b") ? STAGE_B : STAGE_A)
  snapshot(link, userId)
}

// as if they cancelled each plan; their stored rows and anchor go with the account by cascade
export function purgeUser(link: PlanLink, userId: string) {
  const isTheirs = (id: string | null) => !!id && (demoAccountOf(id) ?? id) === userId
  for (const store of [profiles, anchors, dangerous, ...going.values()]) {
    for (const id of store.keys()) if (isTheirs(id)) store.delete(id)
  }
  for (const key of passedPairs.keys()) if (key.split("|").some(isTheirs)) passedPairs.delete(key)

  for (const row of [...plans.values()]) {
    const me = [row.ownerId, row.guestId].find(isTheirs)
    if (me) cancel(link, row, me)
  }
}

export function planDisconnect(userId: string) {
  for (const who of going.values()) who.delete(userId)
}

export function planSessionEnded(link: PlanLink, planId: string, isMet: boolean) {
  going.delete(planId)
  const row = plans.get(planId)
  if (isMet && row) drop(link, row, both(row, "done"))
}

export function planReceive(link: PlanLink, client: Client, msg: PlanMsg) {
  const me = client.id
  switch (msg.t) {
    case "plans_get":
      return plansGet(link, me, msg)

    case "plan_invite":
      return invite(link, client, msg)

    default: {
      const row = plans.get(msg.planId)
      if (!row || !isMember(row, me)) return error(link, me, "invalid_plan")

      switch (msg.t) {
        case "plan_accept":
          return accept(link, row, me, msg.venueId)
        case "plan_pass":
          return pass(link, row, me)
        case "plan_confirm":
          return confirm(link, row, me)
        case "plan_cancel":
          return cancel(link, row, me)
        case "plan_go":
          return go(link, row, client)
      }
    }
  }
}

export function planTick(link: PlanLink) {
  const now = link.now()
  for (const row of [...plans.values()]) {
    const isLapsed = row.expiresAt !== null && now >= row.expiresAt

    if (row.kind === "proposal" && row.state === "proposed" && isLapsed) {
      drop(link, row, both(row, "expired"))
    } else if (row.state === "offered" && isLapsed) {
      skipGuest(link, row, "expired")
    } else if (row.state === "open") {
      offerNext(link, row)
    } else if (row.state === "taken" && now >= row.startsAt) {
      drop(link, row, both(row, "expired"))
    } else if (row.state === "confirmed" && now >= row.startsAt + DAY_MS) {
      drop(link, row, both(row, "done"))
    }
  }

  if (now - proposedAt < link.config.planProposeIntervalMs) return
  proposedAt = now
  propose(link)
}

function plansGet(link: PlanLink, me: string, msg: unknown) {
  const parsed = parsePlansGet(msg)
  if (!parsed.ok) return error(link, me, parsed.error)

  const { lat, lng } = parsed.value
  if (lat !== undefined && lng !== undefined && !isDemo(me)) {
    const at = cellCentre({ lat, lng }, ANCHOR_PRECISION)
    anchors.set(me, at)
    planStore.repo.saveAnchor(me, at).catch(logFailure)
  }

  propose(link, me)
  snapshot(link, me)
}

function invite(link: PlanLink, client: Client, msg: unknown) {
  const me = client.id
  const parsed = parsePlanInvite(msg)
  if (!parsed.ok) return error(link, me, parsed.error)

  const { mode, category, intents, venueId, flex, until } = parsed.value
  if (mode === "date" && !client.profile?.adult) return error(link, me, "adult_required")
  if (!venueById.get(venueId)?.modes.includes(mode)) return error(link, me, "invalid_venue")
  if (openInvites(me) >= OPEN_INVITES_MAX) return error(link, me, "too_many_invites")

  const slots = parsed.value.slots.map((s) => Date.parse(s))
  const row: PlanRow = {
    id: `p_${shortId()}`,
    kind: "invite",
    mode,
    category,
    intents,
    venueId,
    alts: [],
    slots,
    startsAt: slots[0] ?? 0,
    flex,
    until,
    state: "open",
    ownerId: me,
    guestId: null,
    accepted: [],
    passed: [],
    suggestedBy: null,
    expiresAt: null,
  }
  if (!offerable(row, link.now()).length) return error(link, me, "invalid_until")

  save(row)
  push(link, row)
  offerNext(link, row)
}

function accept(link: PlanLink, row: PlanRow, me: string, venueId?: string) {
  if (row.kind === "invite") {
    if (row.state === "taken" || row.state === "confirmed") return
    if (row.guestId !== me || row.state !== "offered") return error(link, me, "invalid_plan")
    row.state = "taken"
    row.expiresAt = null
    save(row)
    return push(link, row)
  }

  if (row.state !== "proposed") return
  const isSuggestion = venueId !== undefined && venueId !== row.venueId
  if (isSuggestion) {
    if (!row.alts.includes(venueId)) return error(link, me, "invalid_venue")
    row.alts = [row.venueId, ...row.alts.filter((id) => id !== venueId)]
    row.venueId = venueId
    row.accepted = [me]
    row.suggestedBy = me
  } else if (!row.accepted.includes(me)) {
    row.accepted.push(me)
  }

  if (row.accepted.length === 2) {
    row.state = "confirmed"
    row.expiresAt = null
  }
  save(row)
  push(link, row)
}

function pass(link: PlanLink, row: PlanRow, me: string) {
  if (row.kind === "proposal" && row.state === "proposed") return passProposal(link, row)
  if (row.kind === "invite" && row.guestId === me && row.state === "offered") {
    return skipGuest(link, row, "expired")
  }
  if (row.kind === "invite" && row.ownerId === me && row.state === "taken") {
    return skipGuest(link, row, "filled")
  }
  error(link, me, "invalid_plan")
}

function confirm(link: PlanLink, row: PlanRow, me: string) {
  if (row.kind !== "invite" || row.ownerId !== me || row.state !== "taken") {
    return error(link, me, "invalid_plan")
  }
  row.state = "confirmed"
  save(row)
  push(link, row)
}

function cancel(link: PlanLink, row: PlanRow, me: string) {
  if (row.state === "confirmed") return drop(link, row, both(row, "cancelled"))
  if (row.kind === "proposal") return passProposal(link, row)
  if (row.guestId === me) return skipGuest(link, row, "cancelled")

  const guest = row.guestId
  const reasons: Record<string, PlanRemovedReason> = { [me]: "cancelled" }
  if (guest) reasons[guest] = row.state === "taken" ? "cancelled" : "expired"
  drop(link, row, reasons)
}

function go(link: PlanLink, row: PlanRow, client: Client) {
  const me = client.id
  const now = link.now()
  if (row.state !== "confirmed" || !row.guestId) return error(link, me, "invalid_plan")
  if (now < row.startsAt - link.config.planCompassLeadMs) return error(link, me, "plan_not_yet")
  if (now > row.startsAt + link.config.planSessionTtlMs) return error(link, me, "invalid_plan")

  client.planGo = row.id
  const who = going.get(row.id) ?? new Set()
  going.set(row.id, who.add(me))
  if (who.size < 2) return

  if (link.startSession([row.ownerId, row.guestId], row.id)) going.delete(row.id)
}

function passProposal(link: PlanLink, row: PlanRow) {
  passedPairs.set(pairKey(row.ownerId, row.guestId), link.now() + PASSED_PAIR_MS)
  drop(link, row, both(row, "expired"))
}

// the guest leaves an invitation without the owner learning why: it goes back to open
function skipGuest(link: PlanLink, row: PlanRow, reason: PlanRemovedReason) {
  const guest = row.guestId
  if (!guest) return

  row.passed.push(guest)
  row.guestId = null
  row.state = "open"
  row.startsAt = row.slots[0] ?? row.startsAt
  row.expiresAt = null
  save(row)
  link.send(guest, { t: "plan_removed", planId: row.id, reason })
  push(link, row)
  offerNext(link, row)
}

function offerNext(link: PlanLink, row: PlanRow) {
  const now = link.now()
  const times = offerable(row, now)
  if (!times.length) return drop(link, row, { [row.ownerId]: "expired" })

  const owner = profiles.get(row.ownerId)
  if (!owner || dangerous.has(row.ownerId)) return

  const search: Search = {
    mode: row.mode,
    category: row.category,
    intents: row.intents,
    walkMin: 15,
  }
  const busy = new Set(
    [...plans.values()].flatMap((r) => (r.state === "offered" ? [r.guestId] : [])),
  )
  const slack = row.flex ? FLEX_MIN : 0

  const best = [...anchors.keys()]
    .filter((id) => id !== row.ownerId && !row.passed.includes(id) && !busy.has(id))
    .filter((id) => !dangerous.has(id) && !isBlocked(id, row.ownerId))
    .filter((id) => demoAccountOf(id) === demoAccountOf(row.ownerId))
    .flatMap((id) => {
      const profile = profiles.get(id)
      if (!profile) return []
      const score = fit({ profile: owner, search }, { profile, search })
      const booked = bookedTimes(id)
      const at = isDemo(id)
        ? times[0]
        : times.find((t) => isFree(profile, row.mode, t, slack) && isClear(booked, t))
      return score === undefined || at === undefined ? [] : [{ id, score, at }]
    })
    .toSorted((x, y) => y.score - x.score)[0]
  if (!best) return

  row.guestId = best.id
  row.state = "offered"
  row.startsAt = best.at
  row.expiresAt = Math.min(now + link.config.planOfferTtlMs, cutoff(row, best.at))
  save(row)
  push(link, row)
}

function propose(link: PlanLink, only?: string) {
  const now = link.now()
  const busy = new Set(
    [...plans.values()].flatMap((r) =>
      r.kind === "proposal" && r.state === "proposed" ? [r.ownerId, r.guestId] : [],
    ),
  )
  const people = [...anchors.keys()].filter(
    (id) => profiles.has(id) && !busy.has(id) && !dangerous.has(id),
  )
  const linked = new Set([...plans.values()].map((r) => pairKey(r.ownerId, r.guestId)))

  const picks = people
    .flatMap((a, i) => people.slice(i + 1).map((b) => [a, b] as const))
    .filter(([a, b]) => !only || a === only || b === only)
    .filter(([a, b]) => !linked.has(pairKey(a, b)))
    .flatMap(([a, b]) => proposal(a, b, now, link.config))
    .toSorted((x, y) => y.score - x.score)

  const taken = new Set<string | null>()
  for (const { row } of picks) {
    if (taken.has(row.ownerId) || taken.has(row.guestId)) continue
    taken.add(row.ownerId).add(row.guestId)
    save(row)
    push(link, row)
  }
}

function proposal(a: string, b: string, now: number, config: Config) {
  const pa = profiles.get(a)
  const pb = profiles.get(b)
  const from = [anchors.get(a), anchors.get(b)]
  if (!pa || !pb || !from[0] || !from[1] || demoAccountOf(a) !== demoAccountOf(b)) return []
  if ((passedPairs.get(pairKey(a, b)) ?? 0) > now || isBlocked(a, b)) return []

  const mode = pa.mode === pb.mode ? pa.mode : "mate"
  const what = sharedIntent(mode, pa, pb)
  if (!what) return []

  const search: Search = { mode, intents: [what.intent], category: what.category, walkMin: 15 }
  const score = fit({ profile: pa, search }, { profile: pb, search })
  if (score === undefined) return []

  const demo = isDemo(a)
  const anchored = from as LatLng[]
  const fitting = venues
    .filter((v) => v.modes.includes(mode) && v.fits.includes(what.intent))
    .map((venue) => ({ venue, far: Math.max(...anchored.map((p) => distanceM(p, venue))) }))
    .filter((x) => demo || x.far <= MAX_WALK_M)
    .toSorted((x, y) => x.far - y.far)
    .map((x) => x.venue)

  const booked = [...bookedTimes(a), ...bookedTimes(b)]
  const times = demo
    ? [demoStart(now)]
    : freeTimes(pa, pb, mode, now).filter((t) => isClear(booked, t))
  for (const startsAt of times) {
    const [venue, ...alts] = fitting.filter((v) => demo || isOpen(v, startsAt))
    if (!venue) continue

    const ttl = now + config.planProposalTtlMs
    const row: PlanRow = {
      id: `p_${shortId()}`,
      kind: "proposal",
      mode,
      category: what.category,
      intents: [what.intent],
      venueId: venue.id,
      alts: alts.slice(0, 2).map((v) => v.id),
      slots: [startsAt],
      startsAt,
      flex: false,
      until: "2h",
      state: "proposed",
      ownerId: a,
      guestId: b,
      accepted: [],
      passed: [],
      suggestedBy: null,
      expiresAt: demo ? ttl : Math.min(ttl, startsAt - config.planCompassLeadMs),
    }
    return [{ row, score }]
  }
  return []
}

// the first intent of the mode, in category order, that both people list as an interest
function sharedIntent(mode: Mode, a: Profile, b: Profile) {
  for (const category of CATEGORIES[mode]) {
    const intent = category.intents.find((i) => a.interests.includes(i) && b.interests.includes(i))
    if (intent) return { category: category.id, intent: intent as Intent }
  }
}

function fit(a: { profile: Profile; search: Search }, b: { profile: Profile; search: Search }) {
  if (!canMatch(a, b)) return
  const score = compat(a, b)
  return score >= COMPAT_THRESHOLD ? score : undefined
}

function freeTimes(a: Profile, b: Profile, mode: Mode, now: number): number[] {
  const first = Math.ceil((now + PROPOSE_AHEAD_MS) / GRID_MS) * GRID_MS
  const count = PROPOSE_WITHIN_MS / GRID_MS
  return Array.from({ length: count }, (_, i) => first + i * GRID_MS).filter(
    (t) => isFree(a, mode, t) && isFree(b, mode, t),
  )
}

function openInvites(userId: string): number {
  return [...plans.values()].filter(
    (r) => r.kind === "invite" && r.ownerId === userId && r.state !== "confirmed",
  ).length
}

// an invitation still held out holds all its times
function bookedTimes(userId: string): number[] {
  return [...plans.values()]
    .filter((r) => isMember(r, userId))
    .flatMap((r) =>
      r.ownerId === userId && (r.state === "open" || r.state === "offered")
        ? r.slots
        : [r.startsAt],
    )
}

function isClear(booked: number[], t: number): boolean {
  return booked.every((b) => Math.abs(t - b) >= CLASH_MS)
}

function demoStart(now: number): number {
  return Math.ceil((now + DEMO_LEAD_MS) / MIN_MS) * MIN_MS
}

function offerable(row: PlanRow, now: number): number[] {
  return row.slots.filter((t) => cutoff(row, t) > now)
}

// "2h": two hours before · "day": the city's midnight before that day; demo times stay offerable
function cutoff(row: PlanRow, t: number): number {
  if (isDemo(row.ownerId)) return t
  return row.until === "2h" ? t - 2 * HOUR_MS : atLocal(t, 0)
}

function view(row: PlanRow, me: string, now: number): Plan {
  const isOwner = row.ownerId === me
  const mine = row.kind === "invite" && isOwner
  const other = isOwner ? row.guestId : row.ownerId
  const isHidden = mine && (row.state === "open" || row.state === "offered")
  const them = other && !isHidden ? profiles.get(other) : undefined
  const startsAt = isHidden ? (row.slots[0] ?? row.startsAt) : row.startsAt

  const isPick =
    row.kind === "proposal" ? row.state === "proposed" : !mine && row.state === "offered"
  const venue = venueById.get(row.venueId)
  const from = other ? anchors.get(other) : undefined

  return {
    id: row.id,
    kind: row.kind,
    state: isHidden ? "open" : row.state,
    mine,
    mode: row.mode,
    category: row.category,
    intents: row.intents,
    startsAt: new Date(startsAt).toISOString(),
    startsInMs: startsAt - now,
    venueId: row.venueId,
    ...(them && { partner: partnerCard(them) }),
    ...(isPick && from && venue && { partnerWalkMin: walkMin(from, venue) }),
    ...(isPick && row.expiresAt !== null && { expiresInMs: Math.max(0, row.expiresAt - now) }),
    ...(row.kind === "proposal" && {
      alts: row.alts,
      accepted: row.accepted.includes(me),
      suggested: other !== null && row.suggestedBy === other,
    }),
    ...(mine && {
      slots: row.slots.map((t) => new Date(t).toISOString()),
      flex: row.flex,
      until: row.until,
    }),
  }
}

function walkMin(from: LatLng, venue: Venue): number {
  return Math.max(1, Math.round(distanceM(from, venue) / WALK_M_PER_MIN))
}

function snapshot(link: PlanLink, me: string) {
  const now = link.now()
  const mine = [...plans.values()].filter((r) => isMember(r, me)).map((r) => view(r, me, now))
  link.send(me, { t: "plans", plans: mine })
}

function push(link: PlanLink, row: PlanRow) {
  const now = link.now()
  for (const id of [row.ownerId, row.guestId]) {
    if (id) link.send(id, { t: "plan_update", plan: view(row, id, now) })
  }
}

function drop(link: PlanLink, row: PlanRow, reasons: Record<string, PlanRemovedReason>) {
  plans.delete(row.id)
  going.delete(row.id)
  const isEnded = Object.values(reasons).some((r) => r === "done" || r === "cancelled")
  if (isEnded && row.guestId && !isDemoRow(row)) {
    passedPairs.set(pairKey(row.ownerId, row.guestId), link.now() + PASSED_PAIR_MS)
  }
  if (!isDemoRow(row)) planStore.repo.remove(row.id).catch(logFailure)
  for (const [id, reason] of Object.entries(reasons)) {
    link.send(id, { t: "plan_removed", planId: row.id, reason })
  }
}

function save(row: PlanRow) {
  plans.set(row.id, row)
  if (!isDemoRow(row)) planStore.repo.save(row).catch(logFailure)
}

function both(row: PlanRow, reason: PlanRemovedReason): Record<string, PlanRemovedReason> {
  return Object.fromEntries([row.ownerId, row.guestId].flatMap((id) => (id ? [[id, reason]] : [])))
}

function isMember(row: PlanRow, userId: string): boolean {
  return row.ownerId === userId || row.guestId === userId
}

function pairKey(a: string, b: string | null): string {
  return [a, b].sort().join("|")
}

// demo sockets are `<account id>~a|b`: never persisted, never planned with anyone else
function isDemo(userId: string): boolean {
  return userId.includes("~")
}

function isDemoRow(row: PlanRow): boolean {
  return isDemo(row.ownerId)
}

function error(link: PlanLink, userId: string, code: string) {
  link.send(userId, { t: "error", code, message: "see PROTOCOL.md › Plans" })
}

function logFailure(err: unknown) {
  console.error("plans: storage failed", err)
}

function shortId(): string {
  return crypto.randomUUID().slice(0, 8)
}
