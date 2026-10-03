/** Wire contract from `docs/PROTOCOL.md`. Change the doc first, then this file. */

/** Every profile, search and match lives in exactly one mode. */
export const MODES = ["date", "mate"] as const
export type Mode = (typeof MODES)[number]

/** "something else": a valid pick in every category; it only matches another `"other"`. */
export const OTHER_INTENT = "other"

export type Category = { id: string; label: string; intents: readonly string[] }

/** Search categories per mode, each with its own intents (`PROTOCOL.md` › Modes). */
export const CATEGORIES = {
  date: [
    {
      id: "food",
      label: "Food and drink",
      intents: ["coffee", "wine", "dinner", "brunch", "beer", "dessert", "street food", "tea"],
    },
    {
      id: "night",
      label: "Nightlife",
      intents: [
        "cocktails",
        "dancing",
        "karaoke",
        "late bar",
        "rooftop",
        "comedy night",
        "jazz club",
      ],
    },
    {
      id: "out",
      label: "Outdoors",
      intents: ["walk", "picnic", "sunset", "cycling", "riverside", "stargazing", "park bench"],
    },
    {
      id: "culture",
      label: "Culture",
      intents: [
        "cinema",
        "exhibition",
        "theatre",
        "bookshop",
        "museum",
        "poetry night",
        "street art",
      ],
    },
    {
      id: "music",
      label: "Music",
      intents: ["live gig", "jazz bar", "record shop", "open mic", "vinyl bar", "concert"],
    },
    {
      id: "fun",
      label: "Attractions",
      intents: ["funfair", "bowling", "escape room", "mini golf", "arcade", "zoo", "ferris wheel"],
    },
  ],
  mate: [
    {
      id: "food",
      label: "Food and drink",
      intents: ["beer", "coffee", "lunch", "street food", "pizza", "brunch", "wine", "ramen"],
    },
    {
      id: "sports",
      label: "Sports",
      intents: [
        "running",
        "gym",
        "climbing",
        "football",
        "padel",
        "tennis",
        "basketball",
        "yoga",
        "swim",
      ],
    },
    {
      id: "games",
      label: "Games",
      intents: [
        "board games",
        "pub quiz",
        "chess",
        "arcade",
        "darts",
        "pool",
        "cards",
        "video games",
      ],
    },
    {
      id: "out",
      label: "Outdoors",
      intents: ["hike", "cycling", "walk", "frisbee", "skate", "kayak", "picnic"],
    },
    {
      id: "music",
      label: "Music",
      intents: ["gig", "jam session", "record shop", "open mic", "karaoke", "festival"],
    },
    {
      id: "culture",
      label: "Culture",
      intents: ["cinema", "exhibition", "workshop", "museum", "talk", "comedy"],
    },
  ],
} as const satisfies Record<Mode, readonly Category[]>

/** Any intent word of any category, or `"other"`. */
export type Intent = (typeof CATEGORIES)[Mode][number]["intents"][number] | typeof OTHER_INTENT

/** Onboarding base interests per mode. Profiles may also hold related picks beyond these. */
export const INTERESTS = {
  date: [
    "coffee",
    "wine",
    "cinema",
    "books",
    "travel",
    "cooking",
    "hiking",
    "techno",
    "jazz",
    "art",
    "dogs",
    "yoga",
    "photography",
    "street food",
  ],
  mate: [
    "board games",
    "climbing",
    "running",
    "gym",
    "football",
    "padel",
    "gaming",
    "pub quiz",
    "hiking",
    "cycling",
    "concerts",
    "cooking",
    "coding",
    "chess",
  ],
} as const satisfies Record<Mode, readonly string[]>

export const GENDERS = ["woman", "man", "non-binary"] as const
export type Gender = (typeof GENDERS)[number]

export const SEEKS = ["women", "men", "everyone"] as const
export type Seek = (typeof SEEKS)[number]

export const LOOKING_FOR = ["something real", "see where it goes", "something light"] as const
export type LookingFor = (typeof LOOKING_FOR)[number]

export const MATE_WHO = ["anyone", "same gender"] as const
export type MateWho = (typeof MATE_WHO)[number]

/** `one` = one-on-one, `small` = small group. */
export const GROUPS = ["one", "small"] as const
export type Group = (typeof GROUPS)[number]

/** `both` reads "either". */
export const ENERGIES = ["chill", "both", "active"] as const
export type Energy = (typeof ENERGIES)[number]

export const WHEN_SLOTS = [
  "weekday mornings",
  "lunch breaks",
  "after work",
  "late nights",
  "weekends",
] as const
export type WhenSlot = (typeof WHEN_SLOTS)[number]

/** `hour` = an hour, `few` = a few hours, `day` = all day. */
export const HANGOUT_LENGTHS = ["hour", "few", "day"] as const
export type HangoutLength = (typeof HANGOUT_LENGTHS)[number]

/** Settings › "Walk up to"; the match radius per value is `Config.walkRadiusM`. */
export const WALK_MINUTES = [5, 10, 15] as const
export type WalkMin = (typeof WALK_MINUTES)[number]

/** Youngest account age (GDPR digital-consent age in PL/SK). */
export const AGE_MIN = 16
export const ADULT_AGE = 18
/** Oldest age; as a range bound it reads "60+". */
export const AGE_MAX = 99

export type QA = { q: string; a: string }

export type DatePrefs = { seek: Seek; ageMin: number; ageMax: number; looking: LookingFor }

export type MatePrefs = {
  who: MateWho
  group: Group
  energy: Energy
  ageMin: number
  ageMax: number
  when: WhenSlot[]
  length: HangoutLength
}

export type Settings = {
  startMode: Mode | null
  walkMin: WalkMin
  autoStop: boolean
  haptics: boolean
  sounds: boolean
  reduceMotion: boolean
}

/** The stored onboarding profile (`GET`/`PUT /api/profile`). Validate untrusted input with `parseProfile`. */
export type Profile = {
  mode: Mode
  name: string
  gender: Gender
  age: number
  interests: string[]
  qa: QA[]
  vibe: string
  date: DatePrefs
  mate: MatePrefs
  /** "I'm 18 or older"; always equals `age >= ADULT_AGE`. Required for date mode. */
  adult: boolean
  /** Selfie check, simulated in this build. */
  verified: boolean
  /** On-device appearance score; a number only, never a photo. */
  taste: number
  settings: Settings
}

/** Prototype defaults for a fresh onboarding draft. Not a valid profile until filled in. */
export const DEFAULT_PROFILE: Profile = {
  mode: "date",
  name: "",
  gender: "woman",
  age: 25,
  interests: [],
  qa: [],
  vibe: "",
  date: { seek: "everyone", ageMin: 24, ageMax: 35, looking: "see where it goes" },
  mate: {
    who: "anyone",
    group: "small",
    energy: "both",
    ageMin: 24,
    ageMax: 35,
    when: [],
    length: "few",
  },
  adult: false,
  verified: false,
  taste: 0,
  settings: {
    startMode: null,
    walkMin: 10,
    autoStop: true,
    haptics: true,
    sounds: false,
    reduceMotion: false,
  },
}

/** Result of every `parse*` function: the cleaned value, or an `invalid_<field>` error code. */
export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string }

const fail = (field: string): { ok: false; error: string } => ({
  ok: false,
  error: `invalid_${field}`,
})

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v)

const isOneOf = <T>(list: readonly T[], v: unknown): v is T =>
  (list as readonly unknown[]).includes(v)

const isText = (v: unknown, max: number, min = 1): v is string =>
  typeof v === "string" && v.trim().length >= min && v.length <= max

const isWithin = (v: unknown, min: number, max: number): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= min && v <= max

const isInt = (v: unknown, min: number, max: number): v is number =>
  Number.isInteger(v) && (v as number) >= min && (v as number) <= max

const isTextList = (v: unknown, max: number, maxLen: number): v is string[] =>
  Array.isArray(v) && v.length <= max && v.every((x) => isText(x, maxLen))

const isUnique = (list: readonly unknown[]) => new Set(list).size === list.length

const isInterestList = (v: unknown): v is string[] =>
  isTextList(v, 30, 32) && v.every((i) => i === i.trim().toLowerCase()) && isUnique(v)

const isQaList = (v: unknown): v is QA[] =>
  Array.isArray(v) &&
  v.length <= 4 &&
  v.every((x) => isObject(x) && isText(x.q, 80) && isText(x.a, 60))

const isRange = (v: Record<string, unknown>, min: number) =>
  isInt(v.ageMin, min, AGE_MAX) && isInt(v.ageMax, min, AGE_MAX) && v.ageMin <= v.ageMax

function parseDatePrefs(v: unknown): DatePrefs | undefined {
  if (!isObject(v) || !isRange(v, ADULT_AGE)) return
  if (!isOneOf(SEEKS, v.seek) || !isOneOf(LOOKING_FOR, v.looking)) return
  return {
    seek: v.seek,
    ageMin: v.ageMin as number,
    ageMax: v.ageMax as number,
    looking: v.looking,
  }
}

function parseMatePrefs(v: unknown): MatePrefs | undefined {
  if (!isObject(v) || !isRange(v, AGE_MIN)) return
  if (!isOneOf(MATE_WHO, v.who) || !isOneOf(GROUPS, v.group) || !isOneOf(ENERGIES, v.energy)) return
  if (!isOneOf(HANGOUT_LENGTHS, v.length)) return

  const when = v.when
  if (!Array.isArray(when) || !when.every((s) => isOneOf(WHEN_SLOTS, s)) || !isUnique(when)) return
  return {
    who: v.who,
    group: v.group,
    energy: v.energy,
    ageMin: v.ageMin as number,
    ageMax: v.ageMax as number,
    when,
    length: v.length,
  }
}

function parseSettings(v: unknown): Settings | undefined {
  if (!isObject(v)) return
  if (v.startMode !== null && !isOneOf(MODES, v.startMode)) return
  if (!isOneOf(WALK_MINUTES, v.walkMin)) return

  const { autoStop, haptics, sounds, reduceMotion } = v
  if (![autoStop, haptics, sounds, reduceMotion].every((b) => typeof b === "boolean")) return
  return {
    startMode: v.startMode,
    walkMin: v.walkMin,
    autoStop: autoStop as boolean,
    haptics: haptics as boolean,
    sounds: sounds as boolean,
    reduceMotion: reduceMotion as boolean,
  }
}

/**
 * Validates an untrusted profile (e.g. a `PUT /api/profile` body) and returns a clean copy
 * without unknown keys. Errors name the first failing field: `invalid_age`, `invalid_adult`, ….
 */
export function parseProfile(input: unknown): Parsed<Profile> {
  if (!isObject(input)) return fail("profile")
  const { mode, name, gender, age, interests, qa, vibe, adult, verified, taste } = input

  if (!isOneOf(MODES, mode)) return fail("mode")
  if (!isText(name, 40)) return fail("name")
  if (!isOneOf(GENDERS, gender)) return fail("gender")
  if (!isInt(age, AGE_MIN, AGE_MAX)) return fail("age")
  if (!isInterestList(interests) || interests.length < 3) return fail("interests")
  if (!isQaList(qa)) return fail("qa")
  if (!isText(vibe, 80)) return fail("vibe")

  const date = parseDatePrefs(input.date)
  if (!date) return fail("date")
  const mate = parseMatePrefs(input.mate)
  if (!mate) return fail("mate")
  const settings = parseSettings(input.settings)
  if (!settings) return fail("settings")

  const isAdultAge = age >= ADULT_AGE
  if (adult !== isAdultAge || (mode === "date" && !isAdultAge)) return fail("adult")
  if (typeof verified !== "boolean") return fail("verified")
  if (typeof taste !== "number" || !Number.isFinite(taste)) return fail("taste")

  return {
    ok: true,
    value: {
      mode,
      name: name.trim(),
      gender,
      age,
      interests,
      qa: qa.map(({ q, a }) => ({ q, a })),
      vibe,
      date,
      mate,
      adult,
      verified,
      taste,
      settings,
    },
  }
}

/** The category `id` of `mode`, if it exists. */
export function findCategory(mode: Mode, id: string): Category | undefined {
  return CATEGORIES[mode].find((c) => c.id === id)
}

/**
 * Badge hash (djb2 over interests and answers), identical to the prototype's `jmBadgeDesign`
 * with an empty seed. Clients compute their own; a match carries the partner's as `badgeSeed`.
 */
export function badgeSeed(interests: readonly string[], qa: readonly QA[]): number {
  const text = `${interests.join("|")}#${qa.map((x) => x.a).join("|")}#`
  let h = 5381
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0
  return h
}

export const BUCKETS = ["cold", "warm", "hot", "burning"] as const
export type Bucket = (typeof BUCKETS)[number]

export type Position = { lat: number; lng: number; acc: number }

/** Server-tunable thresholds, sent once in `ready`. Clients read these instead of hard-coding. */
export type Config = {
  positionIntervalMs: number
  sessionIntervalMs: number
  offerTtlMs: number
  sessionTtlMs: number
  pairCooldownMs: number
  autoStopMs: number
  walkRadiusM: Record<WalkMin, number>
  buckets: Record<Exclude<Bucket, "cold">, number>
  zonePrecision: number
  kAnonymity: number
  /** `true` on demo sockets: `zones` skip k-anonymity, `partner_position` carries `distanceM`. */
  demo: boolean
}

export const DEFAULT_CONFIG: Config = {
  positionIntervalMs: 2000,
  sessionIntervalMs: 1000,
  offerTtlMs: 45_000,
  sessionTtlMs: 600_000,
  pairCooldownMs: 300_000,
  autoStopMs: 1_800_000,
  walkRadiusM: { 5: 400, 10: 800, 15: 1200 },
  buckets: { warm: 200, hot: 80, burning: 30 },
  zonePrecision: 6,
  kAnonymity: 3,
  demo: false,
}

/** What a search runs under; `walkMin` falls back to the profile's setting. */
export type Search = { mode: Mode; category: string; intents: Intent[]; walkMin: WalkMin }

export type SearchOn = { t: "search_on"; walkMin?: WalkMin } & Omit<Search, "walkMin">

export type ClientMsg =
  | { t: "hello"; sessionCookie: string }
  | SearchOn
  | { t: "search_off" }
  | ({ t: "position"; heading?: number } & Position)
  | { t: "accept"; offerId: string }
  | { t: "dismiss"; offerId: string }
  | { t: "vanish"; sessionId: string }
  | { t: "met"; sessionId: string }

/**
 * Validates a `search_on` payload: a mode, one of its category ids, ≥ 1 unique intents of that
 * category (or `"other"`), optional `walkMin`. Errors: `invalid_mode` · `invalid_category` ·
 * `invalid_intents` · `invalid_walk`.
 */
export function parseSearchOn(input: unknown): Parsed<SearchOn> {
  if (!isObject(input) || !isOneOf(MODES, input.mode)) return fail("mode")
  const category = typeof input.category === "string" && findCategory(input.mode, input.category)
  if (!category) return fail("category")

  const { intents, walkMin } = input
  const allowed = [...category.intents, OTHER_INTENT]
  if (!Array.isArray(intents) || !intents.length || !isUnique(intents)) return fail("intents")
  if (!intents.every((i) => allowed.includes(i))) return fail("intents")
  if (walkMin !== undefined && !isOneOf(WALK_MINUTES, walkMin)) return fail("walk")

  return {
    ok: true,
    value: {
      t: "search_on",
      mode: input.mode,
      category: category.id,
      intents: intents as Intent[],
      walkMin,
    },
  }
}

/**
 * Validates a `position` payload: finite `lat` −90…90, `lng` −180…180, `acc` ≥ 0. Returns only
 * those three fields (`heading` is informational). Error: `invalid_position`.
 */
export function parsePosition(input: unknown): Parsed<Position> {
  if (!isObject(input)) return fail("position")
  const { lat, lng, acc } = input
  if (!isWithin(lat, -90, 90) || !isWithin(lng, -180, 180) || !isWithin(acc, 0, Infinity))
    return fail("position")
  return { ok: true, value: { lat, lng, acc } }
}

/** The other person on a match card: their badge and nothing else. */
export type MatchPartner = {
  vibe: string
  /** their first 3 interests */
  interests: string[]
  /** `badgeSeed(interests, qa)` over their full profile */
  badgeSeed: number
  tags: { verified: boolean; adult: boolean }
}

export type SessionEndReason = "met" | "expired" | "vanished" | "disconnected"

export type SearchStopReason = "auto_stop"

export type ServerMsg =
  | { t: "ready"; userId: string; config: Config }
  | { t: "error"; code: string; message: string }
  | { t: "search_stopped"; reason: SearchStopReason }
  | { t: "zones"; cells: { h: string; n: number }[] }
  | {
      t: "match_offer"
      offerId: string
      sharedIntent: Intent
      partner: MatchPartner
      expiresInMs: number
    }
  | { t: "offer_expired"; offerId: string }
  | { t: "session_start"; sessionId: string; expiresInMs: number }
  | {
      t: "partner_position"
      sessionId: string
      bearing: number
      bucket: Bucket
      /** dev/demo builds only, never rendered */
      distanceM?: number
    }
  | { t: "session_end"; sessionId: string; reason: SessionEndReason }

export const CloseCode = {
  NoProfile: 4002,
  ProtocolViolation: 4003,
  Unauthorized: 4004,
} as const

const CLIENT_TYPES = new Set<string>([
  "hello",
  "search_on",
  "search_off",
  "position",
  "accept",
  "dismiss",
  "vanish",
  "met",
])

/**
 * Accepts a raw text frame or an already-parsed object. Unknown `t` or malformed JSON → `null`
 * (ignored, never fatal). Payload fields are not validated here.
 */
export function parseClientMsg(frame: unknown): ClientMsg | null {
  try {
    const msg = typeof frame === "string" ? JSON.parse(frame) : frame
    return CLIENT_TYPES.has(msg?.t) ? msg : null
  } catch {
    return null
  }
}

const SERVER_TYPES = new Set<string>([
  "ready",
  "error",
  "search_stopped",
  "zones",
  "match_offer",
  "offer_expired",
  "session_start",
  "partner_position",
  "session_end",
])

/** Server-frame counterpart of `parseClientMsg`, for clients. */
export function parseServerMsg(frame: unknown): ServerMsg | null {
  try {
    const msg = typeof frame === "string" ? JSON.parse(frame) : frame
    return SERVER_TYPES.has(msg?.t) ? msg : null
  } catch {
    return null
  }
}

/** `"live"` = written by the LLM just now; `"sample"` = the fixed fallback. */
export type LlmSource = "live" | "sample"

/** `POST /api/onboarding/question` */
export type QuestionRequest = { mode: Mode; name: string; interests: string[]; qa: QA[] }
export type QuestionReply = { question: string; options: string[]; source: LlmSource }

/** `POST /api/onboarding/vibe`; `avoid` = lines already shown (reroll). */
export type VibeRequest = { mode: Mode; interests: string[]; qa: QA[]; avoid?: string[] }
export type VibeReply = { vibe: string; source: LlmSource }

/** `POST /api/onboarding/related` */
export type RelatedRequest = { item: string; mode: Mode; have: string[] }
export type RelatedReply = { items: string[] }

/** Validates a `POST /api/onboarding/question` body. */
export function parseQuestionRequest(input: unknown): Parsed<QuestionRequest> {
  if (!isObject(input) || !isOneOf(MODES, input.mode)) return fail("request")
  const { mode, name, interests, qa } = input
  if (!isText(name, 40, 0) || !isInterestList(interests) || !isQaList(qa)) return fail("request")
  return { ok: true, value: { mode, name: name.trim(), interests, qa } }
}

/** Validates a `POST /api/onboarding/vibe` body. */
export function parseVibeRequest(input: unknown): Parsed<VibeRequest> {
  if (!isObject(input) || !isOneOf(MODES, input.mode)) return fail("request")
  const { mode, interests, qa, avoid = [] } = input
  if (!isInterestList(interests) || !isQaList(qa) || !isTextList(avoid, 20, 80))
    return fail("request")
  return { ok: true, value: { mode, interests, qa, avoid } }
}

/** Validates a `POST /api/onboarding/related` body. */
export function parseRelatedRequest(input: unknown): Parsed<RelatedRequest> {
  if (!isObject(input) || !isOneOf(MODES, input.mode)) return fail("request")
  const { mode, item, have } = input
  if (!isText(item, 32) || !isTextList(have, 200, 32)) return fail("request")
  return { ok: true, value: { mode, item: item.trim().toLowerCase(), have } }
}
