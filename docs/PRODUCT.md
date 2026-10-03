# just-mate — product definition

> **Meet for real.**
> just-mate helps two compatible strangers who want the same thing *right now* find each other in the real world — faceless, mutual, and on foot.

## 1. Elevator pitch (30 seconds)

Dating apps solved matching and broke meeting. just-mate replaces swiping and chatting with one mechanic: you carry a faceless profile of *what you want to do and who you'd like to do it with*; when a compatible person — also looking, also nearby — enters your zone, both phones ping at the same moment, each showing a two-line vibe card of the other. Both accept, a compass unlocks, and finding each other becomes a ten-minute game that ends with two people talking face to face. No faces. No chat. No pins.

## 2. Problem & vision

**The problem.** Matching is solved; meeting is broken. People swipe alone at home, chat for weeks, and never meet — while loneliness is a declared public-health issue (WHO 2023; US Surgeon General 2023: health impact equivalent to 15 cigarettes a day). Existing apps monetize attention spent *on the phone*; their incentive is the opposite of getting you outside.

**Why existing formats fail:**

| Format | Failure mode |
|---|---|
| Swipe apps (Tinder, Bumble) | Photo-first judgment; chat purgatory; meetings are the exception |
| Scheduled dating (Breeze, Timeleft) | Real meetings, but planned hours/days ahead — zero serendipity |
| Proximity dating (happn) | Retrospective ("who you passed 7 days ago"), photo-first, chat-gated |
| Ambient proximity (Highlight, Sonar — dead) | Always-on creepiness, battery drain, empty rooms, safety gaps |
| Activity platforms (Meetup) | Scheduled groups; not "I want a beer buddy *now*" |

**Vision.** A generation that meets by walking toward each other, not by swiping. The phone's job ends where the conversation starts: *the interface is the street.*

## 3. The three rules (product constitution)

1. **No faces.** No profile photos anywhere. Attraction is a private, on-device compatibility vector, never a picture to be judged. Kills the appearance economy and the mirror-anxiety of profile curation.
2. **No chat.** There is no messaging. The product's success event is a real conversation; every feature points at it. The match output is *legs, not thumbs*.
3. **No pins.** Location is never a point — only zones (geohash cells) with anonymous density glow. Nobody can be found, followed, or looked up. Ever.

Every feature decision is tested against these three rules; anything that violates one is out by definition.

## 4. Personas & user stories

- **Ania, 24, Kraków, student.** Deleted Tinder twice; tired of being judged on photos and of chats that die. *"When I'm at a festival, I switch on search — compatible people can find me without knowing who I am. If I like the vibe walking up, great; if not, I vanish."*
- **Tomek, 28, relocated for work, knows nobody.** *"I want a beer buddy tonight, not a girlfriend. I don't want to browse people — I want the app to tell me: someone's 200 m away, they also want a beer, go."*
- **Marta, 31, safety-conscious.** *"Serendipity without creepiness: no stranger ever knows where I am unless I said 'now, this person, yes' — and I can end that instantly."*
- **Secondary:** conference/festival attendees ("find a co-founder to talk to in the coffee queue"), travelers, newcomers to a city.

## 5. The core loop

1. **Profile once (3 minutes).** Pick intents (what you're looking for) and interests (what you're into). No photo. Optional nickname, never shown to others.
2. **Search mode ON — deliberately, per occasion.** Default is OFF: you activate it when you're actually out and open to meeting (battery, privacy, and intent all in one toggle). This is the anti-Highlight: session-scoped, never ambient.
3. **Watch zones glow.** The map shows geohash zones lit by the density of searching users. No list, no search field, no browsing — scarcity of information is the feature.
4. **The ping (the product's heartbeat).** Two compatible people, both searching, intents aligned, within walking range (400 m — see §7) → both phones notify simultaneously: match %, shared intent ("wants: beer"), and a 2-line vibe card of the other person.
5. **Mutual accept → compass unlocks.** Only if both tap "open compass". Either alone sees nothing more.
6. **The walk.** A directional arrow with hot/cold color and haptics; distance as a bucket (cold/warm/hot/burning), never a map pin of the other person. 10-minute window.
7. **Meet. Talk.** The vibe card doubles as the icebreaker. Afterward, session ends; positions are discarded.
8. **Either can Vanish** at any moment — session destroyed for both instantly.

## 6. Screen specification

Visual language, motion, haptics and accessibility for every screen below live in `DESIGN.md` (Apple fluid-interface principles applied to a dark map with warm glow); colors named here are its tokens.

### 6.1 Onboarding (3 screens)

1. **"What are you looking for?"** — intent chips, multi-select, ≥1 required: `date · friends · beer · coffee · walking · sports · music`.
2. **"What are you into?"** — interest chips, ≥3 required: `beer · coffee · boardgames · rock · techno · hiking · cinema · books · travel · tech · dogs · climbing · photography · food`.
3. **"Your vibe card."** — preview of the 2-line card others will see (generated vibes, e.g. *"quietly funny — will out-argue you about pizza"*). Explains the attraction vector in one sentence: *"Optionally (production): train your private attraction profile on your own device — photos never leave your phone; only a compatibility number ever does."* Below it a single required checkbox: **"I'm 18 or older"** (the app has no photos and no verification, so the age gate is explicit and blocking — the map is not reachable without it). Button: **Enter the map**.

Design intent: the whole funnel communicates "this is not a profile-picture app" before the user ever sees the map.

### 6.2 Map (home screen)

- Dark base map (maplibre-react-native + OpenFreeMap), **zones** rendered as amber glow circles sized by searching-user density (halo + core layers, additive-feel).
- Own position: small mint dot. No other dots, ever.
- Single prominent control: the **search toggle** (`search off` / `● searching`).
- Zone tap → aggregate only ("6 people searching in this zone"). No identities, no profiles, no history.
- States: search off (map dimmed, zones hidden — you're invisible too), searching (glow visible, you're matchable).

### 6.3 Match banner (arrives on both phones simultaneously)

- `78% match · wants: beer`
- Vibe card in quotes: *"quietly funny — will out-argue you about pizza"*
- **[ open compass ]** — primary; **[ dismiss ]** — ghost button
- Caption: *"unlocks only if they accept too"* — consent made visible.
- Vibration `[200,100,200]` on arrival (expo-haptics; delivered over the live WebSocket while the app is open — no remote push in M0, see §8).
- **Offer TTL: 45 s.** If the other side dismisses or does not answer, the banner quietly turns into *"offer expired"* on the accepting side — it never says "they declined", so a dismiss is invisible by construction. Pair cooldown applies either way.

### 6.4 Compass (full-screen overlay)

- **Arrow**: large, rotation = bearing(me→partner) − device heading. Points the way; the partner's position is *never* drawn on the map.
- **Distance as bucket** (gamified, deliberately imprecise): `cold` (>200 m, blue `tempCold`) → `warm` (<200 m, amber `tempWarm`) → `hot` (<80 m, orange `tempHot`) → `burning` (<30 m, white-hot `tempBurning`) — color + label + haptic escalation. Red is reserved for Vanish.
- **Countdown**: 10:00 session TTL, always visible.
- **Vanish**: always-visible red control; kills the session for both, instantly.
- States: `waiting` (partner accepted but no position yet), `active`, `expired` (TTL), `vanished`.
- **Post-meet screen (M0, cheap, on-category):** when the bucket hits `burning` and either taps **"we met"** (or the TTL ends in `burning`), show *"you walked 480 m to meet"* — distance integrated client-side from own positions during the session, plus a lifetime total ("2.3 km walked to meetings"). No backend, no persistence beyond the device; it is the one screen that makes the Sport & Healthcare framing literal.
- Post-meet (future): optional one-tap "how did it go?" to tune matching.

## 7. Matching system

**Data model.** `user = { id, intents[], interests[], attractionVector (private), session }` — nothing persisted server-side beyond the live socket.

**Explainable scoring (M0 primary).** A transparent function, served by the Elysia backend, is what runs in the demo and what we defend in Q&A:

```
compat = 0.7 × Jaccard(interests) + 0.3 × min(1, |shared intents|)
match  ⇔ both searching ∧ dist(a, b) ≤ R_MATCH (400 m) ∧ shared intent ≥ 1 ∧ compat ≥ 0.45
```

- **Intents gate, interests score.** The shared intent is the *context* of the match ("this is a beer match"), interests set the percentage.
- **Distance, not zone, is the match gate.** The server holds exact positions anyway; zones are a *display* abstraction (see §8). Matching on "same geohash cell" would (a) pair people up to 1.35 km apart — more than the ~830 m a person walks in the 10-minute window at 5 km/h — and (b) never pair two people 50 m apart on either side of a cell boundary. `R_MATCH = 400 m` ≈ 5 min on foot, leaving half the window for finding each other.
- **Offer TTL 45 s**, then the offer expires silently for both (see §6.3).
- **Pair cooldown: 5 min** after any match/dismiss/expiry/vanish — no re-pinging the same person, no notification spam.
- **One active session per user.**
- **Ghost users never match.** Ghosts (server-spawned wanderers that add zone density) carry `ghost: true` and are excluded from candidate pairs — otherwise a demo phone can be offered a ghost instead of the other demo phone.

**Learned compatibility model (stretch, after Sat 19:00 only).** A small model trained by the team on interaction data → pairwise score, served behind the same `/compat` interface so it is a drop-in replacement for the function above. Honesty note for the pitch: a model trained only on *synthetic* data derived from the baseline learns the baseline — so if the model ships in M0 it is presented as "the training pipeline is real, the data is synthetic", and the explainable function remains the headline. We do not say "AI matching" about something that is not learned from real signal.

**Attraction vector (the no-faces trick — production path, one sentence on stage).** Users never publish photos. In production, a user may *privately* train an on-device embedding of "faces I like" (their own examples, never uploaded); during matching only a scalar similarity to the other's on-device vector is exchanged — a number, never an image. Hackathon demo: deterministic simulated vectors; the claim in the pitch is the architecture, demonstrated honestly as canned. **Legal caveat (do not improvise on stage):** anything derived from a face is biometric data under GDPR Art. 9 (special category) even in derived form, so the production design needs a DPIA and likely explicit consent on *both* sides before any similarity is computed. On stage it stays a one-liner labelled "production path"; the demo never claims it runs.

**Vibe cards.** Two-line personality summaries shown at the match moment — the icebreaker that replaces "hey". Demo: canned vibe pairs, deterministic per user. Production: generated (Bielik/LLM) from the profile, cached per user, moderated.

## 8. Zones & location architecture

- **Zone = geohash precision 6** (~1.2 km × 0.6 km at Kraków's latitude) — the *display* unit: big enough for anonymity (a glow never points at one person). Zones are not the match unit; matching is by distance (`R_MATCH`, §7), so cell boundaries never split two nearby people.
- **Glow semantics:** count of *search-mode* users in the cell, rendered as size/brightness. Zones with fewer than **K=3** searching users stay dark (k-anonymity in production; demo shows all) — you can't follow a glow to *the only* person in it.
- **Data flow:** client sends position every ~2 s (while searching) → server keeps it in-memory keyed by socket → computes zone → matches → relays position *only* between mutually-accepted partners *only* during the session → everything discarded on disconnect/vanish/TTL. No database. No history. No logs of positions.
- **Transport: one WebSocket per client** (Elysia `ws`), message schema in `docs/PROTOCOL.md`. All real-time events — zones, match offer, partner position, expiry — ride this socket. **No remote push in M0:** the app is in the foreground whenever search mode is on (that is the product), so push adds EAS/APNs/FCM setup time and a failure mode without adding anything the jury can see. Remote push is an M1 item (search mode in background).
- **Demo mode:** scripted converging positions driven by a dev-build toggle (indoor GPS reality); identical pipeline. Scripted coordinates are expressed relative to the stage (A = stage-left end, B = stage-right end, both facing the audience) because the compass arrow uses the *real* magnetometer heading — if the scripted bearing does not match the physical layout, the arrow visibly points off-stage.

## 9. Match session lifecycle (state machine)

```
idle → searching → [match offered ⇉ both phones, offer TTL 45 s]
     → both accept ⇉ compass active (10 min TTL, positions relayed pairwise)
     │                → meet | TTL expiry | either vanishes
     └→ dismiss | offer expiry (either side; the other side sees only "expired")
     → cooldown(5 min per pair) → idle
```

Full event-by-event schema (client ↔ server) is in `docs/PROTOCOL.md`; it is the contract mobile and backend build against independently.

## 10. Safety & privacy by design (threat model)

| Threat | Countermeasure |
|---|---|
| Stalker follows a specific person | No identity, no search, no browsing; zones not pins; glow is aggregate (k-anonymity); nothing discoverable when search is off |
| Compass abused to locate someone | Unlocks only after **mutual** accept; reveals a *bearing*, never a map position; 10-min TTL; partner sees the same compass (symmetry — they know you're walking too) |
| Harassment | No chat = no DM channel; exposure is session-scoped; block & report (production) kill future matches pair-wide |
| Data breach / subpoena | Positions never persisted — in-memory per socket only; nothing to leak |
| Notification fatigue / ambush pings | Both parties opted in *per occasion* (search toggle); pair cooldown; one active session |
| Women's safety specifically | She is invisible unless she switches search on; she can dismiss any match invisibly (offer simply "expires" on the other side); Vanish is one tap and instant |
| Minors | No photos and no identity means no implicit age signal → explicit, blocking **18+ gate** in onboarding (M0); production: age assurance appropriate to a dating product (M1) |

GDPR/RODO posture: location is personal data → processed solely inside explicit, session-scoped consent; no storage; production path includes a DPIA. Demo runs on test data only.

## 11. Gamification layer

**Core (hackathon):** the compass walk itself — hot/cold buckets, haptic escalation, the 10-minute window creating urgency, and the vibe card as loot ("you found: *quietly funny, will out-argue you about pizza*").

**Planned (post-hackathon, in priority order):**
- **Brave streak**: consecutive weeks with ≥1 real meeting; gentle decay, no leaderboards (anti-attention-economy).
- **Zone heat events**: "this district is glowing tonight" — city-scale serendipity weather.
- **Icebreaker packs**: themed card packs (travel / music / sport) users can equip.

Deliberately excluded: points, ads, streak-guilt, leaderboards — gamification serves courage, not retention.

## 12. Competitive positioning

| | just-mate | happn | Breeze | Tinder | Meetup |
|---|---|---|---|---|---|
| Real-time proximity | ✅ live zones | ⚠ retrospective | ❌ | ❌ | ❌ |
| Faceless | ✅ core | ❌ | ❌ | ❌ | n/a |
| Ends in chat | ❌ ends IRL | ✅ | ❌ (skips chat) | ✅ | ⚠ |
| Serendipitous ("now") | ✅ | ⚠ | ❌ scheduled | ❌ | ❌ |
| Consent architecture | ✅ mutual+zones | ⚠ | ✅ | ❌ | n/a |

Wedge: **consented serendipity** — the four validated quarters (proximity / skip-chat / faceless / live maps) assembled into one walk.

## 13. Anti-goals (what just-mate will never do)

Chat. Photo profiles. Browsing/searching people. Followers, likes, feeds. Ads in the meeting flow. Selling attention. The app's success metric *decreases* phone usage — we build for that.

## 14. Success metrics

- **North star:** completed real-world meetings per active user per week.
- Secondary: search-mode minutes (out of home), match→meet conversion, repeat meetings.
- **Guardrails:** vanish rate (<10% — safety/quality signal), notification opt-out rate, session completion.
- Anti-metric watched on purpose: time-in-app should *not* grow — engagement is measured on the street, not the screen.

## 15. Launch & density strategy (the cold-start answer)

1. **Single-density launches:** one campus, one festival, one city district — anywhere the zone glow is genuinely populated from day one.
2. **Event mode:** festivals/conferences pre-seed official zones (a known, opt-in crowd — the perfect first market).
3. **Venue partnerships:** breweries, cafés, climbing gyms host and promote zones ("first beer" promos) — B2B seeds density and revenue at once.
4. **Ambassadors:** campus societies, expat communities.

The 2012 graveyard (Sonar, Highlight) died of empty rooms; just-mate launches where rooms are already full — and its zone glow, being aggregate, makes even a small crowd feel alive.

## 16. Business model

- **B2B venues & events** (primary): hosting/promoting zones, "first round" promos, event licensing.
- **Consumer premium** (secondary, later): icebreaker packs, multi-city travel mode. Core matching and all safety features stay free forever (safety is never paywalled).

## 17. Roadmap

| Stage | Scope |
|---|---|
| **M0 — HackYeah 2026** (this repo) | Expo dev-client app (WebSocket events, magnetometer compass, haptics, 18+ gate, post-meet distance screen), Bun/Elysia backend (ws, distance-gated matching, offer/session TTLs, ghosts), explainable scoring, demo mode; learned model v0 only if time remains after Sat 19:00 |
| **M1 — production MVP** | remote push (background search mode), k-anonymity (K≥3), block/report, age assurance, persistence-free audit, DPIA, E2E position encryption between paired sessions, model v1 (real interaction data) |
| **v1** | On-device attraction vector (train-on-phone), generated vibe cards (Bielik/LLM), brave streaks |
| **v2** | Venue/event platform (official zones, analytics), city heat events |

## 18. Demo scope & honesty

See README ("What's real vs canned"). Everything presentation-critical is real: profiles, zones from live positions, mutual match delivered live to both phones over WebSocket, explainable scoring, compass bearing, haptics, vanish. Everything auxiliary is honestly canned: ghost density, vibe-card strings, demo-mode positions; the attraction vector is simulated and the learned model (if shown) is trained on synthetic data. Rule for every sentence in the deck and the description: **it describes what the demo does, or it is labelled "production path".**
