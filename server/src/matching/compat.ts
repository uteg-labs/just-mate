import {
  badgeSeed,
  type Config,
  findCategory,
  type Intent,
  type MatchPartner,
  type Mode,
  OTHER_INTENT,
  type Profile,
  type Search,
  type Seek,
} from "@justmate/protocol"

export const COMPAT_THRESHOLD = 0.45

export type Seeker = { profile: Profile; search: Search }

type AgeRange = { ageMin: number; ageMax: number }

const SEEK_GENDER: Record<Seek, string | undefined> = {
  women: "woman",
  men: "man",
  everyone: undefined,
}

// in the category's own order, "other" last, so both sides agree on the first one
export function sharedIntents(a: Search, b: Search): Intent[] {
  const order: readonly string[] = findCategory(a.mode, a.category)?.intents ?? []
  const rank = (i: Intent) => (i === OTHER_INTENT ? order.length : order.indexOf(i))
  return a.intents.filter((i) => b.intents.includes(i)).toSorted((x, y) => rank(x) - rank(y))
}

// hard gates from PROTOCOL.md rules 1–2; distance, cooldown and offer state live in the loop
export function canMatch(a: Seeker, b: Seeker): boolean {
  return !gateMiss(a, b)
}

// the first hard gate the pair fails, named for the log; relaxed keeps only mode and age safety
export function gateMiss(a: Seeker, b: Seeker, relaxed = false): string | undefined {
  const { mode } = a.search
  if (mode !== b.search.mode) return "mode"
  if (a.profile.adult !== b.profile.adult) return "adult"
  if (mode === "date" && !a.profile.adult) return "adult"
  if (relaxed) return

  if (a.search.category !== b.search.category) return "category"
  if (!sharedIntents(a.search, b.search).length) return "intents"
  return prefsMiss(a.profile, b.profile, mode) ?? prefsMiss(b.profile, a.profile, mode)
}

function prefsMiss(me: Profile, them: Profile, mode: Mode): string | undefined {
  if (!acceptsGender(me, them, mode)) return "gender"
  return inRange(me[mode], them.age) ? undefined : "age range"
}

function acceptsGender(me: Profile, them: Profile, mode: Mode): boolean {
  if (mode === "mate") return me.mate.who === "anyone" || me.gender === them.gender
  const seeks = SEEK_GENDER[me.date.seek]
  return !seeks || seeks === them.gender
}

function inRange(range: AgeRange, age: number): boolean {
  return age >= range.ageMin && age <= range.ageMax
}

export function compat(a: Seeker, b: Seeker): number {
  const shared = sharedIntents(a.search, b.search).length
  return 0.7 * jaccard(a.profile.interests, b.profile.interests) + 0.3 * Math.min(1, shared)
}

function jaccard(a: string[], b: string[]): number {
  const left = new Set(a)
  const right = new Set(b)
  const union = left.union(right).size
  return union ? left.intersection(right).size / union : 0
}

export function matchRadiusM(a: Search, b: Search, config: Config): number {
  return Math.min(config.walkRadiusM[a.walkMin], config.walkRadiusM[b.walkMin])
}

export function partnerCard(profile: Profile): MatchPartner {
  return {
    vibe: profile.vibe,
    interests: profile.interests.slice(0, 3),
    badgeSeed: badgeSeed(profile.interests, profile.qa),
    tags: { verified: profile.verified, adult: profile.adult },
  }
}
