# JustMate — product definition

> **Meet for real.**
> JustMate helps two compatible strangers who want the same thing *right now* find each other in the real world — faceless, mutual, and on foot.

## 1. Elevator pitch (30 seconds)

Dating apps solved matching and broke meeting. JustMate replaces swiping and chatting with one mechanic: you carry a faceless profile of *what you want to do and who you'd like to do it with*; when a compatible person — also looking for the same thing, also within walking range — is near you, both phones ping at the same moment, each showing a two-line vibe card of the other. Both accept, a compass unlocks, and finding each other becomes a ten-minute game that ends with two people talking face to face. No faces. No chat. No pins.

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

1. **Profile once (3 minutes).** Pick interests (what you're into) and preview your vibe card. No photo. Optional nickname, never shown to others.
2. **Pick an intent and search — deliberately, per occasion.** Default is invisible: on the Home map you pick what you want *right now* (one intent, max two) and tap **Find people**. Battery, privacy and intent in one action; the intent is the session's context, not a profile attribute. This is the anti-Highlight: session-scoped, never ambient. (Bolt-style Home — `STRUCTURE.md` §2.)
3. **Watch zones glow.** The map shows geohash zones lit by the density of compatible searchers for your active intent. No list, no search field, no browsing — scarcity of information is the feature.
4. **The ping (the product's heartbeat).** Two compatible people, both searching, intents aligned, within walking range (400 m — see §7) → both phones notify simultaneously: match %, shared intent ("wants: beer"), and a 2-line vibe card of the other person.
5. **Mutual accept → compass unlocks.** Only if both tap "open compass". Either alone sees nothing more.
6. **The walk.** A directional arrow with hot/cold color and haptics; distance as a bucket (cold/warm/hot/burning), never a map pin of the other person. 10-minute window.
7. **Meet. Talk.** The vibe card doubles as the icebreaker. Afterward, session ends; positions are discarded.
8. **Either can Vanish** at any moment — session destroyed for both instantly.

## 6. Screen specification

Visual language, motion, haptics and accessibility for every screen below live in `DESIGN.md` (Apple fluid-interface principles applied to a dark map with warm glow); colors named here are its tokens.

### 6.1 Onboarding (3 screens — `STRUCTURE.md` §1 is the source of truth for the app)

Intents are **not** chosen here: they are picked per session on Home (§6.2). Intent vocabulary (shared by Home chips, protocol and scoring): `soul mate · beer · coffee · attractions · friends · sports · music`.

1. **"What are you into?"** — interest chips, ≥3 required: `beer · coffee · boardgames · rock · techno · hiking · cinema · books · travel · tech · dogs · climbing · photography · food`.
2. **"Tell us about you"** — upload one photo. An LLM reads the photo + your interests and writes a 2–3 sentence plain-prose profile (appearance + personality + what you're looking for). This text is what other people see when you match — not the photo. Demo: this step shows a canned description (deterministic per user) so we don't pay API costs on stage; production: real `gpt-4o-mini` call per user, ~$0.001 each. (Real pipeline: see §7.)
3. **"Your vibe card."** — preview of the 2-line card others will see (generated vibes, e.g. *"quietly funny — will out-argue you about pizza"*). Reroll button. Below it a single required checkbox: **"I'm 18 or older"** (the app has no photos and no verification, so the age gate is explicit and blocking — the map is not reachable without it). Button: **Enter the map**.

Design intent: the whole funnel communicates "this is not a profile-picture app" before the user ever sees the map.

### 6.2 Home — "Where to?" (the one screen; layout detail in `STRUCTURE.md` §2)

- Dark base map (maplibre-react-native + OpenFreeMap), **zones** rendered as amber glow circles sized by the density of compatible searchers for the active intent (halo + core layers, additive-feel).
- Own position: small mint dot. No other dots, ever.
- **Bottom sheet** with the prompt **"Where to?"** and intent chips; primary CTA **Find people**. While searching the sheet collapses to a status card (`● searching: beer`, elapsed time, **Stop searching**).
- Zone tap → aggregate only ("~4 compatible around here"). No identities, no profiles, no history.
- States: `idle` (map dimmed, zones hidden — you're invisible too), `searching` (glow visible, you're matchable under the chosen intent).

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

**Data model.** `user = { id, intents (per session), interests[], description (text, LLM-generated from photo + profile), session: { state } }` — in M0 nothing is persisted server-side beyond the live socket. (The stretch ML service keeps a per-user embedding cache in PostgreSQL — profile vectors, never positions; see below.)

**Explainable scoring (M0 primary).** A transparent function, served by the Elysia backend, is what runs in the demo and what we defend in Q&A:

```
compat = 0.7 × Jaccard(interests) + 0.3 × min(1, |shared intents|)
match  ⇔ both searching ∧ dist(a, b) ≤ R_MATCH (400 m) ∧ shared intent ≥ 1 ∧ compat ≥ 0.45
```

- **Intents gate, interests score.** The shared *active* intent (chosen per session on Home) is the *context* of the match ("this is a beer match"), interests set the percentage.
- **Distance, not zone, is the match gate.** The server holds exact positions anyway; zones are a *display* abstraction (see §8). Matching on "same geohash cell" would (a) pair people up to 1.35 km apart — more than the ~830 m a person walks in the 10-minute window at 5 km/h — and (b) never pair two people 50 m apart on either side of a cell boundary. `R_MATCH = 400 m` ≈ 5 min on foot, leaving half the window for finding each other.
- **Offer TTL 45 s**, then the offer expires silently for both (see §6.3).
- **Pair cooldown: 5 min** after any match/dismiss/expiry/vanish — no re-pinging the same person, no notification spam.
- **One active session per user.**
- **Ghost users never match.** Ghosts (server-spawned wanderers that add zone density) carry `ghost: true` and are excluded from candidate pairs — otherwise a demo phone can be offered a ghost instead of the other demo phone.

**Hard gates (server-side, NOT learned).** Whatever scores the pair — the formula above or the stretch model — only sees pairs that have already passed: both searching · `dist ≤ R_MATCH` (400 m) · shared active intent ≥ 1 · K-anonymity of the *zone* (M0: K=1 demo, M1: K=3) · pair cooldown · one active session/offer · not self · not a ghost. The scorer focuses purely on "given shared intent X, how compatible are they on it". (Same table in `docs/ML-MATCHING.md` §7 and `docs/PROTOCOL.md`.)

**Compatibility model (M1+ — post-hackathon, documented, not in M0 demo).** A Siamese text-embedding model with a Match Head, custom-trained by the team. The pipeline:

1. **Photo description (LLM).** At onboarding, the user's photo + (intents, interests) is sent to a vision LLM (e.g. `gpt-4o-mini`) which returns a 2–3 sentence plain-prose text covering how they look, their personality vibe, and who they want to meet. This text is cached in `profile["description"]`. No face data is shared between users — only the text description.
2. **Text embedding.** Each profile's text — `Intent: … Interests: … Description: …` — is sent to OpenAI `text-embedding-3-small` (1536-d, frozen).
3. **Shared Encoder.** A learned MLP `1536 → 512 → 256 → 128` (LayerNorm + ReLU between layers) projects to 128-d compatibility vectors `z_a`, `z_b`, L2-normalized.
4. **Match Head.** Takes `concat(|z_a − z_b|, z_a ⊙ z_b, cos(z_a, z_b))` (257-d) and outputs a pairwise compatibility logit. Sigmoid → score ∈ [0, 1].
5. **Joint training.** Triplet loss (margin=1.0, p=2) + binary match loss (BCE for logit_ab→1 and logit_ac→0) trained jointly on synthetic profiles for M0 / on real outcomes for M1.

- **Serving (M0 stretch).** The trained Siamese model is loaded in-process inside the Bun/Elysia server — no separate inference binary, no compiled C++ runtime, no subprocess protocol. PyTorch + ONNX Runtime both work; we pick whichever starts fastest on the demo machine. The demo always has the explainable baseline as a fallback if the model is unavailable.
- **Training data.** M0 / HackYeah 2026: synthetic profiles + rule-based ground truth (the explainable baseline + noise) — honest-proxy training. M1: real interaction outcomes (mutual accept + met → 1; dismissed/vanished → 0).
- **Threshold.** The `0.45` rule above applies to the explainable baseline. The neural model uses a **separately calibrated** threshold on a held-out synthetic set (target: FPR ≤ 5%, TPR ≥ 80%). Documented in the model card.
- **Fallback.** If the ML service is unavailable, the server transparently falls back to the explainable baseline. The demo never breaks.
- **Honesty on stage.** In M0, with synthetic data only, a learned model just learns the baseline. We do not say "AI matching" about something that is not learned from real signal — the explainable function stays the headline; the model card + `docs/ML-MATCHING.md` describe the *real* M1 pipeline.
- Full pipeline, training loop, file layout, and M1 roadmap: see `docs/ML-MATCHING.md` and `docs/ml/PLAN.md`.

**Description generation (LLM, M0 stretch).** — Today's version of the attraction vector. The user's photo is uploaded once at onboarding; an LLM produces a 2–3 sentence plain-prose description (`Appearance + personality + what they're looking for`) which becomes part of the profile. The matching model never sees the photo, only the text. In M0 we use a canned pool of descriptions for synthetic profiles; in M1 a real LLM call produces them per-user. **Privacy note:** photos go to the LLM API. Production needs a DPIA + explicit consent per §10; the demo uses test data only.

**Vibe cards.** Two-line personality summaries shown at the match moment — the icebreaker that replaces "hey". In the M0 stretch these are the **LLM-generated descriptions** above (one description serves as both profile signal and icebreaker). Pure-text, no image data exchanged between users.

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
| Notification fatigue / ambush pings | Both parties opted in *per occasion* (intent pick + Find people); pair cooldown; one active session |
| Women's safety specifically | She is invisible unless she starts a search; she can dismiss any match invisibly (offer simply "expires" on the other side); Vanish is one tap and instant |
| Minors | Photo + LLM still produces text descriptions; explicit, blocking **18+ gate** in onboarding (M0); production: age assurance appropriate to a dating product (M1) |

GDPR/RODO posture: location is personal data → processed solely inside explicit, session-scoped consent; no storage; production path includes a DPIA. Demo runs on test data only.

## 11. Gamification layer

**Core (hackathon):** the compass walk itself — hot/cold buckets, haptic escalation, the 10-minute window creating urgency, and the vibe card as loot ("you found: *quietly funny, will out-argue you about pizza*").

**Planned (post-hackathon, in priority order):**
- **Brave streak**: consecutive weeks with ≥1 real meeting; gentle decay, no leaderboards (anti-attention-economy).
- **Zone heat events**: "this district is glowing tonight" — city-scale serendipity weather.
- **Icebreaker packs**: themed card packs (travel / music / sport) users can equip.

Deliberately excluded: points, ads, streak-guilt, leaderboards — gamification serves courage, not retention.

## 12. Competitive positioning

| | JustMate | happn | Breeze | Tinder | Meetup |
|---|---|---|---|---|---|
| Real-time proximity | ✅ live zones | ⚠ retrospective | ❌ | ❌ | ❌ |
| Faceless | ✅ core | ❌ | ❌ | ❌ | n/a |
| Ends in chat | ❌ ends IRL | ✅ | ❌ (skips chat) | ✅ | ⚠ |
| Serendipitous ("now") | ✅ | ⚠ | ❌ scheduled | ❌ | ❌ |
| Consent architecture | ✅ mutual+zones | ⚠ | ✅ | ❌ | n/a |

Wedge: **consented serendipity** — the four validated quarters (proximity / skip-chat / faceless / live maps) assembled into one walk.

## 13. Anti-goals (what JustMate will never do)

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

The 2012 graveyard (Sonar, Highlight) died of empty rooms; JustMate launches where rooms are already full — and its zone glow, being aggregate, makes even a small crowd feel alive.

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

See README ("What's real vs canned"). Everything presentation-critical is real: profiles, zones from live positions, mutual match delivered live to both phones over WebSocket, explainable scoring, compass bearing, haptics, vanish. Everything auxiliary is honestly canned: ghost density, profile descriptions (canned pool for synthetic profiles in M0; live `gpt-4o-mini` calls in M1), demo-mode positions; the learned model (if shown) is trained on synthetic data. Rule for every sentence in the deck and the description: **it describes what the demo does, or it is labelled "production path".**
