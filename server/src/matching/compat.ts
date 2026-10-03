import {
  badgeSeed,
  type Config,
  findCategory,
  type Intent,
  type MatchPartner,
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
  if (a.search.mode !== b.search.mode || a.search.category !== b.search.category) return false
  if (!sharedIntents(a.search, b.search).length) return false
  if (a.profile.adult !== b.profile.adult) return false

  if (a.search.mode === "date")
    return datesWith(a.profile, b.profile) && datesWith(b.profile, a.profile)
  return matesWith(a.profile, b.profile) && matesWith(b.profile, a.profile)
}

function datesWith(me: Profile, them: Profile): boolean {
  const seeks = SEEK_GENDER[me.date.seek]
  return me.adult && (!seeks || seeks === them.gender) && inRange(me.date, them.age)
}

function matesWith(me: Profile, them: Profile): boolean {
  const isSameGenderOk = me.mate.who === "anyone" || me.gender === them.gender
  return isSameGenderOk && inRange(me.mate, them.age)
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
