import { describe, expect, test } from "bun:test"
import {
  badgeSeed,
  parsePlanInvite,
  parsePlansGet,
  parseProfile,
  parseQuestionRequest,
  parseRelatedRequest,
  parseReport,
  parseSearchOn,
  parseVibeRequest,
} from "@justmate/protocol"

import { makeProfile } from "./fixtures"

function errorFor(overrides: Record<string, unknown>) {
  const parsed = parseProfile({ ...makeProfile(), ...overrides })
  return parsed.ok ? undefined : parsed.error
}

describe("parseProfile", () => {
  test("a complete profile parses and loses unknown keys", () => {
    const parsed = parseProfile({ ...makeProfile({ name: " Alex " }), password: "x" })
    expect(parsed).toEqual({ ok: true, value: makeProfile() })
  })

  test("anything but an object is rejected", () => {
    expect(parseProfile("hi")).toEqual({ ok: false, error: "invalid_profile" })
    expect(parseProfile(null)).toEqual({ ok: false, error: "invalid_profile" })
  })

  test("interests need 3 unique lowercase picks", () => {
    expect(errorFor({ interests: ["coffee", "wine"] })).toBe("invalid_interests")
    expect(errorFor({ interests: ["coffee", "wine", "Cinema"] })).toBe("invalid_interests")
    expect(errorFor({ interests: ["coffee", "wine", "wine"] })).toBe("invalid_interests")
    expect(errorFor({ interests: ["coffee", "wine", "flat white"] })).toBeUndefined()
  })

  test("age stays within 16–99", () => {
    expect(errorFor({ age: 15, adult: false, mode: "mate" })).toBe("invalid_age")
    expect(errorFor({ age: 27.5 })).toBe("invalid_age")
  })

  test("adult has to match the age", () => {
    expect(errorFor({ age: 17 })).toBe("invalid_adult")
    expect(errorFor({ age: 30, adult: false, mode: "mate" })).toBe("invalid_adult")
    expect(errorFor({ age: 17, adult: false, mode: "mate" })).toBeUndefined()
  })

  test("date mode needs an adult", () => {
    expect(errorFor({ age: 17, adult: false, mode: "date" })).toBe("invalid_adult")
  })

  test("date age ranges start at 18 and stay ordered", () => {
    const date = makeProfile().date
    expect(errorFor({ date: { ...date, ageMin: 17 } })).toBe("invalid_date")
    expect(errorFor({ date: { ...date, ageMin: 40, ageMax: 30 } })).toBe("invalid_date")
    expect(errorFor({ date: { ...date, seek: "cats" } })).toBe("invalid_date")
  })

  test("mate slots come from the fixed list", () => {
    const mate = makeProfile().mate
    expect(errorFor({ mate: { ...mate, when: ["weekends", "weekends"] } })).toBe("invalid_mate")
    expect(errorFor({ mate: { ...mate, when: ["sometimes"] } })).toBe("invalid_mate")
    expect(errorFor({ mate: { ...mate, when: ["weekends", "after work"] } })).toBeUndefined()
  })

  test("settings need a known walk-up time and boolean switches", () => {
    const settings = makeProfile().settings
    expect(errorFor({ settings: { ...settings, walkMin: 7 } })).toBe("invalid_settings")
    expect(errorFor({ settings: { ...settings, haptics: "yes" } })).toBe("invalid_settings")
    expect(errorFor({ settings: { ...settings, startMode: "mate" } })).toBeUndefined()
  })

  test("the model-written texts may be empty but stay within their caps", () => {
    expect(errorFor({ appearance: "", taste: "", character: "" })).toBeUndefined()
    expect(errorFor({ appearance: "x".repeat(301) })).toBe("invalid_appearance")
    expect(errorFor({ taste: 3 })).toBe("invalid_taste")
    expect(errorFor({ character: undefined })).toBe("invalid_character")
  })
})

describe("parseSearchOn", () => {
  const search = { t: "search_on", mode: "date", category: "night", intents: ["dancing"] } as const

  test("a category's own intents and other are accepted", () => {
    expect(parseSearchOn({ ...search, intents: ["dancing", "other"], walkMin: 5 })).toEqual({
      ok: true,
      value: { ...search, intents: ["dancing", "other"], walkMin: 5 },
    })
  })

  test("each field has its own error code", () => {
    const codes = [
      { ...search, mode: "love" },
      { ...search, category: "sports" },
      { ...search, intents: [] },
      { ...search, intents: ["beer"] },
      { ...search, intents: ["dancing", "dancing"] },
      { ...search, walkMin: 20 },
    ].map((s) => {
      const parsed = parseSearchOn(s)
      return parsed.ok || parsed.error
    })
    expect(codes).toEqual([
      "invalid_mode",
      "invalid_category",
      "invalid_intents",
      "invalid_intents",
      "invalid_intents",
      "invalid_walk",
    ])
  })
})

const invite = {
  t: "plan_invite",
  mode: "mate",
  category: "games",
  intents: ["chess"],
  slots: ["2026-10-08T17:00:00.000Z", "2026-10-07T17:00:00Z"],
  flex: true,
  venueId: "meeple",
  until: "day",
} as const

describe("parsePlanInvite", () => {
  test("a valid invitation parses with its times normalised and sorted", () => {
    expect(parsePlanInvite(invite)).toEqual({
      ok: true,
      value: {
        ...invite,
        intents: ["chess"],
        slots: ["2026-10-07T17:00:00.000Z", "2026-10-08T17:00:00.000Z"],
      },
    })
  })

  test("what is checked like search_on", () => {
    expect(parsePlanInvite({ ...invite, category: "night" })).toEqual({
      ok: false,
      error: "invalid_category",
    })
    expect(parsePlanInvite({ ...invite, intents: ["wine"] }).ok).toBe(false)
  })

  test("times must be 1–40 unique dates", () => {
    const error = { ok: false, error: "invalid_slots" } as const
    expect(parsePlanInvite({ ...invite, slots: [] })).toEqual(error)
    expect(parsePlanInvite({ ...invite, slots: ["thursday"] })).toEqual(error)
    expect(
      parsePlanInvite({ ...invite, slots: ["2026-10-07T17:00:00Z", "2026-10-07T17:00:00.000Z"] }),
    ).toEqual(error)
  })

  test("venue, flex and until are required", () => {
    expect(parsePlanInvite({ ...invite, venueId: "" })).toEqual({
      ok: false,
      error: "invalid_venue",
    })
    expect(parsePlanInvite({ ...invite, flex: "yes" })).toEqual({
      ok: false,
      error: "invalid_flex",
    })
    expect(parsePlanInvite({ ...invite, until: "1h" })).toEqual({
      ok: false,
      error: "invalid_until",
    })
  })
})

describe("parsePlansGet", () => {
  test("the position is optional but must be valid when sent", () => {
    expect(parsePlansGet({ t: "plans_get" })).toEqual({ ok: true, value: {} })
    expect(parsePlansGet({ lat: 50, lng: 19.9 })).toEqual({
      ok: true,
      value: { lat: 50, lng: 19.9 },
    })
    expect(parsePlansGet({ lat: 50 })).toEqual({ ok: false, error: "invalid_position" })
  })
})

describe("parseReport", () => {
  test("needs a session id; the reason is optional but must be known", () => {
    expect(parseReport({ t: "report", sessionId: "s_1", junk: 1 })).toEqual({
      ok: true,
      value: { t: "report", sessionId: "s_1", reason: undefined },
    })
    expect(parseReport({ sessionId: "s_1", reason: "no_show" }).ok).toBe(true)
    expect(parseReport({ sessionId: "" })).toEqual({ ok: false, error: "invalid_session" })
    expect(parseReport({ sessionId: "s_1", reason: "rude" })).toEqual({
      ok: false,
      error: "invalid_reason",
    })
  })
})

describe("onboarding requests", () => {
  test("well-formed bodies parse", () => {
    const qa = [{ q: "Pick a deal-breaker.", a: "no banter" }]
    expect(parseQuestionRequest({ mode: "mate", name: "", interests: ["chess"], qa }).ok).toBe(true)
    expect(parseVibeRequest({ mode: "mate", interests: ["chess"], qa }).ok).toBe(true)
    expect(parseRelatedRequest({ mode: "date", item: "Coffee", have: [] })).toEqual({
      ok: true,
      value: { mode: "date", item: "coffee", have: [] },
    })
  })

  test("malformed bodies are invalid_request", () => {
    expect(parseQuestionRequest({ mode: "date", name: "A", interests: "coffee", qa: [] })).toEqual({
      ok: false,
      error: "invalid_request",
    })
    expect(parseVibeRequest({ mode: "date", interests: [], qa: [], avoid: [1] }).ok).toBe(false)
    expect(parseRelatedRequest({ mode: "date", item: "", have: [] }).ok).toBe(false)
  })
})

test("the badge seed is the prototype's djb2 hash", () => {
  expect(badgeSeed([], [])).toBe(5861099)
  expect(badgeSeed(["coffee"], [{ q: "?", a: "x" }])).toBe(
    badgeSeed(["coffee"], [{ q: "!", a: "x" }]),
  )
})
