# JustMate — client ↔ server protocol (M0)

The contract mobile and backend build against **independently**. Accounts, the profile and the onboarding helpers use JSON over HTTP; the live session uses one Elysia WebSocket per client, JSON text frames, one event per frame. Change this file first, `packages/protocol` second, code third.

## Authentication

Better Auth owns `/api/auth/*`, its PostgreSQL tables, cookie sessions and verification tokens.

- **Email + password** is the primary sign-in: `POST /api/auth/sign-up/email` `{ email, password, name }` and `POST /api/auth/sign-in/email` `{ email, password }`. Passwords need 6+ characters. Sign-up signs the user in.
- **Forgot password:** `POST /api/auth/request-password-reset` `{ email, redirectTo }` emails a single-use link (valid 1 h). The link lands on `redirectTo?token=…`; the app then calls `POST /api/auth/reset-password` `{ newPassword, token }`. A reset signs out every other session.
- **Magic link** stays available: `POST /api/auth/sign-in/magic-link` `{ email, callbackURL }`. With a `justmate://` `callbackURL` the verified link lands on `justmate://…?cookie=…`; the app stores that cookie as its session.
- Auth emails go out over SMTP (`SMTP_*`). Without `SMTP_HOST` the server prints them to its console instead; production refuses to start without it.
- Trusted origins: `justmate://`, plus `exp://` in development, plus `AUTH_TRUSTED_ORIGINS` (comma-separated, e.g. `http://localhost:8081` for web).

The Expo client persists the session cookie in the device's secure store. Every route below (HTTP and WebSocket) requires that session; HTTP routes answer `401 { error: "unauthorized" }` without it.

## Profile (HTTP)

The onboarding profile lives server-side, one per user. The client writes the **whole** profile; the server validates it with `parseProfile` from `@justmate/protocol` and stores it.

| Route | Body | Reply |
|---|---|---|
| `GET /api/profile` | — | `200 Profile` · `404 { error: "no_profile" }` before onboarding |
| `PUT /api/profile` | `Profile` | `200 Profile` (as stored) · `400 { error: "invalid_<field>" }` |
| `DELETE /api/account` | — | `204`. Deletes the user, profile, sessions and sign-in methods; a live socket is closed with `4004` |
| `GET /api/account/export` | — | `200 { user, profile, sessions, accounts }` — everything stored about the user, minus password hashes and tokens |

```ts
Profile = {
  mode: "date" | "mate"                         // the onboarding mode
  name: string                                  // first name, 1–40 chars; never sent to a match in M0
  gender: "woman" | "man" | "non-binary"
  age: number                                   // integer 16–99 (16 = GDPR digital-consent age in PL/SK)
  interests: string[]                           // 3–30, lowercase, ≤ 32 chars each, unique; base list or related picks
  qa: { q: string, a: string }[]                // ≤ 4 onboarding answers (q ≤ 80, a ≤ 60 chars)
  vibe: string                                  // the kept vibe line, ≤ 80 chars
  date: { seek: "women" | "men" | "everyone", ageMin, ageMax, looking: "something real" | "see where it goes" | "something light" }
  mate: { who: "anyone" | "same gender", group: "one" | "small", energy: "chill" | "both" | "active",
          ageMin, ageMax, when: ("weekday mornings" | "lunch breaks" | "after work" | "late nights" | "weekends")[],
          length: "hour" | "few" | "day" }
  adult: boolean                                // "I'm 18 or older"; must equal age ≥ 18
  verified: boolean                             // selfie taken — liveness simulated in this build (production path: set by the verifier, not the client)
  appearance: string                            // ≤ 300 chars, visible hair and face features from the selfie (`/api/onboarding/appearance`); "" when skipped; never shown to anyone
  taste: string                                 // ≤ 300 chars, traits the liked sample photos share (`/api/onboarding/taste`); "" when none; never a photo
  character: string                             // ≤ 1000 chars, five "Trait — concrete detail" lines from the answers (`/api/onboarding/character`); "" until written; never sent to a match
  settings: { startMode: "date" | "mate" | null, walkMin: 5 | 10 | 15, autoStop: boolean,
              haptics: boolean, sounds: boolean, reduceMotion: boolean }
}
```

- Age ranges are integers; `ageMin ≤ ageMax ≤ 99`, and `99` reads as "60+". Date ranges start at 18, mate ranges at 16.
- `mode: "date"` requires `adult: true`.
- Both `date` and `mate` preferences are always present, because the map switches mode at any time. `DEFAULT_PROFILE` in the package holds the prototype defaults.
- `appearance`, `taste` and `character` feed matching later (`ML-MATCHING.md`); M0 stores them and never sends them in `match_offer`.
- In development (`NODE_ENV` ≠ `production`) every `PUT` also writes the profile card (`docs/examples/profile_card.md` shape) to `temporary/<userId>.md` at the repo root, for the ML work.

## Onboarding helpers (HTTP)

Live text for onboarding, written by an LLM. Each call has a hard timeout; on a missing key, a timeout, an API error or output that breaks the rules, the server answers with the fixed sample instead (`source: "sample"`), so the client never waits on an error path.

| Route | Body | Reply | Timeout |
|---|---|---|---|
| `POST /api/onboarding/question` | `{ mode, name, interests, qa }` | `{ question, options: [4], source }` | 12 s |
| `POST /api/onboarding/vibe` | `{ mode, interests, qa, avoid?: string[] }` | `{ vibe, source }` | 10 s |
| `POST /api/onboarding/related` | `{ item, mode, have: string[] }` | `{ items: string[] }` (≤ 3) | 8 s |
| `POST /api/onboarding/character` | `{ mode, interests, qa }` | `{ character, source }` | 10 s |
| `POST /api/onboarding/taste` | `{ picks: string[] }` (≤ 30 descriptions of liked samples, ≤ 400 chars each) | `{ taste, source }` | 8 s |
| `POST /api/onboarding/appearance` | `{ photo }` (one base64 JPEG, ≤ `PHOTO_MAX` chars) | `{ appearance, source }` | 12 s |

`source` is `"live" | "sample"`. Invalid bodies get `400 { error: "invalid_request" }`.

- **Question:** sentence case, under 60 characters, no emoji, no exclamation marks, never a topic already asked. Exactly 4 options, lowercase, under 26 characters each. Sample: the mode's fixed question number `qa.length` (mod 4).
- **Vibe:** two short lowercase clauses joined by `" — "`, wry and specific, 60 characters at most, no names, emoji or quotes, not one of `avoid`. Sample: a fixed line not in `avoid`.
- **Related:** 3 lowercase interests (≤ 24 chars) close to `item`, none already in `have`. Sample: the fixed related list for `item`, minus `have` (empty for unknown items).
- **Character:** five lines, one sentence each, shaped "Trait — concrete detail.", third person, no looks, age, names or places; ≤ 1000 chars. Sample: the answers, one per line.
- **Taste:** one line of comma-separated traits that repeat across `picks`, nothing invented; ≤ 300 chars. Sample: the picks joined with `; `, cut to 300.
- **Appearance:** one line of visible hair and face features only (hair, face shape, cheekbones, eyes, brows, facial hair, glasses), never age, ethnicity, gender, weight, emotion or identity; ≤ 300 chars, `""` when no face is visible. Sample: `""`. The photo is passed to the model once and never stored or logged.

## WebSocket

```
ws://<host>:3000/ws?demo=a|b        (demo query param optional, dev builds only)
```

## Conventions

- Every frame: `{ "t": "<event>", ...payload }`. `t` is the discriminator; unknown `t` is ignored, never fatal.
- Positions: `{ "lat": number, "lng": number, "acc": number }` — WGS84 degrees, accuracy in metres.
- IDs: server-issued opaque strings; `userId` is the account id (a demo socket's is `<account id>~a|b`), a `sessionId` lives as long as a match session. Nothing live survives a reconnect — there is nothing to reconnect *to*.
- One live socket per user: a newer `hello` for the same `userId` closes the older socket with `1000`. A repeated `hello` on the same socket is ignored.
- Times: server-relative `expiresInMs` (integer) rather than wall-clock timestamps, so phone clock skew is irrelevant.
- Server is authoritative for all state transitions; the client only *requests* (`accept`, `vanish`) and *reports* (`position`).

## Connection lifecycle

```
connect → hello → (ready) → search_on → position* → … → search_off | search_stopped | close
```

Socket close = search off: an open offer expires for the other side, an active session ends as `disconnected` for the partner. No goodbye frame needed.

## Modes, categories, intents

Every search runs in one **mode**, `date` or `mate`, and one **category** of that mode. Intents are the category's own words plus `"other"` ("something else"). Exact lists are exported as `CATEGORIES` and `INTERESTS`.

| Date category (`id`) | Intents |
|---|---|
| Food and drink (`food`) | coffee · wine · dinner · brunch · beer · dessert · street food · tea |
| Nightlife (`night`) | cocktails · dancing · karaoke · late bar · rooftop · comedy night · jazz club |
| Outdoors (`out`) | walk · picnic · sunset · cycling · riverside · stargazing · park bench |
| Culture (`culture`) | cinema · exhibition · theatre · bookshop · museum · poetry night · street art |
| Music (`music`) | live gig · jazz bar · record shop · open mic · vinyl bar · concert |
| Attractions (`fun`) | funfair · bowling · escape room · mini golf · arcade · zoo · ferris wheel |

| Mate category (`id`) | Intents |
|---|---|
| Food and drink (`food`) | beer · coffee · lunch · street food · pizza · brunch · wine · ramen |
| Sports (`sports`) | running · gym · climbing · football · padel · tennis · basketball · yoga · swim |
| Games (`games`) | board games · pub quiz · chess · arcade · darts · pool · cards · video games |
| Outdoors (`out`) | hike · cycling · walk · frisbee · skate · kayak · picnic |
| Music (`music`) | gig · jam session · record shop · open mic · karaoke · festival |
| Culture (`culture`) | cinema · exhibition · workshop · museum · talk · comedy |

Interests (onboarding base lists; related picks extend them open-endedly):

- date: coffee · wine · cinema · books · travel · cooking · hiking · techno · jazz · art · dogs · yoga · photography · street food
- mate: board games · climbing · running · gym · football · padel · gaming · pub quiz · hiking · cycling · concerts · cooking · coding · chess

## Client → server

| `t` | Payload | Notes |
|---|---|---|
| `hello` | `{ sessionCookie }` | First frame. The Better Auth session cookie must be valid or the socket closes with `4004`. The server loads the user's stored profile; none (onboarding unfinished) closes with `4002`. |
| `search_on` | `{ mode, category, intents: string[], walkMin?: 5 \| 10 \| 15 }` | Enter search mode. `category` is a category `id` of `mode`; `intents` are ≥ 1 unique words of that category or `"other"`. `walkMin` defaults to the profile's `settings.walkMin`. Errors (non-fatal, search state unchanged): `invalid_mode` · `invalid_category` · `invalid_intents` · `invalid_walk` · `adult_required` (date mode, non-adult profile). Sending `search_on` while already searching **replaces** the search (UC11) and keeps the auto-stop clock running; an open offer expires first, and an active session ends as `vanished` (which ends the old search, so the clock starts fresh). Matchable from the first `position`. |
| `search_off` | `{}` | Leave search mode. Expires an open offer and ends an active session as `vanished`. The last position is dropped. |
| `position` | `{ lat, lng, acc, heading?: number }` | Every ~2 s while searching, and every ~1 s while in an active session. `heading` (0–360, magnetometer) is optional and only informational. Errors (non-fatal, position unchanged): `position_before_search_on` · `invalid_position` (`lat` −90…90, `lng` −180…180, `acc` ≥ 0, all finite). Demo sockets' positions are ignored. |
| `accept` | `{ offerId: string }` | Accept a match offer. Idempotent. |
| `dismiss` | `{ offerId: string }` | Decline. **Server never forwards a dismiss**; the other side only ever sees `offer_expired`. Idempotent. |
| `vanish` | `{ sessionId: string }` | Kill the active session for both. Idempotent. |
| `met` | `{ sessionId: string }` | Optional: user tapped "we met" (only enabled in `burning`). Either side's `met` ends the session as `met` for both; the server does not re-check the bucket. Idempotent. |

## Server → client

| `t` | Payload | Notes |
|---|---|---|
| `ready` | `{ userId: string, config: Config }` | Reply to `hello`. The profile itself comes from `GET /api/profile`. |
| `error` | `{ code: string, message: string }` | Non-fatal validation errors (e.g. `position_before_search_on`). Fatal ones close the socket with a 4xxx code instead. |
| `search_stopped` | `{ reason: "auto_stop" }` | The server ended the search: `auto_stop` = `config.autoStopMs` (30 min) of searching with `settings.autoStop` on. Client returns to select. |
| `zones` | `{ cells: { h: string, n: number }[] }` | Every `positionIntervalMs` (2 s) while searching with a position and not in a session. `h` = geohash of `zonePrecision` (6), `n` = other searchers with a position within 2 km of the recipient who share the recipient's mode + category and ≥ 1 intent, pass the profile rules (rule 2) and `compat ≥ threshold` with the recipient, are on the same side of the demo split, and are not in a session — plus ghosts on demo sockets. Cooldown and open offers don't matter here. The recipient never counts. Cells with `n < config.kAnonymity` are **omitted**; demo sockets get all cells. `cells: []` clears the map. Client renders only what it receives. |
| `match_offer` | `{ offerId, sharedIntent: string, partner: MatchPartner, expiresInMs: number }` | Sent to **both** parties within the same tick, each with the *other* person as `partner`. `expiresInMs` = `config.offerTtlMs` (45000); render the countdown from it. |
| `offer_expired` | `{ offerId }` | Offer TTL ran out, or the other side dismissed, or the other side went `search_off` / replaced its search / disconnected. The client shows the same neutral "offer expired" for all of them. Both sides keep searching. |
| `session_start` | `{ sessionId, expiresInMs: number }` | Both accepted. Compass unlocks in state `waiting` until the first `partner_position`. |
| `partner_position` | `{ sessionId, bearing: number, bucket: "cold"\|"warm"\|"hot"\|"burning", distanceM?: number }` | Every `sessionIntervalMs` (1 s) once both members have a position. **Server sends bearing + bucket, never the partner's lat/lng** — the "no pins" rule is enforced at the protocol layer, not in the UI. `bearing` is whole degrees. `bucket` from `config.buckets`: under `burning` m → `burning`, under `hot` → `hot`, under `warm` → `warm`, else `cold`. `distanceM` (whole metres) is sent only to demo sockets (`config.demo: true`) for tuning and must not be rendered. |
| `session_end` | `{ sessionId, reason: "met"\|"expired"\|"vanished"\|"disconnected" }` | Sent to both (the remaining one, on `disconnected`). `met`: either side's `met`. `expired`: session TTL. `vanished`: either side's `vanish`, `search_off` or replacing `search_on`. `disconnected`: the partner's socket closed. Client discards all session state. `vanished` is shown identically whichever side pressed it. The search ends with the session for both (auto-stop clock cleared, positions dropped); the client returns to select and sends `search_on` to search again. |

### `MatchPartner` — the other person's badge, and nothing else

```ts
{
  vibe: string              // their own kept vibe line
  interests: string[]       // their first 3 interests: badge colours, icon and tags
  badgeSeed: number         // badgeSeed(their interests, their answers): pattern, layout, serial
  tags: { verified: boolean, adult: boolean }   // "verified" / "18+" on the badge
}
```

No name, no answers, no score, no position. The client renders the badge from `badgeSeed` + `interests`; for its own badge it computes `badgeSeed` locally with the same exported function. The match percentage is no longer sent.

### `Config` (sent once in `ready`)

```json
{
  "positionIntervalMs": 2000,
  "sessionIntervalMs": 1000,
  "offerTtlMs": 45000,
  "sessionTtlMs": 600000,
  "pairCooldownMs": 300000,
  "autoStopMs": 1800000,
  "walkRadiusM": { "5": 400, "10": 800, "15": 1200 },
  "buckets": { "warm": 200, "hot": 80, "burning": 30 },
  "zonePrecision": 6,
  "kAnonymity": 3,
  "demo": false
}
```

Client reads thresholds from `config` instead of hard-coding them, so tuning on stage is a server restart, not a rebuild.

## Server-side rules (what mobile may assume)

1. **Match gate:** both `searching` ∧ same `mode` ∧ same `category` ∧ ≥ 1 shared intent ∧ `haversine(a, b) ≤ min(walkRadiusM[a.walkMin], walkRadiusM[b.walkMin])` ∧ the profile rules below ∧ `compat ≥ threshold` ∧ pair not in cooldown ∧ neither has an open offer or active session ∧ neither is a ghost ∧ both or neither are demo sockets. (Same table as `ML-MATCHING.md` §7.) `"other"` is an intent like any other: it only matches `"other"`.
2. **Age and safety (hard, never scored):**
   - `adult` is the same on both sides. A non-adult is only ever matched with another non-adult, and only in mate mode; an adult is never offered a non-adult.
   - Date mode requires `adult` — at `search_on`, and again in the match gate.
   - Date: each side's `seek` accepts the other's `gender` (`everyone` accepts all), and each side's age is inside the other's `date` range.
   - Mate: `who: "same gender"` requires equal genders (checked both ways), and each side's age is inside the other's `mate` range.
3. **Scoring (M0):** `compat = 0.7 × Jaccard(interests) + 0.3 × min(1, |shared intents|)`, threshold `0.45`. If the stretch model is enabled it is called behind the same function, returns the same shape, and uses its own calibrated threshold (`ML-MATCHING.md` §8); on any ML error the server falls back to the formula. The score is never sent.
4. **Ghosts** add to `zones.n` only. They never appear in `match_offer`.
5. **Offer TTL** 45 s. Any of: TTL, `dismiss`, `search_off`, a replacing `search_on`, disconnect, auto-stop → `offer_expired` to the *other* side (and to the dismissing side too, for symmetry of client code). Pair enters cooldown (`pairCooldownMs`, 5 min).
6. **Session TTL** 10 min from `session_start`. Server emits `session_end{expired}` to both. Every session end puts the pair in cooldown too.
7. **Position relay** happens *only* inside an active session, *only* as bearing + bucket, *only* to the two members. The server keeps the last position per socket in memory and nothing else; on `session_end`/close it is dropped.
8. **One offer or one session per user** at a time. A user with an open offer is not a candidate for others.
9. **Bearing** = initial bearing from *recipient* to *partner*, degrees clockwise from true north, computed server-side. Client arrow rotation = `bearing − deviceHeading`.
10. **Auto-stop:** with `settings.autoStop` on, searching ends `autoStopMs` after it started (`search_stopped{auto_stop}`). Replacing the search does not restart the clock. An open offer expires first; an active session is never cut short (the search ends with it).
11. **Loop:** the server ticks every `sessionIntervalMs` (1 s): expire offers and sessions, relay `partner_position`, pair searchers, and every `positionIntervalMs` send `zones`. Pairing is greedy by score: of all pairs passing the match gate, the highest `compat` goes first (ties: the shorter distance), and each user gets at most one offer per tick. `sharedIntent` is the first intent both picked in the category's list order, `"other"` last.

## Demo mode (dev builds)

`?demo=a` / `?demo=b` on the socket URL. The socket still needs a valid session, but uses a seeded demo profile (A: Ola, B: Kuba; adults, compatible both ways in both modes) instead of the stored one, under the id `<account id>~a|b`, so one account can drive both phones. Its `ready.config` has `demo: true`. The server ignores incoming `position` from that socket and feeds a scripted track instead, through the identical pipeline:

- `a` stands still at `STAGE_A`. `b` waits 280 m from `a` on the `STAGE_A` → `STAGE_B` line (inside every walk radius) and, from `session_start`, converges on `a` over 40 s: 280 → 200 m in 8 s (`cold`), → 80 m in 10 s (`warm`), → 30 m in 10 s (`hot`), → 2 m in 12 s (`burning`), then stays.
- `STAGE_A` / `STAGE_B` are env vars (`"lat,lng"`) set *after* seeing the stage: A = stage-left end, B = stage-right end, both facing the audience. Only their direction matters for `b`: because the arrow uses the real magnetometer, the scripted bearing must match the physical direction B actually walks — otherwise the arrow visibly points off-stage.
- Demo sockets are matched only with each other, so neither phone can be offered anyone else, and a demo pair skips the pair cooldown so the run can be rehearsed back to back.
- Ghosts: 9 server-side wanderers circling around `STAGE_A`. They count in demo sockets' `zones` (whatever the search) and nowhere else, and never match.

## Taste samples (HTTP)

Sample photos for the date-mode swipe step. They are generated faces, never users, so they are public (no session needed).

| Route | Reply | Notes |
|---|---|---|
| `GET /taste` | `TasteSample[]` = `{ id: "<group>/<n>", group: "man" \| "women", description: string, photo: string }[]` | From `server/taste/<group>/<n>/` (`description.txt` + one image), sorted by id. Folders without an image are skipped. `photo` is a path on the same host. |
| `GET /taste/:group/:n/photo` | the image | `404` if the folder or image does not exist. |

## Minimal happy-path transcript

```
A→ hello {sessionCookie:"…"}
A← ready {userId:"u_A", config:{…}}
A→ search_on {mode:"mate", category:"food", intents:["beer","coffee"]}
A→ position {lat,lng,acc}            (every 2 s)
A← zones {cells:[{h:"u2yhw5",n:7}]}  (every 2 s)
     … B does the same, enters walking range …
A← match_offer {offerId:"o1", sharedIntent:"beer", partner:{vibe:"techno on fridays — crosswords on sundays", interests:["concerts","pub quiz","coding"], badgeSeed:2915, tags:{verified:true, adult:true}}, expiresInMs:45000}
B← match_offer {offerId:"o1", …}      (same tick, A as partner)
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
| `4001` | retired (was the global 18+ gate; the gate is per mode now, see `search_on`) |
| `4002` | no stored profile (onboarding unfinished) |
| `4003` | protocol violation (e.g. frame before `hello`) |
| `4004` | missing, invalid, or expired authentication session, or the account was deleted |
| `1000` | normal close |
