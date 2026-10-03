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
4. **The ping (the product's heartbeat).** Two compatible people, both searching, intents aligned, same zone → both phones notify simultaneously: match %, shared intent ("wants: beer"), and a 2-line vibe card of the other person.
5. **Mutual accept → compass unlocks.** Only if both tap "open compass". Either alone sees nothing more.
6. **The walk.** A directional arrow with hot/cold color and haptics; distance as a bucket (cold/warm/hot/burning), never a map pin of the other person. 10-minute window.
7. **Meet. Talk.** The vibe card doubles as the icebreaker. Afterward, session ends; positions are discarded.
8. **Either can Vanish** at any moment — session destroyed for both instantly.

## 6. Screen specification

### 6.1 Onboarding (3 screens)

1. **"What are you looking for?"** — intent chips, multi-select, ≥1 required: `date · friends · beer · coffee · walking · sports · music`.
2. **"What are you into?"** — interest chips, ≥3 required: `beer · coffee · boardgames · rock · techno · hiking · cinema · books · travel · tech · dogs · climbing · photography · food`.
3. **"Your vibe card."** — preview of the 2-line card others will see (generated vibes, e.g. *"quietly funny — will out-argue you about pizza"*). Explains the attraction vector in one sentence: *"Optionally (production): train your private attraction profile on your own device — photos never leave your phone; only a compatibility number ever does."* Button: **Enter the map**.

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
- Vibration `[200,100,200]` on arrival.

### 6.4 Compass (full-screen overlay)

- **Arrow**: large, rotation = bearing(me→partner) − device heading. Points the way; the partner's position is *never* drawn on the map.
- **Distance as bucket** (gamified, deliberately imprecise): `cold` (>200 m, blue) → `warm` (<200 m, sand) → `hot` (<80 m, orange) → `burning` (<30 m, red) — color + haptic escalation.
- **Countdown**: 10:00 session TTL, always visible.
- **Vanish**: always-visible red control; kills the session for both, instantly.
- States: `waiting` (partner accepted but no position yet), `active`, `expired` (TTL), `vanished`.
- Post-meet (future): optional one-tap "how did it go?" to tune matching.

## 7. Matching system

**Data model.** `user = { id, intents[], interests[], attractionVector (private), session }` — nothing persisted server-side beyond the live socket and the cached embeddings/z-vectors described below.

**Compatibility model (primary).** A Siamese model with a Match Head, custom-trained by the team. Profile text (intents + interests + vibe card) is embedded via OpenAI `text-embedding-3-small` (frozen), passed through a learned **Shared Encoder** that projects to 128-d compatibility vectors `z_a`, `z_b`, then through a **Match Head** that consumes `concat(|z_a − z_b|, z_a ⊙ z_b, cos(z_a, z_b))` (257-d) and outputs a pairwise compatibility score in `[0, 1]`. Trained with **triplet loss + binary match loss** jointly (one triplet yields two training examples for the head).

- **Serving.** Python + FastAPI behind Bun/Elysia. Vectors (`e` and `z`) cached per user in **PostgreSQL with pgvector**. Match Head weights loaded once on app start; per-pair inference does NOT re-encode — it reads cached `z` from pgvector and runs only the head.
- **Training data.** M0 / HackYeah 2026: synthetic profiles + rule-based ground truth (the explainable baseline + noise) — honest-proxy training. M1: real interaction outcomes (mutual accept + met → 1; dismissed/vanished → 0).
- **Threshold.** The `0.45` rule below applies to the explainable baseline. The neural model uses a **separately calibrated** threshold on a held-out synthetic set (target: FPR ≤ 5%, TPR ≥ 80%). Documented in the model card.
- **Fallback.** If the ML service is unavailable, the server transparently falls back to the explainable baseline. The demo never breaks.
- Full pipeline, training loop, file layout, and M1 roadmap: see `docs/ML-MATCHING.md`.

**Explainable baseline** (transparent, fallback, sanity-check for jury Q&A):

```
compat = 0.7 × Jaccard(interests) + 0.3 × min(1, |shared intents|)
match  ⇔ both searching ∧ same zone ∧ shared intent ≥ 1 ∧ compat ≥ 0.45
```

- **Intents gate, interests score.** The shared intent is the *context* of the match ("this is a beer match"), interests set the percentage.
- **Pair cooldown: 5 min** after any match/dismiss/vanish — no re-pinging the same person, no notification spam.
- **One active session per user.**

**Hard gates (server-side, NOT learned).** The model only scores pairs that have already passed: both-in-search-mode · same-zone · shared-intent ≥ 1 · K-anonymity (M0: K=1 demo, M1: K=3) · pair-cooldown · one-active-session · not-self. The model focuses purely on "given shared intent X, how compatible are they on it".

**Attraction vector (the no-faces trick).** Users never publish photos. In production, a user may *privately* train an on-device embedding of "faces I like" (their own examples, never uploaded); during matching only a scalar similarity to the other's on-device vector is exchanged — a number, never an image. Hackathon demo: deterministic simulated vectors; the claim in the pitch is the architecture, demonstrated honestly as canned.

**Vibe cards.** Two-line personality summaries shown at the match moment — the icebreaker that replaces "hey". Demo: canned vibe pairs, deterministic per user. Production: generated (Bielik/LLM) from the profile, cached per user, moderated.

## 8. Zones & location architecture

- **Zone = geohash precision 6** (~1.2 km × 0.6 km at Kraków's latitude): big enough for anonymity, small enough for "walkable now".
- **Glow semantics:** count of *search-mode* users in the cell, rendered as size/brightness. Zones with fewer than **K=3** searching users stay dark (k-anonymity in production; demo shows all) — you can't follow a glow to *the only* person in it.
- **Data flow:** client sends position every ~2 s (while searching) → server keeps it in-memory keyed by socket → computes zone → matches → relays position *only* between mutually-accepted partners *only* during the session → everything discarded on disconnect/vanish/TTL. No database. No history. No logs of positions.
- **Demo mode:** scripted converging positions driven by a dev-build toggle (indoor GPS reality); identical pipeline.

## 9. Match session lifecycle (state machine)

```
idle → searching → [match offered ⇉ both phones]
     → both accept ⇉ compass active (10 min TTL, positions relayed pairwise)
     → meet | TTL expiry | either vanishes
     → cooldown(5 min per pair) → idle
```

## 10. Safety & privacy by design (threat model)

| Threat | Countermeasure |
|---|---|
| Stalker follows a specific person | No identity, no search, no browsing; zones not pins; glow is aggregate (k-anonymity); nothing discoverable when search is off |
| Compass abused to locate someone | Unlocks only after **mutual** accept; reveals a *bearing*, never a map position; 10-min TTL; partner sees the same compass (symmetry — they know you're walking too) |
| Harassment | No chat = no DM channel; exposure is session-scoped; block & report (production) kill future matches pair-wide |
| Data breach / subpoena | Positions never persisted — in-memory per socket only; nothing to leak |
| Notification fatigue / ambush pings | Both parties opted in *per occasion* (search toggle); pair cooldown; one active session |
| Women's safety specifically | She is invisible unless she switches search on; she can dismiss any match invisibly; Vanish is one tap and instant |

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
| **M0 — HackYeah 2026** (this repo) | Expo app (push, magnetometer compass), Bun/Elysia backend, custom-trained model v0 + explainable baseline, demo mode |
| **M1 — production MVP** | k-anonymity (K≥3), block/report, persistence-free audit, DPIA, E2E position encryption between paired sessions, model v1 (real interaction data) |
| **v1** | On-device attraction vector (train-on-phone), generated vibe cards (Bielik/LLM), brave streaks |
| **v2** | Venue/event platform (official zones, analytics), city heat events |

## 18. Demo scope & honesty

See README ("What's real vs canned"). Everything presentation-critical is real: profiles, zones from live positions, mutual match + push, custom-trained model, compass bearing, haptics, vanish. Everything auxiliary is honestly canned: ghost density, vibe-card strings, demo-mode positions; attraction-side training data is synthetic until M1.
