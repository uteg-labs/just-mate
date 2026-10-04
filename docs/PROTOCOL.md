# JustMate — client ↔ server protocol (M0)

The contract mobile and backend build against **independently**. Accounts, the profile and the onboarding helpers use JSON over HTTP; the live session uses one Elysia WebSocket per client, JSON text frames, one event per frame. Change this file first, `packages/protocol` second, code third.

## Authentication

Better Auth owns `/api/auth/*`, its PostgreSQL tables, cookie sessions and verification tokens.

- **Email + password** is the primary sign-in: `POST /api/auth/sign-up/email` `{ email, password, name }` and `POST /api/auth/sign-in/email` `{ email, password }`. Passwords need 6+ characters. Sign-up signs the user in.
- **Forgot password:** `POST /api/auth/request-password-reset` `{ email, redirectTo }` emails a single-use link (valid 1 h). The link lands on `redirectTo?token=…`; the app then calls `POST /api/auth/reset-password` `{ newPassword, token }`. A reset signs out every other session.
- **Magic link** stays available: `POST /api/auth/sign-in/magic-link` `{ email, callbackURL }`. With a `justmate://` `callbackURL` the verified link lands on `justmate://…?cookie=…`; the app stores that cookie as its session.
- Auth emails go out over SMTP (`SMTP_*`). Without `SMTP_HOST` the server prints them to its console instead; production refuses to start without it.
- Trusted origins: `justmate://`, plus `exp://` outside production, plus `AUTH_TRUSTED_ORIGINS` (comma-separated, e.g. `http://localhost:8081` for web). Production refuses to start without `BETTER_AUTH_URL`.

The Expo client persists the session cookie in the device's secure store. Every route below (HTTP and WebSocket) requires that session; HTTP routes answer `401 { error: "unauthorized" }` without it.

## Profile (HTTP)

The onboarding profile lives server-side, one per user. The client writes the **whole** profile; the server validates it with `parseProfile` from `@justmate/protocol` and stores it.

| Route | Body | Reply |
|---|---|---|
| `GET /api/profile` | — | `200 Profile` · `404 { error: "no_profile" }` before onboarding |
| `PUT /api/profile` | `Profile` | `200 Profile` (as stored) · `400 { error: "invalid_<field>" }` |
| `DELETE /api/account` | — | `204`. Deletes the user, profile, sessions and sign-in methods; a live socket is closed with `4004`. Their plans go too, each as if they sent `plan_cancel`: the other side gets `plan_removed`, and an invitation they were offered or had taken goes back to `open` |
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
  partnerCharacter: string                      // ≤ 300 chars, free text typed on the "who" step: the character of the person they look for; "" when left empty; never sent to a match
  settings: { startMode: "date" | "mate" | null, walkMin: 5 | 10 | 15, autoStop: boolean,
              haptics: boolean, sounds: boolean, reduceMotion: boolean }
}
```

- Age ranges are integers; `ageMin ≤ ageMax ≤ 99`, and `99` reads as "60+". Date ranges start at 18, mate ranges at 16.
- `mode: "date"` requires `adult: true`.
- Both `date` and `mate` preferences are always present, because the map switches mode at any time. `DEFAULT_PROFILE` in the package holds the prototype defaults.
- `appearance`, `taste` and `character` feed matching later (`ML-MATCHING.md`); M0 stores them and never sends them in `match_offer`.
- In development (`NODE_ENV` ≠ `production`) every `PUT` also writes the profile card (`docs/examples/profile_card.md` shape) to `server/.cards/<userId>.md`, for the ML work.

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
ws://<host>:3000/ws?demo=a|b        (demo query param optional; honoured only with DEMO_MODE on)
```

## Conventions

- Every frame: `{ "t": "<event>", ...payload }`. `t` is the discriminator; unknown `t` is ignored, never fatal.
- Positions: `{ "lat": number, "lng": number, "acc": number }` — WGS84 degrees, accuracy in metres.
- IDs: server-issued opaque strings; `userId` is the account id (a demo socket's is `<account id>~a|b`), a `sessionId` lives as long as a match session, a `planId` as long as its plan. Nothing live survives a reconnect — there is nothing to reconnect *to* — except plans, which are re-sent after `ready`.
- One live socket per user: a newer `hello` for the same `userId` closes the older socket with `1000`. A repeated `hello` on the same socket is ignored.
- Times: server-relative `expiresInMs` (integer) rather than wall-clock timestamps, so phone clock skew is irrelevant. The one exception is a plan's `startsAt`, which names a day (see Plans).
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
| Sports (`sports`) | running · gym · climbing · football · padel · tennis · basketball · yoga · swim |
| Outdoors (`out`) | hike · cycling · walk · frisbee · skate · kayak · picnic |
| Food and drink (`food`) | coffee · beer · lunch · street food · pizza · brunch · wine · ramen |
| Games (`games`) | board games · pub quiz · chess · arcade · darts · pool · cards · video games |
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
| `position` | `{ lat, lng, acc, heading?: number }` | Every ~2 s (`positionIntervalMs`) while searching, and every ~1 s (`sessionIntervalMs`) while in an active session or after `plan_go`. `heading` (0–360, magnetometer) is optional and only informational. A fix sent sooner than half that interval after the last kept one is silently dropped. A fix more than 10 m per elapsed second away from the last kept one is dropped too, with `position_too_fast`; the next plausible fix is kept as usual. Errors (non-fatal, position unchanged): `position_before_search_on` · `invalid_position` (`lat` −90…90, `lng` −180…180, `acc` ≥ 0, all finite) · `position_too_fast`. Demo sockets' positions are ignored. |
| `accept` | `{ offerId: string }` | Accept a match offer. Idempotent. |
| `dismiss` | `{ offerId: string }` | Decline. **Server never forwards a dismiss**; the other side only ever sees `offer_expired`. Idempotent. |
| `vanish` | `{ sessionId: string }` | Kill the active session for both. Idempotent. |
| `met` | `{ sessionId: string }` | Optional: user tapped "we met" (only enabled in `burning`). Either side's `met` ends the session as `met` for both; the server does not re-check the bucket. Idempotent. |
| `report` | `{ sessionId: string, reason?: "unsafe" \| "inappropriate" \| "no_show" \| "other" }` | Report the other person of a session you were in: from the compass (a match's or a plan's), or from post-meet after it ended. Reporting always blocks them, both ways and for good (rule 12). A session still running ends as `vanished` for both, so the reported side sees an ordinary vanish. Reply: `reported`. Idempotent. Errors (non-fatal): `invalid_session` (unknown, or not one you were in) · `invalid_reason`. |

## Server → client

| `t` | Payload | Notes |
|---|---|---|
| `ready` | `{ userId: string, config: Config, blockedCount: number }` | Reply to `hello`. `blockedCount` = how many people you have reported (and so blocked). The profile itself comes from `GET /api/profile`. |
| `error` | `{ code: string, message: string }` | Non-fatal validation errors (e.g. `position_before_search_on`). Fatal ones close the socket with a 4xxx code instead. |
| `search_stopped` | `{ reason: "auto_stop" }` | The server ended the search: `auto_stop` = `config.autoStopMs` (30 min) of searching with `settings.autoStop` on. Client returns to select. |
| `zones` | `{ cells: { h: string, n: number }[] }` | Every `positionIntervalMs` (2 s) while searching with a position and not in a session. `h` = geohash of `zonePrecision` (6), `n` = other searchers with a position within 2 km of the recipient who share the recipient's mode + category and ≥ 1 intent, pass the profile rules (rule 2) and `compat ≥ threshold` with the recipient, are on the same side of the demo split, and are not in a session — plus ghosts on demo sockets. Cooldown and open offers don't matter here. The recipient never counts. Cells with `n < config.kAnonymity` are **omitted**; demo sockets get all cells. `cells: []` clears the map. Client renders only what it receives. |
| `match_offer` | `{ offerId, sharedIntent: string, partner: MatchPartner, expiresInMs: number }` | Sent to **both** parties within the same tick, each with the *other* person as `partner`. `expiresInMs` = `config.offerTtlMs` (45000); render the countdown from it. |
| `offer_expired` | `{ offerId }` | Offer TTL ran out, or the other side dismissed, or the other side went `search_off` / replaced its search / disconnected. The client shows the same neutral "offer expired" for all of them. Both sides keep searching. |
| `session_start` | `{ sessionId, expiresInMs: number, planId?: string }` | Both accepted, or both sent `plan_go` (then `planId` is set). Compass unlocks in state `waiting` until the first `partner_position`. |
| `partner_position` | `{ sessionId, bearing: number, bucket: "cold"\|"warm"\|"hot"\|"burning", distanceM?: number }` | Every `sessionIntervalMs` (1 s) once both members have a position. **Server sends bearing + bucket, never the partner's lat/lng** — the "no pins" rule is enforced at the protocol layer, not in the UI. `bearing` is a multiple of 10°; while the bucket is `cold` it points at the centre of the partner's geohash-7 cell rather than at the partner (demo sockets: always at the partner), so bearings from faked far-apart spots can't be intersected into a pin. `bucket` from `config.buckets`: under `burning` m → `burning`, under `hot` → `hot`, under `warm` → `warm`, else `cold`. `distanceM` (whole metres) is sent only to demo sockets (`config.demo: true`) for tuning and must not be rendered. |
| `session_end` | `{ sessionId, reason: "met"\|"expired"\|"vanished"\|"disconnected", partnerName?: string }` | Sent to both (the remaining one, on `disconnected`). `met`: either side's `met`; only then `partnerName` carries the other person's first name (names unlock in person, never before). `expired`: session TTL. `vanished`: either side's `vanish`, `search_off` or replacing `search_on`. `disconnected`: the partner's socket closed. Client discards all session state. `vanished` is shown identically whichever side pressed it. The search ends with the session for both (auto-stop clock cleared, positions dropped); the client returns to select and sends `search_on` to search again. |
| `reported` | `{ sessionId, blockedCount: number }` | Reply to `report`, also when the person was already blocked. `blockedCount` as in `ready`. Never sent to the reported side. |

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
  "planCompassLeadMs": 900000,
  "planProposalTtlMs": 21600000,
  "planOfferTtlMs": 3600000,
  "planSessionTtlMs": 1800000,
  "planProposeIntervalMs": 60000,
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
3. **Scoring (M0):** `compat = 0.7 × Jaccard(interests) + 0.3 × min(1, |shared intents|)`, threshold `0.45`. If the stretch model is enabled it is called behind the same function, returns the same shape, and uses its own calibrated threshold (`ML-MATCHING.md` §8); on any ML error, or while the pair has no score for the current model version yet, the server falls back to the formula. The score is never sent.
4. **Ghosts** add to `zones.n` only. They never appear in `match_offer`.
   **Moderation:** `PUT /api/profile` runs the free-text parts of the profile (answers, `character`, `partnerCharacter`, `vibe`, `name`, `interests`) through the OpenAI moderation model. A hit on harassment, hate, violence or sexual content involving minors sets the server-only `dangerous` flag on the stored profile. It is never part of the wire `Profile`, never returned by `GET /api/profile`, and sticky: a later clean save does not clear it. A `dangerous` user is silently excluded from the match gate, from other users' `zones`, from `match_offer`, and from plans: they are never proposed, never offered an invitation, and their own invitations are never offered to anyone. They still connect, search and plan, and simply never see anyone. Without `OPENAI_API_KEY`, or when the moderation call fails, nothing is flagged.
5. **Offer TTL** 45 s. Any of: TTL, `dismiss`, `search_off`, a replacing `search_on`, disconnect, auto-stop → `offer_expired` to the *other* side (and to the dismissing side too, for symmetry of client code). Pair enters cooldown (`pairCooldownMs`, 5 min).
6. **Session TTL** 10 min from `session_start`. Server emits `session_end{expired}` to both. Every session end puts the pair in cooldown too.
7. **Position relay** happens *only* inside an active session, *only* as bearing + bucket, *only* to the two members. The server keeps the last position per socket in memory and nothing else; on `session_end`/close it is dropped.
8. **One offer or one session per user** at a time. A user with an open offer is not a candidate for others.
9. **Bearing** = initial bearing from *recipient* to *partner* (in `cold`: to the centre of the partner's geohash-7 cell), degrees clockwise from true north, rounded to 10°, computed server-side. Client arrow rotation = `bearing − deviceHeading`.
10. **Auto-stop:** with `settings.autoStop` on, searching ends `autoStopMs` after it started (`search_stopped{auto_stop}`). Replacing the search does not restart the clock. An open offer expires first; an active session is never cut short (the search ends with it).
11. **Loop:** the server ticks every `sessionIntervalMs` (1 s): expire offers and sessions, relay `partner_position`, pair searchers, and every `positionIntervalMs` send `zones`. Pairing is greedy by score: of all pairs passing the match gate, the highest `compat` goes first (ties: the shorter distance), and each user gets at most one offer per tick. `sharedIntent` is the first intent both picked in the category's list order, `"other"` last.
12. **Report and block** (`PRODUCT.md` §10.2): a `report` stores a block from the reporter to the other person. A block works both ways: the pair never passes the match gate again (and they don't count in each other's `zones`), is never proposed a plan, and is never offered each other's invitations; live plans between them end as if the reporter cancelled. The reported side is never told. Once **two different people** have reported someone, their profile gets the same server-only `dangerous` flag as moderation (rule 4), effective at once. A session stays reportable while it runs and for 24 h after it ends; a match session also as long as its stored match row exists. Demo sockets can report, which ends the session, but nothing is stored or blocked.

## Plans

A plan is a 1:1 meeting later, at a public venue (`PRODUCT.md` §5.3). It comes two ways:

- a **proposal**, which the server makes for two compatible people;
- an **invitation**, which one person puts out with several times. The server offers it to one compatible person at a time.

Plans ride the same socket. They are stored server-side until 24 h after the start, so unlike a search they survive a reconnect: the server sends a `plans` snapshot right after `ready`.

**Times.** `startsAt` and `slots` are wall-clock ISO-8601 UTC strings, because a plan names a day. The client renders them in the device's time zone. Every countdown is still relative: `startsInMs` and `expiresInMs` are measured from when the frame was sent, so phone clock skew doesn't matter.

### `Venue` (HTTP)

Venues are public places. They are the only coordinates a client ever receives.

| Route | Reply | Notes |
|---|---|---|
| `GET /api/venues` | `Venue[]` | Every row of the server's `venue` table, loaded at startup (seeded by migration). Public, no session needed. Cache it per app run. |

```ts
{
  id: string
  name: string                  // "Meeple Café"
  kind: VenueKind               // "board_game_cafe": the client maps it to a label and an icon
  rating: number | null         // 4.8
  opens: string | null          // "09:00"; null = always open
  closes: string | null         // "00:00"; null = always open
  lat: number; lng: number
  modes: Mode[]                 // which modes it is proposed in
  fits: Intent[]                // the intents it suits, e.g. ["board games", "cards", "chess"]
}
```

`VENUE_KINDS`: `wine_bar` · `cafe` · `board_game_cafe` · `beer_bar` · `cinema` · `climbing_gym` · `riverside` · `rooftop_bar` · `park` · `restaurant` · `bowling` · `museum` · `jazz_club` · `sports_centre` · `pool`.

### `Plan` — one recipient's view

Each side gets its own view of a plan. `partner` is always the *other* person, as the same `MatchPartner` badge as a match: never a name, a score or a position.

```ts
{
  id: string
  kind: "proposal" | "invite"
  state: PlanState
  mine: boolean                 // you put this invitation out (false for proposals)
  mode: Mode
  category: string
  intents: Intent[]
  startsAt: string              // ISO; an open invitation: its first time
  startsInMs: number
  venueId: string
  partner?: MatchPartner        // absent on your own invitation while it's open
  partnerWalkMin?: number       // their walk to the venue in whole minutes; proposals and offers only
  expiresInMs?: number          // a proposal, or an invitation offered to you
  alts?: string[]               // proposal: up to two alternative venue ids
  accepted?: boolean            // proposal: you accepted the current venue and wait for them
  suggested?: boolean           // proposal: the venue is one they suggested
  slots?: string[]              // your own invitation: all its times
  flex?: boolean                // your own invitation: flexible by 30 min
  until?: "2h" | "day"          // your own invitation: open until 2 h before, or the day before
}
```

| `kind` | You are | `state` |
|---|---|---|
| `proposal` | either side | `proposed` → `confirmed` |
| `invite` | the owner (`mine`) | `open` (being offered, nobody in yet) → `taken` (someone's in: `partner`, and `startsAt` is the time they picked) → `confirmed` |
| `invite` | the person it's offered to | `offered` (one time, `expiresInMs`) → `taken` (you're in, waiting for them to confirm) → `confirmed` |

### Client → server

| `t` | Payload | Notes |
|---|---|---|
| `plans_get` | `{ lat?: number, lng?: number }` | When the select sheet opens. The position, if given, becomes your **anchor**: rounded to its geohash-6 cell, kept with your plans, and used only to pick venues halfway. It is never sent to anyone. Reply: `plans`. Error: `invalid_position`. |
| `plan_accept` | `{ planId, venueId?: string }` | **Proposal:** accept it at its venue. With `venueId` set to one of its `alts`, you suggest that venue instead: the venue changes, and only your accept stands. **Invitation offered to you:** take it at the time shown. Idempotent. |
| `plan_pass` | `{ planId }` | **Proposal:** decline. Both sides get `plan_removed {expired}`. **Offered to you:** decline. You get `plan_removed {expired}`; the owner sees nothing. **Your own invitation, `taken`:** pass on the person who took it. They get `plan_removed {filled}`, and it goes back to `open`. |
| `plan_invite` | `{ mode, category, intents, slots: string[], flex: boolean, venueId, until: "2h" \| "day" }` | Put an invitation out. Reply: `plan_update` with `state: "open"`. The `mode`, `category` and `intents` rules and errors are the same as for `search_on`. `slots` holds 1–40 unique ISO times. A time is offerable until 2 h before it (`2h`) or until local midnight before its day (`day`), and at least one must still be offerable. `venueId` must be a venue of that mode. Errors: `invalid_slots` · `invalid_venue` · `invalid_flex` (`flex` not a boolean) · `invalid_until` · `adult_required`. |
| `plan_confirm` | `{ planId }` | Your own invitation, `taken`: confirm the person who took it. Both get `confirmed`. |
| `plan_cancel` | `{ planId }` | Withdraw your invitation, take back your yes, or "Can't make it" on a confirmed plan. The other side gets `plan_removed`: `cancelled` if it was `taken` or `confirmed`, otherwise `expired`. |
| `plan_go` | `{ planId }` | "Open compass" on a confirmed plan. Allowed from `startsAt − config.planCompassLeadMs` until `startsAt + config.planSessionTtlMs`; earlier gives `plan_not_yet`. Once both have sent it, both get `session_start {planId}` and the compass runs exactly as in a match. From your `plan_go` until the session ends, send `position` as in a session; no `search_on` is needed. |

Any `planId` you can't act on (unknown, not yours, or the wrong state) gives `invalid_plan`.

### Server → client

| `t` | Payload | Notes |
|---|---|---|
| `plans` | `{ plans: Plan[] }` | All your current plans. Sent after `ready` and in reply to `plans_get`. Replace your list with it. |
| `plan_update` | `{ plan: Plan }` | Upsert one plan by `id`. |
| `plan_removed` | `{ planId, reason: "expired" \| "filled" \| "cancelled" \| "done" }` | Drop it. `expired`: TTL, or either side passed (the reason is the same whichever side passed). `filled`: the owner passed on you. `cancelled`: the other side cancelled a taken or confirmed plan. `done`: you met, or it ended 24 h ago. |

`session_start` carries `planId` when the session came from a plan. Its TTL is `config.planSessionTtlMs`. `session_end {met}` ends the plan with `plan_removed {done}`. Any other end leaves the plan `confirmed`, so both can open the compass again.

### Server-side rules (plans)

1. **Proposals** run every `config.planProposeIntervalMs`, and for you on `plans_get`. They pair two anchored people who:
   - each have no open proposal;
   - have no live plan with each other, and haven't ended one (`done` or `cancelled`) in the last 7 days;
   - haven't blocked each other (rule 12);
   - pass rule 2 in the plan's mode (each profile's own mode when they agree, else `mate`);
   - share an intent, the first of that mode's category intents in list order that is in both people's interests;
   - reach `compat ≥ threshold`;
   - have a common free time in the next 7 days, at least 3 h ahead, that doesn't clash with either person's live plans.
2. **Free times** are windows in the city's time zone, checked on a 30-minute grid. A time **clashes** with a live plan when it is less than 2 h from the plan's `startsAt`, or, for your own invitation still `open` or `offered`, from any of its `slots`.
   - Mate, from `profile.mate.when`: `weekday mornings` Mon–Fri 08:00–11:00, `lunch breaks` Mon–Fri 11:30–14:00, `after work` Mon–Fri 17:00–20:00, `late nights` every day 20:00–23:30, `weekends` Sat–Sun 10:00–22:00.
   - Date, or an empty `when`: every day 17:00–23:00.
3. **Venue choice.** Among venues of the mode that fit the intent and are open for at least the first hour, pick the one that minimises the longer of the two walks (80 m a minute), with both walks ≤ 15 min. The next two become `alts`. A proposal expires after `config.planProposalTtlMs`, or at `startsAt − planCompassLeadMs`, whichever is first. A passed pair is not proposed to each other again for 7 days.
4. **Invitations** are offered to one person at a time: the best `compat` among anchored people who:
   - pass rule 2 against the invitation's `mode` and `intents`;
   - are free at one of its offerable times (windows widened by 30 min with `flex`) that doesn't clash with their live plans;
   - haven't passed on it before;
   - haven't blocked the owner, or been blocked by them (rule 12);
   - have nothing else `offered` to them.
5. **Offer timing.** An offer lasts `config.planOfferTtlMs`, but never past that time's cutoff. Then the next person gets it. The invitation ends (`expired`) once no time is offerable.
6. **Visibility.** People who aren't connected get their plans in the next `plans` snapshot. The owner of an invitation never learns who passed.
7. **Demo sockets** are planned only with demo sockets of the same account. Their anchor is `STAGE_A` (`a`) or `STAGE_B` (`b`), walks are not limited, and a proposal starts at now + 2 min, so `plan_go` is allowed straight away. The seeded profiles share `running`, so their proposal is a run at a park.

## Demo mode (dev builds)

`?demo=a` / `?demo=b` on the socket URL, honoured only when the server runs with `DEMO_MODE=true` (the default outside production, off in production unless set); otherwise the parameter is ignored and the socket is an ordinary one (`config.demo: false`). The socket still needs a valid session, but uses a seeded demo profile (A: Ola, B: Kuba; adults, compatible both ways in both modes) instead of the stored one, under the id `<account id>~a|b`, so one account can drive both phones. Its `ready.config` has `demo: true`. The server ignores incoming `position` from that socket and feeds a scripted track instead, through the identical pipeline:

- `a` stands still at `STAGE_A`. `b` waits 280 m from `a` on the `STAGE_A` → `STAGE_B` line (inside every walk radius) and, from `session_start`, converges on `a` over 40 s: 280 → 200 m in 8 s (`cold`), → 80 m in 10 s (`warm`), → 30 m in 10 s (`hot`), → 2 m in 12 s (`burning`), then stays.
- `STAGE_A` / `STAGE_B` are env vars (`"lat,lng"`) set *after* seeing the stage: A = stage-left end, B = stage-right end, both facing the audience. Only their direction matters for `b`: because the arrow uses the real magnetometer, the scripted bearing must match the physical direction B actually walks — otherwise the arrow visibly points off-stage.
- Demo sockets are matched only with demo sockets of the same account, so neither phone can be offered anyone else, and a demo pair skips the pair cooldown so the run can be rehearsed back to back.
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
A← session_end {sessionId:"s1", reason:"met", partnerName:"Kuba"}
B← session_end {sessionId:"s1", reason:"met", partnerName:"Ola"}
```

## Close codes

| Code | Meaning |
|---|---|
| `4001` | retired (was the global 18+ gate; the gate is per mode now, see `search_on`) |
| `4002` | no stored profile (onboarding unfinished) |
| `4003` | protocol violation (e.g. frame before `hello`) |
| `4004` | missing, invalid, or expired authentication session, or the account was deleted |
| `1000` | normal close |
| `1011` | the server failed while handling `hello`; reconnect |
