import { DEFAULT_PROFILE, type Position, type Profile } from "@justmate/protocol"

import { bearing, type LatLng, offset } from "../matching/geo"

// compatible both ways in both modes, so the stage pair matches whatever the presenters pick
const base: Profile = {
  ...DEFAULT_PROFILE,
  age: 27,
  adult: true,
  verified: true,
  date: { seek: "everyone", ageMin: 18, ageMax: 99, looking: "see where it goes" },
  mate: { ...DEFAULT_PROFILE.mate, ageMin: 18, ageMax: 99 },
}

export const DEMO_PROFILES: Record<"a" | "b", Profile> = {
  a: {
    ...base,
    name: "Ola",
    gender: "woman",
    interests: ["photography", "coffee", "travel", "running"],
    qa: [
      { q: "Perfect first hour with someone new?", a: "a long walk, no plan" },
      { q: "Your friends would call you…", a: "the planner" },
    ],
    vibe: "early bird with a film camera — opinions on oat milk",
  },
  b: {
    ...base,
    mode: "mate",
    name: "Kuba",
    gender: "man",
    interests: ["coffee", "running", "street food", "cinema"],
    qa: [
      { q: "Nothing planned tonight. What's the move?", a: "grab a pint" },
      { q: "Pick a deal-breaker.", a: "no banter" },
    ],
    vibe: "quietly funny — will out-argue you about pizza",
  },
}

function stage(name: string, fallback: string): LatLng {
  const [lat = Number.NaN, lng = Number.NaN] = (process.env[name] || fallback)
    .split(",")
    .map(Number)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error(`${name} must be "lat,lng"`)
  return { lat, lng }
}

export const STAGE_A = stage("STAGE_A", "50.0680,19.9120")
export const STAGE_B = stage("STAGE_B", "50.0684,19.9135")

// b walks the stage line, so the scripted bearing matches the direction B physically walks
const WALK_BEARING = bearing(STAGE_A, STAGE_B)

const TRACK_START_M = 280

// seconds per leg and where it ends, ≥ 8 s in every bucket
const TRACK = [
  { s: 8, toM: 200 },
  { s: 10, toM: 80 },
  { s: 10, toM: 30 },
  { s: 12, toM: 2 },
]

// demo socket ids are `<account id>~a|b`
export function demoAccountOf(id: string): string | undefined {
  return id.includes("~") ? id.split("~")[0] : undefined
}

export function trackDistanceM(walkingMs: number): number {
  let left = walkingMs / 1000
  let from = TRACK_START_M
  for (const leg of TRACK) {
    if (left < leg.s) return from + ((leg.toM - from) * left) / leg.s
    left -= leg.s
    from = leg.toM
  }
  return from
}

export function demoPosition(side: "a" | "b", walkingMs = 0): Position {
  const at = side === "a" ? STAGE_A : offset(STAGE_A, WALK_BEARING, trackDistanceM(walkingMs))
  return { ...at, acc: 5 }
}

// [bearing, metres] from STAGE_A; each ghost circles 40 m around its spot once a minute
const GHOSTS: [number, number][] = [
  [30, 350],
  [40, 420],
  [55, 380],
  [200, 500],
  [215, 560],
  [230, 470],
  [120, 800],
  [300, 650],
  [310, 700],
]

export function ghostPositions(now: number): LatLng[] {
  return GHOSTS.map(([deg, meters], i) => {
    const spin = (now / 60_000 + i / GHOSTS.length) * 360
    return offset(offset(STAGE_A, deg, meters), spin % 360, 40)
  })
}
