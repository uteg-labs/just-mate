import { describe, expect, test } from "bun:test"
import { badgeSeed, DEFAULT_CONFIG, type Profile, type Search } from "@justmate/protocol"

import {
  canMatch,
  compat,
  gateMiss,
  matchRadiusM,
  partnerCard,
  type Seeker,
} from "../src/matching/compat"
import { makeProfile } from "./fixtures"

const mateBeer: Search = { mode: "mate", category: "food", intents: ["beer"], walkMin: 10 }
const dateWine: Search = { mode: "date", category: "food", intents: ["wine"], walkMin: 10 }

function seeker(profile: Partial<Profile> = {}, search: Partial<Search> = {}): Seeker {
  return { profile: makeProfile(profile), search: { ...mateBeer, ...search } }
}

const minor = { age: 16, adult: false }
const her = { gender: "woman" as const }
const him = { gender: "man" as const }

describe("mode, category and intents", () => {
  test("two compatible searches in the same category match", () => {
    expect(canMatch(seeker(), seeker())).toBe(true)
  })

  test("modes never mix", () => {
    expect(canMatch(seeker({}, dateWine), seeker({}, { ...dateWine, mode: "mate" }))).toBe(false)
  })

  test("the same intent in another category does not match", () => {
    expect(canMatch(seeker(), seeker({}, { category: "games" }))).toBe(false)
  })

  test("at least one intent must be shared", () => {
    expect(canMatch(seeker(), seeker({}, { intents: ["coffee"] }))).toBe(false)
    expect(
      canMatch(seeker({}, { intents: ["beer", "pizza"] }), seeker({}, { intents: ["pizza"] })),
    ).toBe(true)
  })
})

describe("adult segregation", () => {
  test("an adult is never offered a non-adult", () => {
    const wide = { mate: { ...makeProfile().mate, ageMin: 16, ageMax: 99 } }
    expect(canMatch(seeker(wide), seeker({ ...wide, ...minor }))).toBe(false)
    expect(canMatch(seeker({ ...wide, ...minor }), seeker(wide))).toBe(false)
  })

  test("two non-adults can match in mate mode", () => {
    const teen = { ...minor, mate: { ...makeProfile().mate, ageMin: 16, ageMax: 17 } }
    expect(canMatch(seeker(teen), seeker(teen))).toBe(true)
  })

  test("non-adults never match in date mode", () => {
    expect(canMatch(seeker(minor, dateWine), seeker(minor, dateWine))).toBe(false)
  })
})

describe("date preferences", () => {
  const seeksMen = { ...her, date: { ...makeProfile().date, seek: "men" as const } }
  const seeksWomen = { ...him, date: { ...makeProfile().date, seek: "women" as const } }

  test("seek has to accept the other gender both ways", () => {
    expect(canMatch(seeker(seeksMen, dateWine), seeker(seeksWomen, dateWine))).toBe(true)
    expect(canMatch(seeker(seeksMen, dateWine), seeker({ ...seeksWomen, ...her }, dateWine))).toBe(
      false,
    )
  })

  test("everyone accepts any gender", () => {
    expect(canMatch(seeker({ gender: "non-binary" }, dateWine), seeker(him, dateWine))).toBe(true)
  })

  test("each age has to sit inside the other's range", () => {
    const young = { age: 22, date: { ...makeProfile().date, ageMin: 20, ageMax: 30 } }
    expect(canMatch(seeker(young, dateWine), seeker({}, dateWine))).toBe(false)
    expect(canMatch(seeker({ age: 25 }, dateWine), seeker({ age: 34 }, dateWine))).toBe(true)
  })
})

describe("mate preferences", () => {
  const sameGender = { ...her, mate: { ...makeProfile().mate, who: "same gender" as const } }

  test("same gender is checked both ways", () => {
    expect(canMatch(seeker(sameGender), seeker(her))).toBe(true)
    expect(canMatch(seeker(sameGender), seeker(him))).toBe(false)
    expect(canMatch(seeker(him), seeker(sameGender))).toBe(false)
  })

  test("mate age ranges are checked both ways", () => {
    expect(canMatch(seeker({ age: 40 }), seeker())).toBe(false)
  })
})

test("the failing gate is named for the log", () => {
  const sameGender = { ...her, mate: { ...makeProfile().mate, who: "same gender" as const } }
  expect(gateMiss(seeker(), seeker())).toBeUndefined()
  expect(gateMiss(seeker(), seeker({}, { category: "games" }))).toBe("category")
  expect(gateMiss(seeker(), seeker({}, { intents: ["coffee"] }))).toBe("intents")
  expect(gateMiss(seeker(sameGender), seeker(him))).toBe("gender")
  expect(gateMiss(seeker({ age: 22 }), seeker({ age: 23 }))).toBe("age range")
})

test("relaxed, only the mode and the adult rules gate", () => {
  const stranger = seeker(
    { ...him, age: 50, interests: [] },
    { category: "games", intents: ["chess"] },
  )
  expect(gateMiss(seeker({ age: 19 }), stranger, true)).toBeUndefined()
  expect(gateMiss(seeker(), seeker({}, dateWine), true)).toBe("mode")
  expect(gateMiss(seeker(minor), seeker(), true)).toBe("adult")
  expect(gateMiss(seeker(minor, dateWine), seeker(minor, dateWine), true)).toBe("adult")
})

describe("compat", () => {
  test("identical interests and a shared intent score 1", () => {
    expect(compat(seeker(), seeker())).toBe(1)
  })

  test("one shared interest out of six and a shared intent score 0.3 + 0.7 / 6", () => {
    const score = compat(
      seeker({ interests: ["a", "b", "c"] }),
      seeker({ interests: ["c", "d", "e", "f"] }),
    )
    expect(score).toBeCloseTo(0.3 + 0.7 / 6)
  })
})

test("the match radius is the shorter of the two walks", () => {
  expect(matchRadiusM(mateBeer, { ...mateBeer, walkMin: 5 }, DEFAULT_CONFIG)).toBe(400)
  expect(matchRadiusM({ ...mateBeer, walkMin: 15 }, mateBeer, DEFAULT_CONFIG)).toBe(800)
})

test("the partner card carries the badge and nothing else", () => {
  const profile = makeProfile({ verified: true })
  expect(partnerCard(profile)).toEqual({
    vibe: profile.vibe,
    interests: ["coffee", "wine", "cinema"],
    badgeSeed: badgeSeed(profile.interests, profile.qa),
    tags: { verified: true, adult: true },
  })
})
