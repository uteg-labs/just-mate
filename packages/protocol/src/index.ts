/** Wire contract from `docs/PROTOCOL.md`. Change the doc first, then this file. */

export const INTENTS = [
  "soul_mate",
  "date",
  "beer",
  "coffee",
  "friends",
  "sports",
  "music",
] as const
export type Intent = (typeof INTENTS)[number]

export const INTERESTS = [
  "beer",
  "coffee",
  "boardgames",
  "rock",
  "techno",
  "hiking",
  "cinema",
  "books",
  "travel",
  "tech",
  "dogs",
  "climbing",
  "photography",
  "food",
] as const
export type Interest = (typeof INTERESTS)[number]

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
  matchRadiusM: number
  buckets: Record<Exclude<Bucket, "cold">, number>
  zonePrecision: number
  kAnonymity: number
  demo: boolean
}

export const DEFAULT_CONFIG: Config = {
  positionIntervalMs: 2000,
  sessionIntervalMs: 1000,
  offerTtlMs: 45_000,
  sessionTtlMs: 600_000,
  pairCooldownMs: 300_000,
  matchRadiusM: 400,
  buckets: { warm: 200, hot: 80, burning: 30 },
  zonePrecision: 6,
  kAnonymity: 3,
  demo: false,
}

export type ClientMsg =
  | { t: "hello"; sessionCookie: string; interests: string[]; nickname?: string; adult: true }
  | { t: "search_on"; intents: string[] }
  | { t: "search_off" }
  | ({ t: "position"; heading?: number } & Position)
  | { t: "accept"; offerId: string }
  | { t: "dismiss"; offerId: string }
  | { t: "vanish"; sessionId: string }
  | { t: "met"; sessionId: string }

export type SessionEndReason = "met" | "expired" | "vanished" | "disconnected"

export type ServerMsg =
  | { t: "ready"; userId: string; vibe: string; config: Config }
  | { t: "error"; code: string; message: string }
  | { t: "zones"; cells: { h: string; n: number }[] }
  | {
      t: "match_offer"
      offerId: string
      matchPct: number
      sharedIntent: Intent
      vibe: string
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
  AdultRequired: 4001,
  InvalidProfile: 4002,
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

export function isIntent(value: string): value is Intent {
  return (INTENTS as readonly string[]).includes(value)
}

const SERVER_TYPES = new Set<string>([
  "ready",
  "error",
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
