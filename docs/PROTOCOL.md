# JustMate — client ↔ server protocol (M0)

The contract mobile and backend build against **independently**. One WebSocket per client (Elysia `ws`), JSON text frames, one event per frame. Mobile develops against a 40-line mock server that replays this file; backend develops against `wscat`. Change this file first, code second.

```
ws://<host>:3000/ws?demo=a|b        (demo query param optional, dev builds only)
```

## Conventions

- Every frame: `{ "t": "<event>", ...payload }`. `t` is the discriminator; unknown `t` is ignored, never fatal.
- Positions: `{ "lat": number, "lng": number, "acc": number }` — WGS84 degrees, accuracy in metres.
- IDs: server-issued opaque strings; a `userId` lives as long as the socket, a `sessionId` as long as a match session. Nothing is reused across reconnects — there is nothing to reconnect *to* (no persistence).
- Times: server-relative `expiresInMs` (integer) rather than wall-clock timestamps, so phone clock skew is irrelevant.
- Server is authoritative for all state transitions; the client only *requests* (`accept`, `vanish`) and *reports* (`position`).

## Connection lifecycle

```
connect → hello → (ready) → search_on → position* → … → search_off | close
```

Socket close = search off = session vanished (if any). No goodbye frame needed.

## Client → server

| `t` | Payload | Notes |
|---|---|---|
| `hello` | `{ intents: string[], interests: string[], nickname?: string, adult: true }` | First frame. `adult: true` is required (18+ gate); server closes the socket with code `4001` otherwise. ≥1 intent, ≥3 interests, else `4002`. |
| `search_on` | `{}` | Enter search mode. Matchable from the first `position`. |
| `search_off` | `{}` | Leave search mode. Ends an active session as `vanished`. |
| `position` | `{ lat, lng, acc, heading?: number }` | Every ~2 s while searching, and every ~1 s while in an active session. `heading` (0–360, magnetometer) is optional and only informational. |
| `accept` | `{ offerId: string }` | Accept a match offer. Idempotent. |
| `dismiss` | `{ offerId: string }` | Decline. **Server never forwards a dismiss**; the other side only ever sees `offer_expired`. Idempotent. |
| `vanish` | `{ sessionId: string }` | Kill the active session for both. Idempotent. |
| `met` | `{ sessionId: string }` | Optional: user tapped "we met" (only enabled in `burning`). Ends session as `met` for both. |

## Server → client

| `t` | Payload | Notes |
|---|---|---|
| `ready` | `{ userId: string, vibe: string, config: Config }` | Reply to `hello`. `vibe` is the user's own 2-line card (canned, deterministic per `userId` in M0). |
| `error` | `{ code: string, message: string }` | Non-fatal validation errors (e.g. `position_before_search_on`). Fatal ones close the socket with a 4xxx code instead. |
| `zones` | `{ cells: { h: string, n: number }[] }` | Every ~2 s while searching. `h` = geohash-6, `n` = searching users incl. ghosts. Cells with `n < K` are **omitted** in production; in demo mode the server sends all. Client renders only what it receives. |
| `match_offer` | `{ offerId, matchPct: number, sharedIntent: string, vibe: string, expiresInMs: number }` | Sent to **both** parties within the same tick. `vibe` is the *other* person's card. `matchPct` = round(compat × 100). |
| `offer_expired` | `{ offerId }` | Offer TTL ran out, or the other side dismissed, or the other side went `search_off` / disconnected. The client shows the same neutral "offer expired" for all three. |
| `session_start` | `{ sessionId, expiresInMs: number }` | Both accepted. Compass unlocks in state `waiting` until the first `partner_position`. |
| `partner_position` | `{ sessionId, bearing: number, bucket: "cold"|"warm"|"hot"|"burning", distanceM?: number }` | Every ~1 s during a session. **Server sends bearing + bucket, never the partner's lat/lng** — the "no pins" rule is enforced at the protocol layer, not in the UI. `distanceM` is present only in dev/demo builds for tuning and must not be rendered. |
| `session_end` | `{ sessionId, reason: "met"|"expired"|"vanished"|"disconnected" }` | Sent to both. Client discards all session state. `vanished` is shown identically whichever side pressed it. |

### `Config` (sent once in `ready`)

```json
{
  "positionIntervalMs": 2000,
  "sessionIntervalMs": 1000,
  "offerTtlMs": 45000,
  "sessionTtlMs": 600000,
  "pairCooldownMs": 300000,
  "matchRadiusM": 400,
  "buckets": { "warm": 200, "hot": 80, "burning": 30 },
  "zonePrecision": 6,
  "kAnonymity": 3,
  "demo": false
}
```

Client reads thresholds from `config` instead of hard-coding them, so tuning on stage is a server restart, not a rebuild.

## Server-side rules (what mobile may assume)

1. **Match gate:** both `searching` ∧ `haversine(a, b) ≤ matchRadiusM` ∧ `|intents_a ∩ intents_b| ≥ 1` ∧ `compat ≥ 0.45` ∧ pair not in cooldown ∧ neither has an open offer or active session ∧ neither is a ghost.
2. **Scoring (M0):** `compat = 0.7 × Jaccard(interests) + 0.3 × min(1, |shared intents|)`. If a learned model is enabled it is called behind the same function and must return the same shape.
3. **Ghosts** add to `zones.n` only. They never appear in `match_offer`.
4. **Offer TTL** 45 s. Any of: TTL, `dismiss`, `search_off`, disconnect → `offer_expired` to the *other* side (and to the dismissing side too, for symmetry of client code). Pair enters cooldown.
5. **Session TTL** 10 min from `session_start`. Server emits `session_end{expired}` to both.
6. **Position relay** happens *only* inside an active session, *only* as bearing + bucket, *only* to the two members. The server keeps the last position per socket in memory and nothing else; on `session_end`/close it is dropped.
7. **One offer or one session per user** at a time. A user with an open offer is not a candidate for others.
8. **Bearing** = initial bearing from *recipient* to *partner*, degrees clockwise from true north, computed server-side. Client arrow rotation = `bearing − deviceHeading`.

## Demo mode (dev builds)

`?demo=a` / `?demo=b` on the socket URL. The server ignores incoming `position` from that socket and feeds a scripted track instead, through the identical pipeline:

- `a` stands still at `STAGE_A`; `b` starts at `STAGE_B` and converges on `a` over ~40 s, crossing every bucket threshold with ≥5 s dwell in each.
- `STAGE_A` / `STAGE_B` are env vars set *after* seeing the stage: A = stage-left end, B = stage-right end, both facing the audience. Because the arrow uses the real magnetometer, the scripted bearing must match the physical direction B actually walks — otherwise the arrow visibly points off-stage.
- Demo sockets are matched only with each other (ghost rule + a `demoPair` flag), so neither phone can be offered anyone else.

## Minimal happy-path transcript

```
A→ hello {intents:[beer], interests:[rock,hiking,food,dogs], adult:true}
A← ready {userId:"u_A", vibe:"…", config:{…}}
A→ search_on {}
A→ position {lat,lng,acc}            (every 2 s)
A← zones {cells:[{h:"u2yhw5",n:7}]}  (every 2 s)
     … B does the same, enters 400 m …
A← match_offer {offerId:"o1", matchPct:78, sharedIntent:"beer", vibe:"quietly funny — …", expiresInMs:45000}
B← match_offer {offerId:"o1", …}      (same tick)
A→ accept {offerId:"o1"}
B→ accept {offerId:"o1"}
A← session_start {sessionId:"s1", expiresInMs:600000}
B← session_start {sessionId:"s1", expiresInMs:600000}
A← partner_position {sessionId:"s1", bearing:271, bucket:"cold"}   (every 1 s)
     … bucket → warm → hot → burning …
B→ met {sessionId:"s1"}
A← session_end {sessionId:"s1", reason:"met"}
B← session_end {sessionId:"s1", reason:"met"}
```

## Close codes

| Code | Meaning |
|---|---|
| `4001` | `adult` not true |
| `4002` | invalid profile (intent/interest minimums) |
| `4003` | protocol violation (e.g. frame before `hello`) |
| `1000` | normal close |
