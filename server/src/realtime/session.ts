import {
  type ClientMsg,
  CloseCode,
  DEFAULT_CONFIG,
  INTERESTS,
  type Intent,
  isIntent,
  type Position,
  parseClientMsg,
  type ServerMsg,
} from "@justmate/protocol"

export type Conn = {
  send(msg: ServerMsg): void
  close(code: number, reason: string): void
}

export type Client = {
  id: string
  conn: Conn
  userIdForCookie: (cookie: string) => Promise<string | undefined>
  demo?: "a" | "b"
  interests?: string[]
  intents: Intent[]
  searching: boolean
  position?: Position
}

// canned until vibe generation exists (PRODUCT.md §8)
const VIBES = [
  "quietly funny — will out-argue you about pizza",
  "first on the dance floor, last to leave the after-party",
  "knows every trail within 50 km — and the pub at the end of each",
  "asks the second question, the one people actually want to answer",
  "will lose at boardgames gracefully. mostly.",
]

const MIN_INTERESTS = 3
const MAX_INTENTS = 2

export const clients = new Map<string, Client>()

export function connect(
  conn: Conn,
  demo?: "a" | "b",
  userIdForCookie: (cookie: string) => Promise<string | undefined> = async () => undefined,
): Client {
  const client: Client = {
    id: `u_${crypto.randomUUID().slice(0, 8)}`,
    conn,
    demo,
    userIdForCookie,
    intents: [],
    searching: false,
  }
  clients.set(client.id, client)
  return client
}

export function disconnect(client: Client) {
  clients.delete(client.id)
}

export async function receive(client: Client, frame: unknown) {
  const msg = parseClientMsg(frame)
  if (!msg) return

  if (msg.t === "hello") return hello(client, msg)

  if (!client.interests) {
    client.conn.close(CloseCode.ProtocolViolation, "hello first")
    return
  }

  switch (msg.t) {
    case "search_on":
      return searchOn(client, msg.intents)

    case "search_off":
      client.searching = false
      client.intents = []
      return

    case "position":
      if (!client.searching)
        return error(client, "position_before_search_on", "send search_on first")
      client.position = { lat: msg.lat, lng: msg.lng, acc: msg.acc }
      return

    // offers, sessions and relay: matching loop, BUILD-PLAN Sat 15:00
    case "accept":
    case "dismiss":
    case "vanish":
    case "met":
      return
  }
}

async function hello(client: Client, msg: Extract<ClientMsg, { t: "hello" }>) {
  const userId = await client.userIdForCookie(msg.sessionCookie)
  if (!userId) return client.conn.close(CloseCode.Unauthorized, "authentication required")
  if (msg.adult !== true) return client.conn.close(CloseCode.AdultRequired, "18+ only")

  const interests = [...new Set(msg.interests)].filter((i) =>
    (INTERESTS as readonly string[]).includes(i),
  )
  if (interests.length < MIN_INTERESTS)
    return client.conn.close(CloseCode.InvalidProfile, "min 3 interests")

  clients.delete(client.id)
  client.id = userId
  client.interests = interests
  clients.set(client.id, client)
  client.conn.send({
    t: "ready",
    userId: client.id,
    vibe: vibeFor(client.id),
    config: DEFAULT_CONFIG,
  })
}

function searchOn(client: Client, intents: string[]) {
  const valid = [...new Set(intents)].filter(isIntent)
  if (!valid.length || valid.length > MAX_INTENTS || valid.length !== intents.length) {
    return error(client, "invalid_intents", `1–${MAX_INTENTS} of the shared intent vocabulary`)
  }

  client.intents = valid
  client.searching = true
}

function error(client: Client, code: string, message: string) {
  client.conn.send({ t: "error", code, message })
}

function vibeFor(userId: string): string {
  const hash = [...userId].reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
  return VIBES[hash % VIBES.length] ?? ""
}
